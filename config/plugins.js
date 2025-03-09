const path = require('path');

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: path.resolve(__dirname, '../src/providers/r2-upload'),
      providerOptions: {
        accessKeyId: env('R2_ACCESS_KEY'),
        secretAccessKey: env('R2_SECRET_KEY'),
        endpoint: env('R2_ENDPOINT'),
        bucket: env('R2_BUCKET'),
        publicUrl: env('R2_PUBLIC_URL'),
        region: env('R2_REGION', 'auto'),
      },
    },
  },
});
