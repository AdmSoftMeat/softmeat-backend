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
        cloudflarePublicAccessUrl: env("CF_PUBLIC_ACCESS_URL", env('R2_CUSTOM_DOMAIN', 'https://images.softmeat.com.br')),
      },
      actionOptions: {
        upload: {
          ACL: 'public-read',
          // Função para personalizar o caminho de upload
          customPath: (file) => {
            // Função para sanitizar strings (remover acentos e caracteres especiais)
            const sanitizeString = (str) => {
              if (!str) return '';
              return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/[^\w\-]/g, '-')        // Substitui caracteres especiais por hífen
                .replace(/\-+/g, '-')            // Remove hífens consecutivos
                .toLowerCase();                   // Converte para minúsculas
            };

            // Detectar o tipo de recurso (imagem, vídeo, etc.)
            const resourceType = file.mime.startsWith('image/') ? 'images' :
                               file.mime.startsWith('video/') ? 'videos' :
                               file.mime.startsWith('audio/') ? 'audios' : 'files';

            // Determinar a categoria com base no contexto do upload
            let category = 'geral';

            // Tenta determinar a categoria baseado no tipo de conteúdo relacionado
            if (file.related) {
              // Extrai o modelo de relacionamento
              const relatedType = file.related.split('.')[0];

              // Mapeamento simplificado de categorias
              const categoryMap = {
                'produto': 'produtos',
                'curso-online': 'cursos',
                'testemunho': 'testemunhos',
                'cliente': 'clientes',
                'hero-consultoria': 'consultoria',
                'home-consultoria': 'consultoria',
                'home-hero': 'index',
                'index-destaque': 'index',
                'sobre-carrossel': 'institucional',
                'carrossel-treinamento': 'testemunhos',
                'treinamento': 'treinamentos',
                'cronograma': 'treinamentos',
                'home-treinamento': 'treinamentos',
                'configuracao-geral': 'logo'
              };

              // Obter categoria do mapeamento ou usar 'geral' como fallback
              category = categoryMap[relatedType] || 'geral';
            }

            // Sanitizar a categoria
            category = sanitizeString(category);

            // Gerar nome de arquivo sem caracteres especiais mas mantendo a extensão
            const nameWithoutExt = path.basename(file.name, file.ext);
            const sanitizedName = sanitizeString(nameWithoutExt);
            const extension = file.ext.startsWith('.') ? file.ext.substring(1) : file.ext;

            // Evitar nomes muito longos, limitando a 30 caracteres + extensão
            const truncatedName = sanitizedName.length > 30
              ? sanitizedName.substring(0, 30)
              : sanitizedName;

            // Usar apenas o hash encurtado para garantir unicidade
            const shortHash = file.hash.substring(0, 8);

            // Gerar o nome final do arquivo
            const fileName = `${truncatedName}-${shortHash}.${extension}`;

            // Caminho completo no formato categoria/nome-arquivo
            const path = `${category}/${fileName}`;

            if (env('DEBUG') === 'true') {
              console.log('[Upload Path]', {
                original: file.name,
                category: category,
                path: path
              });
            }

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
