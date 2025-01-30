'use strict';

module.exports = () => {
  // Função de bootstrap
  strapi.log.info('Starting Strapi server...');

  // Configurações iniciais
  strapi.log.info('Checking database connection...');

  // Log de configurações importantes
  strapi.log.info(`Server URL: ${strapi.config.get('server.url', 'not set')}`);
  strapi.log.info(`Database Client: ${strapi.config.get('database.connection.client', 'not set')}`);
  strapi.log.info(`Database Path: ${strapi.config.get('database.connection.connection.filename', 'not set')}`);
};
