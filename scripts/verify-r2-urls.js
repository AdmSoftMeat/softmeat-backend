const dotenv = require('dotenv');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

dotenv.config();

// Log de configuração
console.log('=== VERIFICAÇÃO DE CONFIGURAÇÃO R2 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CF_ACCESS_KEY_ID:', process.env.CF_ACCESS_KEY_ID ? '✓ Configurado' : '✗ Não configurado');
console.log('CF_ACCESS_SECRET:', process.env.CF_ACCESS_SECRET ? '✓ Configurado' : '✗ Não configurado');
console.log('CF_ENDPOINT:', process.env.CF_ENDPOINT);
console.log('CF_BUCKET:', process.env.CF_BUCKET);
console.log('CF_PUBLIC_ACCESS_URL:', process.env.CF_PUBLIC_ACCESS_URL);

// Verificar se as credenciais estão configuradas
if (!process.env.CF_ACCESS_KEY_ID || !process.env.CF_ACCESS_SECRET) {
  console.error('Erro: Credenciais R2 não configuradas!');
  process.exit(1);
}

// Função para verificar URLs em um bucket
async function checkBucketUrls(bucketName) {
  console.log(`\n=== Verificando URLs no bucket: ${bucketName} ===`);

  // Configurar cliente R2
  const r2Client = new S3Client({
    region: process.env.CF_REGION || 'auto',
    endpoint: process.env.CF_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CF_ACCESS_KEY_ID,
      secretAccessKey: process.env.CF_ACCESS_SECRET,
    }
  });

  try {
    // Listar objetos no bucket
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 50 // Limitar para não sobrecarregar
    });

    const response = await r2Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log(`Nenhum objeto encontrado no bucket ${bucketName}`);
      return;
    }

    console.log(`Encontrados ${response.Contents.length} objetos no bucket ${bucketName}`);

    // Calcular estatísticas de estrutura de pastas
    const prefixes = {};
    response.Contents.forEach(obj => {
      const firstLevel = obj.Key.split('/')[0];
      prefixes[firstLevel] = (prefixes[firstLevel] || 0) + 1;
    });

    console.log('\nEstrutura de pastas:');
    Object.entries(prefixes).forEach(([prefix, count]) => {
      console.log(`- ${prefix}: ${count} objetos`);
    });

    // Verificar URLs públicas
    const publicDomain = process.env.CF_PUBLIC_ACCESS_URL || 'https://images.softmeat.com.br';

    console.log('\nExemplos de URLs:');
    for (let i = 0; i < Math.min(5, response.Contents.length); i++) {
      const obj = response.Contents[i];
      const publicUrl = `${publicDomain}/${obj.Key}`;

      console.log(`\n[${i+1}] Objeto: ${obj.Key}`);
      console.log(`    Tamanho: ${obj.Size} bytes`);
      console.log(`    URL pública: ${publicUrl}`);

      // Verificar a acessibilidade da URL pública
      try {
        const checkResponse = await fetch(publicUrl, { method: 'HEAD' });
        console.log(`    Acessível: ${checkResponse.ok ? '✓ Sim' : '✗ Não'} (Status: ${checkResponse.status})`);
      } catch (error) {
        console.log(`    Acessível: ✗ Não (Error: ${error.message})`);
      }
    }

  } catch (error) {
    console.error(`Erro ao verificar bucket ${bucketName}:`, error.message);
  }
}

// Verificar ambos os buckets
async function main() {
  await checkBucketUrls('softmeat-dev');
  await checkBucketUrls('softmeat-prod');
}

main().catch(console.error);
