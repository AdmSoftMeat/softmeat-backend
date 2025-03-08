// test-r2-upload.js
// Script para testar o upload e URLs do R2 diretamente
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { formatR2Url } = require('../src/utils/r2');

// Carregar variáveis de ambiente
require('dotenv').config();

// Verificar variáveis configuradas
console.log('=== TESTE DE CONEXÃO R2 ===');
console.log('R2_ACCESS_KEY existe:', !!process.env.R2_ACCESS_KEY);
console.log('R2_SECRET_KEY existe:', !!process.env.R2_SECRET_KEY);
console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
console.log('R2_BUCKET:', process.env.R2_BUCKET);
console.log('R2_REGION:', process.env.R2_REGION || 'auto');
console.log('R2_CUSTOM_DOMAIN:', process.env.R2_CUSTOM_DOMAIN);

// Configurar cliente R2
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Função para testar listagem de arquivos
async function testListFiles() {
  try {
    console.log('\nTentando listar arquivos no bucket R2...');

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
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
      Bucket: process.env.R2_BUCKET,
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
  if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY ||
      !process.env.R2_ENDPOINT || !process.env.R2_BUCKET) {
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