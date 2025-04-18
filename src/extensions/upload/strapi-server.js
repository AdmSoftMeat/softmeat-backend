// src/extensions/upload/strapi-server.js
module.exports = (plugin) => {
  // Armazenar a função original
  const originalUploadToEntity = plugin.services.upload.uploadToEntity;

  // Substituir com versão com log
  plugin.services.upload.uploadToEntity = async (params) => {
    console.log('[Upload Debug] Params:', JSON.stringify(params, null, 2));
    // Chamar a função original, não a si mesma
    return await originalUploadToEntity(params);
  };

  return plugin;
};
