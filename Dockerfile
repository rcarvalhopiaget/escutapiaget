# Estágio base com Node.js
FROM node:18-alpine AS base

# Instalar dependências necessárias para compilação
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Estágio de dependências - instalação de todas as dependências
FROM base AS deps
COPY package.json package-lock.json* ./
# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Estágio de build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Configurações de ambiente para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
ENV SKIP_ENV_VALIDATION=true
ENV CI=true

# Comandos de debugging para identificar problemas
RUN echo "Listando arquivos importantes:"
RUN ls -la
RUN echo "Verificando arquivos de configuração:"
RUN ls -la app || echo "Nenhuma pasta app"
RUN cat next.config.mjs || echo "next.config.mjs não encontrado"

# Executar build com modo verboso
RUN npm run build || (echo "Falha no build! Mostrando erros:" && exit 1)

# Estágio de execução
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos gerados durante o build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Permite substituir variáveis de ambiente durante execução
CMD ["node", "server.js"] 