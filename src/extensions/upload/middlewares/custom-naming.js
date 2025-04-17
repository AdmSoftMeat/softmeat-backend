// src/middlewares/custom-naming.js
'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.request.url.includes('/upload') && ctx.request.method === 'POST') {
      const { files } = ctx.request;

      if (files?.files) {
        files.files = Array.isArray(files.files)
          ? files.files.map(processFile)
          : processFile(files.files);
      }
    }
    await next();
  };

  function processFile(file) {
    if (file.name && !file.hash) {
      file.hash = file.name.replace(/\.[^/.]+$/, '');
    }
    return file;
  }
};
