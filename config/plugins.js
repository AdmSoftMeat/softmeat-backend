// config/plugins.js
module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  upload: {
    config: {
      provider: "strapi-provider-cloudflare-r2",
      providerOptions: {
        accessKeyId: env("CF_ACCESS_KEY_ID", env('R2_ACCESS_KEY')),
        secretAccessKey: env("CF_ACCESS_SECRET", env('R2_SECRET_KEY')),
        endpoint: env("CF_ENDPOINT", env('R2_ENDPOINT')),
        params: {
          Bucket: env("CF_BUCKET", env('R2_BUCKET')),
          ACL: 'public-read',
        },
        region: env("CF_REGION", env('R2_REGION', 'auto')),
        /**
         * Set this Option to store the CDN URL of your files and not the R2 endpoint URL in your DB.
         * Can be used in Cloudflare R2 with Domain-Access or Public URL
         */
        cloudflarePublicAccessUrl: env("CF_PUBLIC_ACCESS_URL", env('R2_CUSTOM_DOMAIN', 'https://images.softmeat.com.br')),
        /**
         * Sets if all assets should be uploaded in the root dir regardless the strapi folder.
         */
        pool: false,
      },
      actionOptions: {
        upload: {
          ACL: 'public-read',
          // Função para personalizar o caminho de upload
          customPath: (file) => {
            console.log('Customizando caminho para upload:', file.name);

            // Detectar o tipo de recurso (imagem, vídeo, etc.)
            const resourceType = file.mime.startsWith('image/') ? 'images' :
                                file.mime.startsWith('video/') ? 'videos' :
                                file.mime.startsWith('audio/') ? 'audios' : 'files';

            console.log('Tipo de recurso:', resourceType);

            // Determinar a categoria com base no contexto do upload
            let category = 'geral';

            // Tenta determinar a categoria baseado no tipo de conteúdo relacionado
            if (file.related) {
              // Extrai o modelo de relacionamento
              const relatedType = file.related.split('.')[0];
              console.log('Tipo relacionado:', relatedType);

              switch (relatedType) {
                case 'produto':
                  category = 'produtos';
                  break;
                case 'curso-online':
                  category = 'cursos';
                  break;
                case 'testemunho':
                  category = 'testemunhos';
                  break;
                case 'cliente':
                  category = 'clientes';
                  break;
                case 'hero-consultoria':
                case 'home-consultoria':
                  category = 'consultoria';
                  break;
                case 'home-hero':
                case 'index-destaque':
                  category = 'index';
                  break;
                case 'sobre-carrossel':
                  category = 'institucional';
                  break;
                case 'carrossel-treinamento':
                case 'treinamento':
                case 'cronograma':
                case 'home-treinamento':
                  category = 'treinamentos';
                  break;
                default:
                  category = 'geral';
              }
            }

            console.log('Categoria:', category);

            // Gerar nome de arquivo único
            const extension = file.ext.startsWith('.') ? file.ext.substring(1) : file.ext;
            const timestamp = Date.now();
            const fileName = `${file.hash}-${timestamp}.${extension}`;

            // Gerar o caminho completo
            const path = `${resourceType}/${category}/${fileName}`;
            console.log('Caminho final:', path);

            return path;
          }
        },
        uploadStream: {
          ACL: 'public-read'
        },
        delete: {},
      },
    },
  },
});
