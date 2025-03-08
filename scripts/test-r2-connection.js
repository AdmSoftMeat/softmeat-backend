// test-r2-connection.js
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verificar se as variáveis foram carregadas
console.log('Variáveis carregadas:');
console.log('R2_ACCESS_KEY existe:', !!process.env.R2_ACCESS_KEY);
console.log('R2_SECRET_KEY existe:', !!process.env.R2_SECRET_KEY);
console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
console.log('R2_BUCKET:', process.env.R2_BUCKET);
console.log('R2_REGION:', process.env.R2_REGION || 'auto');
console.log('R2_CUSTOM_DOMAIN:', process.env.R2_CUSTOM_DOMAIN);

// Verificar se as variáveis essenciais estão presentes
if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY || !process.env.R2_ENDPOINT || !process.env.R2_BUCKET) {
 console.error('Erro: Variáveis de ambiente R2 não encontradas!');
 console.error('Por favor, verifique se o arquivo .env contém as configurações do R2.');
 process.exit(1);
}

// Configurar o cliente R2
const r2Client = new S3Client({
 region: process.env.R2_REGION || 'auto',
 endpoint: process.env.R2_ENDPOINT,
 credentials: {
   accessKeyId: process.env.R2_ACCESS_KEY,
   secretAccessKey: process.env.R2_SECRET_KEY,
 },
});

async function testConnection() {
 try {
   console.log('\nTentando conectar ao R2...');

   // Listar objetos no bucket
   const command = new ListObjectsV2Command({
     Bucket: process.env.R2_BUCKET,
     MaxKeys: 10, // Limitando a 10 objetos para teste
   });

   const response = await r2Client.send(command);

   console.log(`\nConexão com R2 bem-sucedida!`);
   console.log(`Encontrados ${response.Contents?.length || 0} objetos:`);

   // Mostrar alguns objetos
   (response.Contents || []).forEach((obj, index) => {
     console.log(`${index + 1}. ${obj.Key} (${obj.Size} bytes)`);

     // Construir URL usando o domínio personalizado
     const customUrl = `${process.env.R2_CUSTOM_DOMAIN}/${obj.Key}`;
     console.log(`   URL custom: ${customUrl}`);

     // Construir URL direta do R2
     const directUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${obj.Key}`;
     console.log(`   URL direta: ${directUrl}`);
   });

 } catch (error) {
   console.error('Erro ao conectar com R2:', error);
 }
}

testConnection();
