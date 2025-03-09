const path = require("path");

module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: env('DATABASE_FILENAME', '/mnt/data/softmeat-db/data.db'),
      useNullAsDefault: true,
    },
    useNullAsDefault: true,
    pool: {
      min: 0,
      max: 1,
      acquireTimeoutMillis: 600000,
      createTimeoutMillis: 600000,
      destroyTimeoutMillis: 600000,
      idleTimeoutMillis: 600000,
    }
  }
});
