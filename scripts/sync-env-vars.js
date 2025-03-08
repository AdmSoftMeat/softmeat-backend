// scripts/sync-env-vars.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis do ambiente atual
dotenv.config();

// Definir mapeamentos R2 -> CF
const mappings = [
  { from: 'R2_ACCESS_KEY', to: 'CF_ACCESS_KEY_ID' },
  { from: 'R2_SECRET_KEY', to: 'CF_ACCESS_SECRET' },
  { from: 'R2_ENDPOINT', to: 'CF_ENDPOINT' },
  { from: 'R2_BUCKET', to: 'CF_BUCKET' },
  { from: 'R2_REGION', to: 'CF_REGION' },
  { from: 'R2_CUSTOM_DOMAIN', to: 'CF_PUBLIC_ACCESS_URL' }
];

// Criar objeto com novos valores
const newVars = {};
let hasChanges = false;

// Mapear valores existentes
mappings.forEach(({ from, to }) => {
  if (process.env[from] && !process.env[to]) {
    newVars[to] = process.env[from];
    hasChanges = true;
    console.log(`Mapeando ${from} para ${to}: ${process.env[from]}`);
  }
});

if (!hasChanges) {
  console.log('Todas as variáveis já estão configuradas corretamente');
  process.exit(0);
}

// Determinar se estamos em produção ou desenvolvimento
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Em produção, apenas mostrar comandos para definir variáveis
  console.log('\nEm ambiente de produção, use os seguintes comandos:');

  Object.entries(newVars).forEach(([key, value]) => {
    // Mostrar comando para Railway, Heroku ou similar
    console.log(`railway variables set ${key}="${value}"`);
    // Ou para ambiente genérico
    console.log(`export ${key}="${value}"`);
  });
} else {
  // Em desenvolvimento, atualizar arquivo .env
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    console.error('Arquivo .env não encontrado');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Adicionar novas variáveis
  envContent += '\n\n# Variáveis mapeadas automaticamente\n';
  Object.entries(newVars).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });

  // Salvar o arquivo atualizado
  fs.writeFileSync(envPath, envContent);
  console.log('\nArquivo .env atualizado com sucesso!');
}
