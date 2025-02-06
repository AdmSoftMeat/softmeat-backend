// config/plugins.js
module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 10 * 1024 * 1024, // Aumentando para 10MB
      },
      breakpoints: {
        large: 1000,
        medium: 750,
        small: 500,
        thumbnail: 150,
      },
    },
  },
});
