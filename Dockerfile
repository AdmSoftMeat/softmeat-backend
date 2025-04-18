FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    build-base \
    python3 \
    sqlite

# Configurar diretório de trabalho
WORKDIR /opt/app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências do Strapi e PostgreSQL
RUN npm install \
    @strapi/strapi@4.15.5 \
    @strapi/plugin-users-permissions@4.15.5 \
    @strapi/plugin-i18n@4.15.5 \
    pg@8.11.3 \
    pg-connection-string@2.7.0

# Adicionar um arquivo de versão para invalidar o cache quando necessário
ARG BUILD_DATE=unknown
RUN echo "Build date: $BUILD_DATE" > build_version.txt

# Copiar o código-fonte
COPY . .

# Construir a aplicação
RUN NODE_ENV=production npm run build

# Configurar diretórios de upload e permissões
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads
RUN mkdir -p /opt/app/data && \
    chown -R node:node /opt/app && \
    chmod -R 755 /opt/app/data

# Usuário não-root
USER node

# Comando de inicialização
CMD ["npm", "run", "start"]
