// src/utils/r2.js - versão melhorada
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
  const cleanPath = String(path).startsWith('/') ? path.substring(1) : path;

  // Usar domínio personalizado se disponível
  if (process.env.CF_PUBLIC_ACCESS_URL) {
    const domain = process.env.CF_PUBLIC_ACCESS_URL.endsWith('/')
      ? process.env.CF_PUBLIC_ACCESS_URL.slice(0, -1)
      : process.env.CF_PUBLIC_ACCESS_URL;
    return `${domain}/${cleanPath}`;
  }

  // Fallback para URL direta do R2
  if (process.env.CF_ENDPOINT && process.env.CF_BUCKET) {
    const endpoint = process.env.CF_ENDPOINT.endsWith('/')
      ? process.env.CF_ENDPOINT.slice(0, -1)
      : process.env.CF_ENDPOINT;
    return `${endpoint}/${process.env.CF_BUCKET}/${cleanPath}`;
  }

  // Se tudo falhar, retornar o caminho como está
  console.warn('[R2 URL Formatter] Configuração R2 incompleta, usando caminho original');
  return path;
};

module.exports = {
  formatR2Url
};
