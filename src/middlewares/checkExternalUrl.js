'use strict';

// Middleware que verifica se uma URL é externa e evita o processamento desnecessário
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Apenas interceptar uploads
    if (ctx.request.url.includes('/upload') && ctx.request.method === 'POST') {
      const fileData = ctx.request.body?.fileInfo;

      // Verificar se é uma URL externa do R2
      if (fileData && fileData.url) {
        const r2Patterns = [
          'images.softmeat.com.br',
          '.r2.cloudflarestorage.com',
          process.env.CF_PUBLIC_ACCESS_URL,
          process.env.R2_CUSTOM_DOMAIN
        ].filter(Boolean);

        const isR2Url = r2Patterns.some(pattern =>
          fileData.url && pattern && fileData.url.includes(pattern)
        );

        if (isR2Url) {
          // Marcar como URL externa
          ctx.request.body.fileInfo.isExternalUrl = true;
          console.log(`[R2 Middleware] URL R2 detectada: ${fileData.url}`);
        }
      }
    }

    await next();
  };
};
