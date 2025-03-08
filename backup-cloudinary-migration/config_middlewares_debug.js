// config/middlewares/debug.js
module.exports = (config, { strapi }) => {
  strapi.log.info("============ DEBUG ENVIRONMENT VARIABLES ============");
  strapi.log.info("R2_ENDPOINT:", process.env.R2_ENDPOINT);
  strapi.log.info("R2_BUCKET:", process.env.R2_BUCKET);
  strapi.log.info("R2_CUSTOM_DOMAIN:", process.env.R2_CUSTOM_DOMAIN);

  // Verificar se as variáveis do Cloudinary ainda existem
  strapi.log.info("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME);

  return async (ctx, next) => {
    // Continuar para o próximo middleware
    await next();
  };
};
