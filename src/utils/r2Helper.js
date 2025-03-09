'use strict';

/**
 * Utilitários para auxiliar no tratamento de URLs do R2
 */

const isR2Url = (url) => {
  if (!url) return false;

  const r2Patterns = [
    'images.softmeat.com.br',
    '.r2.cloudflarestorage.com',
    process.env.CF_PUBLIC_ACCESS_URL,
    process.env.R2_CUSTOM_DOMAIN
  ].filter(Boolean);

  return r2Patterns.some(pattern => pattern && url.includes(pattern));
};

const formatR2Url = (url) => {
  if (!url || !isR2Url(url)) return url;

  // Se já estiver usando o domínio público, retornar como está
  if (process.env.CF_PUBLIC_ACCESS_URL && url.includes(process.env.CF_PUBLIC_ACCESS_URL)) {
    return url;
  }

  // Se estiver usando o endpoint direto do R2, converter para domínio público
  if (process.env.CF_ENDPOINT && process.env.CF_BUCKET && url.includes(process.env.CF_ENDPOINT)) {
    const publicUrl = process.env.CF_PUBLIC_ACCESS_URL;
    if (!publicUrl) return url;

    const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;

    // Extrair o caminho do objeto no bucket
    const regex = new RegExp(`.*?${process.env.CF_BUCKET}/?(.*)`, 'i');
    const match = url.match(regex);

    if (match && match[1]) {
      return `${cleanPublicUrl}/${match[1]}`;
    }
  }

  return url;
};

module.exports = {
  isR2Url,
  formatR2Url
};
