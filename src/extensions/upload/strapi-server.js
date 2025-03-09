// src/extensions/upload/strapi-server.js
'use strict';

module.exports = (plugin) => {
  // Preservar a função original de upload
  const originalUpload = plugin.services.upload.upload;

  // Padrões para identificar URLs do R2
  const r2Patterns = [
    'storage.softmeat.com.br',
    'images.softmeat.com.br',
    '.r2.cloudflarestorage.com',
    process.env.R2_PUBLIC_URL,
    process.env.R2_ENDPOINT
  ].filter(Boolean);

  // Função para verificar se uma URL é do R2
  const isR2Url = (url) => {
    if (!url) return false;
    return r2Patterns.some(pattern => url.includes(pattern));
  };

  // Sobrescrever o método de upload no serviço
  plugin.services.upload.upload = async (fileData, config) => {
    // Verificar se é uma URL externa do R2
    if (fileData && fileData.fileInfo && fileData.fileInfo.url && isR2Url(fileData.fileInfo.url)) {
      console.log(`[R2] Referenciando URL externa: ${fileData.fileInfo.url}`);

      // Extrair informações do arquivo
      const fileName = fileData.fileInfo.url.split('/').pop();
      const ext = fileName.includes('.') ? `.${fileName.split('.').pop().toLowerCase()}` : '';
      const mime = getMimeType(ext);

      // Criar objeto de referência
      return {
        name: fileName || fileData.fileInfo.name,
        url: fileData.fileInfo.url,
        provider: 'aws-s3',
        ext: ext || fileData.fileInfo.ext,
        mime: mime || fileData.fileInfo.mime,
        size: fileData.fileInfo.size || 0,
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
        // Garantir que a URL use o domínio público correto
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

// Função para formatar URLs R2 para usar o domínio público
function formatR2Url(url) {
  if (!url) return url;

  const publicUrl = process.env.R2_PUBLIC_URL || 'https://storage.softmeat.com.br';

  // Se já estiver usando o domínio público
  if (url.includes(publicUrl)) return url;

  try {
    // Extrair o caminho relativo
    let relativePath = '';
    const urlObj = new URL(url);
    const bucketName = process.env.R2_BUCKET || 'softmeat-storage';

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
}

// Função para determinar o tipo MIME com base na extensão
function getMimeType(ext) {
  if (!ext) return 'application/octet-stream';

  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
  };

  return types[ext.toLowerCase()] || 'application/octet-stream';
}
