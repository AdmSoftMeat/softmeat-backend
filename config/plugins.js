// config/plugins.js
const path = require('path');

module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        accessKeyId: env('R2_ACCESS_KEY'),
        secretAccessKey: env('R2_SECRET_KEY'),
        region: env('R2_REGION', 'auto'),
        endpoint: env('R2_ENDPOINT'),
        params: {
          Bucket: env('R2_BUCKET', 'softmeat-storage'),
          ACL: 'public-read',
          CacheControl: 'public, max-age=31536000, immutable',
        },
        forcePathStyle: true,
        customDomain: env('R2_PUBLIC_URL', 'https://storage.softmeat.com.br'),
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
                .replace(/[^\w\-]/g, '-')        // Substitui caracteres especiais por hífen
                .replace(/\-+/g, '-')            // Remove hífens consecutivos
                .toLowerCase();                   // Converte para minúsculas
            };

            // Se for uma URL externa, retornar a URL completa sem modificação
            if (file.isExternalUrl && file.url) {
              return file.url;
            }

            // Detectar o tipo de recurso
            const resourceType = file.mime?.startsWith('image/') ? 'images' :
                               file.mime?.startsWith('video/') ? 'videos' :
                               file.mime?.startsWith('audio/') ? 'audios' : 'files';

            // Determinar a categoria com base no contexto do upload
            let category = 'geral';

            // Tentar determinar a categoria baseado no tipo de conteúdo relacionado
            if (file.related) {
              // Extrair o modelo de relacionamento
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

            // Garantir que o hash seja único e esteja presente
            const shortHash = (file.hash || Date.now().toString()).substring(0, 8);

            // Gerar o nome final do arquivo
            const fileName = `${truncatedName}-${shortHash}.${extension}`;

            // Caminho completo no formato categoria/nome-arquivo
            const finalPath = `${category}/${fileName}`;

            if (env('DEBUG') === 'true') {
              console.log('[Upload Path]', {
                original: file.name,
                category: category,
                path: finalPath
              });
            }

            return finalPath;
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
