// diagnose-r2-config.js
// Usa a API do Node.js para verificar a configuração do R2
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('=== DIAGNÓSTICO DE CONFIGURAÇÃO DE UPLOAD R2 ===');

// 1. Verificar variáveis de ambiente
console.log('\n[1] Verificando variáveis de ambiente para R2:');
const requiredEnvVars = [
  'R2_ACCESS_KEY',
  'R2_SECRET_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET',
  'R2_REGION',
  'R2_CUSTOM_DOMAIN'
];

let missingVars = [];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: Não encontrada`);
  } else {
    console.log(`✅ ${varName}: ${varName === 'R2_SECRET_KEY' ? '[OCULTO]' : process.env[varName]}`);
  }
}

if (missingVars.length > 0) {
  console.log(`\n⚠️ Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
} else {
  console.log('\n✅ Todas as variáveis de ambiente necessárias estão presentes');
}

// 2. Verificar a configuração do plugin de upload
console.log('\n[2] Verificando configuração do plugin de upload:');
const pluginsConfigPath = path.join(process.cwd(), 'config', 'plugins.js');

if (fs.existsSync(pluginsConfigPath)) {
  try {
    const pluginsConfig = require(pluginsConfigPath);
    console.log('Configuração do plugin de upload encontrada:');

    if (pluginsConfig.upload && pluginsConfig.upload.config) {
      const uploadConfig = pluginsConfig.upload.config;
      console.log('✅ Configuração de upload existe');

      // Verificar provider
      if (uploadConfig.provider === '@strapi/provider-upload-aws-s3') {
        console.log('✅ Provider correto: @strapi/provider-upload-aws-s3');
      } else {
        console.log(`❌ Provider incorreto: ${uploadConfig.provider}`);
      }

      // Verificar opções do provider
      if (uploadConfig.providerOptions) {
        console.log('✅ Opções do provider configuradas');

        // Verificar específicas do R2
        const options = uploadConfig.providerOptions;
        const requiredOptions = ['accessKeyId', 'secretAccessKey', 'endpoint', 'params'];

        let missingOptions = [];
        for (const option of requiredOptions) {
          if (!options[option]) {
            missingOptions.push(option);
            console.log(`❌ Opção ${option} não encontrada`);
          } else {
            console.log(`✅ Opção ${option} configurada`);
          }
        }

        if (options.params && options.params.Bucket) {
          console.log(`✅ Bucket configurado: ${options.params.Bucket}`);
        } else {
          console.log('❌ Bucket não configurado');
        }

        if (options.params && options.params.ACL === 'public-read') {
          console.log(`✅ ACL configurado corretamente: public-read`);
        } else {
          console.log(`❌ ACL não configurado como public-read`);
        }
      } else {
        console.log('❌ Opções do provider não encontradas');
      }

      // Verificar opções de ações (customPath, etc)
      if (uploadConfig.actionOptions) {
        console.log('✅ Opções de ação configuradas');

        if (uploadConfig.actionOptions.upload) {
          console.log('✅ Opções de upload configuradas');

          if (uploadConfig.actionOptions.upload.ACL === 'public-read') {
            console.log('✅ ACL de upload configurado corretamente');
          } else {
            console.log('❌ ACL de upload não configurado como public-read');
          }

          if (typeof uploadConfig.actionOptions.upload.customPath === 'function') {
            console.log('✅ customPath configurado como função');
          } else {
            console.log('❌ customPath não encontrado ou não é uma função');
          }
        } else {
          console.log('❌ Opções de upload não configuradas');
        }
      } else {
        console.log('❌ Opções de ação não encontradas');
      }
    } else {
      console.log('❌ Configuração de upload não encontrada');
    }
  } catch (error) {
    console.log(`❌ Erro ao carregar a configuração: ${error.message}`);
  }
} else {
  console.log('❌ Arquivo config/plugins.js não encontrado');
}

// 3. Verificar a implementação do formatador de URLs
console.log('\n[3] Verificando formatador de URLs:');

const formatUrlPath = path.join(process.cwd(), 'src', 'extensions', 'upload', 'services', 'format-url.js');
if (fs.existsSync(formatUrlPath)) {
  console.log('✅ Arquivo format-url.js encontrado');

  try {
    const formatUrlContent = fs.readFileSync(formatUrlPath, 'utf8');

    if (formatUrlContent.includes('formatR2Url')) {
      console.log('✅ Função formatR2Url referenciada');
    } else {
      console.log('❌ Função formatR2Url não encontrada no format-url.js');
    }

    if (formatUrlContent.includes('formatFileUrl')) {
      console.log('✅ Função formatFileUrl implementada');
    } else {
      console.log('❌ Função formatFileUrl não encontrada');
    }

    // Verificar estrutura básica da função
    if (formatUrlContent.includes('return file') && formatUrlContent.includes('file.url')) {
      console.log('✅ Função formatFileUrl parece retornar o arquivo com URL');
    } else {
      console.log('❌ Função formatFileUrl pode não estar retornando corretamente');
    }
  } catch (error) {
    console.log(`❌ Erro ao ler format-url.js: ${error.message}`);
  }
} else {
  console.log('❌ Arquivo format-url.js não encontrado');
}

// 4. Verificar a implementação da extensão do upload
console.log('\n[4] Verificando extensão do upload:');

const strapiServerPath = path.join(process.cwd(), 'src', 'extensions', 'upload', 'strapi-server.js');
if (fs.existsSync(strapiServerPath)) {
  console.log('✅ Arquivo strapi-server.js encontrado');

  try {
    const strapiServerContent = fs.readFileSync(strapiServerPath, 'utf8');

    if (strapiServerContent.includes('formatUrl')) {
      console.log('✅ Módulo formatUrl importado');
    } else {
      console.log('❌ Módulo formatUrl não importado');
    }

    if (strapiServerContent.includes('oldFindOne') && strapiServerContent.includes('oldFindMany')) {
      console.log('✅ Funções findOne e findMany sobrescritas');
    } else {
      console.log('❌ Funções findOne e/ou findMany não sobrescritas corretamente');
    }
  } catch (error) {
    console.log(`❌ Erro ao ler strapi-server.js: ${error.message}`);
  }
} else {
  console.log('❌ Arquivo strapi-server.js não encontrado');
}

// 5. Verificar a implementação das funções utilitárias
console.log('\n[5] Verificando funções utilitárias do R2:');

const r2UtilsPath = path.join(process.cwd(), 'src', 'utils', 'r2.js');
if (fs.existsSync(r2UtilsPath)) {
  console.log('✅ Arquivo r2.js encontrado');

  try {
    const r2UtilsContent = fs.readFileSync(r2UtilsPath, 'utf8');

    if (r2UtilsContent.includes('formatR2Url')) {
      console.log('✅ Função formatR2Url implementada');

      if (r2UtilsContent.includes('R2_CUSTOM_DOMAIN')) {
        console.log('✅ Uso de R2_CUSTOM_DOMAIN encontrado');
      } else {
        console.log('❌ R2_CUSTOM_DOMAIN não utilizado');
      }

      if (r2UtilsContent.includes('return finalUrl') || r2UtilsContent.includes('return `${customDomain}')) {
        console.log('✅ Função parece retornar URL formatada');
      } else {
        console.log('❌ Função pode não estar retornando URL corretamente');
      }
    } else {
      console.log('❌ Função formatR2Url não encontrada no r2.js');
    }
  } catch (error) {
    console.log(`❌ Erro ao ler r2.js: ${error.message}`);
  }
} else {
  console.log('❌ Arquivo r2.js não encontrado');
}

// 6. Teste simples de formatação de URL
console.log('\n[6] Testando formatação de URL:');

try {
  // Tentar importar a função formatR2Url
  const r2Utils = require(path.join(process.cwd(), 'src', 'utils', 'r2.js'));

  if (typeof r2Utils.formatR2Url === 'function') {
    const testPath = 'images/test/example.jpg';
    const formattedUrl = r2Utils.formatR2Url(testPath);

    console.log(`✅ Função importada e executada`);
    console.log(`✅ Teste: formatR2Url('${testPath}') => '${formattedUrl}'`);

    if (formattedUrl.includes(process.env.R2_CUSTOM_DOMAIN || '')) {
      console.log('✅ URL formatada usando domínio personalizado');
    } else if (formattedUrl.includes(process.env.R2_ENDPOINT || '')) {
      console.log('✅ URL formatada usando endpoint padrão');
    } else {
      console.log('❌ URL formatada não contém nem domínio personalizado nem endpoint');
    }
  } else {
    console.log('❌ Função formatR2Url não pôde ser importada ou não é uma função');
  }
} catch (error) {
  console.log(`❌ Erro ao testar formatação de URL: ${error.message}`);
}

console.log('\n=== FIM DO DIAGNÓSTICO ===');
console.log('\nRecomendações:');
console.log('- Verifique se todas as variáveis de ambiente estão configuradas corretamente no .env');
console.log('- Certifique-se de que o formato das URLs R2 está correto em seus arquivos');
console.log('- Verifique se o plugin de upload está corretamente configurado para usar o R2');
console.log('- Reinicie o servidor Strapi após corrigir quaisquer problemas');
