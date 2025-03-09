const { S3 } = require('aws-sdk');
require('dotenv').config();

async function testR2() {
  console.log('Testando conexão com R2...');

  const s3 = new S3({
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
    endpoint: process.env.R2_ENDPOINT,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: process.env.R2_REGION || 'auto'
  });

  try {
    const result = await s3.listObjects({ Bucket: process.env.R2_BUCKET }).promise();
    console.log('Conexão com R2 bem-sucedida!');
    console.log(`Objetos encontrados: ${result.Contents.length}`);

    // Testar alguns objetos
    if (result.Contents.length > 0) {
      console.log('\nExemplos de objetos:');
      result.Contents.slice(0, 3).forEach(obj => {
        console.log(`- ${obj.Key} (${obj.Size} bytes)`);
        console.log(`  URL: ${process.env.R2_PUBLIC_URL}/${obj.Key}`);
      });
    }
  } catch (error) {
    console.error('Erro ao conectar com R2:', error);
  }
}

testR2();
