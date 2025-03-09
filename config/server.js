module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'https://softmeat-backend-production.up.railway.app'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  // Limite de upload
  maxUploadLimit: '50mb',
});
