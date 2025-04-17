// config/webhooks.js
module.exports = {
  default: {
    'media.create': [
      {
        name: 'frontend-notification',
        url: process.env.FRONTEND_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ],
    'media.update': [
      {
        name: 'frontend-notification',
        url: process.env.FRONTEND_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ],
    'media.delete': [
      {
        name: 'frontend-notification',
        url: process.env.FRONTEND_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ],
  },
};
