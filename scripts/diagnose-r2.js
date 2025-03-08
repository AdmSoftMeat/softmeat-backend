// scripts/diagnose-r2.js
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function runDiagnostics() {
  console.log('=== DIAGNÓSTICO DE CONEXÃO R2 ===');
  console.log('Ambiente:', process.env.NODE_ENV);

  // Verificar variáveis de ambiente
  const requiredVars = ['CF_ACCESS_KEY_ID', 'CF_ACCESS_SECRET', 'CF_ENDPOINT', 'CF_BUCKET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('Variáveis de ambiente faltando:', missingVars.join(', '));
    return false;
  }

  // Criar cliente R2
  const s3Client = new S3Client({
    region: process.env.CF_REGION || 'auto',
    endpoint: process.env.CF_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CF_ACCESS_KEY_ID,
      secretAccessKey: process.env.CF_ACCESS_SECRET,
    },
  });

  // Testar listagem
  try {
    console.log('Testando listagem de objetos...');
    const command = new ListObjectsV2Command({
      Bucket: process.env.CF_BUCKET,
      MaxKeys: 5
    });

    const response = await s3Client.send(command);
    console.log(`Sucesso! Encontrados ${response.Contents?.length || 0} objetos`);

    // Testar upload de texto
    console.log('Testando upload de arquivo de teste...');
    const testContent = `Teste de diagnóstico R2 - ${new Date().toISOString()}`;
    const testKey = `diagnostico/teste-${Date.now()}.txt`;

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CF_BUCKET,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
      ACL: 'public-read'
    });

    await s3Client.send(uploadCommand);
    console.log('Upload de teste concluído com sucesso!');

    // Construir URLs de teste
    const directUrl = `${process.env.CF_ENDPOINT}/${process.env.CF_BUCKET}/${testKey}`;
    const publicUrl = process.env.CF_PUBLIC_ACCESS_URL ?
                     `${process.env.CF_PUBLIC_ACCESS_URL}/${testKey}` :
                     directUrl;

    console.log('URLs de teste:');
    console.log('- URL direta:', directUrl);
    console.log('- URL pública:', publicUrl);

    return true;
  } catch (error) {
    console.error('Erro durante diagnóstico:', error);
    return false;
  }
}

// Executar diagnóstico
runDiagnostics()
  .then(success => {
    if (success) {
      console.log('Diagnóstico concluído com sucesso!');
      process.exit(0);
    } else {
      console.error('Diagnóstico falhou!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
