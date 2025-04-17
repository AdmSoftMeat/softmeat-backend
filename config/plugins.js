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
            // Obter a coleção associada ao arquivo
            let collection = 'geral';
            if (file.related) {
              // Extrair nome da coleção do campo relacionado
              collection = file.related.split('.')[0];
            }

            // Sanitizar o nome do arquivo
            const originalName = file.name ? file.name.substring(0, file.name.lastIndexOf('.')) : '';
            const sanitizedName = sanitizeString(originalName);

            // Adicionar hash curto para garantir unicidade
            const shortHash = file.hash ? file.hash.substring(0, 8) : '';

            // Retornar caminho com padrão: collection_filename-hash.ext
            return `${collection}/${collection}_${sanitizedName}-${shortHash}${file.ext}`;
          }
        }
      }
    },
  },
});

// Função auxiliar para sanitizar nomes de arquivos
function sanitizeString(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Substitui caracteres especiais por hífen
    .replace(/-+/g, '-') // Remove hífens consecutivos
    .toLowerCase();
}

