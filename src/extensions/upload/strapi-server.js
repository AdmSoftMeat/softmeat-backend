'use strict';

const formatUrl = require('./services/format-url');

/**
 * Configuração de extensão para o plugin de upload
 * Sobrescreve funções para formatar URLs do R2
 */
module.exports = (plugin) => {
  // Registrar função de log para diagnóstico
  const formatDebug = (file) => {
    if (process.env.DEBUG_UPLOAD === 'true') {
      console.log('[Upload Debug] Formatando URL:', file?.url);
    }
    return file;
  };

  // Substituir a função findOne para formatar URLs
  const oldFindOne = plugin.services.upload.findOne;
  plugin.services.upload.findOne = async (id, populate) => {
    const file = await oldFindOne(id, populate);

    // Formatar URL se encontrou o arquivo
    if (file) {
      formatDebug(file);
      return formatUrl.formatFileUrl(file);
    }

    return file;
  };

  // Substituir a função findMany para formatar URLs
  const oldFindMany = plugin.services.upload.findMany;
  plugin.services.upload.findMany = async (query) => {
    const files = await oldFindMany(query);

    // Formatar URLs de todos os arquivos
    return files.map(file => {
      formatDebug(file);
      return formatUrl.formatFileUrl(file);
    });
  };

  // Sobrescrever a função do serviço upload para garantir que os links sejam formatados no momento do upload
  const oldUpload = plugin.services.upload.upload;
  plugin.services.upload.upload = async (fileData, config) => {
    const result = await oldUpload(fileData, config);

    // Formatar URLs nos resultados do upload
    if (Array.isArray(result)) {
      return result.map(file => formatUrl.formatFileUrl(file));
    }

    return formatUrl.formatFileUrl(result);
  };

  return plugin;
};