FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev > /dev/null 2>&1

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Criar diretório de dados e ajustar permissões
RUN mkdir -p /app/data
RUN chown -R node:node /app

# Mudar para usuário não-root
USER node

# Expor porta do Strapi
EXPOSE 1337

# Comando para iniciar o Strapi
CMD ["npm", "start"]
