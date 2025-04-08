#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens com timestamp
log() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função para verificar se um endpoint está acessível
check_endpoint() {
  local url=$1
  local description=$2
  local expected_status=$3
  
  log "${YELLOW}Verificando $description...${NC}"
  
  # Fazer requisição HTTP e capturar o status code
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$status" -eq "$expected_status" ]; then
    log "${GREEN}✅ $description está funcionando (Status: $status)${NC}"
    return 0
  else
    log "${RED}❌ $description não está funcionando corretamente (Status: $status, Esperado: $expected_status)${NC}"
    return 1
  fi
}

# URL base da aplicação
read -p "Digite a URL base da aplicação (ex: https://seu-app.up.railway.app): " BASE_URL

if [ -z "$BASE_URL" ]; then
  log "${RED}URL base não fornecida. Usando localhost:3000${NC}"
  BASE_URL="http://localhost:3000"
fi

log "${YELLOW}Iniciando verificação de deploy para $BASE_URL${NC}"

# Array para manter contagem de sucesso/erro
success=0
error=0

# Verificar página principal
if check_endpoint "$BASE_URL" "Página principal" 200; then
  ((success++))
else
  ((error++))
fi

# Verificar página de login admin
if check_endpoint "$BASE_URL/admin/login" "Página de login admin" 200; then
  ((success++))
else
  ((error++))
fi

# Verificar API de autenticação
if check_endpoint "$BASE_URL/api/auth/csrf" "API de CSRF" 200; then
  ((success++))
else
  ((error++))
fi

# Verificar redirecionamento do middleware para login
if check_endpoint "$BASE_URL/admin/dashboard" "Middleware de proteção" 200; then
  ((success++))
else
  ((error++))
fi

# Resumo final
log "\n${YELLOW}=== RESUMO DA VERIFICAÇÃO ===${NC}"
log "Total de endpoints verificados: $((success + error))"
log "${GREEN}✅ Endpoints funcionando: $success${NC}"
log "${RED}❌ Endpoints com problemas: $error${NC}"

if [ $error -eq 0 ]; then
  log "${GREEN}🎉 DEPLOY BEM-SUCEDIDO! Todos os endpoints estão funcionando.${NC}"
else
  log "${RED}⚠️ ATENÇÃO: Alguns endpoints não estão funcionando como esperado.${NC}"
  log "${YELLOW}Sugestões de verificação:${NC}"
  log "  - Verifique se todas as variáveis de ambiente foram configuradas"
  log "  - Verifique os logs da aplicação para identificar erros"
  log "  - Verifique se a conexão com o banco de dados está funcionando"
  log "  - Execute a página de debug em $BASE_URL/admin/session-debug"
fi 