// config/middlewares.js

module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': [
            "'self'",
            'https:',
            'http://localhost:*',
            'https://softmeat.com.br',
            'https://www.softmeat.com.br',
            'https://softmeat-frontend.pages.dev',
            'https://storage.softmeat.com.br',
            'https://*.r2.cloudflarestorage.com',
          ],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'market-assets.strapi.io',
          'https://storage.softmeat.com.br',
          'https://*.r2.cloudflarestorage.com',
        ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            'https://storage.softmeat.com.br',
            'https://*.r2.cloudflarestorage.com',
          ],
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'font-src': ["'self'", 'data:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [
        // Frontend de produção
        'https://softmeat.com.br',
        'https://www.softmeat.com.br',
        'https://softmeat-frontend.pages.dev',
        // Backend/admin de produção (Railway ou custom domain)
        'https://softmeat-backend-production-ac73.up.railway.app',
        // Adicione aqui o domínio customizado do backend, se usar
        // 'https://api.softmeat.com.br',
        // Desenvolvimento local
        'http://localhost:4321',
        'http://127.0.0.1:4321',
        'http://localhost:1337',
        'http://127.0.0.1:1337',
      ],
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'X-Requested-With',
        'X-Forwarded-Host',
        'X-Forwarded-Proto',
      ],
      credentials: true,
      // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
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
