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
            // Função para sanitizar strings
            const sanitizeString = (str) => {
              if (!str) return '';
              return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/[^a-zA-Z0-9-_]/g, '-') // Substitui caracteres especiais por hífen
                .replace(/-+/g, '-') // Remove hífens consecutivos
                .toLowerCase(); // Converte para minúsculas
            };

            // Determinar nome da coleção
            let collection = 'geral';
            if (file.related) {
              collection = file.related.split('.')[0];
              console.log(`Coleção detectada: ${collection}`);
            }

            // Obter nome original do arquivo sem extensão
            const originalName = file.name ? file.name.substring(0, file.name.lastIndexOf('.')) : 'unnamed';
            const sanitizedName = sanitizeString(originalName);

            // Adicionar um pequeno hash para garantir unicidade
            const shortHash = file.hash ? file.hash.substring(0, 8) : Date.now().toString().substring(0, 8);

            // Formato final: collection/collection_filename-hash.ext
            const finalPath = `${collection}/${collection}_${sanitizedName}-${shortHash}${file.ext}`;
            console.log(`Caminho do arquivo gerado: ${finalPath}`);

            return finalPath;
          }
        }
      }
    },
  },
});

