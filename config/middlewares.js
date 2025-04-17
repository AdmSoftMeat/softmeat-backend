module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'storage.softmeat.com.br', '*.r2.cloudflarestorage.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'storage.softmeat.com.br', '*.r2.cloudflarestorage.com'],
        },
      },
    },
  },
  {
    name: 'global::upload-logger',
    config: {}
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
