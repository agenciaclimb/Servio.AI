#!/bin/bash
# Smoke Tests E2E — 3 Fluxos Críticos
# Protocolo Supremo — Validação de Verdade Operacional
# Data: 27/12/2025

API_URL="http://localhost:8081/api"
RESULTS_FILE="smoke-test-results.json"

echo "🚀 Iniciando Smoke Tests E2E (27/12/2025 17:40 BRT)"
echo "API Base: $API_URL"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL=0
PASSED=0
FAILED=0

# Função para testar endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  
  ((TOTAL++))
  
  echo -n "[$TOTAL] $name ... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$API_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ $http_code${NC}"
    ((PASSED++))
    echo "$body" | head -c 100
    echo ""
  else
    echo -e "${RED}✗ Expected $expected_status, got $http_code${NC}"
    ((FAILED++))
    echo "Response: $body" | head -c 150
    echo ""
  fi
}

echo "=========================================="
echo "FLUXO 1: CLIENTE (Job + IA + Payment)"
echo "=========================================="

# 1.1 Criar Job
echo ""
echo "1.1 Criar Job (cliente)"
JOB_DATA='{
  "title": "Encanador para vazamento",
  "description": "Cano vazando embaixo da pia",
  "category": "encanamento",
  "location": "São Paulo, SP",
  "clientId": "cliente@test.com",
  "budget": 500
}'

# 1.2 Listar Jobs
echo "1.2 Listar Jobs"
test_endpoint "GET /api/jobs" "GET" "/jobs" "" "200"

echo ""
echo "=========================================="
echo "FLUXO 2: PARCEIRO (Proposta + IA Chat)"
echo "=========================================="

# 2.1 Criar Proposta
echo ""
echo "2.1 Criar Proposta"
PROPOSAL_DATA='{
  "jobId": "job_123",
  "providerId": "provider@test.com",
  "amount": 450,
  "description": "Posso fazer em 2 dias"
}'

# 2.2 Enviar mensagem via WebChat (IA)
echo "2.2 Enviar mensagem WebChat + IA"
CHAT_DATA='{
  "userId": "provider@test.com",
  "message": "Quando posso começar?",
  "userType": "prestador"
}'
test_endpoint "POST /api/omni/web/send" "POST" "/omni/web/send" "$CHAT_DATA" "200"

echo ""
echo "=========================================="
echo "FLUXO 3: PROSPECTOR (Smart Actions)"
echo "=========================================="

# 3.1 Smart Actions
echo "3.1 Executar Smart Actions"
PROSPECT_DATA='{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+5511999999999",
  "temperature": "cold"
}'
test_endpoint "POST /api/prospector/smart-actions" "POST" "/prospector/smart-actions" "$PROSPECT_DATA" "200"

# 3.2 Listar Leads
echo "3.2 Listar Leads"
test_endpoint "GET /api/prospector/leads" "GET" "/prospector/leads?status=new&limit=10" "" "200"

echo ""
echo "=========================================="
echo "RESULTADO FINAL"
echo "=========================================="
echo -e "Total: $TOTAL | ${GREEN}Passed: $PASSED${NC} | ${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ GO PARA LANÇAMENTO${NC}"
  exit 0
else
  echo -e "${RED}✗ NO-GO — Corrigir $FAILED erros${NC}"
  exit 1
fi
