module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'https://softmeat-backend-production-ac73.up.railway.app'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  emitErrors: false,
  maxUploadLimit: '50mb',
  maxRequestSize: '50mb',
  http2: {
    enabled: false,
  },
  webhooks: {
    populateRelations: false,
  },
  timeout: 120000,
});
