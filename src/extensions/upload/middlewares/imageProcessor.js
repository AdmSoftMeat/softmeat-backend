// src/extensions/upload/middlewares/imageProcessor.js
'use strict';

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Middleware para processar imagens antes do upload para o R2
 */
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Verificar se é uma requisição de upload
    if (ctx.request.url.startsWith('/upload') && ctx.request.method === 'POST') {
      try {
        // Verificar se há arquivos no payload
        const files = ctx.request.files?.files || [];

        if (files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Verificar se é uma imagem
            if (file && file.type && file.type.startsWith('image/')) {
              // Logging para debug
              console.log(`[Image Processor] Processando: ${file.name} (${file.type})`);

              try {
                // Processar a imagem com Sharp
                const processedPath = await processImage(file);

                if (processedPath) {
                  // Substituir o arquivo original com o processado
                  const originalStats = fs.statSync(file.path);
                  const processedStats = fs.statSync(processedPath);

                  console.log(`[Image Processor] Original: ${originalStats.size} bytes, Processado: ${processedStats.size} bytes`);

                  // Substituir o arquivo
                  fs.unlinkSync(file.path);
                  fs.copyFileSync(processedPath, file.path);
                  fs.unlinkSync(processedPath);

                  // Atualizar o tamanho do arquivo
                  file.size = processedStats.size;

                  console.log(`[Image Processor] Imagem processada com sucesso: ${file.name}`);
                }
              } catch (error) {
                console.error(`[Image Processor] Erro ao processar imagem: ${error.message}`);
                // Continuar com o upload mesmo com erro para não bloquear
              }
            }
          }
        }
      } catch (error) {
        console.error(`[Image Processor] Erro no middleware: ${error.message}`);
      }
    }

    // Continuar para o próximo middleware
    await next();
  };
};

/**
 * Processa uma imagem usando Sharp
 * @param {Object} file Objeto do arquivo
 * @returns {String|null} Caminho do arquivo processado ou null se falhar
 */
async function processImage(file) {
  const tempPath = `${file.path}_processed`;

  try {
    // Carregar imagem com Sharp
    let image = sharp(file.path);

    // Obter metadados da imagem original para diagnóstico
    const metadata = await image.metadata();
    console.log(`[Image Processor] Metadados originais:`, {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha
    });

    // Processar baseado no formato
    switch (metadata.format) {
      case 'png':
        // Para PNG, manter transparência mas otimizar
        await image
          .png({ progressive: true, compressionLevel: 6 })
          .toFile(tempPath);
        break;

      case 'webp':
        // Para WebP, otimizar mantendo qualidade e transparência se existir
        await image
          .webp({
            quality: 85,
            alphaQuality: 100, // Manter qualidade do canal alpha
            lossless: metadata.hasAlpha // Usar lossless para imagens com transparência
          })
          .toFile(tempPath);
        break;

      case 'jpeg':
      case 'jpg':
        // Para JPEG, otimizar qualidade
        await image
          .jpeg({ quality: 85, progressive: true })
          .toFile(tempPath);
        break;

      default:
        // Para outros formatos, apenas copiar
        fs.copyFileSync(file.path, tempPath);
        break;
    }

    // Verificar se o arquivo processado existe
    if (fs.existsSync(tempPath)) {
      // Obter metadados da imagem processada para diagnóstico
      try {
        const processedMetadata = await sharp(tempPath).metadata();
        console.log(`[Image Processor] Metadados processados:`, {
          format: processedMetadata.format,
          width: processedMetadata.width,
          height: processedMetadata.height,
          channels: processedMetadata.channels,
          hasAlpha: processedMetadata.hasAlpha
        });
      } catch (error) {
        console.error(`[Image Processor] Erro ao ler metadados processados: ${error.message}`);
      }

      return tempPath;
    }

    return null;
  } catch (error) {
    console.error(`[Image Processor] Erro: ${error.message}`);
    // Se houver erro, remover arquivo temporário se existir
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    return null;
  }
}
