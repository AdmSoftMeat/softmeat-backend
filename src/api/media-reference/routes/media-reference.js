// src/api/media-reference/routes/media-reference.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/api/media/reference',
      handler: 'media-reference.reference',
      config: {
        policies: [],
        description: 'Referencia uma mídia externa por URL'
      }
    }
  ]
};
