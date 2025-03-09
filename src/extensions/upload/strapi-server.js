'use strict';

module.exports = (plugin) => {
  // Sobrescrever o controlador de upload
  const originalUpload = plugin.controllers.upload.upload;

  plugin.controllers.upload.upload = async (ctx) => {
    const { url } = ctx.request.body?.fileInfo || {};

    // Se for uma URL do R2, criar referência em vez de upload
    if (url && (url.includes('storage.softmeat.com.br') || url.includes('r2.cloudflarestorage.com'))) {
      console.log('[R2] Referenciando URL externa:', url);

      // Extrair informações do arquivo
      const fileName = url.split('/').pop();
      const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
      const mime = getMimeType(ext);

      // Criar entrada no banco sem fazer upload
      const entity = await strapi.entityService.create('plugin::upload.file', {
        data: {
          name: fileName,
          alternativeText: ctx.request.body.fileInfo?.alternativeText,
          caption: ctx.request.body.fileInfo?.caption,
          width: ctx.request.body.fileInfo?.width,
          height: ctx.request.body.fileInfo?.height,
          formats: {},
          hash: fileName.split('.')[0],
          ext: ext,
          mime: mime,
          size: ctx.request.body.fileInfo?.size || 0,
          url: url,
          provider: 'aws-s3'
        }
      });

      return { data: entity };
    }

    // Para outros casos, informar que não permitimos upload
    return ctx.badRequest(
      'Upload direto não permitido',
      { message: 'Este servidor não aceita uploads diretos. Por favor, use URLs do R2.' }
    );
  };

  return plugin;
};

// Função auxiliar
function getMimeType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  return types[ext?.toLowerCase()] || 'application/octet-stream';
}
