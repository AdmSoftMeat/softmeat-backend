module.exports = {
  register({ strapi }) {
    console.log('=== VERIFICAÇÃO DE AMBIENTE DE PRODUÇÃO ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_CLIENT:', process.env.DATABASE_CLIENT);
    console.log('DATABASE_FILENAME:', process.env.DATABASE_FILENAME);

    // Verificar variáveis R2
    console.log('=== CONFIGURAÇÃO R2 ===');
    console.log('R2_ACCESS_KEY configurado:', !!process.env.R2_ACCESS_KEY);
    console.log('R2_SECRET_KEY configurado:', !!process.env.R2_SECRET_KEY);
    console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
    console.log('R2_BUCKET:', process.env.R2_BUCKET);
    console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);

    // Verificar permissões de diretório (produção)
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs');
      const path = require('path');

      const dbPath = process.env.DATABASE_FILENAME;
      const dbDir = path.dirname(dbPath);

      try {
        console.log(`Verificando diretório do banco de dados: ${dbDir}`);
        if (fs.existsSync(dbDir)) {
          console.log('✓ Diretório do banco de dados existe');

          // Verificar permissões
          const dirStats = fs.statSync(dbDir);
          console.log(`  Permissões: ${dirStats.mode}`);

          // Verificar arquivo do banco
          if (fs.existsSync(dbPath)) {
            console.log(`✓ Arquivo do banco de dados existe: ${dbPath}`);
            const fileStats = fs.statSync(dbPath);
            console.log(`  Tamanho: ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);
            console.log(`  Permissões: ${fileStats.mode}`);
          } else {
            console.log(`✗ Arquivo do banco de dados não existe: ${dbPath}`);
          }
        } else {
          console.log(`✗ Diretório do banco de dados não existe: ${dbDir}`);
        }
      } catch (error) {
        console.error('Erro ao verificar banco de dados:', error.message);
      }
    }
  },

  bootstrap({ strapi }) {
    // Log de inicialização simplificado
    console.log(`Strapi iniciado em ${process.env.NODE_ENV} mode`);
  }
};
