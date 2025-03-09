const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('=== DIAGNÓSTICO DE UPLOAD R2 ===');
console.log('\nVariáveis de ambiente:');
console.log('R2_ACCESS_KEY:', process.env.R2_ACCESS_KEY ? '✓ Configurado' : '✗ Não configurado');
console.log('R2_SECRET_KEY:', process.env.R2_SECRET_KEY ? '✓ Configurado' : '✗ Não configurado');
console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
console.log('R2_BUCKET:', process.env.R2_BUCKET);
console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
console.log('R2_REGION:', process.env.R2_REGION);

console.log('\nVerificando arquivos de configuração:');

// Verificar plugins.js
try {
  const pluginsPath = path.join(process.cwd(), 'config', 'plugins.js');
  if (fs.existsSync(pluginsPath)) {
    console.log('✓ plugins.js encontrado');
    const content = fs.readFileSync(pluginsPath, 'utf8');
    console.log('  Provider configurado:', content.includes('@strapi/provider-upload-aws-s3') ? 'aws-s3' : 'outro');
    console.log('  Configuração S3 em formato correto:', content.includes('s3Options:') ? 'Sim' : 'Não');
  } else {
    console.log('✗ plugins.js não encontrado');
  }
} catch (error) {
  console.error('Erro ao verificar plugins.js:', error.message);
}

// Verificar extensões de upload
try {
  const extensionsPath = path.join(process.cwd(), 'src', 'extensions', 'upload');
  if (fs.existsSync(extensionsPath)) {
    console.log('✓ Extensões de upload encontradas');

    const serverFile = path.join(extensionsPath, 'strapi-server.js');
    if (fs.existsSync(serverFile)) {
      console.log('  ✓ strapi-server.js encontrado');
      const content = fs.readFileSync(serverFile, 'utf8');
      console.log('    Sobrescreve método de upload:', content.includes('plugin.services.upload.upload') ? 'Sim' : 'Não');
    } else {
      console.log('  ✗ strapi-server.js não encontrado');
    }
  } else {
    console.log('✗ Pasta de extensões de upload não encontrada');
  }
} catch (error) {
  console.error('Erro ao verificar extensões:', error.message);
}

// Verificar middlewares.js
try {
  const middlewaresPath = path.join(process.cwd(), 'config', 'middlewares.js');
  if (fs.existsSync(middlewaresPath)) {
    console.log('✓ middlewares.js encontrado');
    const content = fs.readFileSync(middlewaresPath, 'utf8');
    console.log('  Configuração de cors:', content.includes('strapi::cors') ? 'Sim' : 'Não');
    console.log('  Configuração de body parser:', content.includes('strapi::body') ? 'Sim' : 'Não');
  } else {
    console.log('✗ middlewares.js não encontrado');
  }
} catch (error) {
  console.error('Erro ao verificar middlewares.js:', error.message);
}

console.log('\nVerificando banco de dados:');
try {
  const dbPath = process.env.DATABASE_FILENAME || '/mnt/data/softmeat-db/data.db';
  if (fs.existsSync(dbPath)) {
    console.log(`✓ Banco de dados SQLite encontrado: ${dbPath}`);
    const stats = fs.statSync(dbPath);
    console.log(`  Tamanho: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Última modificação: ${stats.mtime}`);
  } else {
    console.log(`✗ Banco de dados SQLite não encontrado: ${dbPath}`);
  }
} catch (error) {
  console.error('Erro ao verificar banco de dados:', error.message);
}

console.log('\nResultado do diagnóstico:');
console.log('1. Executar: npm install @strapi/provider-upload-aws-s3');
console.log('2. Verificar permissões do diretório /mnt/data/softmeat-db/');
console.log('3. Reiniciar o servidor: npm run start');
