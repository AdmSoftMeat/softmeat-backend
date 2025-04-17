// config/plugins.js
const path = require('path');

module.exports = ({ env }) => ({
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
        baseUrl: env('R2_PUBLIC_URL')
      },
      actionOptions: {
        upload: {
          ACL: 'public-read',
          customPath: (file) => {
            const sanitizeString = (str) => {
              if (!str) return '';
              return str
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9-_]/g, '-')
                .replace(/-+/g, '-')
                .toLowerCase();
            };

            // Determinar coleção a partir do contexto
            let collection = 'geral';
            if (file.related) {
              const [model] = file.related.split('.');
              collection = model;
            }

            // Usar nome original sem hash
            const originalName = file.name || 'file';
            const baseName = path.basename(originalName, path.extname(originalName));
            const sanitizedName = sanitizeString(baseName);

            // Formato final: coleção/nome-sanitizado.ext
            return `${collection}/${collection}_${sanitizedName}${path.extname(originalName)}`;
          }
        }
      }
    },
  },
});
