const path = require("path");

module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.join(process.cwd(), env('DATABASE_FILENAME', '.tmp/data.db')),
      useNullAsDefault: true,
    },
    debug: false,
    useNullAsDefault: true,
    pool: {
      min: 0,
      max: 1,
      acquireTimeoutMillis: 300000,
      createTimeoutMillis: 300000,
      destroyTimeoutMillis: 300000,
      idleTimeoutMillis: 300000
    }
  }
});
