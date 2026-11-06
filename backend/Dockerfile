FROM node:20-alpine

WORKDIR /app

# Copia manifesto de dependências
COPY package*.json ./

# Instala dependências de produção
RUN npm ci --omit=dev

# Copia o código-fonte TypeScript
COPY . .

# Compila TypeScript → JavaScript
RUN npm run build

# Cria a pasta de uploads (persistida via volume no docker-compose)
RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
