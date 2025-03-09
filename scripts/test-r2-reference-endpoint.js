// scripts/test-r2-reference-endpoint.js
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Configuração
const API_URL = process.env.PUBLIC_URL || 'http://localhost:1337';
const API_TOKEN = process.env.API_TOKEN; // Adicione seu token de API ao .env

async function testMediaReference() {
  console.log('=== TESTE DE REFERENCIAMENTO DE MÍDIA ===');

  // URL de teste
  const testUrl = 'https://storage.softmeat.com.br/produtos/exemplo-teste.jpg';

  try {
    console.log(`Tentando referenciar: ${testUrl}`);

    const response = await axios.post(
      `${API_URL}/api/media/reference`,
      {
        url: testUrl,
        name: 'Exemplo de Teste',
        caption: 'Imagem referenciada via API',
        alternativeText: 'Imagem de teste'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Sucesso!');
    console.log('Resposta:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testMediaReference();
