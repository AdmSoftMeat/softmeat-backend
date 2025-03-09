'use strict';

// Middleware para interceptar e ajustar requisições de imagens do R2
module.exports = (config, { strapi }) => {
  // Função para determinar qual bucket usar
  const getBucketInfo = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      bucket: isProd ? process.env.CF_BUCKET || 'softmeat-prod' : 'softmeat-dev',
      publicUrl: process.env.CF_PUBLIC_ACCESS_URL || 'https://images.softmeat.com.br'
    };
  };

  // Função para verificar se a URL é do R2
  const isR2Url = (url) => {
    if (!url) return false;

    const r2Patterns = [
      'images.softmeat.com.br',
      '.r2.cloudflarestorage.com',
      'softmeat-dev',
      'softmeat-prod',
      process.env.CF_PUBLIC_ACCESS_URL,
      process.env.CF_ENDPOINT,
    ].filter(Boolean);

    return r2Patterns.some(pattern => pattern && url.includes(pattern));
  };

  return async (ctx, next) => {
    const { bucket, publicUrl } = getBucketInfo();

    // Registrar as variáveis de ambiente uma vez
    if (!global.strapiR2ConfigLogged) {
      console.log('[R2 Config]', {
        env: process.env.NODE_ENV,
        bucket,
        publicUrl,
        endpoint: process.env.CF_ENDPOINT,
      });
      global.strapiR2ConfigLogged = true;
    }

    // Interceptar requisições de upload
    if (ctx.request.url.includes('/upload') && ctx.request.method === 'POST') {
      // Verificar se há dados de arquivo com URL
      if (ctx.request.body?.fileInfo?.url) {
        const fileUrl = ctx.request.body.fileInfo.url;

        // Verificar se é URL do R2
        if (isR2Url(fileUrl)) {
          console.log(`[R2 Handler] URL R2 detectada em upload: ${fileUrl}`);
          ctx.request.body.fileInfo.isExternalUrl = true;
        }
      }
    }

    await next();

    // Interceptar respostas para normalizar URLs
    if (ctx.response.body && ctx.response.status >= 200 && ctx.response.status < 300) {
      // Normalizar URLs em respostas de APIs
      if (ctx.response.body.data) {
        normalizeResponseUrls(ctx.response.body.data, publicUrl);
      }
    }
  };
};

// Função recursiva para normalizar URLs em respostas
function normalizeResponseUrls(data, publicUrl) {
  if (!data) return;

  // Se for array, processar cada item
  if (Array.isArray(data)) {
    data.forEach(item => normalizeResponseUrls(item, publicUrl));
    return;
  }

  // Se for objeto, processar cada propriedade
  if (typeof data === 'object') {
    // Normalizar a URL diretamente
    if (data.url && typeof data.url === 'string') {
      // Verificar se é URL do R2 mas não usa o domínio público
      if (data.url.includes('.r2.cloudflarestorage.com') && !data.url.includes(publicUrl)) {
        // Extrair caminho relativo
        const match = data.url.match(/.*\/([^/]+)\/(.*)$/);
        if (match && match[2]) {
          const relativePath = match[2];
          const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
          data.url = `${cleanPublicUrl}/${relativePath}`;
        }
      }
    }

    // Processar propriedades aninhadas
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'object') {
        normalizeResponseUrls(data[key], publicUrl);
      }
    });
  }
}
