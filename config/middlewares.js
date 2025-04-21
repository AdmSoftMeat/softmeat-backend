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
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: [
        'https://softmeat.com.br',
        'https://www.softmeat.com.br',
        'https://softmeat-frontend.pages.dev', // Mantenha se necessário para testes
      ],
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
