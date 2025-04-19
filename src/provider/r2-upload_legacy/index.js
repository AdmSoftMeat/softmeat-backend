// src/providers/r2-upload/index.js
const AWS = require('aws-sdk');
const path = require('path');

module.exports = {
  init(config) {
    const S3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      endpoint: config.endpoint,
      region: config.region || 'auto',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });

    const publicUrl = config.publicUrl || config.endpoint;

    return {
      async upload(file) {
        const { buffer, hash, ext, mime } = file;

        // Gerar nome de arquivo com hash para evitar colisões
        const filename = `${hash}${ext}`;

        // Definir categoria baseada no mime-type
        let category = 'other';
        if (mime.startsWith('image/')) category = 'images';
        else if (mime.startsWith('video/')) category = 'videos';
        else if (mime.startsWith('audio/')) category = 'audio';

        // Definir chave com categoria
        const Key = `${category}/${filename}`;

        // Upload para R2
        await S3.upload({
          Key,
          Body: Buffer.from(buffer),
          ContentType: mime,
          Bucket: config.bucket,
          ACL: 'public-read'
        }).promise();

        // Formar URL pública correta
        const cleanPublicUrl = publicUrl.endsWith('/')
          ? publicUrl.slice(0, -1)
          : publicUrl;

        file.url = `${cleanPublicUrl}/${Key}`;

        return file;
      },

      async delete(file) {
        // Extrair a chave da URL
        const urlPath = new URL(file.url).pathname;
        const Key = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

        try {
          await S3.deleteObject({
            Key,
            Bucket: config.bucket,
          }).promise();
        } catch (error) {
          console.error('Error deleting from R2:', error);
        }
      },
    };
  },
};
