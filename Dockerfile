FROM node:18-alpine

# Instalar todas as dependências necessárias para o sharp
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    python3 \
    make \
    g++ \
    libc6-compat

# Configurar variáveis de ambiente para o sharp
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_arch=x64
ENV npm_config_platform=linux

# Criar diretório da aplicação
WORKDIR /opt/app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --verbose

# Copiar resto do código
COPY . .

# Criar diretório de dados e ajustar permissões
RUN mkdir -p /opt/app/data

# Não vamos mais mudar para o usuário node devido ao RAILWAY_RUN_UID=0
# USER node

# Expor porta
EXPOSE 1337

# Comando para iniciar
CMD ["npm", "start"]
