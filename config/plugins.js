// config/plugins.js
module.exports = ({ env }) => ({
  // Outras configurações...
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        accessKeyId: env('R2_ACCESS_KEY'),
        secretAccessKey: env('R2_SECRET_KEY'),
        endpoint: env('R2_ENDPOINT'),
        region: env('R2_REGION', 'auto'),
        params: {
          Bucket: env('R2_BUCKET'),
          ACL: 'public-read',
        },
        customDomain: env('R2_PUBLIC_URL')
      },
    },
  },
});
