// config/middleware.js

module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true, // Use as políticas padrão do Strapi como base
        directives: {
          // Permite conexões com o próprio domínio, qualquer domínio https e origens específicas
          'connect-src': [
            "'self'",
            'https:', // Permite conexões HTTPS em geral (necessário para muitos plugins/serviços)
            'http://localhost:*', // Permite conexões de desenvolvimento local
            'https://softmeat.com.br',
            'https://www.softmeat.com.br',
            'https://softmeat-frontend.pages.dev',
            'https://storage.softmeat.com.br', // Se o admin precisar buscar algo do storage
            'https://*.r2.cloudflarestorage.com',
          ],
          // Permite imagens do próprio domínio, data URIs, blobs, domínios do Strapi e seus armazenamentos
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io', // Necessário para o painel admin
            'https://storage.softmeat.com.br',
            'https://*.r2.cloudflarestorage.com',
            // Adicione outros domínios de imagem, se necessário
          ],
          // Permite mídias do próprio domínio, data URIs, blobs, domínios do Strapi e seus armazenamentos
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io', // Necessário para o painel admin
            'https://storage.softmeat.com.br',
            'https://*.r2.cloudflarestorage.com',
            // Adicione outros domínios de mídia, se necessário
          ],
          // Permite scripts do próprio domínio e scripts inline (necessário para o painel admin)
          // Se você precisar de mais fontes (ex: CDNs, analytics), adicione-as aqui
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'], // Exemplo: adicionando jsdelivr
           // Permite estilos do próprio domínio e estilos inline (necessário para o painel admin)
           // Se você precisar de mais fontes (ex: fontes externas, CDNs de CSS), adicione-as aqui
          'style-src': ["'self'", "'unsafe-inline'"],
          // Permite fontes do próprio domínio e data URIs
          'font-src': ["'self'", 'data:'],
          // Diretivas adicionais podem ser necessárias dependendo dos plugins e funcionalidades
          upgradeInsecureRequests: null, // Não força HTTPS se não estiver configurado
        },
      },
    },
  },
  // Configuração CORS CORRIGIDA
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*', // Ou especifique headers mais restritos se preferir
      origin: [
        // Domínios de produção do Frontend
        'https://softmeat.com.br',
        'https://www.softmeat.com.br',
        'https://softmeat-frontend.pages.dev',
        // Domínio de produção do Backend/Admin
        'https://softmeat-backend-production.up.railway.app',
        // Domínios de Desenvolvimento Local (ajuste as portas se necessário)
        'http://localhost:4321', // Astro dev server
        'http://127.0.0.1:4321',
        'http://localhost:1337', // Strapi admin local
        'http://127.0.0.1:1337',
      ],
      // Métodos HTTP permitidos (padrão geralmente cobre, mas pode ser explícito)
      // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      // Configurações adicionais de CORS se necessário (credentials, etc.)
      // keepHeaderOnError: true, // Útil para debug CORS
    },
  },
  // Middleware 'strapi::cors' duplicado foi REMOVIDO daqui
  'strapi::poweredBy', // Recomenda-se desabilitar em produção por segurança (config: { poweredBy: '' })
  'strapi::logger',
  'strapi::query',
  'strapi::body', // Certifique-se que a config de 'body' aceita uploads de tamanho suficiente
  'strapi::session',
  'strapi::favicon', // Servir favicon padrão do Strapi
  'strapi::public', // Servir arquivos da pasta 'public'
];
