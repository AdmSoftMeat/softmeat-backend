// src/extensions/upload/strapi-server.js
'use strict';

module.exports = (plugin) => {
  const originalUpload = plugin.services.upload.upload;

  // Função para verificar se uma URL é do R2
  const isR2Url = (url) => {
    const patterns = [
      'images.softmeat.com.br',
      '.r2.cloudflarestorage.com',
      process.env.R2_PUBLIC_URL,
      process.env.R2_ENDPOINT,
    ].filter(Boolean);

    return url && patterns.some(pattern => url.includes(pattern));
  };

  // Função para converter URLs diretas do R2 para o domínio personalizado
  const formatR2Url = (url) => {
    if (!url || !isR2Url(url)) return url;

    const publicUrl = process.env.R2_PUBLIC_URL || 'https://images.softmeat.com.br';

    // Se já estiver usando o domínio público
    if (url.includes(publicUrl)) return url;

    try {
      // Extrair o caminho relativo
      let relativePath = '';
      const urlObj = new URL(url);
      const bucketName = process.env.R2_BUCKET || 'softmeat-prod';

      // Tentar diferentes formatos de URL
      if (url.includes('.r2.cloudflarestorage.com')) {
        const parts = urlObj.pathname.split('/');
        const bucketIndex = parts.findIndex(part => part === bucketName);

        if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
          relativePath = parts.slice(bucketIndex + 1).join('/');
        }
      } else {
        // Formato simples de URL
        relativePath = urlObj.pathname;
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1);
        }
      }

      if (relativePath) {
        const cleanPublicUrl = publicUrl.endsWith('/') ?
                              publicUrl.slice(0, -1) :
                              publicUrl;
        return `${cleanPublicUrl}/${relativePath}`;
      }

      return url;
    } catch (error) {
      console.error(`[R2] Erro ao formatar URL: ${error.message}`);
      return url;
    }
  };

  // Sobrescrever o método de upload
  plugin.services.upload.upload = async (fileData, config) => {
    // Se tiver uma URL e for do R2, apenas referenciar
    if (fileData && fileData.url && isR2Url(fileData.url)) {
      console.log(`[R2] URL externa detectada: ${fileData.url}`);

      // Normalizar a URL
      const normalizedUrl = formatR2Url(fileData.url);
      console.log(`[R2] URL normalizada: ${normalizedUrl}`);

      // Extrair informações do arquivo
      const fileName = normalizedUrl.split('/').pop();
      const ext = getExtension(fileName);
      const mime = getMimeType(ext);

      // Retornar objeto sem fazer upload (apenas referência)
      return {
        ...fileData,
        url: normalizedUrl,
        provider: 'aws-s3',
        name: fileName || fileData.name,
        ext: ext || fileData.ext,
        mime: mime || fileData.mime,
        size: fileData.size || 0,
        isExternalUrl: true
      };
    }

    // Caso contrário, continuar com o upload normal
    return await originalUpload(fileData, config);
  };

  // Interceptar para normalizar URLs nas respostas
  const originalFindOne = plugin.services.upload.findOne;
  if (originalFindOne) {
    plugin.services.upload.findOne = async (id, config) => {
      const file = await originalFindOne(id, config);

      if (file && file.url && isR2Url(file.url)) {
        file.url = formatR2Url(file.url);
      }

      return file;
    };
  }

  // Interceptar para normalizar URLs nas listagens
  const originalFind = plugin.services.upload.find;
  if (originalFind) {
    plugin.services.upload.find = async (params, config) => {
      const files = await originalFind(params, config);

      if (Array.isArray(files)) {
        files.forEach(file => {
          if (file.url && isR2Url(file.url)) {
            file.url = formatR2Url(file.url);
          }
        });
      }

      return files;
    };
  }

  return plugin;
};

// Funções auxiliares
function getExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

function getMimeType(ext) {
  if (!ext) return 'application/octet-stream';

  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  return types[ext.toLowerCase()] || 'application/octet-stream';
}
