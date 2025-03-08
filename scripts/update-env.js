// scripts/update-env.js
// Este script atualiza o arquivo .env com as variáveis necessárias para o Cloudflare R2
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

// Verificar se o arquivo .env existe
if (!fs.existsSync(envPath)) {
  console.error('\x1b[31mArquivo .env não encontrado. Crie o arquivo primeiro.\x1b[0m');
  process.exit(1);
}

// Ler o conteúdo atual do arquivo .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Verificar quais variáveis já existem
const existingVars = {
  CF_ACCESS_KEY_ID: envContent.includes('CF_ACCESS_KEY_ID='),
  CF_ACCESS_SECRET: envContent.includes('CF_ACCESS_SECRET='),
  CF_ENDPOINT: envContent.includes('CF_ENDPOINT='),
  CF_BUCKET: envContent.includes('CF_BUCKET='),
  CF_PUBLIC_ACCESS_URL: envContent.includes('CF_PUBLIC_ACCESS_URL='),
};

// Ler variáveis R2 existentes para usar como padrão
const r2Vars = {
  R2_ACCESS_KEY: (envContent.match(/R2_ACCESS_KEY=([^\n]*)/)?.[1] || '').trim(),
  R2_SECRET_KEY: (envContent.match(/R2_SECRET_KEY=([^\n]*)/)?.[1] || '').trim(),
  R2_ENDPOINT: (envContent.match(/R2_ENDPOINT=([^\n]*)/)?.[1] || '').trim(),
  R2_BUCKET: (envContent.match(/R2_BUCKET=([^\n]*)/)?.[1] || '').trim(),
  R2_CUSTOM_DOMAIN: (envContent.match(/R2_CUSTOM_DOMAIN=([^\n]*)/)?.[1] || '').trim(),
};

// Preparar novas variáveis
const newVars = [];

if (!existingVars.CF_ACCESS_KEY_ID) {
  newVars.push(`CF_ACCESS_KEY_ID=${r2Vars.R2_ACCESS_KEY}`);
}

if (!existingVars.CF_ACCESS_SECRET) {
  newVars.push(`CF_ACCESS_SECRET=${r2Vars.R2_SECRET_KEY}`);
}

if (!existingVars.CF_ENDPOINT) {
  newVars.push(`CF_ENDPOINT=${r2Vars.R2_ENDPOINT}`);
}

if (!existingVars.CF_BUCKET) {
  newVars.push(`CF_BUCKET=${r2Vars.R2_BUCKET}`);
}

if (!existingVars.CF_PUBLIC_ACCESS_URL) {
  newVars.push(`CF_PUBLIC_ACCESS_URL=${r2Vars.R2_CUSTOM_DOMAIN || 'https://images.softmeat.com.br'}`);
}

// Adicionar as novas variáveis ao arquivo .env
if (newVars.length > 0) {
  envContent += '\n\n# Variáveis Cloudflare R2 para strapi-provider-cloudflare-r2\n';
  envContent += newVars.join('\n');

  // Salvar o arquivo atualizado
  fs.writeFileSync(envPath, envContent);

  console.log('\x1b[32mVariáveis adicionadas ao arquivo .env:\x1b[0m');
  newVars.forEach(v => console.log(`- ${v.split('=')[0]}`));
} else {
  console.log('\x1b[32mTodas as variáveis necessárias já existem no arquivo .env\x1b[0m');
}

console.log('\n\x1b[34mPróximos passos:\x1b[0m');
console.log('1. Verifique se as variáveis têm os valores corretos no arquivo .env');
console.log('2. Instale o provider: npm install strapi-provider-cloudflare-r2');
console.log('3. Reinicie o servidor Strapi: npm run develop');
