# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
# .env.production tem os valores públicos (publishable key) do Supabase
# e é lido automaticamente pelo Vite durante o build.
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Saída do build já é autocontida (inclui seu próprio node_modules mínimo)
COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
