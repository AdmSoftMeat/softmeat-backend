'use strict';

module.exports = (plugin) => {
  const originalUpload = plugin.services.upload.upload;

  // Função para verificar se uma URL é do R2
  const isR2Url = (url) => {
    const patterns = [
      'storage.softmeat.com.br',
      '.r2.cloudflarestorage.com',
      process.env.R2_PUBLIC_URL,
      process.env.R2_ENDPOINT,
    ].filter(Boolean);

    return url && patterns.some(pattern => url.includes(pattern));
  };

  // Sobrescrever o método de upload
  plugin.services.upload.upload = async (fileData, config) => {
    // Se for uma URL externa do R2, apenas referenciar sem fazer upload
    if (fileData && fileData.fileInfo && fileData.fileInfo.url && isR2Url(fileData.fileInfo.url)) {
      console.log(`[R2] URL externa detectada: ${fileData.fileInfo.url}`);

      // Extrair informações do arquivo
      const fileName = fileData.fileInfo.url.split('/').pop();
      const ext = getExtension(fileName);
      const mime = getMimeType(ext);

      // Retornar objeto sem fazer upload (apenas referência)
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

// Função para formatar URLs R2
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

// Funções auxiliares
function getExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
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
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
  };

  return types[ext.toLowerCase()] || 'application/octet-stream';
}
