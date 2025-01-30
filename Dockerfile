FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev > /dev/null 2>&1

# Configurar workdir
WORKDIR /opt/app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm ci --production

# Copiar arquivos do projeto
COPY . .

# Criar diretório de dados e configurar permissões
RUN mkdir -p /opt/app/data && \
    chown -R node:node /opt/app && \
    chmod -R 755 /opt/app/data

# Variáveis de ambiente
ENV NODE_ENV=production
ENV DATABASE_FILENAME=/opt/app/data/data.db
ENV DATABASE_CLIENT=sqlite

# Expor porta
EXPOSE 1337

# Iniciar aplicação
CMD ["npm", "run", "start"]
