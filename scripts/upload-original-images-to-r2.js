// scripts/upload-original-images-to-r2.js
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const mime = require('mime-types');

// Carregar variáveis de ambiente
dotenv.config();

// Configurar o cliente R2
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Diretório base de imagens
const BASE_IMAGE_DIR = path.join(__dirname, '/images');

// Mapeamento de pastas para categorias no R2
const FOLDER_CATEGORY_MAP = {
  'clientes': 'clientes',
  'consultoria': 'consultoria',
  'cursos': 'cursos',
  'index': 'index',
  'institucional': 'institucional',
  'logo': 'logo',
  'produtos': 'produtos',
  'testemunhos': 'testemunhos',
  // Adicione outros mapeamentos conforme necessário
};

// Função para verificar se o arquivo é uma imagem
function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
}

// Função para determinar o tipo de recurso com base no MIME type
function getResourceType(mimeType) {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audios';
  return 'files';
}

// Função para determinar a categoria com base no caminho do arquivo
function getCategory(filePath) {
  const relativePath = path.relative(BASE_IMAGE_DIR, filePath);
  const segments = relativePath.split(path.sep);

  // Obter a primeira pasta do caminho relativo
  const firstFolder = segments[0];

  // Retornar a categoria mapeada ou 'geral' como fallback
  return FOLDER_CATEGORY_MAP[firstFolder] || 'geral';
}

// Função para fazer upload de um arquivo para o R2
async function uploadFileToR2(filePath) {
  try {
    // Ler o arquivo
    const fileContent = fs.readFileSync(filePath);

    // Determinar MIME type
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    // Determinar tipo de recurso (images, videos, etc)
    const resourceType = getResourceType(mimeType);

    // Determinar categoria baseado no caminho
    const category = getCategory(filePath);

    // Gerar nome de arquivo (mantendo o nome original)
    const fileName = path.basename(filePath);

    // Criar o path no R2
    const r2Key = `${category}/${fileName}`;

    // Upload para o R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: r2Key,
      Body: fileContent,
      ContentType: mimeType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await r2Client.send(command);
    console.log(`Uploaded ${filePath} to ${r2Key}`);
    return r2Key;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error);
    throw error;
  }
}

// Função para percorrer diretório recursivamente
async function processDirectory(directory) {
  const items = fs.readdirSync(directory);

  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // Se for diretório, processa recursivamente
      await processDirectory(itemPath);
    } else if (stats.isFile() && isImageFile(itemPath)) {
      // Se for arquivo de imagem, faz upload
      await uploadFileToR2(itemPath);
    }
  }
}

// Função principal
async function main() {
  try {
    console.log('Starting upload of original images to R2...');
    await processDirectory(BASE_IMAGE_DIR);
    console.log('Upload completed successfully!');
  } catch (error) {
    console.error('Error during upload process:', error);
    process.exit(1);
  }
}

// Executar o script
main();
