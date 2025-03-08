// scripts/diagnose-r2-images-v2.js
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const dotenv = require('dotenv');
const { tmpdir } = require('os');

// Carregar variáveis de ambiente
dotenv.config();

// Criar cliente R2
const s3Client = new S3Client({
  region: process.env.CF_REGION || 'auto',
  endpoint: process.env.CF_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
});

// Diretório para salvar imagens temporárias
const TEMP_DIR = path.join(tmpdir(), 'r2-images-diagnose');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Função para obter a URL formatada
function getFormattedUrl(key) {
  if (process.env.CF_PUBLIC_ACCESS_URL) {
    return `${process.env.CF_PUBLIC_ACCESS_URL.replace(/\/$/, '')}/${key}`;
  }
  return `${process.env.CF_ENDPOINT.replace(/\/$/, '')}/${process.env.CF_BUCKET}/${key}`;
}

// Função para verificar se a imagem é transparente
async function isTransparentImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    // A imagem tem canal alpha e é PNG, WebP ou similar
    return metadata.hasAlpha === true && metadata.channels === 4;
  } catch (error) {
    console.error(`Erro ao analisar imagem ${filePath}: ${error.message}`);
    return false;
  }
}

// Função para verificar imagens em um prefixo específico
async function checkImagesInPrefix(prefix) {
  console.log(`\n=== VERIFICANDO IMAGENS EM ${prefix}/ ===`);

  try {
    // Listar objetos com o prefixo
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.CF_BUCKET,
      Prefix: prefix + '/',
      MaxKeys: 20 // Limitar para amostragem
    });

    const listResult = await s3Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log(`Nenhuma imagem encontrada no prefixo ${prefix}/`);
      return { total: 0, transparent: 0, errors: 0 };
    }

    console.log(`Encontradas ${listResult.Contents.length} imagens no prefixo ${prefix}/`);

    // Filtrar apenas arquivos de imagem
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const imageObjects = listResult.Contents.filter(obj => {
      const ext = path.extname(obj.Key).toLowerCase();
      return imageExtensions.includes(ext);
    });

    console.log(`Total de arquivos de imagem: ${imageObjects.length}`);

    // Analisar uma amostra de imagens (limitando para não sobrecarregar)
    const sampleSize = Math.min(imageObjects.length, 5); // Limitar a 5 imagens por prefixo
    const imageSample = imageObjects.slice(0, sampleSize);

    console.log(`\nAnalisando amostra de ${sampleSize} imagens...`);

    let transparentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < imageSample.length; i++) {
      const imageObj = imageSample[i];
      console.log(`\nImagem ${i+1}/${sampleSize}: ${imageObj.Key}`);

      try {
        // Obter o objeto do R2
        const getCommand = new GetObjectCommand({
          Bucket: process.env.CF_BUCKET,
          Key: imageObj.Key,
        });

        const getResult = await s3Client.send(getCommand);

        // Salvar temporariamente para análise
        const tempFilePath = path.join(TEMP_DIR, path.basename(imageObj.Key));
        const fileStream = fs.createWriteStream(tempFilePath);

        await new Promise((resolve, reject) => {
          getResult.Body.pipe(fileStream)
            .on('finish', () => {
              resolve();
            })
            .on('error', (err) => {
              reject(err);
            });
        });

        // Verificar se a imagem tem transparência
        const transparent = await isTransparentImage(tempFilePath);

        // Obter informações da imagem
        const metadata = await sharp(tempFilePath).metadata();

        console.log(`  URL: ${getFormattedUrl(imageObj.Key)}`);
        console.log(`  Formato: ${metadata.format}`);
        console.log(`  Dimensões: ${metadata.width}x${metadata.height}`);
        console.log(`  Canais: ${metadata.channels}`);
        console.log(`  Tem transparência: ${transparent ? 'Sim' : 'Não'}`);

        if (transparent) {
          transparentCount++;
        }

        // Limpar arquivo temporário
        fs.unlinkSync(tempFilePath);
      } catch (error) {
        console.error(`  Erro ao analisar imagem: ${error.message}`);
        errorCount++;
      }
    }

    return {
      total: sampleSize,
      transparent: transparentCount,
      errors: errorCount
    };

  } catch (error) {
    console.error(`Erro ao analisar prefixo ${prefix}/: ${error.message}`);
    return { total: 0, transparent: 0, errors: 0 };
  }
}

// Função principal de diagnóstico
async function diagnoseR2Images() {
  console.log('=== DIAGNÓSTICO DE IMAGENS NO R2 ===');
  console.log(`Bucket: ${process.env.CF_BUCKET}`);
  console.log(`Endpoint: ${process.env.CF_ENDPOINT}`);
  console.log(`URL pública: ${process.env.CF_PUBLIC_ACCESS_URL || 'Não configurada'}`);

  if (!process.env.CF_BUCKET || !process.env.CF_ENDPOINT) {
    console.error('Erro: Configuração R2 incompleta. Verifique as variáveis de ambiente.');
    return;
  }

  try {
    // Primeiro, listar todos os objetos para descobrir prefixos
    console.log('\nDescobrir prefixos disponíveis...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.CF_BUCKET,
      MaxKeys: 1000
    });

    const listResult = await s3Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('Nenhum objeto encontrado no bucket.');
      return;
    }

    // Extrair prefixos únicos (primeiro nível)
    const prefixes = new Set();
    listResult.Contents.forEach(obj => {
      const firstLevel = obj.Key.split('/')[0];
      if (firstLevel) {
        prefixes.add(firstLevel);
      }
    });

    console.log(`Prefixos encontrados: ${Array.from(prefixes).join(', ')}`);

    // Analisar imagens em cada prefixo
    let totalStats = { total: 0, transparent: 0, errors: 0 };

    for (const prefix of prefixes) {
      const stats = await checkImagesInPrefix(prefix);
      totalStats.total += stats.total;
      totalStats.transparent += stats.transparent;
      totalStats.errors += stats.errors;
    }

    // Resumo geral
    console.log('\n=== RESUMO GERAL DA ANÁLISE ===');
    console.log(`Total de imagens analisadas: ${totalStats.total}`);
    console.log(`Imagens com transparência: ${totalStats.transparent} (${(totalStats.transparent/totalStats.total*100 || 0).toFixed(1)}%)`);
    console.log(`Erros durante a análise: ${totalStats.errors} (${(totalStats.errors/totalStats.total*100 || 0).toFixed(1)}%)`);

    // Limpar diretório temporário
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  } catch (error) {
    console.error('Erro durante o diagnóstico:', error.message);
  }
}

// Executar diagnóstico
diagnoseR2Images().catch(error => {
  console.error('Erro fatal durante o diagnóstico:', error);
});
