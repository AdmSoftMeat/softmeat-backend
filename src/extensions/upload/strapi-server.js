'use strict';

module.exports = (plugin) => {
  // Interceptar requisições de upload para capturar URLs externas
  plugin.controllers.upload.upload = async (ctx) => {
    try {
      console.log('[DEBUG] Interceptando requisição de upload:',
                 ctx.request.body?.fileInfo?.url || 'arquivo local');

      // Se for uma URL externa do R2, apenas referenciar
      if (ctx.request.body?.fileInfo?.url &&
          ctx.request.body.fileInfo.url.includes('storage.softmeat.com.br')) {

        console.log('[DEBUG] URL R2 detectada, criando referência');

        const url = ctx.request.body.fileInfo.url;
        const fileName = url.split('/').pop();
        const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
        const mime = getMimeType(ext);

        // Criar entrada no banco sem upload físico
        const fileData = {
          name: fileName,
          alternativeText: ctx.request.body.fileInfo.alternativeText || null,
          caption: ctx.request.body.fileInfo.caption || null,
          url: url,
          ext: ext,
          mime: mime,
          size: ctx.request.body.fileInfo.size || 0,
          provider: 'aws-s3',
        };

        // Salvar diretamente no banco
        const entity = await strapi.db.query('plugin::upload.file').create({
          data: fileData
        });

        return { data: entity };
      }

      // Para outros casos, continuar com o fluxo normal
      console.log('[DEBUG] Prosseguindo com upload normal');
      return await plugin.controllers.upload.originalUpload(ctx);
    } catch (error) {
      console.error('[ERROR] Erro durante upload:', error.message);
      throw error;
    }
  };

  // Manter referência ao controlador original
  plugin.controllers.upload.originalUpload = plugin.controllers.upload.upload;

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

  return types[ext.toLowerCase()] || 'application/octet-stream';
}
