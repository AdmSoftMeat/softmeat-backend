'use strict';

/**
 * Serviço aprimorado para formatação de URLs do R2
 */

/**
 * Extrai o domínio de uma URL
 * @param {string} url - URL para extrair o domínio
 * @returns {string} Domínio da URL
 */
function extractDomain(url) {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error(`[R2 URL] Erro ao extrair domínio: ${error.message}`);
    return '';
  }
}

/**
 * Formata URL de arquivo para usar o domínio público do R2
 * @param {Object} file - Objeto de arquivo
 * @returns {Object} Arquivo com URL atualizada
 */
function formatFileUrl(file) {
  if (!file || !file.url) return file;

  try {
    // Obter configurações do R2
    const publicDomain = process.env.CF_PUBLIC_ACCESS_URL;
    const r2Endpoint = process.env.CF_ENDPOINT;
    const bucket = process.env.CF_BUCKET;

    if (!publicDomain) {
      console.log(`[R2 URL] Domínio público não configurado, mantendo URL original: ${file.url}`);
      return file;
    }

    // Log para depuração
    console.log(`[R2 URL] Processando URL: ${file.url}`);

    const currentDomain = extractDomain(file.url);
    const publicUrlDomain = extractDomain(publicDomain);

    // Se já estiver usando o domínio público, manter como está
    if (currentDomain === publicUrlDomain) {
      console.log(`[R2 URL] URL já usa domínio público, mantendo: ${file.url}`);
      return file;
    }

    // Verificar se está usando o endpoint R2 direto
    const isUsingR2Endpoint = r2Endpoint && file.url.includes(r2Endpoint);

    // Se não estiver usando endpoint R2 nem domínio público, pode ser URL externa
    if (!isUsingR2Endpoint && currentDomain !== publicUrlDomain) {
      console.log(`[R2 URL] Possível URL externa, verificando estrutura: ${file.url}`);

      // Verificar se é uma URL válida
      try {
        new URL(file.url);
      } catch (e) {
        console.log(`[R2 URL] URL inválida, mantendo como está: ${file.url}`);
        return file;
      }

      // Se o domínio for diferente e não for do R2, é provavelmente uma URL externa
      // Preserva-la se for válida
      if (!currentDomain.includes('cloudflarestorage.com') &&
          !currentDomain.includes('softmeat.com.br')) {
        console.log(`[R2 URL] URL externa confirmada, mantendo: ${file.url}`);
        return file;
      }
    }

    // Se chegamos aqui, precisamos reformatar a URL para usar o domínio público

    // Extrair o caminho relativo da URL
    let relativePath = '';
    try {
      const urlObj = new URL(file.url);
      relativePath = urlObj.pathname;

      // Remover prefixo do bucket se presente
      if (bucket && relativePath.includes(bucket)) {
        const bucketIndex = relativePath.indexOf(bucket);
        relativePath = relativePath.substring(bucketIndex + bucket.length);
      }

      // Remover barras iniciais
      while (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
    } catch (error) {
      console.error(`[R2 URL] Erro ao extrair caminho: ${error.message}`);
      return file;
    }

    // Formar nova URL com domínio público
    const formattedPublicDomain = publicDomain.endsWith('/')
      ? publicDomain.slice(0, -1)
      : publicDomain;

    const newUrl = `${formattedPublicDomain}/${relativePath}`;

    console.log(`[R2 URL] URL reformatada: ${file.url} -> ${newUrl}`);

    // Criar cópia do arquivo com URL atualizada
    return {
      ...file,
      url: newUrl
    };
  } catch (error) {
    console.error(`[R2 URL] Erro ao formatar URL: ${error.message}`);
    // Em caso de erro, retornar arquivo original sem modificações
    return file;
  }
}

module.exports = {
  formatFileUrl
};
