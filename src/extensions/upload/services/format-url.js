// src/extensions/upload/services/format-url.js
'use strict';

/**
 * Formatador de URL para arquivos armazenados no R2
 */
module.exports = {
  /**
   * Formata a URL de um arquivo, convertendo URLs R2 padrão para o domínio personalizado
   * @param {Object} file - Objeto de arquivo do Strapi
   * @returns {Object} Objeto de arquivo com URL formatada
   */
  formatFileUrl(file, options = {}) {
    // Se não temos arquivo ou URL, retornar como está
    if (!file || !file.url) {
      return file;
    }

    // Criar uma cópia para não modificar o original
    const formattedFile = { ...file };

    try {
      // Se a URL já usa o domínio personalizado, não fazer nada
      if (process.env.CF_PUBLIC_ACCESS_URL &&
          formattedFile.url.startsWith(process.env.CF_PUBLIC_ACCESS_URL)) {
        return formattedFile;
      }

      // Se temos configuração R2 e a URL não usa o domínio personalizado
      if (process.env.CF_PUBLIC_ACCESS_URL && process.env.CF_BUCKET) {
        // Extrair o caminho relativo da URL
        // Podemos estar lidando com diferentes formatos de URL:
        // - URL do R2: https://[endpoint]/[bucket]/[path]
        // - URL já formatada mas incorretamente
        let relativePath = '';

        try {
          const urlObj = new URL(formattedFile.url);
          relativePath = urlObj.pathname;

          // Se a URL contém o nome do bucket, remover o bucket e a barra inicial
          if (relativePath.includes(process.env.CF_BUCKET)) {
            const bucketStartPos = relativePath.indexOf(process.env.CF_BUCKET);
            if (bucketStartPos !== -1) {
              relativePath = relativePath.substring(
                bucketStartPos + process.env.CF_BUCKET.length
              );
            }
          }

          // Remover a barra inicial se existir
          relativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;

          // Construir a URL usando o domínio público configurado
          const publicAccessUrl = process.env.CF_PUBLIC_ACCESS_URL.endsWith('/')
            ? process.env.CF_PUBLIC_ACCESS_URL.slice(0, -1)
            : process.env.CF_PUBLIC_ACCESS_URL;

          formattedFile.url = `${publicAccessUrl}/${relativePath}`;

          if (process.env.DEBUG === 'true') {
            console.log(`[URL Formatter] ${file.url} -> ${formattedFile.url}`);
          }
        } catch (urlError) {
          console.error(`[URL Formatter] Erro ao analisar URL ${formattedFile.url}: ${urlError.message}`);
        }
      }
    } catch (error) {
      console.error(`[URL Formatter] Erro ao formatar URL: ${error.message}`);
    }

    return formattedFile;
  },
};
