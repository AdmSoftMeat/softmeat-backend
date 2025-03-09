'use strict';

module.exports = (plugin) => {
  // Salvar referência ao método original de upload
  const originalUpload = plugin.services.upload.upload;

  // Função para verificar se uma URL pertence ao R2
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

  // Função para normalizar uma URL do R2
  const normalizeR2Url = (url) => {
    if (!url || !isR2Url(url)) return url;

    const publicUrl = process.env.CF_PUBLIC_ACCESS_URL || 'https://images.softmeat.com.br';

    try {
      // Já está usando a URL pública?
      if (url.startsWith(publicUrl)) {
        return url;
      }

      // Extrair caminho relativo usando expressões regulares
      let relativePath = '';

      // Diferentes padrões para extração do caminho
      const patterns = [
        // Padrão para URL direta do R2
        new RegExp(`https://.*\\.r2\\.cloudflarestorage\\.com/[^/]+/(.*)`, 'i'),
        // Padrão para URL do domínio customizado
        new RegExp(`https://images\\.softmeat\\.com\\.br/(.*)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          relativePath = match[1];
          break;
        }
      }

      if (relativePath) {
        const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        return `${cleanPublicUrl}/${relativePath}`;
      }

      return url;
    } catch (error) {
      console.error(`[R2] Erro ao normalizar URL: ${error.message}`);
      return url;
    }
  };

  // Sobrescrever o método de upload
  plugin.services.upload.upload = async (fileData, config) => {
    // Verificar se é uma URL do R2
    if (fileData && fileData.url && isR2Url(fileData.url)) {
      console.log(`[R2] URL detectada: ${fileData.url}`);

      // Normalizar a URL
      const normalizedUrl = normalizeR2Url(fileData.url);
      console.log(`[R2] URL normalizada: ${normalizedUrl}`);

      // Extrair informações do arquivo
      const fileName = normalizedUrl.split('/').pop();
      const ext = getExtFromUrl(normalizedUrl);
      const mime = getMimeFromUrl(normalizedUrl);

      // Retornar objeto de arquivo modificado (apenas referenciando a URL)
      return {
        ...fileData,
        url: normalizedUrl,
        provider: 'cloudflare-r2',
        name: fileName || fileData.name,
        size: fileData.size || 0,
        ext: fileData.ext || ext,
        mime: fileData.mime || mime,
        isExternalUrl: true
      };
    }

    // Caso contrário, usar o método original
    return await originalUpload(fileData, config);
  };

  return plugin;
};

// Funções auxiliares
function getExtFromUrl(url) {
  if (!url) return '';
  const parts = url.split('.');
  if (parts.length > 1) {
    return `.${parts.pop().split('?')[0]}`;
  }
  return '';
}

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
