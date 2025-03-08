// migrate-cloudinary-to-r2.js
// Script para migrar completamente do Cloudinary para R2
// Uso: node migrate-cloudinary-to-r2.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const Database = require('better-sqlite3');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createReadStream } = require('fs');
const mime = require('mime-types');

// Configurações
const DB_PATH = process.env.DATABASE_FILENAME || path.join(process.cwd(), '.tmp/data.db');
const CLOUDINARY_PATTERN = /(res\.cloudinary\.com|.*\.cloudinary\.com)/i;
const BACKUP_DIR = path.join(process.cwd(), 'backup-cloudinary-migration');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuração do cliente R2
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Funções auxiliares
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function error(message) {
  log(message, colors.red);
}

function success(message) {
  log(message, colors.green);
}

function info(message) {
  log(message, colors.blue);
}

function warning(message) {
  log(message, colors.yellow);
}

// Garantir que o diretório de backup exista
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 1. Atualização dos arquivos de configuração
async function updateConfigFiles() {
  info('Iniciando atualização dos arquivos de configuração...');

  const filesToUpdate = [
    {
      path: 'config/middlewares.js',
      updates: [
        {
          find: /['"]res\.cloudinary\.com['"]/g,
          replace: ''
        },
        {
          find: /['"]\*\.cloudinary\.com['"]/g,
          replace: ''
        }
      ]
    },
    {
      path: 'config/middlewares/debug.js',
      updates: [
        {
          find: /strapi\.log\.info\("CLOUDINARY_NAME:".*\);/,
          replace: '// Referência ao Cloudinary removida'
        }
      ]
    }
  ];

  for (const file of filesToUpdate) {
    try {
      if (fs.existsSync(file.path)) {
        // Backup do arquivo
        const backupPath = path.join(BACKUP_DIR, file.path.replace(/\//g, '_'));
        fs.copyFileSync(file.path, backupPath);

        // Atualizar arquivo
        let content = fs.readFileSync(file.path, 'utf8');
        let updated = false;

        for (const update of file.updates) {
          const newContent = content.replace(update.find, update.replace);
          if (newContent !== content) {
            content = newContent;
            updated = true;
          }
        }

        if (updated) {
          fs.writeFileSync(file.path, content);
          success(`Arquivo ${file.path} atualizado com sucesso`);
        } else {
          info(`Nenhuma alteração necessária em ${file.path}`);
        }
      } else {
        warning(`Arquivo ${file.path} não encontrado`);
      }
    } catch (err) {
      error(`Erro ao atualizar ${file.path}: ${err.message}`);
    }
  }
}

// 2. Migração do banco de dados
async function migrateDatabase() {
  info('Iniciando migração do banco de dados...');

  try {
    // Verificar se o banco de dados existe
    if (!fs.existsSync(DB_PATH)) {
      error(`Banco de dados não encontrado em ${DB_PATH}`);
      return;
    }

    // Backup do banco de dados
    const dbBackupPath = path.join(BACKUP_DIR, 'database_backup.db');
    fs.copyFileSync(DB_PATH, dbBackupPath);
    success(`Backup do banco de dados criado em ${dbBackupPath}`);

    // Abrir conexão com o banco
    const db = new Database(DB_PATH);

    // Buscar todas as tabelas com potenciais URLs
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    let totalUpdated = 0;

    for (const table of tables) {
      try {
        // Verificar se a tabela tem alguma coluna que possa conter JSON ou URL
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        const textColumns = columns.filter(col =>
          col.type.toLowerCase().includes('text') ||
          col.type.toLowerCase().includes('varchar') ||
          col.type.toLowerCase().includes('json')
        );

        if (textColumns.length === 0) continue;

        info(`Analisando tabela ${table.name}...`);

        // Para cada coluna de texto, verificar e atualizar URLs
        for (const column of textColumns) {
          // Selecionar todas as linhas onde a coluna contém cloudinary
          const rows = db.prepare(`
            SELECT id, ${column.name} FROM ${table.name}
            WHERE ${column.name} LIKE '%cloudinary%'
          `).all();

          if (rows.length === 0) continue;

          info(`Encontradas ${rows.length} linhas com referências ao Cloudinary na coluna ${column.name} da tabela ${table.name}`);

          // Para cada linha, atualizar a URL
          for (const row of rows) {
            let content = row[column.name];
            let updated = false;

            try {
              // Verificar se é JSON
              if (content.startsWith('{') || content.startsWith('[')) {
                const json = JSON.parse(content);
                const updatedJson = await updateCloudinaryUrlsInObject(json);
                if (JSON.stringify(json) !== JSON.stringify(updatedJson)) {
                  content = JSON.stringify(updatedJson);
                  updated = true;
                }
              } else if (typeof content === 'string' && CLOUDINARY_PATTERN.test(content)) {
                // Se for uma string simples com URL do Cloudinary
                content = await updateCloudinaryUrl(content);
                updated = true;
              }

              if (updated) {
                db.prepare(`
                  UPDATE ${table.name} SET ${column.name} = ? WHERE id = ?
                `).run(content, row.id);
                totalUpdated++;
              }
            } catch (err) {
              warning(`Erro ao processar linha id=${row.id} na tabela ${table.name}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        error(`Erro ao processar tabela ${table.name}: ${err.message}`);
      }
    }

    // Verificar tabela específica 'files' que provavelmente contém links de mídia
    try {
      const mediaFiles = db.prepare(`
        SELECT id, url, provider FROM files
        WHERE provider = 'cloudinary' OR url LIKE '%cloudinary%'
      `).all();

      if (mediaFiles.length > 0) {
        info(`Encontrados ${mediaFiles.length} arquivos de mídia para migrar`);

        // Para cada arquivo, fazer download e upload para R2
        for (const file of mediaFiles) {
          try {
            const newUrl = await migrateMediaFile(file);

            if (newUrl) {
              db.prepare(`
                UPDATE files SET url = ?, provider = 'aws-s3' WHERE id = ?
              `).run(newUrl, file.id);
              totalUpdated++;
              success(`Arquivo id=${file.id} migrado com sucesso`);
            }
          } catch (err) {
            error(`Erro ao migrar arquivo id=${file.id}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      warning(`Erro ao verificar tabela de arquivos: ${err.message}`);
    }

    db.close();
    success(`Migração do banco de dados concluída. Total de ${totalUpdated} atualizações realizadas.`);

  } catch (err) {
    error(`Erro na migração do banco de dados: ${err.message}`);
  }
}

// Função para atualizar URLs do Cloudinary em objetos aninhados
async function updateCloudinaryUrlsInObject(obj) {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => updateCloudinaryUrlsInObject(item)));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && CLOUDINARY_PATTERN.test(value)) {
        result[key] = await updateCloudinaryUrl(value);
      } else if (typeof value === 'object') {
        result[key] = await updateCloudinaryUrlsInObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  if (typeof obj === 'string' && CLOUDINARY_PATTERN.test(obj)) {
    return await updateCloudinaryUrl(obj);
  }

  return obj;
}

// Função para atualizar uma URL do Cloudinary para R2
async function updateCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return url;

  try {
    // Verificar se é uma URL do Cloudinary
    if (!CLOUDINARY_PATTERN.test(url)) {
      return url;
    }

    // Extrair o caminho do arquivo a partir da URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Ignorar transformações do Cloudinary e obter apenas o nome do arquivo
    const fileName = pathParts[pathParts.length - 1];

    // Download do arquivo
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const tempPath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(tempPath, response.data);

    // Determinar tipo de recurso
    const resourceType = getResourceTypeFromUrl(url);

    // Fazer upload para R2
    const category = 'migrated';
    const r2Path = `${resourceType}/${category}/${fileName}`;

    await uploadToR2(tempPath, r2Path, mime.lookup(fileName) || 'application/octet-stream');

    // Gerar nova URL
    const newUrl = formatR2Url(r2Path);
    info(`URL migrada: ${url} -> ${newUrl}`);

    return newUrl;
  } catch (err) {
    warning(`Erro ao migrar URL ${url}: ${err.message}`);
    return url;
  }
}

// Função para migrar um arquivo de mídia
async function migrateMediaFile(file) {
  try {
    // Download do arquivo
    const response = await axios.get(file.url, { responseType: 'arraybuffer' });
    const fileName = path.basename(new URL(file.url).pathname);
    const tempPath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(tempPath, response.data);

    // Determinar tipo de recurso
    const resourceType = getResourceTypeFromUrl(file.url);

    // Fazer upload para R2
    const category = 'migrated';
    const r2Path = `${resourceType}/${category}/${fileName}`;

    await uploadToR2(tempPath, r2Path, mime.lookup(fileName) || 'application/octet-stream');

    // Gerar nova URL
    return formatR2Url(r2Path);
  } catch (err) {
    error(`Erro ao migrar arquivo de mídia: ${err.message}`);
    return null;
  }
}

// Função para fazer upload para o R2
async function uploadToR2(filePath, key, contentType) {
  try {
    const fileStream = createReadStream(filePath);

    const params = {
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
      ACL: 'public-read'
    };

    await r2Client.send(new PutObjectCommand(params));
    success(`Arquivo ${key} enviado para R2 com sucesso`);
    return true;
  } catch (err) {
    error(`Erro ao enviar arquivo para R2: ${err.message}`);
    return false;
  }
}

// Função para formatar URL do R2 (copiada de src/utils/r2.js para garantir consistência)
function formatR2Url(path) {
  const customDomain = process.env.R2_CUSTOM_DOMAIN;

  // Se tiver um domínio personalizado configurado, use-o
  if (customDomain) {
    // Certificar que o path não começa com barra para concatenar corretamente
    const formattedPath = path.startsWith('/') ? path.substring(1) : path;
    return `${customDomain}/${formattedPath}`;
  }

  // Caso contrário, use a URL direta do R2
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  return `${endpoint}/${bucket}/${path}`;
}

// Determinar tipo de recurso com base na URL
function getResourceTypeFromUrl(url) {
  const fileExtension = path.extname(new URL(url).pathname).toLowerCase();

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

  if (imageExtensions.includes(fileExtension)) return 'images';
  if (videoExtensions.includes(fileExtension)) return 'videos';
  if (audioExtensions.includes(fileExtension)) return 'audios';

  return 'files';
}

// 3. Remover variáveis de ambiente do Cloudinary
function removeCloudinaryEnvVars() {
  info('Verificando variáveis de ambiente do Cloudinary...');

  try {
    if (fs.existsSync('.env')) {
      const envBackupPath = path.join(BACKUP_DIR, '.env.backup');
      fs.copyFileSync('.env', envBackupPath);

      let envContent = fs.readFileSync('.env', 'utf8');
      const cloudinaryVars = envContent.match(/^CLOUDINARY_.*=.*$/gm);

      if (cloudinaryVars && cloudinaryVars.length > 0) {
        info(`Encontradas ${cloudinaryVars.length} variáveis do Cloudinary no arquivo .env`);

        // Comentar as variáveis do Cloudinary
        cloudinaryVars.forEach(varLine => {
          envContent = envContent.replace(varLine, `# ${varLine} # Desativado pela migração para R2`);
        });

        fs.writeFileSync('.env', envContent);
        success('Variáveis do Cloudinary comentadas no arquivo .env');
      } else {
        info('Nenhuma variável do Cloudinary encontrada no arquivo .env');
      }
    }
  } catch (err) {
    error(`Erro ao verificar variáveis de ambiente: ${err.message}`);
  }
}

// 4. Atualizar pacotes do package.json
async function updatePackageJson() {
  info('Atualizando package.json...');

  try {
    if (fs.existsSync('package.json')) {
      const pkgBackupPath = path.join(BACKUP_DIR, 'package.json.backup');
      fs.copyFileSync('package.json', pkgBackupPath);

      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      // Remover pacotes do Cloudinary
      const dependencies = pkg.dependencies || {};
      const devDependencies = pkg.devDependencies || {};

      const cloudinaryPackages = ['cloudinary', '@strapi/provider-upload-cloudinary'];
      let removedPackages = [];

      cloudinaryPackages.forEach(packageName => {
        if (dependencies[packageName]) {
          delete dependencies[packageName];
          removedPackages.push(packageName);
        }
        if (devDependencies[packageName]) {
          delete devDependencies[packageName];
          removedPackages.push(packageName);
        }
      });

      if (removedPackages.length > 0) {
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        success(`Pacotes removidos do package.json: ${removedPackages.join(', ')}`);

        // Atualizar node_modules
        info('Executando npm install para atualizar node_modules...');
        execSync('npm install', { stdio: 'inherit' });
      } else {
        info('Nenhum pacote do Cloudinary encontrado no package.json');
      }
    }
  } catch (err) {
    error(`Erro ao atualizar package.json: ${err.message}`);
  }
}

// Executar todas as etapas
async function runMigration() {
  log('Iniciando migração completa do Cloudinary para R2...', colors.magenta);

  // Verificar variáveis de ambiente necessárias
  if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY ||
      !process.env.R2_ENDPOINT || !process.env.R2_BUCKET) {
    error('Variáveis de ambiente R2 não configuradas! Verifique seu arquivo .env');
    process.exit(1);
  }

  try {
    // Instalar dependências necessárias
    const neededPackages = ['axios', 'better-sqlite3', 'mime-types', '@aws-sdk/client-s3'];
    info('Instalando dependências necessárias...');

    try {
      execSync(`npm install ${neededPackages.join(' ')} --no-save`, { stdio: 'inherit' });
    } catch (err) {
      error(`Erro ao instalar dependências: ${err.message}`);
      process.exit(1);
    }

    // Executar as etapas da migração
    await updateConfigFiles();
    await removeCloudinaryEnvVars();
    await migrateDatabase();
    await updatePackageJson();

    success('Migração concluída com sucesso!');
    info('Recomendação: Reinicie o servidor Strapi para aplicar todas as alterações.');
    log(`Um backup dos arquivos originais foi criado em: ${BACKUP_DIR}`, colors.cyan);
  } catch (err) {
    error(`Erro durante a migração: ${err.message}`);
  }
}

// Iniciar migração
runMigration();
