module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'frame-ancestors': null,
          upgradeInsecureRequests: null,
        },
      },
      frameguard: false,
      strapi: {
        oneTimeAuthToken: {
          required: false
        }
      }
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      keepHeaderOnError: true,
      credentials: true,
      maxAge: 31536000,
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
