// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("PGHOST", "localhost"),
      port: parseInt(env("PGPORT", "5432")), // ← Converta explicitamente para número
      database: env("PGDATABASE", "strapi"),
      user: env("PGUSER", "postgres"),
      password: env("PGPASSWORD", "postgres"),
      ssl: env.bool("DATABASE_SSL", true)
        ? {
            rejectUnauthorized: env.bool("DATABASE_SSL_SELF", false),
          }
        : false,
    },
  },
});
