// src/extensions/upload/strapi-server.js
'use strict';

const formatUrl = require('./services/format-url');
const imageProcessorMiddleware = require('./middlewares/imageProcessor');

module.exports = (plugin) => {
  // Adicionar log de erro detalhado
  const logUploadError = (error, fileData) => {
    console.error('[UPLOAD ERROR]', {
      message: error.message,
      stack: error.stack,
      fileName: fileData?.name,
      fileSize: fileData?.size,
      fileMime: fileData?.type,
      time: new Date().toISOString()
    });
  };

  // Registrar middleware para processamento de imagens
  strapi.server.use((ctx, next) => {
    // Apenas processar se for uma requisição para o endpoint de upload
    if (ctx.request.url.startsWith('/api/upload')) {
      return imageProcessorMiddleware(null, { strapi })(ctx, next);
    }
    return next();
  });

  // Sobrescrever upload para adicionar tratamento de erro
  const oldUpload = plugin.services.upload.upload;
  plugin.services.upload.upload = async (fileData, config) => {
    try {
      // Log antes do upload para debugging
      if (fileData) {
        console.log(`[UPLOAD START] ${fileData.name || 'Unknown file'} (${fileData.size} bytes, ${fileData.type})`);
      }

      const result = await oldUpload(fileData, config);

      // Registrar sucesso
      console.log(`[UPLOAD SUCCESS] ${fileData?.name || 'Unknown file'}`);

      // Formatar URLs nos resultados do upload
      if (Array.isArray(result)) {
        return result.map(file => formatUrl.formatFileUrl(file));
      }

      return formatUrl.formatFileUrl(result);
    } catch (error) {
      // Registrar erro detalhado
      logUploadError(error, fileData);

      // Relançar o erro para tratamento adequado na camada de API
      throw error;
    }
  };

  return plugin;
};
