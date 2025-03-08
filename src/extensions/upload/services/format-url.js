'use strict';

const { formatR2Url } = require('../../../utils/r2');

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
    // Verificar se o arquivo tem URL
    if (!file?.url) {
      return file;
    }

    // Verificar se o arquivo já está usando o domínio personalizado
    if (process.env.R2_CUSTOM_DOMAIN && file.url.startsWith(process.env.R2_CUSTOM_DOMAIN)) {
      return file;
    }

    // Verificar se o arquivo é do R2 (verificando endpoint)
    if (process.env.R2_ENDPOINT && file.url.includes(process.env.R2_ENDPOINT)) {
      try {
        // Extrair o caminho relativo do arquivo
        const urlObj = new URL(file.url);
        const pathname = urlObj.pathname;

        // Pegar todos os segmentos após o nome do bucket
        const bucketPos = pathname.indexOf(process.env.R2_BUCKET);

        if (bucketPos !== -1) {
          const relativePath = pathname.substring(bucketPos + process.env.R2_BUCKET.length + 1);
          // Formatar com a URL personalizada
          file.url = formatR2Url(relativePath);
          console.log(`URL formatada: ${relativePath} -> ${file.url}`);
        }
      } catch (error) {
        console.error(`Erro ao formatar URL ${file.url}: ${error.message}`);
      }
    }

    return file;
  },
};