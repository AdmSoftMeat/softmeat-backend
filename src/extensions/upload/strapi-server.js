'use strict';

module.exports = (plugin) => {
  // Interceptar o provedor de upload para URLs externas
  const originalUpload = plugin.services.upload.upload;

  // Interceptar a função findOne
  const originalFindOne = plugin.controllers.content-api.findOne;

  // Salvar a função search original para referência
  const originalSearch = plugin.controllers.content-api.search;

  plugin.services.upload.upload = async (fileData, config) => {
    // Se já estiver no R2, apenas referencia a URL
    if (fileData && fileData.url) {
      const r2Patterns = [
        'images.softmeat.com.br',
        '.r2.cloudflarestorage.com',
        process.env.CF_PUBLIC_ACCESS_URL,
        process.env.R2_CUSTOM_DOMAIN
      ].filter(Boolean);

      // Verifica se a URL já é do R2 (qualquer padrão que identifique seu bucket)
      const isR2Url = r2Patterns.some(pattern =>
        fileData.url && fileData.url.includes(pattern)
      );

      if (isR2Url) {
        console.log(`[R2 Integration] URL R2 detectada, mantendo referência: ${fileData.url}`);

        // Extrair o nome de arquivo
        const fileName = fileData.url.split('/').pop();

        // Apenas referencia a URL existente sem fazer upload
        return {
          ...fileData,
          url: fileData.url,
          provider: 'cloudflare-r2',
          name: fileName || fileData.name,
          size: fileData.size || 0,
          ext: fileData.ext || getExtFromUrl(fileData.url),
          mime: fileData.mime || getMimeFromUrl(fileData.url),
          isExternalUrl: true
        };
      }
    }

    // Caso contrário, continua com o upload normal
    return await originalUpload(fileData, config);
  };

  // Intercepta as respostas para garantir que as URLs usem o domínio correto
  plugin.controllers.content-api.findOne = async (ctx) => {
    const response = await originalFindOne(ctx);

    // Formatar URLs nas respostas
    if (response && response.data) {
      formatResponseUrls(response.data);
    }

    return response;
  };

  // Intercepta as respostas de busca
  plugin.controllers.content-api.search = async (ctx) => {
    const response = await originalSearch(ctx);

    // Formatar URLs nas respostas
    if (response && response.data) {
      response.data.forEach(item => formatResponseUrls(item));
    }

    return response;
  };

  return plugin;
};

// Funções auxiliares

// Formata recursivamente as URLs em uma resposta
function formatResponseUrls(data) {
  if (!data) return;

  // Se for um objeto com URL, formata
  if (data.url && typeof data.url === 'string') {
    data.url = formatUrl(data.url);
  }

  // Verifica propriedades aninhadas
  if (typeof data === 'object') {
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object') {
        formatResponseUrls(data[key]);
      }
    });
  }
}

// Formata uma URL para usar o domínio público do R2
function formatUrl(url) {
  if (!url) return url;

  const r2Endpoint = process.env.CF_ENDPOINT || '';
  const publicUrl = process.env.CF_PUBLIC_ACCESS_URL || '';
  const bucket = process.env.CF_BUCKET || '';

  // Se a URL já é do domínio público, manter como está
  if (publicUrl && url.includes(publicUrl)) {
    return url;
  }

  // Se a URL usa o endpoint do R2 diretamente, substituir pelo domínio público
  if (r2Endpoint && bucket && url.includes(r2Endpoint)) {
    const cleanPublicUrl = publicUrl.endsWith('/') ?
      publicUrl.slice(0, -1) : publicUrl;

    // Extrair o caminho relativo da URL
    const pattern = new RegExp(`${r2Endpoint}.*?/${bucket}/(.+)`);
    const match = url.match(pattern);

    if (match && match[1]) {
      return `${cleanPublicUrl}/${match[1]}`;
    }
  }

  return url;
}

// Obtém a extensão de arquivo a partir da URL
function getExtFromUrl(url) {
  if (!url) return '';
  const parts = url.split('.');
  if (parts.length > 1) {
    return `.${parts.pop().split('?')[0]}`;
  }
  return '';
}

// Obtém o tipo MIME a partir da URL
function getMimeFromUrl(url) {
  const ext = getExtFromUrl(url).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
