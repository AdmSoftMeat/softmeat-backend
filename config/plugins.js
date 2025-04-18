// config/plugins.js
const path = require('path');

module.exports = ({ env }) => ({
  upload: {
    config: {
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY'),
            secretAccessKey: env('R2_SECRET_KEY')
          },
          endpoint: env('R2_ENDPOINT'),
          region: env('R2_REGION', 'auto'),
          params: {
            Bucket: env('R2_BUCKET'),
            ACL: 'public-read',
          }
        },
        baseUrl: env('R2_PUBLIC_URL')
      },
      actionOptions: {
        upload: {
          ACL: 'public-read',
          customPath: (file) => {
            // Função para sanitizar strings
            const sanitizeString = (str) => {
              if (!str) return '';
              return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9-_]/g, '-')
                .replace(/-+/g, '-')
                .toLowerCase();
            };

            // Determinar categoria
            let category = 'geral';
            if (file.related) {
              const relatedType = file.related.split('.')[0];
              category = relatedType || 'geral';
            }

            // Sanitizar nome do arquivo
            const nameWithoutExt = path.basename(file.name, path.extname(file.name));
            const sanitizedName = sanitizeString(nameWithoutExt);

            // Formato final: categoria/categoria_nome-arquivo.ext
            return `${category}/${category}_${sanitizedName}${path.extname(file.name)}`;
          }
        }
      }
    },
  },
});
