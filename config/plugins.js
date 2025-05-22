const { S3Client } = require('@aws-sdk/client-s3');

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Client: new S3Client({
          region: 'auto',
          endpoint: env('R2_ENDPOINT'),
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY'),
            secretAccessKey: env('R2_SECRET_KEY')
          },
          forcePathStyle: true // Necessário para Cloudflare R2
        }),
        params: {
          Bucket: env('R2_BUCKET'),
          ACL: 'public-read' // Garante permissão pública
        },
        baseUrl: env('R2_PUBLIC_URL') // URL pública do Cloudflare R2
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {}
      }
    }
  }
});
