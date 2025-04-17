// src/middlewares/custom-naming.js
'use strict';

module.exports = (strapi) => ({
  initialize() {
    strapi.app.use(async (ctx, next) => {
      if (ctx.path.startsWith('/upload')) {
        // Sua lógica personalizada aqui
      }
      await next();
    });
  }
});
