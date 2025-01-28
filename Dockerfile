FROM node:18-alpine

WORKDIR /opt/app

RUN apk add --no-cache build-base python3

COPY package*.json ./
RUN npm install

COPY . .
RUN mkdir -p /opt/app/data
RUN chown -R node:node /opt/app

USER node
EXPOSE 1337

CMD ["npm", "start"]
