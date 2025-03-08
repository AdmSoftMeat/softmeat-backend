'use strict';

const formatUrl = require('./services/format-url');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

module.exports = (plugin) => {
  const originalUpload = plugin.services.upload.upload;

  plugin.services.upload.upload = async (fileData, config) => {
    if (fileData && fileData.url && !fileData._path) {
      console.log(`[PROD UPLOAD] Detectado upload de URL externa: ${fileData.url}`);

      // Baixar o arquivo da URL externa
      try {
        const response = await axios.get(fileData.url, { responseType: 'stream' });

        const filePath = path.join(__dirname, 'temp', `${fileData.name}`);  // Caminho temporário para o arquivo

        // Salvar o arquivo temporariamente
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        // Aguardar o download ser concluído
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Substituir os dados do arquivo com o arquivo baixado
        fileData = {
          ...fileData,
          _path: filePath,  // Caminho temporário para o arquivo
          size: fs.statSync(filePath).size,  // Ajuste o tamanho do arquivo
        };
      } catch (error) {
        console.error(`[PROD ERROR] Erro ao baixar a imagem da URL ${fileData.url}: ${error.message}`);
        throw error;
      }
    }

    try {
      const result = await originalUpload(fileData, config);
      console.log(`[PROD UPLOAD] Upload concluído: ${fileData?.name || 'Unknown'}`);

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
