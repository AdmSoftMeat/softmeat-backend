module.exports = ({ env }) => ({
  settings: {
    cloudinary: {
      enabled: true,
      config: {
        provider: '@strapi/provider-upload-cloudinary',
        providerOptions: {
          cloud_name: env('CLOUDINARY_NAME'),
          api_key: env('CLOUDINARY_KEY'),
          api_secret: env('CLOUDINARY_SECRET'),
        },
      },
    },
  },
});
