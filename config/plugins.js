module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY'),
            secretAccessKey: env('R2_SECRET_KEY'),
          },
          region: env('R2_REGION', 'auto'),
          endpoint: env('R2_ENDPOINT'),
          params: {
            Bucket: env('R2_BUCKET'),
            ACL: 'public-read',
          }
        },
        baseUrl: env('R2_PUBLIC_URL', 'https://storage.softmeat.com.br'),
        uploadPath: '',
      },
      actionOptions: {
        upload: {
          ACL: 'public-read'
        },
        uploadStream: {
          ACL: 'public-read'
        },
        delete: {},
      },
    },
  },
});
