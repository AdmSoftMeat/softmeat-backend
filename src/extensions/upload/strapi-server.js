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
    // Log simplificado
    console.log('[R2] Processando upload:', fileData?.fileInfo?.url || 'arquivo local');

    // Se for uma URL externa do R2, apenas referenciar
    if (fileData && fileData.fileInfo && fileData.fileInfo.url && isR2Url(fileData.fileInfo.url)) {
      console.log(`[R2] URL externa detectada: ${fileData.fileInfo.url}`);

      const fileName = fileData.fileInfo.url.split('/').pop();
      const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
      const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                   ext === '.png' ? 'image/png' :
                   ext === '.svg' ? 'image/svg+xml' :
                   'application/octet-stream';

      // Retornar objeto sem upload
      return {
        name: fileName,
        url: fileData.fileInfo.url,
        provider: 'aws-s3',
        ext: ext,
        mime: mime,
        size: fileData.fileInfo.size || 0,
      };
    }

    // Upload normal
    return originalUpload(fileData, config);
  };

  return plugin;
};
