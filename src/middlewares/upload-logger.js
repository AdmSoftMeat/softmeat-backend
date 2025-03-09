// src/middlewares/upload-logger.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.request.url.includes('/upload')) {
      console.log('=== UPLOAD DEBUG ===');
      console.log('Request method:', ctx.request.method);
      console.log('Content-Type:', ctx.request.header['content-type']);

      try {
        await next();
        console.log('Upload response status:', ctx.response.status);
      } catch (error) {
        console.error('Upload error:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
      }
    } else {
      await next();
    }
  };
};
