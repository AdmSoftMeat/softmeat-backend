// scripts/list-all-r2-objects.js
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function listAllObjects() {
  console.log('=== LISTAGEM COMPLETA DE OBJETOS NO R2 ===');
  console.log(`Bucket: ${process.env.CF_BUCKET}`);
  console.log(`Endpoint: ${process.env.CF_ENDPOINT}`);
  console.log(`URL pública: ${process.env.CF_PUBLIC_ACCESS_URL || 'Não configurada'}`);

  // Criar cliente R2
  const s3Client = new S3Client({
    region: process.env.CF_REGION || 'auto',
    endpoint: process.env.CF_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CF_ACCESS_KEY_ID,
      secretAccessKey: process.env.CF_ACCESS_SECRET,
    },
  });

  try {
    // Listar todos os objetos (sem prefixo específico)
    const command = new ListObjectsV2Command({
      Bucket: process.env.CF_BUCKET,
      MaxKeys: 100
    });

    const response = await s3Client.send(command);

    console.log(`\nTotal de objetos encontrados: ${response.Contents?.length || 0}`);

    if (response.Contents && response.Contents.length > 0) {
      // Agrupar por prefixo para entender a estrutura
      const prefixes = {};

      response.Contents.forEach(obj => {
        // Extrair o primeiro nível do caminho
        const firstLevel = obj.Key.split('/')[0];
        if (!prefixes[firstLevel]) {
          prefixes[firstLevel] = {
            count: 0,
            size: 0,
            examples: []
          };
        }

        prefixes[firstLevel].count++;
        prefixes[firstLevel].size += obj.Size;

        // Guardar alguns exemplos para cada prefixo
        if (prefixes[firstLevel].examples.length < 3) {
          prefixes[firstLevel].examples.push(obj.Key);
        }
      });

      // Mostrar resumo de prefixos
      console.log('\nEstrutura de diretórios:');
      Object.entries(prefixes).forEach(([prefix, info]) => {
        console.log(`- ${prefix}/: ${info.count} objetos (${(info.size / 1024 / 1024).toFixed(2)} MB)`);

        // Mostrar alguns exemplos
        console.log('  Exemplos:');
        info.examples.forEach(example => {
          const url = `${process.env.CF_PUBLIC_ACCESS_URL}/${example}`;
          console.log(`  - ${example}`);
          console.log(`    URL: ${url}`);
        });
      });
    }
  } catch (error) {
    console.error('Erro ao listar objetos:', error);
  }
}

listAllObjects();
