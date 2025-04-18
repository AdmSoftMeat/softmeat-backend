module.exports = {
  register(strapi) {
    console.log('=== VERIFICAÇÃO DE AMBIENTE DE PRODUÇÃO ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_CLIENT:', process.env.DATABASE_CLIENT);

    console.log('=== CONFIGURAÇÃO R2 ===');
    console.log('R2_ACCESS_KEY configurado:', !!process.env.R2_ACCESS_KEY);
    console.log('R2_SECRET_KEY configurado:', !!process.env.R2_SECRET_KEY);
    console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
    console.log('R2_BUCKET:', process.env.R2_BUCKET);
    console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);

    // Removida a linha problemática que usava path.dirname com valor undefined
  },

  bootstrap(strapi) {
    console.log(`Strapi iniciado em ${process.env.NODE_ENV} mode`);
  }
};
