'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const stream = require('stream');
const formatUrl = require('./services/format-url');

module.exports = (plugin) => {
  const originalUpload = plugin.services.upload.upload;

  plugin.services.upload.upload = async (fileData, config) => {
    // Verificar se o arquivo tem uma URL externa
    if (fileData && fileData.url) {
      console.log(`[PROD] URL detectada: ${fileData.url}`);

      // Verificar se a URL é válida e já existe no R2
      if (isValidUrl(fileData.url)) {
        // Se a URL for válida, usar a URL diretamente
        console.log(`[PROD] Usando URL existente no R2: ${fileData.url}`);

        fileData = {
          ...fileData,
          _path: fileData.url, // Use a URL diretamente
          size: 0,  // Tamanho pode ser ajustado conforme necessário
        };

        // Retornar o fileData com a URL, sem fazer o upload
        return fileData;
      }
    }

    // Caso contrário, continuar com o processo de upload do arquivo
    try {
      const result = await originalUpload(fileData, config);
      console.log(`[PROD UPLOAD] Upload concluído: ${fileData?.name || 'Unknown'}`);

      // Garantir que as URLs de upload sejam formatadas corretamente
      if (Array.isArray(result)) {
        const formattedResults = result.map(file => formatUrl.formatFileUrl(file));
        console.log(`[PROD UPLOAD] URLs formatadas para ${formattedResults.length} arquivos`);
        return formattedResults;
      }

      return formatUrl.formatFileUrl(result);
    } catch (error) {
      console.error('[PROD UPLOAD ERROR]', {
        message: error.message,
        stack: error.stack,
        fileName: fileData?.name,
        fileSize: fileData?.size,
        fileType: fileData?.type,
        time: new Date().toISOString()
      });

      throw error;
    }
  };

  return plugin;
};

// Função para validar se a URL é válida
function isValidUrl(url) {
  try {
    // Tenta construir a URL e verificar se ela é válida
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch (error) {
    console.error('[PROD] URL inválida:', url);
    return false;
  }
}
