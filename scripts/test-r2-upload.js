// scripts/test-r2-upload.js - versão atualizada
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

// Verificar variáveis configuradas
console.log('=== TESTE DE CONEXÃO R2 ===');
console.log('CF_ACCESS_KEY_ID existe:', !!process.env.CF_ACCESS_KEY_ID);
console.log('CF_ACCESS_SECRET existe:', !!process.env.CF_ACCESS_SECRET);
console.log('CF_ENDPOINT:', process.env.CF_ENDPOINT);
console.log('CF_BUCKET:', process.env.CF_BUCKET);
console.log('CF_REGION:', process.env.CF_REGION || 'auto');
console.log('CF_PUBLIC_ACCESS_URL:', process.env.CF_PUBLIC_ACCESS_URL);

// Configurar cliente R2
const r2Client = new S3Client({
  region: process.env.CF_REGION || 'auto',
  endpoint: process.env.CF_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
});

// Função para formatar URL R2
const formatR2Url = (path) => {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  if (process.env.CF_PUBLIC_ACCESS_URL) {
    const domain = process.env.CF_PUBLIC_ACCESS_URL.endsWith('/')
      ? process.env.CF_PUBLIC_ACCESS_URL.slice(0, -1)
      : process.env.CF_PUBLIC_ACCESS_URL;
    return `${domain}/${cleanPath}`;
  }

  const endpoint = process.env.CF_ENDPOINT;
  const bucket = process.env.CF_BUCKET;

  if (!endpoint || !bucket) {
    console.error('Erro: CF_ENDPOINT ou CF_BUCKET não definidos!');
    return '';
  }

  const cleanEndpoint = endpoint.endsWith('/')
    ? endpoint.slice(0, -1)
    : endpoint;

  return `${cleanEndpoint}/${bucket}/${cleanPath}`;
};

// Função para testar listagem de arquivos
async function testListFiles() {
  try {
    console.log('\nTentando listar arquivos no bucket R2...');

    const command = new ListObjectsV2Command({
      Bucket: process.env.CF_BUCKET,
      MaxKeys: 5
    });

    const response = await r2Client.send(command);
    console.log(`✅ Sucesso! Encontrados ${response.Contents?.length || 0} arquivos\n`);

    // Mostrar alguns arquivos
    if (response.Contents && response.Contents.length > 0) {
      console.log('Exemplos de arquivos:');
      response.Contents.slice(0, 5).forEach((file, index) => {
        const url = formatR2Url(file.Key);
        console.log(`${index + 1}. ${file.Key} -> ${url}`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error.message);
    return false;
  }
}

// Função para testar upload de arquivo
async function testUpload() {
  try {
    console.log('\nTentando fazer upload de arquivo de teste para R2...');

    // Criar arquivo de teste
    const testFile = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFile, `Arquivo de teste gerado em ${new Date().toISOString()}`);

    // Configurar comando de upload
    const fileStream = fs.createReadStream(testFile);
    const fileKey = `test/test-upload-${Date.now()}.txt`;

    const uploadParams = {
      Bucket: process.env.CF_BUCKET,
      Key: fileKey,
      Body: fileStream,
      ContentType: 'text/plain',
      ACL: 'public-read'
    };

    // Enviar arquivo
    await r2Client.send(new PutObjectCommand(uploadParams));
    console.log('✅ Upload concluído com sucesso');

    // Mostrar URL
    const url = formatR2Url(fileKey);
    console.log(`URL do arquivo: ${url}`);

    // Limpar
    fs.unlinkSync(testFile);
    console.log('Arquivo de teste local removido');

    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error.message);
    return false;
  }
}

// Testar formatação de URLs
function testFormatUrls() {
  console.log('\nTeste de formatação de URLs:');

  const testPaths = [
    'images/test/example.jpg',
    '/images/product/photo.png',
    'videos/testimonials/video.mp4'
  ];

  for (const path of testPaths) {
    const url = formatR2Url(path);
    console.log(`${path} -> ${url}`);
  }
}

// Executar testes
async function runTests() {
  console.log('\n=== INICIANDO TESTES R2 ===');

  // Verificar variáveis necessárias
  if (!process.env.CF_ACCESS_KEY_ID || !process.env.CF_ACCESS_SECRET ||
      !process.env.CF_ENDPOINT || !process.env.CF_BUCKET) {
    console.error('❌ Configuração incompleta. Verifique as variáveis de ambiente.');
    return;
  }

  // Testar formatação de URLs
  testFormatUrls();

  // Testar conexão e listagem
  const listSuccess = await testListFiles();

  // Testar upload se listagem for bem-sucedida
  if (listSuccess) {
    await testUpload();
  }

  console.log('\n=== TESTES CONCLUÍDOS ===');
}

// Executar todos os testes
runTests();
