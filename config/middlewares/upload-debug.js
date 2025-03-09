module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.request.url.includes('/upload') && ctx.request.method === 'POST') {
      console.log('=== INTERCEPTANDO REQUISIÇÃO DE UPLOAD ===');
      console.log('Tamanho do corpo:', ctx.request.body ? 'Presente' : 'Ausente');
      console.log('Content-Type:', ctx.request.headers['content-type']);
      console.log('Content-Length:', ctx.request.headers['content-length']);

      try {
        await next();

        console.log('=== RESPOSTA DE UPLOAD ===');
        console.log('Status:', ctx.response.status);
        console.log('Tipo de resposta:', typeof ctx.response.body);
      } catch (error) {
        console.error('=== ERRO NO UPLOAD ===');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        throw error;
      }
    } else {
      await next();
    }
  };
};
