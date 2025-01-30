module.exports = {
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
  responses: {
    privateAttributes: ['_v', 'id', 'created_at'],
  },
  webhook: {
    populateRelations: false,
  },
};
