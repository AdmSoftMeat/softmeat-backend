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

  // Sanitizar o caminho
  const cleanPath = String(path).replace(/^\/+/, '');

  // Usar domínio personalizado como prioritário
  if (process.env.CF_PUBLIC_ACCESS_URL) {
    const domain = process.env.CF_PUBLIC_ACCESS_URL.replace(/\/+$/, '');
    return `${domain}/${cleanPath}`;
  }

  // Fallback para URL direta do R2
  if (process.env.CF_ENDPOINT && process.env.CF_BUCKET) {
    const endpoint = process.env.CF_ENDPOINT.replace(/\/+$/, '');
    const bucket = process.env.CF_BUCKET;
    return `${endpoint}/${bucket}/${cleanPath}`;
  }

  // Último recurso: retornar o caminho original
  console.warn('Configuração R2 incompleta. Impossível formatar URL.');
  return path;
};

// Exportar funções úteis
module.exports = {
  formatR2Url
};
