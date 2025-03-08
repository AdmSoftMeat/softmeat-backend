// scripts/fix-r2-urls-improved.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function fixImageUrls(strapi) {
  console.log(`${colors.magenta}=== CORREÇÃO AVANÇADA DE URLs DE IMAGENS ===\n${colors.reset}`);

  // Verificar configurações
  console.log(`${colors.blue}Verificando configurações R2:${colors.reset}`);
  const r2Config = {
    publicUrl: process.env.CF_PUBLIC_ACCESS_URL,
    endpoint: process.env.CF_ENDPOINT,
    bucket: process.env.CF_BUCKET,
    legacyUrl: process.env.R2_CUSTOM_DOMAIN,
  };

  // Validar configurações
  for (const [key, value] of Object.entries(r2Config)) {
    if (value) {
      console.log(`  ✅ ${key}: ${value}`);
    } else {
      console.log(`  ${colors.yellow}⚠️ ${key}: Não configurado${colors.reset}`);
    }
  }

  if (!r2Config.publicUrl) {
    console.error(`${colors.red}Erro: CF_PUBLIC_ACCESS_URL não está configurado, é necessário para corrigir URLs.${colors.reset}`);
    return;
  }

  try {
    // Buscar todos os arquivos no banco de dados
    console.log(`\n${colors.blue}Buscando arquivos no banco de dados...${colors.reset}`);
    const files = await strapi.db.query('plugin::upload.file').findMany({});

    console.log(`Encontrados ${files.length} arquivos no total\n`);

    // Agrupar arquivos por tipo MIME
    const filesByType = {};
    for (const file of files) {
      const type = file.mime ? (file.mime.split('/')[0] || 'other') : 'unknown';
      if (!filesByType[type]) filesByType[type] = [];
      filesByType[type].push(file);
    }

    console.log(`${colors.blue}Distribuição de arquivos por tipo:${colors.reset}`);
    for (const [type, typeFiles] of Object.entries(filesByType)) {
      console.log(`  ${type}: ${typeFiles.length} arquivos`);
    }

    // Extrator de domínio
    const extractDomain = (url) => {
      if (!url) return '';
      try {
        return new URL(url).hostname;
      } catch (error) {
        return '';
      }
    };

    // Formatador de URL
    const formatFileUrl = (url) => {
      if (!url) return { formatted: false, url };

      try {
        // Verificar se a URL já usa o domínio correto
        const publicUrlDomain = extractDomain(r2Config.publicUrl);
        const currentDomain = extractDomain(url);

        if (currentDomain === publicUrlDomain) {
          return { formatted: false, url }; // Já está usando o domínio correto
        }

        // URL nula ou inválida
        if (!url || !url.includes('://')) {
          return { formatted: false, url };
        }

        // Se for URL externa (não R2 nem Cloudflare)
        if (!url.includes('cloudflarestorage.com') &&
            !url.includes(r2Config.endpoint) &&
            !url.includes('softmeat.com.br')) {
          return { formatted: false, url };
        }

        // Extrair caminho relativo
        const urlObj = new URL(url);
        let relativePath = urlObj.pathname;

        // Remover bucket se presente
        if (r2Config.bucket && relativePath.includes(r2Config.bucket)) {
          const bucketIndex = relativePath.indexOf(r2Config.bucket);
          relativePath = relativePath.substring(bucketIndex + r2Config.bucket.length);
        }

        // Remover barra inicial
        while (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1);
        }

        // Formar nova URL
        const formattedPublicDomain = r2Config.publicUrl.endsWith('/')
          ? r2Config.publicUrl.slice(0, -1)
          : r2Config.publicUrl;

        const newUrl = `${formattedPublicDomain}/${relativePath}`;

        return { formatted: true, url: newUrl };
      } catch (error) {
        console.error(`Erro ao formatar URL ${url}: ${error.message}`);
        return { formatted: false, url };
      }
    };

    // Agrupar arquivos por fonte de URL
    const urlSources = {};
    for (const file of files) {
      if (!file.url) continue;

      const domain = extractDomain(file.url);
      if (!urlSources[domain]) urlSources[domain] = [];
      urlSources[domain].push(file);
    }

    console.log(`\n${colors.blue}Origens de URLs encontradas:${colors.reset}`);
    for (const [domain, domainFiles] of Object.entries(urlSources)) {
      console.log(`  ${domain}: ${domainFiles.length} arquivos`);
    }

    // Começar correção de URLs
    console.log(`\n${colors.blue}Iniciando correção de URLs...${colors.reset}`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (!file.url) {
        console.log(`${colors.yellow}⚠️ Arquivo ${file.id} não tem URL${colors.reset}`);
        skippedCount++;
        continue;
      }

      const { formatted, url: newUrl } = formatFileUrl(file.url);

      if (formatted) {
        try {
          // Verificar se a URL realmente mudou
          if (file.url !== newUrl) {
            // Atualizar URL no banco de dados
            await strapi.db.query('plugin::upload.file').update({
              where: { id: file.id },
              data: { url: newUrl }
            });

            updatedCount++;
            console.log(`✅ [${updatedCount}] URL atualizada: ${file.name}`);
            console.log(`   De: ${file.url}`);
            console.log(`   Para: ${newUrl}`);
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`${colors.red}❌ Erro ao atualizar arquivo ${file.id}: ${error.message}${colors.reset}`);
          errorCount++;
        }
      } else {
        skippedCount++;
      }
    }

    // Resumo final
    console.log(`\n${colors.green}=== RESUMO DA CORREÇÃO DE URLs ===${colors.reset}`);
    console.log(`✅ Total de URLs corrigidas: ${updatedCount}`);
    console.log(`⏩ URLs ignoradas (já corretas ou externas): ${skippedCount}`);
    console.log(`❌ Erros durante a correção: ${errorCount}`);

    if (updatedCount > 0) {
      console.log(`\n${colors.green}As URLs foram atualizadas com sucesso para usar o domínio: ${r2Config.publicUrl}${colors.reset}`);
    } else if (errorCount === 0) {
      console.log(`\n${colors.green}Todas as URLs já estão usando o domínio correto.${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}A correção de URLs encontrou problemas. Verifique os logs acima.${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Erro fatal ao corrigir URLs: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }
}

module.exports = { fixImageUrls };

// Se o script for executado diretamente
if (require.main === module) {
  console.log('Este script deve ser executado através do Strapi:');
  console.log('NODE_ENV=production node -e "require(\'./scripts/fix-r2-urls-improved.js\').fixImageUrls(strapi)"');
}
