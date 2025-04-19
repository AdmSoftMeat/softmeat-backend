// src/extensions/upload/services/Upload.js
'use strict';

module.exports = {
  async enhanceFile(file, fileInfo = {}, metas = {}) {
    // Log para depuração
    console.log('[enhanceFile] Input:', JSON.stringify({
      file: file.name,
      fileInfo: fileInfo.name,
      metas: {
        refId: metas.refId,
        ref: metas.ref,
        field: metas.field
      }
    }, null, 2));

    // Obter o serviço de upload original
    const uploadService = strapi.plugin('upload').service('file');
    const fileInfoEnhanced = await uploadService.enhanceFile(file, fileInfo, metas);

    // Adicionar metadados para facilitar o rastreamento
    if (metas.refId && metas.ref) {
      try {
        const model = strapi.contentTypes[metas.ref];
        if (model) {
          // Correção: usar displayName como fallback em vez de name
          const modelName = model.info.singularName || model.info.displayName || metas.ref.split('.').pop();

          // Adicionar metadados sem modificar o nome do arquivo
          fileInfoEnhanced.provider_metadata = {
            ...fileInfoEnhanced.provider_metadata,
            collection: modelName
          };

          console.log(`Metadados adicionados: collection=${modelName}`);
        }
      } catch (error) {
        console.error('Erro ao adicionar metadados:', error);
      }
    }

    // Log do resultado
    console.log('[enhanceFile] Output:', JSON.stringify({
      name: fileInfoEnhanced.name,
      hash: fileInfoEnhanced.hash,
      provider_metadata: fileInfoEnhanced.provider_metadata
    }, null, 2));

    return fileInfoEnhanced;
  }
};
