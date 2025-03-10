module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        accessKeyId: env('R2_ACCESS_KEY'),
        secretAccessKey: env('R2_SECRET_KEY'),
        endpoint: env('R2_ENDPOINT'),
        params: {
          Bucket: env('R2_BUCKET'),
          ACL: 'public-read',
        },
        region: env('R2_REGION', 'auto'),
        baseUrl: env('R2_PUBLIC_URL')
      },
      actionOptions: {
        upload: {
          ACL: 'public-read',
          customPath: (file) => {
            // Determine folder based on file type
            const type = file.mime.split('/')[0];
            let folder = 'outros';

            if (type === 'image') folder = 'imagens';
            else if (type === 'video') folder = 'videos';
            else if (type === 'audio') folder = 'audios';

            // Add related model as subfolder if available
            if (file.related) {
              const model = file.related.split('.')[0];
              return `${folder}/${model}/${file.hash}${file.ext}`;
            }

            return `${folder}/${file.hash}${file.ext}`;
          }
        }
      }
    },
  },
});
