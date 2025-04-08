#!/bin/bash

# Script para build e deploy da aplicação
echo "=== Iniciando processo de build e deploy ==="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Limpar containers antigos
echo "=== Limpando containers e imagens antigas ==="
docker ps -a | grep escutapiaget | awk '{print $1}' | xargs -r docker rm -f
docker images | grep escutapiaget | awk '{print $3}' | xargs -r docker rmi -f

# Construir a imagem
echo "=== Construindo imagem Docker ==="
docker build -t escutapiaget:latest .

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
    echo "=== ERRO: Falha ao construir a imagem Docker ==="
    exit 1
fi

echo "=== Imagem Docker construída com sucesso ==="

# Executar o container
echo "=== Iniciando o container ==="
docker run -d --name escutapiaget \
    -p 3000:3000 \
    -e MONGODB_URI="$MONGODB_URI" \
    -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    -e NEXTAUTH_URL="$NEXTAUTH_URL" \
    escutapiaget:latest

echo "=== Container iniciado. Aplicação disponível em: http://localhost:3000 ==="
echo "=== Para criar o usuário admin, acesse: http://localhost:3000/admin/criar-admin ==="

# Instruções para deploy no Railway
echo ""
echo "=== INSTRUÇÕES PARA DEPLOY NO RAILWAY ==="
echo "1. Certifique-se de que o Railway CLI está instalado"
echo "2. Faça login no Railway: railway login"
echo "3. Conecte ao projeto: railway link"
echo "4. Faça deploy: railway up"
echo ""
echo "=== IMPORTANTE: Verifique as variáveis de ambiente no Railway ==="
echo "- MONGODB_URI: String de conexão com o MongoDB"
echo "- NEXTAUTH_SECRET: Chave para criptografia das sessões"
echo "- NEXTAUTH_URL: URL completa da aplicação (ex: https://escutapiaget-production.up.railway.app)"
echo "" 