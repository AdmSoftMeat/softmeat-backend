// src/extensions/upload/services/format-url.js (versão simplificada para produção)
'use strict';

module.exports = {
  formatFileUrl(file) {
    if (!file || !file.url) return file;

    try {
      // Log detalhado para depuração em produção
      console.log(`[PROD URL] Formatando URL: ${file.url}`);

      // Verificar se a URL já usa o domínio público
      if (process.env.CF_PUBLIC_ACCESS_URL &&
          file.url.indexOf(process.env.CF_PUBLIC_ACCESS_URL) === -1) {

        // Tentar extrair caminho relativo
        let relativePath = '';

        try {
          const urlObj = new URL(file.url);
          relativePath = urlObj.pathname;

          // Remover o prefixo do bucket se presente
          if (process.env.CF_BUCKET && relativePath.includes(process.env.CF_BUCKET)) {
            relativePath = relativePath.substring(
              relativePath.indexOf(process.env.CF_BUCKET) + process.env.CF_BUCKET.length
            );
          }

          // Remover a barra inicial
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
          }

          // Formar nova URL
          const publicDomain = process.env.CF_PUBLIC_ACCESS_URL.endsWith('/')
            ? process.env.CF_PUBLIC_ACCESS_URL.slice(0, -1)
            : process.env.CF_PUBLIC_ACCESS_URL;

          const newUrl = `${publicDomain}/${relativePath}`;

          console.log(`[PROD URL] Transformação: ${file.url} -> ${newUrl}`);

          // Criar cópia com URL atualizada
          return { ...file, url: newUrl };
        } catch (error) {
          console.error(`[PROD URL ERROR] Falha ao processar URL ${file.url}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`[PROD URL ERROR] Erro geral: ${error.message}`);
    }

    // Retornar o arquivo original se não conseguir processar
    return file;
  }
};
