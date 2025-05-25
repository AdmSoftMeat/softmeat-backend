// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-provider-cloudflare-r2',
      providerOptions: {
        accessKeyId: env('R2_ACCESS_KEY'),
        secretAccessKey: env('R2_SECRET_KEY'),
        endpoint: env('R2_ENDPOINT'),
        params: {
          Bucket: env('R2_BUCKET'),
          ACL: 'public-read' // Adição crítica
        },
        cloudflarePublicAccessUrl: env('R2_PUBLIC_URL'),
        pool: true // Fundamental para pastas numéricas
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      }
    }
  }
});
