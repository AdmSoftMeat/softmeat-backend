module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'https://softmeat-backend-production.up.railway.app'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
    url: '/admin',
    autoOpen: false,
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
