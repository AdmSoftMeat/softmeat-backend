// src/extensions/upload/services/Upload.js
'use strict';

module.exports = {
  async enhanceFile(file, fileInfo = {}, metas = {}) {
    // Obter o serviço de upload original
    const uploadService = strapi.plugin('upload').service('file');
    const fileInfoEnhanced = await uploadService.enhanceFile(file, fileInfo, metas);

    // Adicionar metadados para facilitar o rastreamento
    if (metas.refId && metas.ref) {
      try {
        const model = strapi.contentTypes[metas.ref];
        if (model) {
          const modelName = model.info.singularName || model.info.name;

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

    return fileInfoEnhanced;
  }
};
