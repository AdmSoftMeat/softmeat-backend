// scripts/test-r2-reference.js
const dotenv = require('dotenv');
dotenv.config();

async function testR2Reference(strapi, testUrl) {
  console.log('=== TESTE DE REFERENCIAMENTO DE IMAGENS R2 ===');

  try {
    const r2Url = testUrl || 'https://storage.softmeat.com.br/produtos/bacon-12345.jpg';
    const fileData = {
      name: 'teste-referencia.jpg',
      url: r2Url,
      mime: 'image/jpeg',
      size: 10240,
      ext: '.jpg',
    };

    if (!strapi?.plugin) {
      console.error('❌ Strapi não está disponível no contexto. Execute via Strapi.');
      return;
    }

    const uploadService = strapi.plugin('upload').service('upload');
    if (!uploadService || !uploadService.upload) {
      console.error('❌ Serviço de upload não disponível.');
      return;
    }

    const result = await uploadService.upload({
      data: { fileInfo: fileData },
      files: {}
    });

    console.log('Resultado do teste:');
    console.log(' - URL:', result?.url);
    console.log(' - Provider:', result?.provider);
    console.log(' - Tamanho:', result?.size);
    console.log(' - isExternalUrl:', result?.isExternalUrl);

    if (result?.url === r2Url) {
      console.log('✅ SUCESSO! A URL original foi preservada');
    } else {
      console.log('❌ FALHA! A URL foi modificada');
    }

  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

module.exports = { testR2Reference };

// Instruções de uso:
// 1. Acesse o console do Strapi:
//    npx strapi console
// 2. Execute o teste:
//    await require('./scripts/test-r2-reference.js').testR2Reference(strapi, 'https://storage.softmeat.com.br/produtos/bacon-12345.jpg');
