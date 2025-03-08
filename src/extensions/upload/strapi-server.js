const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

module.exports = (plugin) => {
  const originalUpload = plugin.services.upload.upload;

  plugin.services.upload.upload = async (fileData, config) => {
    if (fileData && fileData.url && !fileData._path) {
      console.log(`[PROD UPLOAD] Detectado upload de URL externa: ${fileData.url}`);

      // Baixar o arquivo da URL externa
      try {
        const response = await axios.get(fileData.url, { responseType: 'arraybuffer' });

        // Verificar se a resposta contém dados
        if (!response.data) {
          throw new Error("Imagem não encontrada ou inválida.");
        }

        // Criar um arquivo temporário para o arquivo baixado
        const tempFilePath = path.join(__dirname, 'temp', `${fileData.name}`);
        fs.writeFileSync(tempFilePath, response.data);

        // Atualizar o fileData com o arquivo temporário
        fileData = {
          ...fileData,
          _path: tempFilePath,
          size: fs.statSync(tempFilePath).size,
        };
      } catch (error) {
        console.error(`[PROD ERROR] Erro ao baixar a imagem da URL ${fileData.url}: ${error.message}`);
        throw error;
      }
    }

    // Continuar com o upload original
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
