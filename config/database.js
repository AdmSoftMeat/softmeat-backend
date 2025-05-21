module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('PGHOST'),
      port: env.int('PGPORT'),
      database: env('PGDATABASE'),
      user: env('PGUSER'),
      password: env('PGPASSWORD'),
      ssl: env.bool('DATABASE_SSL', true) ? {
        rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false) // False para aceitar self-signed
      } : false,
    },
  },
});
