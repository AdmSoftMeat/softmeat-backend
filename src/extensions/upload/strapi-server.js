// src/extensions/upload/strapi-server.js (versão otimizada para produção)
'use strict';

const formatUrl = require('./services/format-url');

module.exports = (plugin) => {
  // Sobrescrever upload com logging detalhado para produção
  const originalUpload = plugin.services.upload.upload;

  plugin.services.upload.upload = async (fileData, config) => {
    // Log detalhado para depuração em produção
    if (fileData) {
      console.log(`[PROD UPLOAD] Iniciando upload: ${fileData.name || 'Unknown'} (${fileData.size} bytes, ${fileData.type})`);
    }

    try {
      // Chamar o upload original
      const result = await originalUpload(fileData, config);

      // Log de sucesso
      console.log(`[PROD UPLOAD] Upload concluído: ${fileData?.name || 'Unknown'}`);

      // Formatar URLs
      if (Array.isArray(result)) {
        const formattedResults = result.map(file => formatUrl.formatFileUrl(file));
        console.log(`[PROD UPLOAD] URLs formatadas para ${formattedResults.length} arquivos`);
        return formattedResults;
      }

      return formatUrl.formatFileUrl(result);
    } catch (error) {
      // Log detalhado de erro
      console.error('[PROD UPLOAD ERROR]', {
        message: error.message,
        stack: error.stack,
        fileName: fileData?.name,
        fileSize: fileData?.size,
        fileType: fileData?.type,
        time: new Date().toISOString()
      });

      throw error;
    }
  };

  // Desativar o middleware de processamento para evitar problemas
  // O middleware apenas fará log sem modificar as imagens
  const imageProcessorMiddleware = require('./middlewares/imageProcessor');
  strapi.server.use((ctx, next) => {
    if (ctx.request.url.includes('/upload')) {
      return imageProcessorMiddleware(null, { strapi })(ctx, next);
    }
    return next();
  });

  return plugin;
};
