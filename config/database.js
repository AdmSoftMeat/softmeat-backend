module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('PGHOST', 'localhost'),
      port: env.int('PGPORT', 5432), // Garante conversão para número
      database: env('PGDATABASE', 'strapi'),
      user: env('PGUSER', 'postgres'),
      password: env('PGPASSWORD', 'postgres'),
      ssl: env.bool('DATABASE_SSL', true) ? {
        rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false)
      } : false,
    },
    debug: false,
  },
});
