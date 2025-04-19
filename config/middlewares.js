module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://storage.softmeat.com.br',
            'https://*.r2.cloudflarestorage.com',
            // Adicione outros domínios de imagens se necessário
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://storage.softmeat.com.br',
            'https://*.r2.cloudflarestorage.com',
          ],
          // Outros directives podem ser adicionados conforme necessidade
        },
      },
    },
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
