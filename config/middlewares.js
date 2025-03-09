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
            env("R2_ENDPOINT", "").replace(/^https?:\/\//, ""),
            env("R2_PUBLIC_URL", "").replace(/^https?:\/\//, ""),
            '*.r2.cloudflarestorage.com'
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            env("R2_ENDPOINT", "").replace(/^https?:\/\//, ""),
            env("R2_PUBLIC_URL", "").replace(/^https?:\/\//, ""),
            '*.r2.cloudflarestorage.com',
            '*.cloudflare.com',
            '*.softmeat.com.br',
            'market-assets.strapi.io',
            '*'
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            env("R2_ENDPOINT", "").replace(/^https?:\/\//, ""),
            env("R2_PUBLIC_URL", "").replace(/^https?:\/\//, ""),
            '*.r2.cloudflarestorage.com',
            '*.cloudflare.com',
            '*.softmeat.com.br',
            'market-assets.strapi.io',
            '*'
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
    name: 'upload-debug',
    resolve: './src/middlewares/upload-debug'
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      jsonLimit: '10mb',
      formLimit: '50mb',
      textLimit: '10mb',
      formidable: {
        maxFileSize: 50 * 1024 * 1024,
        multiples: true,
        keepExtensions: true
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
