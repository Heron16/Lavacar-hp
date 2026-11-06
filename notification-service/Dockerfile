# ============================================================
#  AquaWash — Notification Service
#  Build multi-stage: compila TypeScript e roda só o JS final
# ============================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# --- Stage 2: Runtime ---
FROM node:20-alpine AS runtime

WORKDIR /app

# Copia apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copia o build compilado
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
