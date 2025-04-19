// scripts/diagnose-upload.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('=== DIAGNÓSTICO DE UPLOAD R2/STRAPI ===\n');

// 1. Variáveis de ambiente
const requiredVars = [
  'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_ENDPOINT', 'R2_BUCKET', 'R2_PUBLIC_URL', 'R2_REGION'
];
console.log('Variáveis de ambiente:');
requiredVars.forEach(v => {
  console.log(`${v}:`, process.env[v] ? '✓ Configurado' : '✗ Não configurado');
});

// 2. plugins.js
const pluginsPath = path.join(process.cwd(), 'config', 'plugins.js');
if (fs.existsSync(pluginsPath)) {
  const content = fs.readFileSync(pluginsPath, 'utf8');
  console.log('\n✓ plugins.js encontrado');
  console.log('  Provider configurado:', content.includes('@strapi/provider-upload-aws-s3') ? 'aws-s3' : 'outro');
  console.log('  customPath presente:', content.includes('customPath') ? 'Sim' : 'Não');
} else {
  console.log('\n✗ plugins.js não encontrado');
}

// 3. plugins-funcional.js (deve ser removido)
const pluginsFuncPath = path.join(process.cwd(), 'config', 'plugins-funcional.js');
if (fs.existsSync(pluginsFuncPath)) {
  console.log('\n⚠️ plugins-funcional.js encontrado (remova para evitar conflitos)');
}

// 4. config/env/
const envPath = path.join(process.cwd(), 'config', 'env');
if (fs.existsSync(envPath)) {
  console.log('\n⚠️ Pasta config/env encontrada (verifique sobrescritas de configuração)');
}

// 5. src/extensions/upload/
const extUploadPath = path.join(process.cwd(), 'src', 'extensions', 'upload');
if (fs.existsSync(extUploadPath)) {
  console.log('\n✓ src/extensions/upload/ existe');
  const files = fs.readdirSync(extUploadPath);
  if (files.length) {
    console.log('  Arquivos encontrados:', files.join(', '));
  } else {
    console.log('  (Pasta está vazia)');
  }
}

// 6. src/provider/r2-upload/index.js
const providerPath = path.join(process.cwd(), 'src', 'provider', 'r2-upload', 'index.js');
if (fs.existsSync(providerPath)) {
  console.log('\n✓ Provider customizado r2-upload encontrado');
}

// 7. Banco de dados (PostgreSQL)
console.log('\nBanco de dados:');
if (process.env.PGHOST) {
  console.log('  PostgreSQL configurado via variáveis PGHOST, PGUSER, etc.');
} else {
  console.log('  ⚠️ Variáveis do PostgreSQL não encontradas.');
}

// 8. Arquivos residuais
const configFiles = fs.readdirSync(path.join(process.cwd(), 'config'));
const residuals = configFiles.filter(f => f.endsWith('-funcional.js') || f.endsWith('.bak') || f.endsWith('.old'));
if (residuals.length) {
  console.log('\n⚠️ Arquivos residuais em config/:', residuals.join(', '));
}

console.log('\nDiagnóstico concluído.');
console.log('Ações recomendadas:');
console.log('- Remova arquivos de configuração duplicados ou antigos.');
console.log('- Confirme se plugins.js está correto e único.');
console.log('- Verifique logs do Strapi para garantir que customPath está sendo executado.');
console.log('- Reinicie o servidor após alterações.');
