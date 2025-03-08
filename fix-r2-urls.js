// fix-r2-urls.js
// Corrige a implementação da formatação de URLs R2 no Strapi
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('=== CORREÇÃO DE URLS R2 ===');

// Diretório para backup
const BACKUP_DIR = path.join(process.cwd(), 'backup-r2-fix');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 1. Corrigir o arquivo utils/r2.js
console.log('\n[1] Corrigindo implementação do formatador R2:');

const r2UtilsPath = path.join(process.cwd(), 'src', 'utils', 'r2.js');
if (fs.existsSync(r2UtilsPath)) {
  // Backup
  const backupPath = path.join(BACKUP_DIR, 'r2.js.backup');
  fs.copyFileSync(r2UtilsPath, backupPath);
  console.log(`✅ Backup criado em ${backupPath}`);

  // Reescrever completamente o arquivo com uma implementação otimizada
  const newR2Content = `'use strict';

/**
 * Utilitários para manipulação de URLs do Cloudflare R2
 */

/**
 * Formata um caminho de arquivo para uma URL R2 completa
 * @param {string} path - Caminho relativo do arquivo no bucket
 * @returns {string} URL formatada
 */
const formatR2Url = (path) => {
  if (!path) return '';

  // Garantir que path não é undefined ou null
  const filePath = String(path);

  // Remover barras iniciais para consistência
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

  // Usar domínio personalizado se disponível
  const customDomain = process.env.R2_CUSTOM_DOMAIN;
  if (customDomain) {
    // Garantir que o domínio personalizado não termine com barra
    const domain = customDomain.endsWith('/')
      ? customDomain.slice(0, -1)
      : customDomain;

    return \`\${domain}/\${cleanPath}\`;
  }

  // Fallback para URL direta do R2
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !bucket) {
    console.error('Erro: R2_ENDPOINT ou R2_BUCKET não definidos!');
    return '';
  }

  // Garantir que o endpoint não termine com barra
  const cleanEndpoint = endpoint.endsWith('/')
    ? endpoint.slice(0, -1)
    : endpoint;

  return \`\${cleanEndpoint}/\${bucket}/\${cleanPath}\`;
};

/**
 * Determina o tipo de recurso com base no MIME type
 * @param {string} mimeType - MIME type do arquivo
 * @returns {string} Tipo de recurso (images, videos, audios, files)
 */
const getResourceType = (mimeType) => {
  if (!mimeType) return 'files';

  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audios';

  return 'files';
};

/**
 * Gera um nome de arquivo único baseado no hash e timestamp
 * @param {Object} file - Objeto do arquivo Strapi
 * @returns {string} Nome de arquivo único
 */
const generateFileName = (file) => {
  if (!file || !file.hash) {
    const randomHash = Math.random().toString(36).substring(2, 15);
    return \`\${randomHash}-\${Date.now()}.unknown\`;
  }

  const extension = (file.ext && file.ext.startsWith('.'))
    ? file.ext.substring(1)
    : (file.ext || 'bin');

  return \`\${file.hash}-\${Date.now()}.\${extension}\`;
};

/**
 * Constrói um caminho de pasta para armazenamento
 * @param {string} resourceType - Tipo de recurso (images, videos, etc)
 * @param {Object} options - Opções adicionais
 * @returns {string} Caminho da pasta formatado
 */
const getResourceFolder = (resourceType, options = {}) => {
  const { category = '', subfolder = '' } = options;

  let path = resourceType || 'files';

  if (category) {
    path += \`/\${category}\`;
  }

  if (subfolder) {
    path += \`/\${subfolder}\`;
  }

  return path;
};

// Exportar todas as funções utilitárias
module.exports = {
  formatR2Url,
  getResourceType,
  generateFileName,
  getResourceFolder
};`;

  fs.writeFileSync(r2UtilsPath, newR2Content);
  console.log('✅ Arquivo r2.js reescrito com implementação otimizada');
} else {
  console.log('❌ Arquivo r2.js não encontrado! Criando novo...');
  fs.mkdirSync(path.dirname(r2UtilsPath), { recursive: true });
  fs.writeFileSync(r2UtilsPath, newR2Content);
  console.log('✅ Novo arquivo r2.js criado');
}

// 2. Corrigir a implementação do serviço format-url
console.log('\n[2] Corrigindo serviço de formatação de URL:');

const formatUrlPath = path.join(process.cwd(), 'src', 'extensions', 'upload', 'services', 'format-url.js');
const formatUrlDir = path.dirname(formatUrlPath);

if (!fs.existsSync(formatUrlDir)) {
  fs.mkdirSync(formatUrlDir, { recursive: true });
  console.log(`✅ Diretório ${formatUrlDir} criado`);
}

if (fs.existsSync(formatUrlPath)) {
  // Backup
  const backupPath = path.join(BACKUP_DIR, 'format-url.js.backup');
  fs.copyFileSync(formatUrlPath, backupPath);
  console.log(`✅ Backup criado em ${backupPath}`);
}

// Reescrever o arquivo format-url.js
const formatUrlContent = `'use strict';

const { formatR2Url } = require('../../../utils/r2');

/**
 * Formatador de URL para arquivos armazenados no R2
 */
module.exports = {
  /**
   * Formata a URL de um arquivo, convertendo URLs R2 padrão para o domínio personalizado
   * @param {Object} file - Objeto de arquivo do Strapi
   * @returns {Object} Objeto de arquivo com URL formatada
   */
  formatFileUrl(file, options = {}) {
    // Verificar se o arquivo tem URL
    if (!file?.url) {
      return file;
    }

    // Verificar se o arquivo já está usando o domínio personalizado
    if (process.env.R2_CUSTOM_DOMAIN && file.url.startsWith(process.env.R2_CUSTOM_DOMAIN)) {
      return file;
    }

    // Verificar se o arquivo é do R2 (verificando endpoint)
    if (process.env.R2_ENDPOINT && file.url.includes(process.env.R2_ENDPOINT)) {
      try {
        // Extrair o caminho relativo do arquivo
        const urlObj = new URL(file.url);
        const pathname = urlObj.pathname;

        // Pegar todos os segmentos após o nome do bucket
        const bucketPos = pathname.indexOf(process.env.R2_BUCKET);

        if (bucketPos !== -1) {
          const relativePath = pathname.substring(bucketPos + process.env.R2_BUCKET.length + 1);
          // Formatar com a URL personalizada
          file.url = formatR2Url(relativePath);
          console.log(\`URL formatada: \${relativePath} -> \${file.url}\`);
        }
      } catch (error) {
        console.error(\`Erro ao formatar URL \${file.url}: \${error.message}\`);
      }
    }

    return file;
  },
};`;

fs.writeFileSync(formatUrlPath, formatUrlContent);
console.log('✅ Arquivo format-url.js atualizado com implementação robusta');

// 3. Verificar e atualizar o arquivo strapi-server.js
console.log('\n[3] Atualizando extensão de upload:');

const strapiServerPath = path.join(process.cwd(), 'src', 'extensions', 'upload', 'strapi-server.js');
const strapiServerDir = path.dirname(strapiServerPath);

if (!fs.existsSync(strapiServerDir)) {
  fs.mkdirSync(strapiServerDir, { recursive: true });
  console.log(`✅ Diretório ${strapiServerDir} criado`);
}

if (fs.existsSync(strapiServerPath)) {
  // Backup
  const backupPath = path.join(BACKUP_DIR, 'strapi-server.js.backup');
  fs.copyFileSync(strapiServerPath, backupPath);
  console.log(`✅ Backup criado em ${backupPath}`);
}

// Reescrever o arquivo strapi-server.js
const strapiServerContent = `'use strict';

const formatUrl = require('./services/format-url');

/**
 * Configuração de extensão para o plugin de upload
 * Sobrescreve funções para formatar URLs do R2
 */
module.exports = (plugin) => {
  // Registrar função de log para diagnóstico
  const formatDebug = (file) => {
    if (process.env.DEBUG_UPLOAD === 'true') {
      console.log('[Upload Debug] Formatando URL:', file?.url);
    }
    return file;
  };

  // Substituir a função findOne para formatar URLs
  const oldFindOne = plugin.services.upload.findOne;
  plugin.services.upload.findOne = async (id, populate) => {
    const file = await oldFindOne(id, populate);

    // Formatar URL se encontrou o arquivo
    if (file) {
      formatDebug(file);
      return formatUrl.formatFileUrl(file);
    }

    return file;
  };

  // Substituir a função findMany para formatar URLs
  const oldFindMany = plugin.services.upload.findMany;
  plugin.services.upload.findMany = async (query) => {
    const files = await oldFindMany(query);

    // Formatar URLs de todos os arquivos
    return files.map(file => {
      formatDebug(file);
      return formatUrl.formatFileUrl(file);
    });
  };

  // Sobrescrever a função do serviço upload para garantir que os links sejam formatados no momento do upload
  const oldUpload = plugin.services.upload.upload;
  plugin.services.upload.upload = async (fileData, config) => {
    const result = await oldUpload(fileData, config);

    // Formatar URLs nos resultados do upload
    if (Array.isArray(result)) {
      return result.map(file => formatUrl.formatFileUrl(file));
    }

    return formatUrl.formatFileUrl(result);
  };

  return plugin;
};`;

fs.writeFileSync(strapiServerPath, strapiServerContent);
console.log('✅ Arquivo strapi-server.js atualizado com implementação robusta');

// 4. Verificar e atualizar a configuração de plugin
console.log('\n[4] Verificando configuração do plugin:');

const pluginsPath = path.join(process.cwd(), 'config', 'plugins.js');
if (fs.existsSync(pluginsPath)) {
  // Backup
  const backupPath = path.join(BACKUP_DIR, 'plugins.js.backup');
  fs.copyFileSync(pluginsPath, backupPath);
  console.log(`✅ Backup criado em ${backupPath}`);

  // Ler o conteúdo atual
  let pluginsContent = fs.readFileSync(pluginsPath, 'utf8');

  // Verificar se a configuração de upload está correta
  if (!pluginsContent.includes("'upload': {") && !pluginsContent.includes("upload: {")) {
    console.log('❌ Configuração de upload não encontrada');
    console.log('✅ Adicionando nova configuração de upload...');

    // Adicionar configuração completa de upload
    pluginsContent = `// config/plugins.js
${pluginsContent.includes('module.exports') ? '' : 'module.exports = ({ env }) => ({\n'}
${pluginsContent.includes('module.exports = ({ env }) =>') ? '' : 'module.exports = ({ env }) => (\n'}
 'users-permissions': {
   config: {
     jwtSecret: env('JWT_SECRET'),
   },
 },
 upload: {
   config: {
     provider: '@strapi/provider-upload-aws-s3',
     providerOptions: {
       accessKeyId: env('R2_ACCESS_KEY'),
       secretAccessKey: env('R2_SECRET_KEY'),
       endpoint: env('R2_ENDPOINT'),
       params: {
         Bucket: env('R2_BUCKET'),
         ACL: 'public-read',
       },
       region: env('R2_REGION', 'auto'),
     },
     actionOptions: {
       upload: {
         ACL: 'public-read',
       },
       uploadStream: {
         ACL: 'public-read'
       },
       delete: {},
     },
   },
 },
});`;

    fs.writeFileSync(pluginsPath, pluginsContent);
    console.log('✅ Configuração do plugin atualizada com configuração completa de upload');
  } else {
    console.log('✅ Configuração de upload encontrada, verificando detalhes...');

    // Verificar se há configuração ACL pública
    if (!pluginsContent.includes('ACL: \'public-read\'')) {
      console.log('⚠️ Não encontrada configuração ACL: public-read para uploads');
      console.log('✅ Atualizando configuração do plugin...');

      // Adicionar ACL se estiver faltando
      pluginsContent = pluginsContent.replace(
        /params: {([^}]*)}/g,
        'params: {$1,\n         ACL: \'public-read\',\n       }'
      );

      // Adicionar actionOptions se estiver faltando
      if (!pluginsContent.includes('actionOptions')) {
        pluginsContent = pluginsContent.replace(
          /providerOptions: {([^}]*)}(,?\s*[^}]*})/,
          'providerOptions: {$1},\n     actionOptions: {\n       upload: {\n         ACL: \'public-read\'\n       },\n       uploadStream: {\n         ACL: \'public-read\'\n       },\n       delete: {}\n     }$2'
        );
      }

      fs.writeFileSync(pluginsPath, pluginsContent);
      console.log('✅ Configuração do plugin atualizada com ACL public-read');
    } else {
      console.log('✅ Configuração ACL já está presente');
    }
  }
} else {
  console.log('❌ Arquivo config/plugins.js não encontrado, criando novo...');

  // Criar novo arquivo plugins.js
  const newPluginsContent = `// config/plugins.js
const { formatR2Url, getResourceType, generateFileName } = require('../src/utils/r2');

module.exports = ({ env }) => ({
 'users-permissions': {
   config: {
     jwtSecret: env('JWT_SECRET'),
   },
 },
 upload: {
   config: {
     provider: '@strapi/provider-upload-aws-s3',
     providerOptions: {
       accessKeyId: env('R2_ACCESS_KEY'),
       secretAccessKey: env('R2_SECRET_KEY'),
       endpoint: env('R2_ENDPOINT'),
       params: {
         Bucket: env('R2_BUCKET'),
         ACL: 'public-read',
       },
       region: env('R2_REGION', 'auto'),
     },
     actionOptions: {
       upload: {
         ACL: 'public-read',
         // Função para personalizar o caminho de upload
         customPath: (file) => {
           console.log('Customizando caminho para upload:', file.name);

           // Detectar o tipo de recurso (imagem, vídeo, etc.)
           const resourceType = file.mime.startsWith('image/') ? 'images' :
                               file.mime.startsWith('video/') ? 'videos' :
                               file.mime.startsWith('audio/') ? 'audios' : 'files';

           console.log('Tipo de recurso:', resourceType);

           // Determinar a categoria com base no contexto do upload
           let category = 'geral';

           // Tenta determinar a categoria baseado no tipo de conteúdo relacionado
           if (file.related) {
             // Extrai o modelo de relacionamento
             const relatedType = file.related.split('.')[0];
             console.log('Tipo relacionado:', relatedType);

             switch (relatedType) {
               case 'produto':
                 category = 'produtos';
                 break;
               case 'curso-online':
                 category = 'cursos';
                 break;
               case 'testemunho':
                 category = 'testemunhos';
                 break;
               case 'cliente':
                 category = 'clientes';
                 break;
               case 'hero-consultoria':
               case 'home-consultoria':
                 category = 'consultoria';
                 break;
               case 'home-hero':
               case 'index-destaque':
                 category = 'index';
                 break;
               case 'sobre-carrossel':
                 category = 'institucional';
                 break;
               case 'carrossel-treinamento':
               case 'treinamento':
               case 'cronograma':
               case 'home-treinamento':
                 category = 'treinamentos';
                 break;
               default:
                 category = 'geral';
             }
           }

           console.log('Categoria:', category);

           // Gerar nome de arquivo único
           const extension = file.ext.startsWith('.') ? file.ext.substring(1) : file.ext;
           const timestamp = Date.now();
           const fileName = \`\${file.hash}-\${timestamp}.\${extension}\`;

           // Gerar o caminho completo
           const path = \`\${resourceType}/\${category}/\${fileName}\`;
           console.log('Caminho final:', path);

           return path;
         }
       },
       uploadStream: {
         ACL: 'public-read'
       },
       delete: {},
     },
   },
 },
});`;

  fs.mkdirSync(path.dirname(pluginsPath), { recursive: true });
  fs.writeFileSync(pluginsPath, newPluginsContent);
  console.log('✅ Novo arquivo plugins.js criado com configuração completa');
}

// 5. Criar arquivo de teste R2
console.log('\n[5] Criando arquivo de teste de conexão R2:');

const testR2Path = path.join(process.cwd(), 'scripts', 'test-r2-upload.js');
const testR2Dir = path.dirname(testR2Path);

if (!fs.existsSync(testR2Dir)) {
  fs.mkdirSync(testR2Dir, { recursive: true });
}

const testR2Content = `// test-r2-upload.js
// Script para testar o upload e URLs do R2 diretamente
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { formatR2Url } = require('../src/utils/r2');

// Carregar variáveis de ambiente
require('dotenv').config();

// Verificar variáveis configuradas
console.log('=== TESTE DE CONEXÃO R2 ===');
console.log('R2_ACCESS_KEY existe:', !!process.env.R2_ACCESS_KEY);
console.log('R2_SECRET_KEY existe:', !!process.env.R2_SECRET_KEY);
console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
console.log('R2_BUCKET:', process.env.R2_BUCKET);
console.log('R2_REGION:', process.env.R2_REGION || 'auto');
console.log('R2_CUSTOM_DOMAIN:', process.env.R2_CUSTOM_DOMAIN);

// Configurar cliente R2
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Função para testar listagem de arquivos
async function testListFiles() {
  try {
    console.log('\\nTentando listar arquivos no bucket R2...');

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      MaxKeys: 5
    });

    const response = await r2Client.send(command);
    console.log(\`✅ Sucesso! Encontrados \${response.Contents?.length || 0} arquivos\\n\`);

    // Mostrar alguns arquivos
    if (response.Contents && response.Contents.length > 0) {
      console.log('Exemplos de arquivos:');
      response.Contents.slice(0, 5).forEach((file, index) => {
        const url = formatR2Url(file.Key);
        console.log(\`\${index + 1}. \${file.Key} -> \${url}\`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error.message);
    return false;
  }
}

// Função para testar upload de arquivo
async function testUpload() {
  try {
    console.log('\\nTentando fazer upload de arquivo de teste para R2...');

    // Criar arquivo de teste
    const testFile = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFile, \`Arquivo de teste gerado em \${new Date().toISOString()}\`);

    // Configurar comando de upload
    const fileStream = fs.createReadStream(testFile);
    const fileKey = \`test/test-upload-\${Date.now()}.txt\`;

    const uploadParams = {
      Bucket: process.env.R2_BUCKET,
      Key: fileKey,
      Body: fileStream,
      ContentType: 'text/plain',
      ACL: 'public-read'
    };

    // Enviar arquivo
    await r2Client.send(new PutObjectCommand(uploadParams));
    console.log('✅ Upload concluído com sucesso');

    // Mostrar URL
    const url = formatR2Url(fileKey);
    console.log(\`URL do arquivo: \${url}\`);

    // Limpar
    fs.unlinkSync(testFile);
    console.log('Arquivo de teste local removido');

    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error.message);
    return false;
  }
}

// Testar formatação de URLs
function testFormatUrls() {
  console.log('\\nTeste de formatação de URLs:');

  const testPaths = [
    'images/test/example.jpg',
    '/images/product/photo.png',
    'videos/testimonials/video.mp4'
  ];

  for (const path of testPaths) {
    const url = formatR2Url(path);
    console.log(\`\${path} -> \${url}\`);
  }
}

// Executar testes
async function runTests() {
  console.log('\\n=== INICIANDO TESTES R2 ===');

  // Verificar variáveis necessárias
  if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY ||
      !process.env.R2_ENDPOINT || !process.env.R2_BUCKET) {
    console.error('❌ Configuração incompleta. Verifique as variáveis de ambiente.');
    return;
  }

  // Testar formatação de URLs
  testFormatUrls();

  // Testar conexão e listagem
  const listSuccess = await testListFiles();

  // Testar upload se listagem for bem-sucedida
  if (listSuccess) {
    await testUpload();
  }

  console.log('\\n=== TESTES CONCLUÍDOS ===');
}

// Executar todos os testes
runTests();`;

fs.writeFileSync(testR2Path, testR2Content);
console.log(`✅ Arquivo de teste criado em ${testR2Path}`);

console.log('\n=== CORREÇÕES CONCLUÍDAS ===');
console.log('\nInstruções:');
console.log('1. Reinicie o servidor Strapi para aplicar as alterações');
console.log('2. Teste o upload de arquivos no painel admin');
console.log('3. Execute o script de teste para verificar a conexão direta: node scripts/test-r2-upload.js');
console.log('\nUm backup de todos os arquivos modificados foi criado em:', BACKUP_DIR);
