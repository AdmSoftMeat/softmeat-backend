'use strict';

module.exports = (plugin) => {
  // Interceptar o provedor de upload para URLs externas
  const originalUpload = plugin.services.upload.upload;

  // Não podemos acessar diretamente controllers["content-api"] pois pode não existir
  // Vamos focar apenas na funcionalidade de upload

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
        fileData.url && pattern && fileData.url.includes(pattern)
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

  return plugin;
};

// Funções auxiliares

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
