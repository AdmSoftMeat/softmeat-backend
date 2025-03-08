'use strict';

/**
 * Utilitários para manipulação de URLs do Cloudflare R2
 */

/**
 * Formata um caminho de arquivo para uma URL R2 completa
 * @param {string} path - Caminho relativo do arquivo no bucket
 * @returns {string} URL formatada
 */
const formatR2Url = (path) => {
  if (!path) return '';

  // Garantir que path não é undefined ou null
  const filePath = String(path);

  // Remover barras iniciais para consistência
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

  // Usar domínio personalizado se disponível
  const customDomain = process.env.R2_CUSTOM_DOMAIN;
  if (customDomain) {
    // Garantir que o domínio personalizado não termine com barra
    const domain = customDomain.endsWith('/')
      ? customDomain.slice(0, -1)
      : customDomain;

    return `${domain}/${cleanPath}`;
  }

  // Fallback para URL direta do R2
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !bucket) {
    console.error('Erro: R2_ENDPOINT ou R2_BUCKET não definidos!');
    return '';
  }

  // Garantir que o endpoint não termine com barra
  const cleanEndpoint = endpoint.endsWith('/')
    ? endpoint.slice(0, -1)
    : endpoint;

  return `${cleanEndpoint}/${bucket}/${cleanPath}`;
};

/**
 * Determina o tipo de recurso com base no MIME type
 * @param {string} mimeType - MIME type do arquivo
 * @returns {string} Tipo de recurso (images, videos, audios, files)
 */
const getResourceType = (mimeType) => {
  if (!mimeType) return 'files';

  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audios';

  return 'files';
};

/**
 * Gera um nome de arquivo único baseado no hash e timestamp
 * @param {Object} file - Objeto do arquivo Strapi
 * @returns {string} Nome de arquivo único
 */
const generateFileName = (file) => {
  if (!file || !file.hash) {
    const randomHash = Math.random().toString(36).substring(2, 15);
    return `${randomHash}-${Date.now()}.unknown`;
  }

  const extension = (file.ext && file.ext.startsWith('.'))
    ? file.ext.substring(1)
    : (file.ext || 'bin');

  return `${file.hash}-${Date.now()}.${extension}`;
};

/**
 * Constrói um caminho de pasta para armazenamento
 * @param {string} resourceType - Tipo de recurso (images, videos, etc)
 * @param {Object} options - Opções adicionais
 * @returns {string} Caminho da pasta formatado
 */
const getResourceFolder = (resourceType, options = {}) => {
  const { category = '', subfolder = '' } = options;

  let path = resourceType || 'files';

  if (category) {
    path += `/${category}`;
  }

  if (subfolder) {
    path += `/${subfolder}`;
  }

  return path;
};

// Exportar todas as funções utilitárias
module.exports = {
  formatR2Url,
  getResourceType,
  generateFileName,
  getResourceFolder
};