module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  upload: {
    config: {
      provider: '@strapi/provider-upload-cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
        secure: true,
        private_cdn: false,
        secure_distribution: null,
        cname: null,
      },
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
      actionOptions: {
        upload: {
          folder: env('CLOUDINARY_FOLDER', 'softmeat'),
          resource_type: 'auto',
          unique_filename: true,
          overwrite: false,
          transformation: {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
          use_filename: true,
        },
        delete: {
          invalidate: true
        },
      },
    },
  },
});
