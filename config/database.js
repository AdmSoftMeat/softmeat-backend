const path = require("path");

module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.join(process.cwd(), env('DATABASE_FILENAME', '/opt/app/data/data.db')),
      useNullAsDefault: true,
      // Aumentando limites para suportar URLs longas do Cloudinary
      stringifyObjects: true,
      timezone: 'UTC',
      options: {
        maxVariables: 10000 // Aumenta limite de variáveis
      }
    },
    debug: false,
    pool: {
      min: 0,
      max: 1,
      acquireTimeoutMillis: 300000,
      createTimeoutMillis: 300000,
      destroyTimeoutMillis: 300000,
      idleTimeoutMillis: 300000,
      // Usando sintaxe correta do Knex para SQLite
      afterCreate: (conn, cb) => {
        conn.pragma('journal_mode = WAL');
        conn.pragma('synchronous = NORMAL');
        cb(null, conn);
      }
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(process.cwd(), 'database/migrations')
    }
  }
});
