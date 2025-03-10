// src/extensions/upload/strapi-server.js
module.exports = (plugin) => {
  plugin.services.upload.uploadToEntity = async (params) => {
    console.log('[Upload Debug] Params:', JSON.stringify(params, null, 2));
    return await plugin.services.upload.uploadToEntity(params);
  };

  return plugin;
};
