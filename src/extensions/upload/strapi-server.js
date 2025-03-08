'use strict';

const path = require('path');
const fs = require('fs');
const axios = require('axios');

/**
 * Utilitário para determinar o tipo MIME baseado na extensão do arquivo
 * @param {string} filePath - Caminho ou nome do arquivo
 * @returns {string} Tipo MIME
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
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
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Extrai o nome do arquivo de uma URL
 * @param {string} url - URL do arquivo
 * @returns {string} Nome do arquivo
 */
function getFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathnameParts = urlObj.pathname.split('/');
    return pathnameParts[pathnameParts.length - 1] || `file-${Date.now()}`;
  } catch (error) {
    console.error(`[R2] Erro ao extrair nome de arquivo da URL: ${error.message}`);
    return `file-${Date.now()}`;
  }
}

/**
 * Verifica se uma URL pertence ao domínio R2
 * @param {string} url - URL para verificar
 * @param {string[]} domains - Lista de domínios R2 possíveis
 * @returns {boolean} Verdadeiro se a URL pertencer ao R2
 */
function isR2Url(url, domains) {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    return domains.some(domain => {
      if (!domain) return false;
      // Remover protocolo se presente
      const cleanDomain = domain.replace(/^https?:\/\//, '');
      return urlObj.hostname.includes(cleanDomain);
    });
  } catch (error) {
    console.error(`[R2] Erro ao verificar URL R2: ${error.message}`);
    return false;
  }
}

/**
 * Extrai o caminho relativo da URL do R2
 * @param {string} url - URL completa do R2
 * @param {string} domain - Domínio base do R2
 * @returns {string} Caminho relativo
 */
function extractR2Path(url, domain) {
  if (!url || !domain) return '';

  try {
    // Remover protocolo do domínio se presente
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    const urlObj = new URL(url);

    // Obter o pathname completo
    let relativePath = urlObj.pathname;

    // Se o bucket estiver no caminho, remova-o
    if (process.env.CF_BUCKET && relativePath.includes(process.env.CF_BUCKET)) {
      relativePath = relativePath.substring(
        relativePath.indexOf(process.env.CF_BUCKET) + process.env.CF_BUCKET.length
      );
    }

    // Remover barras iniciais
    while (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }

    return relativePath;
  } catch (error) {
    console.error(`[R2] Erro ao extrair caminho R2: ${error.message}`);
    return '';
  }
}

module.exports = (plugin) => {
  const originalUpload = plugin.services.upload.upload;

  // Para depuração: listar todas as variáveis de ambiente R2
  const r2Config = {
    publicUrl: process.env.CF_PUBLIC_ACCESS_URL,
    endpoint: process.env.CF_ENDPOINT,
    bucket: process.env.CF_BUCKET,
    legacyUrl: process.env.R2_CUSTOM_DOMAIN,
  };

  console.log('[R2 Config]', JSON.stringify(r2Config, null, 2));

  plugin.services.upload.upload = async (fileData, config) => {
    // Se não temos dados de arquivo ou é um upload de arquivo físico (não URL)
    if (!fileData || !fileData.url || fileData._path) {
      // Prosseguir com upload normal
      console.log(`[R2] Upload padrão para: ${fileData?.name || 'Arquivo desconhecido'}`);
      return await originalUpload(fileData, config);
    }

    console.log(`[R2] Processando URL: ${fileData.url}`);

    // Domínios possíveis do R2 (inclui domínio customizado e endpoints diretos)
    const r2Domains = [
      process.env.CF_PUBLIC_ACCESS_URL,
      process.env.CF_ENDPOINT,
      process.env.R2_CUSTOM_DOMAIN,
      'r2.cloudflarestorage.com',
      'images.softmeat.com.br'
    ].filter(Boolean);

    // Verificar se a URL já é do R2
    if (isR2Url(fileData.url, r2Domains)) {
      console.log(`[R2] URL detectada como origem R2: ${fileData.url}`);

      // Determinar qual domínio corresponde
      let matchedDomain = null;
      for (const domain of r2Domains) {
        if (fileData.url.includes(domain.replace(/^https?:\/\//, ''))) {
          matchedDomain = domain;
          break;
        }
      }

      if (matchedDomain) {
        // Extrair caminho relativo
        const relativePath = extractR2Path(fileData.url, matchedDomain);
        const fileName = path.basename(relativePath);

        console.log(`[R2] Preservando arquivo R2 existente: ${fileName} (${relativePath})`);

        // Criar um registro que aponta para o arquivo R2 existente
        // sem tentar baixá-lo ou reprocessá-lo
        return {
          name: fileName,
          alternativeText: fileData.alternativeText || '',
          caption: fileData.caption || '',
          hash: fileData.hash || Date.now().toString(),
          ext: path.extname(fileName),
          mime: fileData.mime || getMimeType(fileName),
          size: fileData.size || 0,
          url: fileData.url,
          provider: 'strapi-provider-cloudflare-r2',
          formats: fileData.formats || null,
        };
      }
    }

    // Se chegamos aqui, é uma URL externa, não do R2
    console.log(`[R2] URL externa detectada, tentando download: ${fileData.url}`);

    try {
      // Criar diretório temporário se não existir
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Nome de arquivo baseado na URL ou timestamp
      const fileName = getFileNameFromUrl(fileData.url);
      const filePath = path.join(tempDir, fileName);

      // Baixar arquivo
      const response = await axios({
        method: 'get',
        url: fileData.url,
        responseType: 'stream',
        timeout: 30000, // 30 segundos timeout
      });

      // Gravar arquivo temporário
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Verificar se o arquivo foi baixado corretamente
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('Arquivo baixado está vazio');
      }

      console.log(`[R2] Download concluído: ${fileName} (${stats.size} bytes)`);

      // Preparar dados para upload
      const updatedFileData = {
        ...fileData,
        name: fileName,
        _path: filePath,
        size: stats.size,
        mime: fileData.mime || getMimeType(fileName)
      };

      // Continuar com o upload normal
      const result = await originalUpload(updatedFileData, config);

      // Limpar arquivo temporário
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`[R2] Erro ao remover arquivo temporário: ${err.message}`);
      }

      return result;
    } catch (error) {
      console.error(`[R2] Erro ao processar URL externa: ${error.message}`);
      throw error;
    }
  };

  return plugin;
};
