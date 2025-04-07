# Estágio base com Node.js
FROM node:20-alpine AS base

# Estágio de dependências
FROM base AS dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Estágio de build
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Definir variáveis de ambiente para o build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Executar build
RUN npm run build

# Estágio de produção
FROM base AS runner
WORKDIR /app

# Definir variáveis de ambiente para produção
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Criar diretório de uploads temporário com permissões corretas
RUN mkdir -p /app/public/uploads
RUN chown -R nextjs:nodejs /app

# Copiar apenas os arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Definir usuário para execução da aplicação
USER nextjs

# Expor porta da aplicação
EXPOSE 3000

# Adicionar comentários para explicar o que cada variável faz
# PORT: a porta que o servidor Next.js vai escutar
# HOSTNAME: o endereço IP que o servidor vai escutar (0.0.0.0 significa todas as interfaces)

CMD ["node", "server.js"] 