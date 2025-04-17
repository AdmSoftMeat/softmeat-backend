// src/index.js
module.exports = {
  register(strapi) {
    console.log('=== VERIFICAÇÃO DE AMBIENTE DE PRODUÇÃO ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_CLIENT:', process.env.DATABASE_CLIENT);
    console.log('DATABASE_FILENAME:', process.env.DATABASE_FILENAME);

    console.log('=== CONFIGURAÇÃO R2 ===');
    console.log('R2_ACCESS_KEY configurado:', !!process.env.R2_ACCESS_KEY);
    console.log('R2_SECRET_KEY configurado:', !!process.env.R2_SECRET_KEY);
    console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
    console.log('R2_BUCKET:', process.env.R2_BUCKET);
    console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);

    // Verificar permissões de diretório apenas se estiver usando SQLite
    if (process.env.NODE_ENV === 'production' &&
        process.env.DATABASE_CLIENT === 'sqlite' &&
        process.env.DATABASE_FILENAME) {
      const fs = require('fs');
      const path = require('path');

      const dbPath = process.env.DATABASE_FILENAME;
      const dbDir = path.dirname(dbPath);

      try {
        // Resto do código de verificação do SQLite...
      } catch (error) {
        console.error('Erro ao verificar banco de dados:', error.message);
      }
    }
  },

  bootstrap(strapi) {
    console.log(`Strapi iniciado em ${process.env.NODE_ENV} mode`);
  }
};
