// src/extensions/upload/middlewares/imageProcessor.js
'use strict';

const sharp = require('sharp');
const fs = require('fs');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Verificar se é uma requisição de upload
    if (ctx.request.url.includes('/upload') && ctx.request.method === 'POST') {
      // Verificar se está referenciando uma URL externa
      if (ctx.request.body?.fileInfo?.url) {
        const r2Patterns = [
          'storage.softmeat.com.br',
          'images.softmeat.com.br',
          '.r2.cloudflarestorage.com',
          process.env.R2_PUBLIC_URL,
          process.env.R2_ENDPOINT
        ].filter(Boolean);

        const isR2Url = r2Patterns.some(pattern =>
          ctx.request.body.fileInfo.url.includes(pattern)
        );

        if (isR2Url) {
          console.log(`[R2] Detectada URL externa: ${ctx.request.body.fileInfo.url}`);
          // Marcar como URL externa para evitar processamento
          ctx.request.body.fileInfo.isExternalUrl = true;
          await next();
          return;
        }
      }

      // Processar arquivos físicos apenas se existirem
      const files = ctx.request.files?.files || [];

      if (files.length > 0) {
        for (const file of files) {
          if (file && file.type && file.type.startsWith('image/')) {
            try {
              // Apenas verificar se a imagem é válida sem modificá-la
              const metadata = await sharp(file.path).metadata();
              console.log(`[UPLOAD] Imagem verificada: ${file.name}, formato: ${metadata.format}, tamanho: ${file.size} bytes`);

              // Verificar se o arquivo tem conteúdo
              const stats = fs.statSync(file.path);
              if (stats.size === 0) {
                console.error(`[UPLOAD ERROR] Arquivo vazio detectado: ${file.name}`);
              }
            } catch (error) {
              console.error(`[UPLOAD ERROR] Falha ao verificar imagem ${file.name}: ${error.message}`);
            }
          }
        }
      }
    }

    // Prosseguir para o próximo middleware
    await next();
  };
};
