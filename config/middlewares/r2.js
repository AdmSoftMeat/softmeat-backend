module.exports = ({ env }) => ({
  settings: {
    r2Storage: {
      enabled: true,
      config: {
        provider: '@strapi/provider-upload-aws-s3',
        providerOptions: {
          accessKeyId: env('R2_ACCESS_KEY'),
          secretAccessKey: env('R2_SECRET_KEY'),
          endpoint: env('R2_ENDPOINT'),
          params: {
            Bucket: env('R2_BUCKET'),
          },
          region: env('R2_REGION', 'auto'),
        },
      },
    },
  },
});
