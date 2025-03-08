// scripts/test-r2-reference.js
const dotenv = require('dotenv');
dotenv.config();

async function testR2Reference(strapi) {
  console.log('=== TESTE DE REFERENCIAMENTO DE IMAGENS R2 ===');

  try {
    // 1. Simular uma URL do R2
    const r2Url = 'https://images.softmeat.com.br/produtos/bacon-12345.jpg';

    // 2. Criar um objeto de arquivo simulado
    const fileData = {
      name: 'teste-referencia.jpg',
      url: r2Url,
      mime: 'image/jpeg',
      size: 10240,
      ext: '.jpg',
    };

    console.log('Testando referência de URL R2:', r2Url);

    // 3. Simular o upload usando a biblioteca
    const uploadService = strapi.plugins.upload.services.upload;
    const result = await uploadService.upload({
      data: {
        fileInfo: fileData
      },
      files: {}
    });

    console.log('Resultado do teste:');
    console.log(' - URL: ', result?.url);
    console.log(' - Provider: ', result?.provider);
    console.log(' - Tamanho: ', result?.size);
    console.log(' - isExternalUrl: ', result?.isExternalUrl);

    if (result?.url === r2Url) {
      console.log('✅ SUCESSO! A URL original foi preservada');
    } else {
      console.log('❌ FALHA! A URL foi modificada');
    }

  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Exportar para uso com strapi
module.exports = { testR2Reference };

// Se executado diretamente
if (require.main === module) {
  console.log('Execute este script através do Strapi:');
  console.log('NODE_ENV=development node -e "require(\'./scripts/test-r2-reference.js\').testR2Reference(strapi)"');
}
