'use strict';

/**
 * configuracao-geral service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::configuracao-geral.configuracao-geral');
