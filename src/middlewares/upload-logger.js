// src/middlewares/upload-logger.js
module.exports = (config, strapi) => {
  return async (ctx, next) => {
    if (ctx.request.url.includes('upload') && ctx.request.method === 'POST') {
      console.log('=== INÍCIO DE UPLOAD ===');
      console.log('Dados do arquivo:', ctx.request.files?.files?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        hash: f.hash
      })));

      try {
        await next();
        console.log('=== RESPOSTA DE UPLOAD ===');
        console.log('Status:', ctx.response.status);
        if (ctx.response.body?.length) {
          console.log('Arquivos processados:', ctx.response.body.map(f => ({
            name: f.name,
            url: f.url,
            hash: f.hash
          })));
        }
      } catch (error) {
        console.error('=== ERRO DE UPLOAD ===', error.message);
        throw error;
      }
    } else {
      await next();
    }
  };
};
