module.exports = {
  default: {
    'entry.publish': [
      {
        name: 'cloudflare-purge-all',
        url: process.env.CLOUDFLARE_PURGE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({ purge_everything: true })
      }
    ],
    'entry.unpublish': [
      {
        name: 'cloudflare-purge-all',
        url: process.env.CLOUDFLARE_PURGE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({ purge_everything: true })
      }
    ],
    'media.create': [
      {
        name: 'cloudflare-purge-all',
        url: process.env.CLOUDFLARE_PURGE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({ purge_everything: true })
      }
    ],
    'media.update': [
      {
        name: 'cloudflare-purge-all',
        url: process.env.CLOUDFLARE_PURGE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({ purge_everything: true })
      }
    ],
    'media.delete': [
      {
        name: 'cloudflare-purge-all',
        url: process.env.CLOUDFLARE_PURGE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({ purge_everything: true })
      }
    ]
  }
};

