// scripts/check-r2-url.js
require('dotenv').config();

// Função para verificar se uma URL é do R2
function isR2Url(url) {
  const r2Patterns = [
    'images.softmeat.com.br',
    '.r2.cloudflarestorage.com',
    process.env.CF_PUBLIC_ACCESS_URL,
    process.env.R2_CUSTOM_DOMAIN,
    'softmeat-dev',
    'softmeat-prod'
  ].filter(Boolean);

  return r2Patterns.some(pattern => pattern && url.includes(pattern));
}

// Função para normalizar URL R2
function normalizeR2Url(url) {
  if (!url || !isR2Url(url)) return url;

  const publicUrl = process.env.CF_PUBLIC_ACCESS_URL || 'https://images.softmeat.com.br';

  // Já usa o domínio público?
  if (url.startsWith(publicUrl)) {
    return url;
  }

  // Extrair caminho relativo
  let relativePath = '';

  if (url.includes('.r2.cloudflarestorage.com')) {
    const match = url.match(/.*\/([^/]+)\/(.*)$/);
    if (match && match[2]) {
      relativePath = match[2];
    }
  }

  if (relativePath) {
    const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    return `${cleanPublicUrl}/${relativePath}`;
  }

  return url;
}

// URLs de teste
const testUrls = [
  'https://images.softmeat.com.br/produtos/bacon-12345.jpg',
  'https://950693b7edbd202561c3d20e4a036247.r2.cloudflarestorage.com/softmeat-dev/produtos/salame-67890.png',
  'https://950693b7edbd202561c3d20e4a036247.r2.cloudflarestorage.com/softmeat-prod/images/test.jpg',
  'https://example.com/imagem.jpg'
];

// Testar cada URL
console.log('=== TESTE DE DETECÇÃO E NORMALIZAÇÃO DE URLS R2 ===');
console.log('Variáveis de ambiente carregadas:');
console.log('CF_PUBLIC_ACCESS_URL:', process.env.CF_PUBLIC_ACCESS_URL);
console.log('CF_ENDPOINT:', process.env.CF_ENDPOINT);
console.log('CF_BUCKET:', process.env.CF_BUCKET);

testUrls.forEach(url => {
  const isR2 = isR2Url(url);
  const normalized = normalizeR2Url(url);

  console.log(`\nURL: ${url}`);
  console.log(`É URL do R2? ${isR2 ? 'SIM' : 'NÃO'}`);

  if (isR2) {
    console.log(`URL normalizada: ${normalized}`);
    console.log(`Mudou? ${url !== normalized ? 'SIM' : 'NÃO'}`);
  }
});

// Executar com: node scripts/check-r2-url.js
