// src/extensions/upload/strapi-server.js
'use strict';

module.exports = (plugin) => {
  // Se quiser manter capacidade de ajustar URLs, pode manter isso
  const customizeUrls = (file) => {
    if (file && file.url && process.env.R2_PUBLIC_URL) {
      if (file.url.includes('.r2.cloudflarestorage.com')) {
        // Ajustar URLs para usar o domínio personalizado
        const bucketName = process.env.R2_BUCKET;
        const publicUrl = process.env.R2_PUBLIC_URL.endsWith('/')
          ? process.env.R2_PUBLIC_URL.slice(0, -1)
          : process.env.R2_PUBLIC_URL;

        const regex = new RegExp(`.*?${bucketName}/(.*)`, 'i');
        const match = file.url.match(regex);

        if (match && match[1]) {
          file.url = `${publicUrl}/${match[1]}`;
        }
      }
    }
    return file;
  };

  // Interceptar URLs nas respostas
  const originalFindOne = plugin.services.upload.findOne;
  if (originalFindOne) {
    plugin.services.upload.findOne = async (id, config) => {
      const file = await originalFindOne(id, config);
      return customizeUrls(file);
    };
  }

  // Interceptar URLs nas listagens
  const originalFind = plugin.services.upload.find;
  if (originalFind) {
    plugin.services.upload.find = async (params, config) => {
      const files = await originalFind(params, config);
      if (Array.isArray(files)) {
        files.forEach(file => customizeUrls(file));
      }
      return files;
    };
  }

  return plugin;
};
