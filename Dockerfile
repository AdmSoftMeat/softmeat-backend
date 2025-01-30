FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev > /dev/null 2>&1

# Criar diretório da aplicação
WORKDIR /opt/app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código-fonte
COPY . .

# Criar diretório de dados e ajustar permissões
RUN mkdir -p /opt/app/data && \
    chown -R node:node /opt/app && \
    chmod -R 755 /opt/app/data

# Mudar para usuário node
USER node

# Expor porta
EXPOSE 1337

# Comando para iniciar
CMD ["npm", "start"]
