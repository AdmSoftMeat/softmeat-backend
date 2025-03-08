// scripts/test-r2-provider.js
// Script para testar a configuração do provider R2
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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

// Configurações
const testFilePath = path.join(__dirname, 'test-file.txt');
const testFileKey = `test/provider-test-${Date.now()}.txt`;

// Criar o arquivo de teste
fs.writeFileSync(testFilePath, `Teste de upload para R2 - ${new Date().toISOString()}`);

// Configurar cliente R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CF_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
});

// Funções auxiliares
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Teste de upload
async function testUpload() {
  log('\n=== TESTE DO PROVIDER STRAPI-PROVIDER-CLOUDFLARE-R2 ===', colors.magenta);

  // Verificar variáveis de ambiente
  log('\n[1] Verificando variáveis de ambiente:', colors.blue);
  const requiredVars = ['CF_ACCESS_KEY_ID', 'CF_ACCESS_SECRET', 'CF_ENDPOINT', 'CF_BUCKET', 'CF_PUBLIC_ACCESS_URL'];

  let missingVars = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      log(`  ❌ ${varName}: Não encontrada`, colors.red);
      missingVars.push(varName);
    } else {
      log(`  ✅ ${varName}: Configurada`);
    }
  }

  if (missingVars.length > 0) {
    log(`\n❌ As seguintes variáveis não estão configuradas: ${missingVars.join(', ')}`, colors.red);
    log('Por favor, configure-as no arquivo .env e tente novamente');
    return;
  }

  // Testar conexão e listagem
  log('\n[2] Testando conexão e listagem de objetos:', colors.blue);
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.CF_BUCKET,
      MaxKeys: 5
    });

    const listResponse = await s3Client.send(listCommand);
    log(`  ✅ Conexão estabelecida com sucesso`);
    log(`  ✅ Encontrados ${listResponse.Contents?.length || 0} objetos`);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      log(`\n  Exemplos de objetos:`);
      listResponse.Contents.slice(0, 3).forEach((obj, i) => {
        log(`  ${i+1}. ${obj.Key} (${obj.Size} bytes)`);

        // Construir URL direta e pública
        const directUrl = `${process.env.CF_ENDPOINT}/${process.env.CF_BUCKET}/${obj.Key}`;
        const publicUrl = `${process.env.CF_PUBLIC_ACCESS_URL}/${obj.Key}`;

        log(`     URL direta: ${directUrl}`);
        log(`     URL pública: ${publicUrl}`);
      });
    }
  } catch (error) {
    log(`  ❌ Erro ao conectar ao R2: ${error.message}`, colors.red);
    return;
  }

  // Testar upload
  log('\n[3] Testando upload de arquivo:', colors.blue);
  try {
    const fileContent = fs.readFileSync(testFilePath);

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CF_BUCKET,
      Key: testFileKey,
      Body: fileContent,
      ContentType: 'text/plain',
      ACL: 'public-read'
    });

    await s3Client.send(uploadCommand);
    log(`  ✅ Arquivo enviado com sucesso`);

    // Construir URLs
    const directUrl = `${process.env.CF_ENDPOINT}/${process.env.CF_BUCKET}/${testFileKey}`;
    const publicUrl = `${process.env.CF_PUBLIC_ACCESS_URL}/${testFileKey}`;

    log(`  URL direta: ${directUrl}`);
    log(`  URL pública: ${publicUrl}`);

    // Testar download
    log('\n[4] Testando download do arquivo:', colors.blue);
    const getCommand = new GetObjectCommand({
      Bucket: process.env.CF_BUCKET,
      Key: testFileKey
    });

    const getResponse = await s3Client.send(getCommand);
    log(`  ✅ Arquivo recuperado com sucesso`);
    log(`  Content-Type: ${getResponse.ContentType}`);
    log(`  Content-Length: ${getResponse.ContentLength} bytes`);

    // Limpar
    fs.unlinkSync(testFilePath);
    log(`\n✅ Teste concluído com sucesso!`, colors.green);
    log(`O arquivo de teste foi enviado para: ${testFileKey}`);
    log(`\nPróximos passos:`);
    log(`1. Verifique se pode acessar a URL pública: ${publicUrl}`);
    log(`2. Configure o plugin no Strapi conforme documentação`);
    log(`3. Reinicie o servidor Strapi e teste o upload pelo painel admin`);
  } catch (error) {
    log(`  ❌ Erro durante o teste: ${error.message}`, colors.red);
  }
}

// Executar o teste
testUpload();
