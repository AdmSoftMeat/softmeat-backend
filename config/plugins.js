// config/plugins.js
const path = require('path');

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3', // Adicionado o provider
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
            // Logs para depuração
            console.log('File object:', JSON.stringify({
              name: file.name,
              hash: file.hash,
              ext: file.ext,
              related: file.related,
              mime: file.mime,
              path: file.path
            }, null, 2));

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
              const relatedType = typeof file.related === 'string'
                ? file.related.split('.')[0]
                : Array.isArray(file.related) && file.related.length > 0
                  ? file.related[0].ref.split('.')[0]
                  : 'geral';
              category = relatedType || 'geral';
            }

            // Sanitizar nome do arquivo
            const nameWithoutExt = path.basename(file.name, path.extname(file.name));
            const sanitizedName = sanitizeString(nameWithoutExt);

            // Formato final: categoria/categoria_nome-arquivo.ext
            const finalPath = `${category}/${category}_${sanitizedName}${path.extname(file.name)}`;
            console.log('Final path:', finalPath);
            return finalPath;
          }
        }
      }
    },
  },
});
