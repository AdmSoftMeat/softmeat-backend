// scripts/check-r2-url.js
require('dotenv').config();

// Função para verificar se uma URL é do R2
function isR2Url(url) {
  const r2Patterns = [
    'images.softmeat.com.br',
    '.r2.cloudflarestorage.com',
    process.env.CF_PUBLIC_ACCESS_URL,
    process.env.R2_CUSTOM_DOMAIN
  ].filter(Boolean);

  return r2Patterns.some(pattern => pattern && url.includes(pattern));
}

// URLs de teste
const testUrls = [
  'https://images.softmeat.com.br/produtos/bacon-12345.jpg',
  'https://950693b7edbd202561c3d20e4a036247.r2.cloudflarestorage.com/softmeat-dev/produtos/salame-67890.png',
  'https://example.com/imagem.jpg'
];

// Testar cada URL
console.log('=== TESTE DE DETECÇÃO DE URLS R2 ===');
console.log('Variáveis de ambiente carregadas:');
console.log('CF_PUBLIC_ACCESS_URL:', process.env.CF_PUBLIC_ACCESS_URL);
console.log('CF_ENDPOINT:', process.env.CF_ENDPOINT);
console.log('CF_BUCKET:', process.env.CF_BUCKET);

testUrls.forEach(url => {
  const result = isR2Url(url);
  console.log(`URL: ${url}`);
  console.log(`É URL do R2? ${result ? 'SIM' : 'NÃO'}`);
  console.log('---');
});

// Executar com: node scripts/check-r2-url.js
