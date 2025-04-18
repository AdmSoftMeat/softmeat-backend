const parse = require('pg-connection-string').parse;

module.exports = ({ env }) => {
  // Configuração para Railway
  if (env('DATABASE_URL')) {
    const config = parse(env('DATABASE_URL'));

    return {
      connection: {
        client: 'postgres',
        connection: {
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          password: config.password,
          ssl: {
            rejectUnauthorized: env.bool('DATABASE_SSL', true) // Railway requer SSL
          }
        },
        pool: {
          min: env.int('DATABASE_POOL_MIN', 2),
          max: env.int('DATABASE_POOL_MAX', 10)
        }
      }
    };
  }

  // Fallback para desenvolvimento local
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'postgres'),
        password: env('DATABASE_PASSWORD', 'postgres'),
        ssl: env.bool('DATABASE_SSL', false)
      }
    }
  };
};
