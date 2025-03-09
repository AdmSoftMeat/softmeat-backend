const path = require("path");

module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: env('DATABASE_FILENAME', '/mnt/data/softmeat-db/data.db'),
      useNullAsDefault: true,
    },
    debug: false,
    useNullAsDefault: true,  // Adicione isto para corrigir o aviso
    pool: {
      min: 0,
      max: 1,
      acquireTimeoutMillis: 300000,
      createTimeoutMillis: 300000,
      destroyTimeoutMillis: 300000,
      idleTimeoutMillis: 300000,
      afterCreate: (conn, cb) => {
        conn.pragma('journal_mode = WAL');
        conn.pragma('synchronous = NORMAL');
        cb(null, conn);
      }
    },
    migrations: {
      directory: path.join(process.cwd(), 'database/migrations')
    }
  }
});
