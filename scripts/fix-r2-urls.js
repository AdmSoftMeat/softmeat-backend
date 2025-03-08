// scripts/fix-r2-urls.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixImageUrls(strapi) {
  console.log('=== CORREÇÃO DE URLs DE IMAGENS EM PRODUÇÃO ===');

  try {
    // Buscar todas as imagens no banco de dados
    const files = await strapi.db.query('plugin::upload.file').findMany({
      where: {
        mime: {
          $startsWith: 'image/'
        }
      }
    });

    console.log(`Encontrados ${files.length} arquivos de imagem no banco de dados`);

    // Formatador de URL
    const formatFileUrl = (url) => {
      if (!url) return url;

      try {
        // Verificar se a URL já usa o domínio correto
        if (process.env.CF_PUBLIC_ACCESS_URL &&
            !url.startsWith(process.env.CF_PUBLIC_ACCESS_URL)) {

          // Extrair caminho relativo
          const urlObj = new URL(url);
          let relativePath = urlObj.pathname;

          // Remover bucket se presente
          if (process.env.CF_BUCKET && relativePath.includes(process.env.CF_BUCKET)) {
            relativePath = relativePath.substring(
              relativePath.indexOf(process.env.CF_BUCKET) + process.env.CF_BUCKET.length
            );
          }

          // Remover barra inicial
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
          }

          // Formar nova URL
          const publicDomain = process.env.CF_PUBLIC_ACCESS_URL.endsWith('/')
            ? process.env.CF_PUBLIC_ACCESS_URL.slice(0, -1)
            : process.env.CF_PUBLIC_ACCESS_URL;

          return `${publicDomain}/${relativePath}`;
        }

        return url;
      } catch (error) {
        console.error(`Erro ao formatar URL ${url}: ${error.message}`);
        return url;
      }
    };

    // Corrigir URLs
    let updatedCount = 0;

    for (const file of files) {
      const oldUrl = file.url;
      const newUrl = formatFileUrl(oldUrl);

      if (oldUrl !== newUrl) {
        // Atualizar URL no banco de dados
        await strapi.db.query('plugin::upload.file').update({
          where: { id: file.id },
          data: { url: newUrl }
        });

        updatedCount++;
        console.log(`${updatedCount}. URL atualizada: ${oldUrl} -> ${newUrl}`);
      }
    }

    console.log(`\nTotal de ${updatedCount} URLs corrigidas`);

  } catch (error) {
    console.error('Erro ao corrigir URLs:', error);
  }
}

module.exports = { fixImageUrls };

// Se o script for executado diretamente
if (require.main === module) {
  console.log('Este script deve ser executado através do Strapi:');
  console.log('NODE_ENV=production node -e "require(\'./scripts/fix-r2-urls.js\').fixImageUrls(strapi)"');
}
