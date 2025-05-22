// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        accessKeyId: env("R2_ACCESS_KEY"),
        secretAccessKey: env("R2_SECRET_KEY"),
        endpoint: env("R2_ENDPOINT"),
        region: "auto",
        params: {
          Bucket: env("R2_BUCKET"),
          ACL: "public-read", // Obrigatório para acesso público
        },
      },
      baseUrl: env("R2_PUBLIC_URL"), // Domínio customizado (ex: https://storage.softmeat.com.br)
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
