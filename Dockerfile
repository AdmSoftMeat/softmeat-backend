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
    pg@8.14.1 \
    pg-connection-string@2.7.0

# Forçar resolução de versões problemáticas
RUN npm install --save-exact @radix-ui/react-use-effect-event@0.0.3

# Copiar o código-fonte
COPY . .

# Construir a aplicação com variáveis de ambiente adicionais
RUN NODE_OPTIONS="--max_old_space_size=4096" NODE_ENV=production npm run build

# Configurar diretórios de upload e permissões
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads
RUN mkdir -p /opt/app/data && \
    chown -R node:node /opt/app && \
    chmod -R 755 /opt/app/data

# Usuário não-root
USER node

# Comando de inicialização
CMD ["npm", "run", "start"]
