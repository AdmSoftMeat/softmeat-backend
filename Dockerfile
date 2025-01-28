FROM node:18-alpine

RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm vips-dev python3 make g++ \
    libtool pkgconfig cairo-dev pango-dev giflib-dev

WORKDIR /opt/app

COPY package*.json ./

RUN npm install --build-from-source

COPY . .

RUN mkdir -p /opt/app/data
RUN chown -R node:node /opt/app

USER node
EXPOSE 1337

CMD ["npm", "start"]
