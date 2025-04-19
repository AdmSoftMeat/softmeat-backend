// scripts/test-strapi-upload-active.js
const dotenv = require('dotenv');
dotenv.config();

async function testStrapiUploadActive(strapi) {
  console.log('=== TESTE DE UPLOAD ATIVO DO STRAPI ===');

  try {
    // 1. Descobrir provider ativo do upload
    let providerName = null;
    let providerConfig = null;
    let customPathFunc = null;

    // Tenta pelo plugin oficial
    if (strapi?.plugin?.('upload')?.provider) {
      providerName = strapi.plugin('upload').provider;
      providerConfig = strapi.plugin('upload').providerConfig;
    } else if (strapi?.plugins?.upload?.provider) {
      providerName = strapi.plugins.upload.provider;
      providerConfig = strapi.plugins.upload.providerConfig;
    }

    // Tenta acessar o customPath
    const uploadConfig = strapi.config.get('plugin.upload');
    if (uploadConfig?.actionOptions?.upload?.customPath) {
      customPathFunc = uploadConfig.actionOptions.upload.customPath;
    }

    console.log('Provider ativo:', providerName || '(não detectado)');
    console.log('Configuração do provider:', providerConfig || '(não detectada)');
    console.log('Função customPath está presente:', !!customPathFunc);

    // 2. Simula um upload para testar o customPath
    if (customPathFunc) {
      const fakeFile = {
        name: 'Teste_Árvore-çãõ.jpg',
        hash: '123abc',
        ext: '.jpg',
        related: [{ ref: 'api::produto.produto' }],
        mime: 'image/jpeg',
        path: null,
      };
      const resultPath = customPathFunc(fakeFile);
      console.log('Resultado do customPath para arquivo de teste:', resultPath);
    } else {
      console.log('customPath não está configurado na actionOptions.upload.');
    }

    // 3. Verifica se existe provider customizado carregado
    try {
      const customProvider = require('../src/provider/r2-upload/index.js');
      if (customProvider) {
        console.log('⚠️ Provider customizado r2-upload está presente no projeto!');
      }
    } catch (err) {
      // Não existe ou não foi carregado
    }

    // 4. Testa upload real se desejado
    // (Opcional: pode-se simular upload real se desejar, mas para diagnóstico basta o acima)

  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

module.exports = { testStrapiUploadActive };

// Instruções de uso:
// 1. Acesse o console do Strapi:
//    npx strapi console
// 2. Execute o teste:
//    await require('./scripts/test-strapi-upload-active.js').testStrapiUploadActive(strapi);
