// config/plugins.js
const path = require('path');

// Função para sanitizar nomes de arquivo
const sanitizeString = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Substitui caracteres especiais
    .replace(/-+/g, '-') // Remove hífens consecutivos
    .toLowerCase();
};

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        s3Options: { // Configuração correta para R2
          accessKeyId: env('R2_ACCESS_KEY'),
          secretAccessKey: env('R2_SECRET_KEY'),
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
            // 1. Determinar coleção
            let collection = 'geral';

            if (file.related?.length > 0) {
              const [model] = file.related[0].ref.split('.');
              collection = model;
            }

            // 2. Obter nome original seguro
            const originalName = file.name || file.hash;
            const baseName = path.basename(originalName, path.extname(originalName));
            const sanitizedName = sanitizeString(baseName);

            // 3. Formato final: coleção/nome-coleção_nome-arquivo.ext
            return `${collection}/${collection}_${sanitizedName}${path.extname(originalName)}`;
          }
        },
        uploadStream: {},
        delete: {},
      }
    },
  },
});

