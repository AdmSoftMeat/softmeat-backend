const config = {
  locales: ['pt-BR'],
  translations: {
    'pt-BR': {
      'app.components.LeftMenu.navbrand.title': 'SoftMeat Dashboard',
    },
  },
};

const bootstrap = (app) => {
  console.log(app);
};

export default {
  config,
  bootstrap,
};
