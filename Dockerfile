FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache \
    build-base \
    python3 \
    sqlite

# Configurar workdir
WORKDIR /opt/app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install \
    @strapi/strapi@4.15.5 \
    @strapi/plugin-users-permissions@4.15.5 \
    @strapi/plugin-i18n@4.15.5 \
    better-sqlite3@8.6.0

# Copiar resto do código
COPY . .

# Build do Strapi
RUN NODE_ENV=production npm run build
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads

# Criar diretório de dados e ajustar permissões
RUN mkdir -p /opt/app/data && \
    chown -R node:node /opt/app && \
    chmod -R 755 /opt/app/data && \
    mkdir -p /tmp/uploads && \
    chmod 777 /tmp/uploads

# Expor porta
EXPOSE 1337

# Comando para iniciar
CMD ["npm", "start"]
