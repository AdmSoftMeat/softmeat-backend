module.exports = ({ env }) => [
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
            'http:',
            env("CF_ENDPOINT", "").replace(/^https?:\/\//, ""),
            env("CF_PUBLIC_ACCESS_URL", "").replace(/^https?:\/\//, ""),
            '*.r2.cloudflarestorage.com'
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            env("CF_ENDPOINT", "").replace(/^https?:\/\//, ""),
            env("CF_PUBLIC_ACCESS_URL", "").replace(/^https?:\/\//, ""),
            '*.r2.cloudflarestorage.com',
            '*.cloudflare.com',
            '*.softmeat.com.br',
            'market-assets.strapi.io',
            '*'  // Temporariamente permissivo durante testes
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            env("CF_ENDPOINT", "").replace(/^https?:\/\//, ""),
            env("CF_PUBLIC_ACCESS_URL", "").replace(/^https?:\/\//, ""),
            '*.r2.cloudflarestorage.com',
            '*.cloudflare.com',
            '*.softmeat.com.br',
            'market-assets.strapi.io',
            '*'  // Temporariamente permissivo durante testes
          ],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'frame-ancestors': null,
          upgradeInsecureRequests: null,
        },
      },
      frameguard: false,
    },
  },
  {
    name: 'strapi::cors',
    config: {
      headers: '*',
      origin: [
        'http://localhost:1337',
        'http://localhost:3000',
        'http://localhost:4321',
        'https://softmeat.com.br',
        'https://www.softmeat.com.br',
        'https://softmeat-backend-production.up.railway.app',
        'https://softmeat.pages.dev',
        env("CF_PUBLIC_ACCESS_URL", "https://images.softmeat.com.br"),
        env("CF_ENDPOINT", "")
      ].filter(Boolean),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      keepHeaderOnError: true,
      credentials: true,
      maxAge: 31536000,
      exposedHeaders: ['Content-Range', 'X-Content-Range']
    },
  },
  // Remover temporariamente o middleware personalizado
  // {
  //   name: 'global::imageR2Handler',
  //   config: {}
  // },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
