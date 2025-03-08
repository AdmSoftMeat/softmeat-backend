// src/index.js - Adicione no início da função register ou bootstrap
module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {
    console.log('============ DEBUG ENVIRONMENT VARIABLES ============');
    console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
    console.log('R2_BUCKET:', process.env.R2_BUCKET);
    console.log('R2_CUSTOM_DOMAIN:', process.env.R2_CUSTOM_DOMAIN);
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {},
};
