# 🚀 Guia de Desenvolvimento Local - Servio.AI

**Última Atualização**: 28/11/2025  
**Status**: ✅ Sistema de Fallback em Memória Implementado

---

## 📋 Visão Geral

Este guia explica como rodar o Servio.AI localmente **sem precisar configurar credenciais Firebase**. O backend possui um sistema de fallback que usa armazenamento em memória quando não detecta credenciais do Google Cloud.

---

## ⚡ Quick Start (5 minutos)

### 1. Clonar e Instalar

```powershell
# Clone o repositório
git clone https://github.com/agenciaclimb/servio.ai.git
cd servio.ai

# Instalar dependências
npm install
cd backend
npm install
cd ..
```

### 2. Iniciar Backend (Modo Memória)

```powershell
# Abrir terminal separado para backend
cd backend
$env:NODE_ENV='development'
node src/index.js
```

**Saída esperada:**

```
[DB] ⚠️  No Google Cloud Project ID found - usando armazenamento em memória
[SERVER] ✅ Firestore Backend Service listening on 0.0.0.0:8081
```

### 3. Popular Usuários de Teste

```powershell
# Em outro terminal
Invoke-RestMethod -Uri 'http://localhost:8081/dev/seed-e2e-users' -Method POST
```

**Resposta:**

```json
{
  "message": "E2E users seeded successfully",
  "users": [
    "e2e-cliente@servio.ai",
    "e2e-prestador@servio.ai",
    "admin@servio.ai",
    "e2e-prospector@servio.ai"
  ],
  "mode": true
}
```

### 4. Iniciar Frontend

```powershell
# Na raiz do projeto
npm run dev
```

Frontend estará disponível em: `http://localhost:5173`

---

## 🔍 Verificação do Sistema

### Health Check

```powershell
Invoke-RestMethod -Uri 'http://localhost:8081/health' -Method Get
```

**Resposta:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T02:00:00.000Z",
  "service": "servio-backend"
}
```

### Status do Banco de Dados

```powershell
Invoke-RestMethod -Uri 'http://localhost:8081/dev/db-status' -Method Get
```

**Resposta:**

```json
{
  "mode": "memory",
  "environment": "development",
  "data": {
    "users": {
      "e2e-cliente@servio.ai": { ... },
      "e2e-prestador@servio.ai": { ... },
      "admin@servio.ai": { ... },
      "e2e-prospector@servio.ai": { ... }
    },
    "jobs": { ... },
    "proposals": { ... }
  }
}
```

---

## 👥 Usuários E2E Disponíveis

Todos os usuários são criados automaticamente via `/dev/seed-e2e-users`:

| Email                      | Tipo       | Senha (quando Firebase Auth configurado) |
| -------------------------- | ---------- | ---------------------------------------- |
| `e2e-cliente@servio.ai`    | cliente    | `SenhaE2E!123`                           |
| `e2e-prestador@servio.ai`  | prestador  | `SenhaE2E!123`                           |
| `admin@servio.ai`          | admin      | `AdminE2E!123`                           |
| `e2e-prospector@servio.ai` | prospector | `SenhaE2E!123`                           |

### Dados dos Usuários

**Cliente:**

```json
{
  "email": "e2e-cliente@servio.ai",
  "name": "E2E Cliente",
  "type": "cliente",
  "location": "São Paulo",
  "status": "ativo"
}
```

**Prestador:**

```json
{
  "email": "e2e-prestador@servio.ai",
  "name": "E2E Prestador",
  "type": "prestador",
  "location": "São Paulo",
  "status": "ativo",
  "headline": "Prestador E2E",
  "specialties": ["limpeza", "reparos"],
  "verificationStatus": "verificado",
  "providerRate": 0.85
}
```

**Prospector:**

```json
{
  "email": "e2e-prospector@servio.ai",
  "name": "E2E Prospector",
  "type": "prospector",
  "location": "São Paulo",
  "status": "ativo",
  "prospectorStats": {
    "totalRecruits": 0,
    "activeRecruits": 0,
    "totalCommissions": 0,
    "level": 1,
    "badges": []
  }
}
```

---

## 🧪 Testando Funcionalidades

### Criar Job

```powershell
$body = @{
  title = "Limpeza Residencial"
  description = "Limpeza completa de apartamento 2 quartos"
  category = "limpeza"
  budget = 150.0
  location = "São Paulo, SP"
  clientId = "e2e-cliente@servio.ai"
  clientName = "E2E Cliente"
} | ConvertTo-Json

$job = Invoke-RestMethod -Uri 'http://localhost:8081/api/jobs' -Method Post -Body $body -ContentType 'application/json'
Write-Host "Job criado com ID: $($job.id)"
```

### Criar Proposta

```powershell
$proposalBody = @{
  jobId = "auto_1764381689788_l7tr7ef3y"  # ID do job criado acima
  providerId = "e2e-prestador@servio.ai"
  providerName = "E2E Prestador"
  price = 130.0
  message = "Posso fazer amanhã mesmo!"
  estimatedDays = 1
} | ConvertTo-Json

$proposal = Invoke-RestMethod -Uri 'http://localhost:8081/proposals' -Method Post -Body $proposalBody -ContentType 'application/json'
Write-Host "Proposta criada com ID: $($proposal.id)"
```

### Listar Usuários

```powershell
$users = Invoke-RestMethod -Uri 'http://localhost:8081/api/users' -Method Get
$users | Format-Table email, name, type
```

---

## 🔧 Troubleshooting

### Backend não inicia

**Problema:** Porta 8081 já está em uso

```powershell
# Matar processos na porta 8081
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Backend não responde

**Problema:** Backend crashou ou ficou travado

```powershell
# Verificar se há processo Node rodando
Get-Process node -ErrorAction SilentlyContinue

# Se não houver, reiniciar
cd backend
$env:NODE_ENV='development'
node src/index.js
```

### Dados desapareceram

**Problema:** Dados são voláteis em modo memória

**Solução:** Recriar usuários após reiniciar backend

```powershell
Invoke-RestMethod -Uri 'http://localhost:8081/dev/seed-e2e-users' -Method POST
```

### Frontend não conecta ao backend

**Problema:** CORS ou backend não está rodando

**Verificação:**

```powershell
# 1. Verificar se backend está rodando
curl http://localhost:8081/health

# 2. Verificar configuração do frontend
# Arquivo: vite.config.ts
# Deve ter proxy para /api -> http://localhost:8081
```

---

## 📝 Endpoints de Desenvolvimento

Disponíveis apenas quando `NODE_ENV !== 'production'`:

### POST /dev/seed-e2e-users

Cria 4 usuários de teste no banco de dados.

**Request:**

```powershell
Invoke-RestMethod -Uri 'http://localhost:8081/dev/seed-e2e-users' -Method POST
```

**Response:**

```json
{
  "message": "E2E users seeded successfully",
  "users": [
    "e2e-cliente@servio.ai",
    "e2e-prestador@servio.ai",
    "admin@servio.ai",
    "e2e-prospector@servio.ai"
  ],
  "mode": true
}
```

### GET /dev/db-status

Retorna modo do banco (memory/firestore) e dump completo dos dados.

**Request:**

```powershell
Invoke-RestMethod -Uri 'http://localhost:8081/dev/db-status' -Method Get
```

**Response:**

```json
{
  "mode": "memory",
  "environment": "development",
  "data": {
    "users": { ... },
    "jobs": { ... },
    "proposals": { ... }
  }
}
```

---

## 🎯 Limitações do Modo Memória

### ⚠️ O que NÃO funciona:

- **Persistência**: Dados são perdidos ao reiniciar o backend
- **Firebase Auth**: Login via interface requer Firebase Auth configurado
- **Push Notifications**: FCM precisa de credenciais reais
- **Storage**: Upload de arquivos requer Firebase Storage
- **Transações**: Transações complexas podem ter comportamento diferente

### ✅ O que funciona:

- **API REST**: Todos os endpoints CRUD funcionam normalmente
- **Lógica de Negócio**: Jobs, propostas, usuários, etc.
- **Queries**: Filtros simples com `where()`, `limit()`, `orderBy()`
- **FieldValue**: `increment()`, `serverTimestamp()`, `arrayUnion()`, `arrayRemove()`
- **Collections**: Criação automática de coleções e documentos

---

## 🚀 Próximo Nível: Firebase Emulator

Para uma experiência mais completa com autenticação e storage:

```powershell
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar emulators
firebase emulators:start
```

**Configurar backend para usar emulator:**

```javascript
// backend/src/index.js
if (process.env.FIREBASE_EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}
```

---

## 📚 Recursos Adicionais

- **Documento Mestre**: `DOCUMENTO_MESTRE_SERVIO_AI.md`
- **Comandos Úteis**: `COMANDOS_UTEIS.md`
- **API Endpoints**: `API_ENDPOINTS.md`
- **Testes**: `HOW_TO_TEST.md`

---

## 🎓 Dicas para Novos Desenvolvedores

1. **Sempre verifique o health check** antes de começar a trabalhar
2. **Use `/dev/db-status`** para debugar o estado do banco
3. **Recrie os usuários** após reiniciar o backend
4. **Terminal externo** para backend evita travamentos (PowerShell separado)
5. **Logs detalhados** aparecem no console do backend

---

**Desenvolvido com ❤️ pela equipe Servio.AI**
