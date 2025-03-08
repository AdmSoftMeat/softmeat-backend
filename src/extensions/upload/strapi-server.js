'use strict';

const formatUrl = require('./services/format-url');

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

  // Sobrescrever upload para adicionar tratamento de erro
  const oldUpload = plugin.services.upload.upload;
  plugin.services.upload.upload = async (fileData, config) => {
    try {
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

  // Outras sobrescritas existentes...

  return plugin;
};
