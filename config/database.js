// config/database.js
const parse = require('pg-connection-string').parse;

module.exports = ({ env }) => {
  const config = parse(env('DATABASE_URL'));

  return {
    connection: {
      client: 'postgres',
      connection: {
        ...config,
        ssl: {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false)
        }
      }
    }
  };
};
