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
        s3Options: { // Formato correto para R2
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
            console.log('Upload file info:', {
              name: file.name,
              related: file.related,
              mime: file.mime
            });

            // Determinar categoria baseada no tipo de conteúdo
            let collection = 'geral';

            if (file.related) {
              try {
                // Extrair modelo relacionado
                const relatedType = typeof file.related === 'string'
                  ? file.related.split('.')[0]
                  : Array.isArray(file.related) && file.related.length > 0
                    ? file.related[0].ref.split('.')[0]
                    : 'geral';

                collection = relatedType || 'geral';
                console.log(`Categoria determinada: ${collection}`);
              } catch (error) {
                console.error('Erro ao extrair categoria:', error);
              }
            }

            // Processar nome do arquivo
            const nameWithoutExt = path.basename(file.name, path.extname(file.name));
            const sanitizedName = sanitizeString(nameWithoutExt);

            // Formato final: categoria/categoria_nome-arquivo.ext
            const finalPath = `${collection}/${collection}_${sanitizedName}${path.extname(file.name)}`;
            console.log(`Caminho final do arquivo: ${finalPath}`);

            return finalPath;
          }
        }
      }
    },
  },
});
