// src/extensions/upload/middlewares/imageProcessor.js (versão simplificada para produção)
'use strict';

const sharp = require('sharp');
const fs = require('fs');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Em produção, logging detalhado
    if (ctx.request.url.includes('/upload') && ctx.request.method === 'POST') {
      const files = ctx.request.files?.files || [];

      if (files.length > 0) {
        for (const file of files) {
          if (file && file.type && file.type.startsWith('image/')) {
            try {
              // Apenas verificar se a imagem é válida sem modificá-la
              const metadata = await sharp(file.path).metadata();
              console.log(`[PROD] Imagem verificada: ${file.name}, formato: ${metadata.format}, tamanho: ${file.size} bytes`);

              // Verificar se o arquivo tem conteúdo
              const stats = fs.statSync(file.path);
              if (stats.size === 0) {
                console.error(`[PROD ERROR] Arquivo vazio detectado: ${file.name}`);
              } else {
                console.log(`[PROD] Arquivo válido: ${file.name}, tamanho: ${stats.size} bytes`);
              }
            } catch (error) {
              console.error(`[PROD ERROR] Falha ao verificar imagem ${file.name}: ${error.message}`);
            }
          }
        }
      }
    }

    // Prosseguir sem processar a imagem para evitar problemas
    await next();
  };
};
