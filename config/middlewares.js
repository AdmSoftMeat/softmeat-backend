module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:', 'res.cloudinary.com'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            '*.cloudinary.com',
            'res.cloudinary.com'
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            '*.cloudinary.com',
            'res.cloudinary.com'
          ],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'frame-ancestors': null,
          upgradeInsecureRequests: null,
        },
        'default-src': ["'self'", '*.cloudinary.com', 'res.cloudinary.com'],
      },
      frameguard: false,
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: [
        'http://localhost:1337',
        'http://localhost:3000',
        'http://localhost:4321',
        'https://softmeat.com.br',
        'https://www.softmeat.com.br',
        'https://softmeat-backend-production.up.railway.app',
        'https://softmeat.pages.dev',
        'https://res.cloudinary.com'
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      keepHeaderOnError: true,
      credentials: true,
      maxAge: 31536000,
      exposedHeaders: ['Content-Range', 'X-Content-Range']
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
