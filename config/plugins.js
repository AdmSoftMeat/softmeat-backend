// config/plugins.js
const path = require("path");

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "@strapi/provider-upload-aws-s3",
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env("R2_ACCESS_KEY"),
            secretAccessKey: env("R2_SECRET_KEY"),
          },
          endpoint: env("R2_ENDPOINT"),
          region: env("R2_REGION", "auto"),
          params: {
            Bucket: env("R2_BUCKET"),
            ACL: "public-read",
          },
        },
        baseUrl: env("R2_PUBLIC_URL"),
      },
    },
  },
});
