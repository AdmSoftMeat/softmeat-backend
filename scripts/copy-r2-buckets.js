const dotenv = require('dotenv');
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

dotenv.config();

// Configurações
const SOURCE_BUCKET = 'softmeat-dev';
const TARGET_BUCKET = 'softmeat-prod';
const DRY_RUN = true; // Definir como false para realmente copiar os objetos

// Log inicial
console.log('=== CÓPIA DE OBJETOS ENTRE BUCKETS R2 ===');
console.log(`De: ${SOURCE_BUCKET}`);
console.log(`Para: ${TARGET_BUCKET}`);
console.log(`Modo: ${DRY_RUN ? 'Simulação (dry run)' : 'Cópia real'}`);

// Verificar credenciais
if (!process.env.CF_ACCESS_KEY_ID || !process.env.CF_ACCESS_SECRET) {
  console.error('Erro: Credenciais R2 não configuradas!');
  process.exit(1);
}

// Criar cliente R2
const r2Client = new S3Client({
  region: process.env.CF_REGION || 'auto',
  endpoint: process.env.CF_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  }
});

// Função para copiar objetos entre buckets
async function copyBucketObjects() {
  try {
    console.log('\nListando objetos do bucket de origem...');

    // Listar objetos no bucket de origem
    const listCommand = new ListObjectsV2Command({
      Bucket: SOURCE_BUCKET
    });

    const sourceObjects = await r2Client.send(listCommand);

    if (!sourceObjects.Contents || sourceObjects.Contents.length === 0) {
      console.log('Nenhum objeto encontrado no bucket de origem.');
      return;
    }

    console.log(`Encontrados ${sourceObjects.Contents.length} objetos para copiar.`);

    // Listar objetos no bucket de destino para verificar quais já existem
    console.log('Verificando objetos existentes no bucket de destino...');

    const targetListCommand = new ListObjectsV2Command({
      Bucket: TARGET_BUCKET
    });

    let targetObjects;
    try {
      targetObjects = await r2Client.send(targetListCommand);
    } catch (error) {
      console.error('Erro ao listar objetos do bucket de destino:', error.message);
      targetObjects = { Contents: [] };
    }

    // Criar conjunto de chaves existentes no destino
    const existingKeys = new Set();
    if (targetObjects.Contents) {
      targetObjects.Contents.forEach(obj => existingKeys.add(obj.Key));
    }

    console.log(`O bucket de destino já possui ${existingKeys.size} objetos.`);

    // Copiar objetos
    let copiedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const obj of sourceObjects.Contents) {
      // Verificar se o objeto já existe no destino
      if (existingKeys.has(obj.Key)) {
        console.log(`Pulando objeto existente: ${obj.Key}`);
        skippedCount++;
        continue;
      }

      try {
        // Obter o objeto do bucket de origem
        const getCommand = new GetObjectCommand({
          Bucket: SOURCE_BUCKET,
          Key: obj.Key
        });

        const sourceObject = await r2Client.send(getCommand);

        if (!DRY_RUN) {
          // Copiar para o bucket de destino
          const putCommand = new PutObjectCommand({
            Bucket: TARGET_BUCKET,
            Key: obj.Key,
            Body: sourceObject.Body,
            ContentType: sourceObject.ContentType,
            ContentLength: sourceObject.ContentLength,
            ACL: 'public-read',
            CacheControl: 'public, max-age=31536000, immutable'
          });

          await r2Client.send(putCommand);
        }

        console.log(`${DRY_RUN ? '[Simulação] ' : ''}Copiado: ${obj.Key} (${obj.Size} bytes)`);
        copiedCount++;
      } catch (error) {
        console.error(`Erro ao copiar ${obj.Key}:`, error.message);
        errorCount++;
      }
    }

    // Resumo final
    console.log('\n=== RESUMO DA OPERAÇÃO ===');
    console.log(`Total de objetos: ${sourceObjects.Contents.length}`);
    console.log(`Copiados: ${copiedCount}`);
    console.log(`Pulados (já existentes): ${skippedCount}`);
    console.log(`Erros: ${errorCount}`);

    if (DRY_RUN) {
      console.log('\nEste foi apenas um modo de simulação. Para realizar a cópia real, defina DRY_RUN como false.');
    }

  } catch (error) {
    console.error('Erro durante a cópia de objetos:', error);
  }
}

// Executar
copyBucketObjects().catch(console.error);
