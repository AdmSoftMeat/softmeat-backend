// src/api/media-reference/controllers/media-reference.js
'use strict';

module.exports = {
  async reference(ctx) {
    try {
      const { url, name, caption, alternativeText } = ctx.request.body;

      if (!url) {
        return ctx.badRequest('URL é obrigatória');
      }

      // Criar o objeto de referência
      const fileData = {
        fileInfo: {
          name: name || url.split('/').pop(),
          url,
          caption,
          alternativeText,
          isExternalUrl: true
        }
      };

      // Usar o serviço de upload existente
      const file = await strapi.plugins.upload.services.upload.upload(fileData);

      return {
        success: true,
        file
      };
    } catch (error) {
      console.error('[Media Reference] Erro:', error);
      return ctx.badRequest('Erro ao referenciar mídia', { error: error.message });
    }
  }
};
