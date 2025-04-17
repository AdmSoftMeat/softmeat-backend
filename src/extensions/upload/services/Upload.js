// src/extensions/upload/services/Upload.js
'use strict';

const path = require('path');

module.exports = {
  async enhanceFile(file, fileInfo = {}, metas = {}) {
    const originalEnhancer = strapi.plugin('upload').service('file');
    const fileInfoEnhanced = await originalEnhancer.enhanceFile(file, fileInfo, metas);

    // Personalizar o nome do arquivo para seguir o padrão "nome da coleção_nome da imagem"
    if (metas.refId && metas.ref && metas.field) {
      try {
        const model = strapi.contentTypes[metas.ref];
        if (model) {
          const modelName = model.info.singularName || model.info.name;
          const extension = path.extname(fileInfoEnhanced.name);
          const baseName = path.basename(fileInfoEnhanced.name, extension);
          const sanitizedName = this.sanitizeString(baseName);
          const shortHash = fileInfoEnhanced.hash.substring(0, 8);

          // Formatar nome do arquivo conforme padrão desejado
          fileInfoEnhanced.name = `${modelName}_${sanitizedName}-${shortHash}${extension}`;

          // Armazenar metadados adicionais
          fileInfoEnhanced.provider_metadata = {
            ...fileInfoEnhanced.provider_metadata,
            collection: modelName,
            originalName: baseName
          };
        }
      } catch (error) {
        console.error('Error customizing file name:', error);
      }
    }

    return fileInfoEnhanced;
  },

  sanitizeString(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }
};

