# API Endpoints - Servio.AI

> **Documentação Completa dos Endpoints do Backend**  
> Atualizado em: 13/11/2025 23:20  
> Versão: 1.0.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Códigos de Erro](#códigos-de-erro)
4. [Endpoints de IA](#endpoints-de-ia)
5. [Endpoints de Stripe](#endpoints-de-stripe)
6. [Endpoints de Usuários](#endpoints-de-usuários)
7. [Endpoints de Jobs](#endpoints-de-jobs)
8. [Endpoints de Propostas](#endpoints-de-propostas)
9. [Comportamento de Fallback](#comportamento-de-fallback)

---

## Visão Geral

### Base URL

```
Desenvolvimento: http://localhost:5000
Produção: https://servio-backend-h5ogjon7aa-uw.a.run.app
```

### Formato de Resposta

Todas as respostas seguem o formato JSON:

```json
{
  "success": true,
  "data": { ... }
}
```

Em caso de erro:

```json
{
  "success": false,
  "error": "Mensagem de erro amigável",
  "code": "E_ERROR_CODE"
}
```

---

## Autenticação

Atualmente não há autenticação obrigatória nos endpoints (modo desenvolvimento).
Em produção, será implementado Firebase Auth com tokens JWT.

---

## Códigos de Erro

O sistema usa um catálogo estruturado de erros:

| Código        | Descrição                | Status HTTP | Ação do Cliente           |
| ------------- | ------------------------ | ----------- | ------------------------- |
| `E_NETWORK`   | Falha de rede            | N/A         | Verificar conexão, retry  |
| `E_TIMEOUT`   | Timeout (>15s)           | 408         | Retry com backoff         |
| `E_AUTH`      | Não autorizado           | 401, 403    | Redirecionar para login   |
| `E_NOT_FOUND` | Recurso não encontrado   | 404         | Informar usuário          |
| `E_SERVER`    | Erro interno do servidor | 500+        | Mostrar mensagem genérica |
| `E_UNKNOWN`   | Erro desconhecido        | N/A         | Log + contatar suporte    |

### Estrutura do ApiError

```typescript
interface ApiError extends Error {
  code: string; // Código do catálogo (E_*)
  status?: number; // Status HTTP
  details?: unknown; // Informações adicionais
  message: string; // Mensagem amigável
}
```

---

## Endpoints de IA

### 1. Gerar Dica de Perfil

**Status**: 🟢 Implementado (stub com fallback Gemini)

**Endpoint**: `POST /api/generate-tip`

**Descrição**: Gera dica personalizada para melhorar o perfil do usuário.

**Request Body**:

```json
{
  "user": {
    "name": "João Silva",
    "email": "joao@email.com",
    "type": "prestador",
    "profileImage": "https://...",
    "bio": "Eletricista com 10 anos...",
    "verificationStatus": "verificado",
    "completedJobs": 15,
    "rating": 4.8
  }
}
```

**Response (Sucesso)**:

```json
{
  "tip": "Complete seu perfil adicionando uma foto profissional de alta qualidade."
}
```

**Response (Fallback - Gemini indisponível)**:

```json
{
  "tip": "Dica padrão: Adicione mais informações sobre sua experiência."
}
```

**Códigos de Erro**:

- `E_NETWORK`: Falha ao conectar com backend
- `E_TIMEOUT`: Timeout na geração (>15s)
- `E_SERVER`: Erro interno do Gemini

**Comportamento de Fallback**:

- Se Gemini não estiver configurado: retorna dica genérica
- Se erro na API: retorna dica baseada em regras simples
- Em testes (VITEST): retorna mock determinístico

---

### 2. Melhorar Perfil

**Status**: 🟢 Implementado (stub com fallback Gemini)

**Endpoint**: `POST /api/enhance-profile`

**Descrição**: Melhora headline e bio do perfil usando IA.

**Request Body**:

```json
{
  "profile": {
    "name": "João Silva",
    "headline": "Eletricista",
    "bio": "Faço instalações elétricas"
  }
}
```

**Response (Sucesso)**:

```json
{
  "suggestedHeadline": "Eletricista Profissional | 10+ Anos | Certificado NR10",
  "suggestedBio": "Especialista em instalações residenciais e comerciais..."
}
```

**Response (Fallback)**:

```json
{
  "suggestedHeadline": "Profissional Especializado em [categoria]",
  "suggestedBio": "Bio melhorada baseada em boas práticas..."
}
```

**Códigos de Erro**:

- `E_NETWORK`, `E_TIMEOUT`, `E_SERVER`

---

### 3. Gerar Email de Indicação

**Status**: 🟢 Implementado (stub com fallback Gemini)

**Endpoint**: `POST /api/generate-referral`

**Descrição**: Gera email personalizado para indicar a plataforma.

**Request Body**:

```json
{
  "senderName": "João Silva",
  "friendEmail": "amigo@email.com"
}
```

**Response (Sucesso)**:

```json
{
  "subject": "João recomenda: Encontre profissionais qualificados na Servio",
  "body": "Olá!\n\nEu sou João Silva e uso a Servio para..."
}
```

**Códigos de Erro**:

- `E_NETWORK`, `E_TIMEOUT`, `E_SERVER`

---

### 4. Enriquecer Pedido de Serviço

**Status**: 🟢 Implementado com fallback heurístico robusto

**Endpoint**: `POST /api/enhance-job`

**Descrição**: Analisa texto livre e extrai categoria, tipo de serviço e descrição melhorada.

**Request Body**:

```json
{
  "prompt": "preciso consertar uma tomada que não funciona",
  "address": "Rua ABC, 123 - São Paulo",
  "fileCount": 1
}
```

**Response (Sucesso - IA)**:

```json
{
  "enhancedDescription": "Conserto de tomada sem energia elétrica em ambiente residencial...",
  "suggestedCategory": "eletricista",
  "suggestedServiceType": "tabelado"
}
```

**Response (Fallback Heurístico)**:

```json
{
  "enhancedDescription": "preciso consertar uma tomada que não funciona",
  "suggestedCategory": "eletricista",
  "suggestedServiceType": "personalizado"
}
```

**Heurística de Fallback**:

- Detecta palavras-chave para categorizar:
  - `eletric`, `luz`, `tomada`, `fio` → `eletricista`
  - `encan`, `torneira`, `vazamento` → `encanador`
  - `pintura`, `parede` → `pintura`
  - `telhado`, `goteira` → `reparos`
  - `computador`, `notebook` → `ti`
  - `design`, `logo` → `design`
- Detecta tipo de serviço:
  - `diagnostico`, `avaliar`, `inspecionar` → `diagnostico`
  - `simples`, `trocar`, `instalar` → `tabelado`
  - Padrão → `personalizado`

**Códigos de Erro**:

- `E_NETWORK`, `E_TIMEOUT` (com fallback automático)

**Console Warning**:

```
[enhanceJobRequest] Fallback heuristic used due to AI backend error: [erro]
```

---

### 5. Matching de Prestadores

**Status**: 🟢 Implementado (stub com fallback básico)

**Endpoint**: `POST /api/match-providers`

**Descrição**: Encontra os melhores prestadores para um job usando IA.

**Request Body**:

```json
{
  "job": {
    "id": "job-123",
    "category": "eletricista",
    "description": "Instalação de tomadas...",
    "address": "Rua ABC, 123"
  },
  "allUsers": [...],
  "allJobs": [...]
}
```

**Response (Sucesso)**:

```json
[
  {
    "provider": {
      /* User object */
    },
    "score": 0.92,
    "reason": "Especialista em instalações elétricas residenciais, 50+ jobs concluídos na região"
  },
  {
    "provider": {
      /* User object */
    },
    "score": 0.85,
    "reason": "Eletricista certificado, alta avaliação (4.9/5)"
  }
]
```

**Response (Fallback)**:

```json
[
  {
    "provider": {
      /* User object */
    },
    "score": 0.7,
    "reason": "Prestador disponível"
  }
]
```

**Códigos de Erro**:

- `E_NETWORK`, `E_TIMEOUT` (com fallback para prestadores verificados)

---

### 6. Gerar Mensagem de Proposta

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/generate-proposal`

**Descrição**: Gera mensagem personalizada para envio de proposta.

**Request Body**:

```json
{
  "job": {
    "category": "eletricista",
    "description": "Instalação de tomadas..."
  },
  "provider": {
    "name": "João Silva",
    "specialties": ["Instalações Residenciais"]
  }
}
```

**Response**:

```json
{
  "message": "Olá! Sou João Silva, eletricista especializado em instalações residenciais..."
}
```

---

### 7. Gerar FAQ do Serviço

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/generate-faq`

**Descrição**: Gera perguntas e respostas frequentes sobre um job.

**Request Body**:

```json
{
  "job": {
    "category": "eletricista",
    "description": "Instalação de tomadas...",
    "serviceType": "tabelado"
  }
}
```

**Response**:

```json
[
  {
    "question": "Quanto tempo leva a instalação?",
    "answer": "Geralmente entre 1-2 horas, dependendo da complexidade."
  },
  {
    "question": "Preciso fornecer algum material?",
    "answer": "Não, o prestador traz todos os materiais necessários."
  }
]
```

---

### 8. Identificar Item por Imagem

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/identify-item`

**Descrição**: Identifica item a partir de imagem para manutenção preventiva.

**Request Body**:

```json
{
  "base64Image": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg"
}
```

**Response**:

```json
{
  "name": "Geladeira Frost Free",
  "category": "Eletrodoméstico",
  "maintenanceSchedule": "A cada 6 meses",
  "estimatedLifespan": "10-15 anos"
}
```

---

### 9. Gerar Conteúdo SEO

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/generate-seo`

**Descrição**: Gera meta description e keywords para perfil do prestador.

**Request Body**:

```json
{
  "user": {
    "name": "João Silva",
    "specialties": ["Instalações", "Reparos"],
    "city": "São Paulo"
  },
  "reviews": [...]
}
```

**Response**:

```json
{
  "metaDescription": "João Silva - Eletricista em São Paulo | 50+ serviços | Avaliação 4.9",
  "keywords": ["eletricista são paulo", "instalação elétrica", "reparo tomada"]
}
```

---

### 10. Resumir Avaliações

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/summarize-reviews`

**Descrição**: Cria resumo das avaliações de um prestador.

**Request Body**:

```json
{
  "providerName": "João Silva",
  "reviews": [
    { "rating": 5, "comment": "Excelente profissional..." },
    { "rating": 4, "comment": "Bom trabalho..." }
  ]
}
```

**Response**:

```json
{
  "summary": "João Silva é altamente recomendado pelos clientes, com destaque para pontualidade e qualidade técnica."
}
```

---

### 11. Gerar Comentário de Avaliação

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/generate-comment`

**Descrição**: Sugere comentário baseado na nota e categoria.

**Request Body**:

```json
{
  "rating": 5,
  "category": "eletricista",
  "description": "Instalação de tomadas"
}
```

**Response**:

```json
{
  "comment": "Excelente profissional! Trabalho impecável e pontual."
}
```

---

### 12. Gerar Conteúdo de Landing Page

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/generate-category-page`

**Descrição**: Gera conteúdo SEO para página de categoria.

**Request Body**:

```json
{
  "category": "eletricista",
  "location": "São Paulo"
}
```

**Response**:

```json
{
  "title": "Eletricistas em São Paulo - Contrate Profissionais Qualificados",
  "description": "Encontre os melhores eletricistas em São Paulo...",
  "content": "# Eletricistas em São Paulo\n\n..."
}
```

---

### 13. Sugerir Manutenção

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/suggest-maintenance`

**Descrição**: Analisa item e sugere manutenção preventiva.

**Request Body**:

```json
{
  "item": {
    "name": "Ar Condicionado",
    "category": "Eletrodoméstico",
    "lastMaintenance": "2024-06-01",
    "usageFrequency": "Diário"
  }
}
```

**Response**:

```json
{
  "suggestion": "Limpeza de filtros recomendada",
  "urgency": "média",
  "estimatedCost": 80,
  "description": "Seu ar condicionado está sem manutenção há 5 meses..."
}
```

---

### 14. Propor Horário via Chat

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/propose-schedule`

**Descrição**: Analisa conversa e sugere horário de agendamento.

**Request Body**:

```json
{
  "messages": [
    { "sender": "cliente", "text": "Posso na terça de manhã" },
    { "sender": "prestador", "text": "Tenho disponibilidade às 9h" }
  ]
}
```

**Response**:

```json
{
  "date": "2024-11-19",
  "time": "09:00",
  "duration": 120
}
```

---

### 15. Assistência em Chat

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/get-chat-assistance`

**Descrição**: Sugere respostas inteligentes durante conversa.

**Request Body**:

```json
{
  "messages": [...],
  "currentUserType": "prestador"
}
```

**Response**:

```json
{
  "suggestion": "Sugira um horário específico para facilitar o agendamento"
}
```

---

### 16. Interpretar Busca Natural

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/parse-search`

**Descrição**: Converte busca em linguagem natural para filtros estruturados.

**Request Body**:

```json
{
  "query": "eletricista barato perto de mim urgente"
}
```

**Response**:

```json
{
  "category": "eletricista",
  "urgency": "alta",
  "priceRange": "economico",
  "location": "nearby"
}
```

---

### 17. Extrair Informações de Documento

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/extract-document`

**Descrição**: Extrai dados estruturados de documentos (fotos de orçamentos, etc).

**Request Body**:

```json
{
  "base64Image": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg"
}
```

**Response**:

```json
{
  "type": "Orçamento",
  "extractedData": {
    "total": 450.0,
    "items": ["Instalação tomada", "Material elétrico"],
    "date": "2024-11-13"
  }
}
```

---

### 18. Mediar Disputa

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/mediate-dispute`

**Descrição**: Analisa mensagens de disputa e sugere resolução.

**Request Body**:

```json
{
  "messages": [
    { "sender": "cliente", "text": "O serviço não foi concluído..." },
    { "sender": "prestador", "text": "Faltou material que o cliente..." }
  ],
  "clientName": "Maria Santos",
  "providerName": "João Silva"
}
```

**Response**:

```json
{
  "summary": "Disputa sobre material faltante e conclusão do serviço",
  "analysis": "Ambas as partes têm pontos válidos...",
  "suggestion": "Recomendamos acordo: prestador conclui serviço com desconto de 20%"
}
```

---

### 19. Analisar Comportamento Suspeito

**Status**: 🟢 Implementado (stub)

**Endpoint**: `POST /api/analyze-fraud`

**Descrição**: Detecta padrões suspeitos em comportamento de usuário.

**Request Body**:

```json
{
  "provider": {
    "email": "prestador@email.com",
    "completedJobs": 2,
    "rating": 5.0,
    "memberSince": "2024-11-10"
  },
  "context": {
    "type": "proposal",
    "data": {
      "price": 5000,
      "responseTime": 30
    }
  }
}
```

**Response**:

```json
{
  "isSuspicious": true,
  "riskScore": 0.75,
  "reason": "Conta nova (3 dias) com preço muito alto (5000) e rating perfeito suspeito"
}
```

**Response (Nenhum risco)**:

```json
{
  "isSuspicious": false,
  "riskScore": 0.1,
  "reason": "Comportamento normal"
}
```

---

## Endpoints de Stripe

### 1. Criar Conta Connect

**Status**: 🟢 Implementado (stub quando Stripe não configurado)

**Endpoint**: `POST /api/stripe/create-connect-account`

**Descrição**: Cria conta Stripe Connect para prestador receber pagamentos.

**Request Body**:

```json
{
  "userId": "usuario@email.com"
}
```

**Response (Stripe configurado)**:

```json
{
  "accountId": "acct_1234567890"
}
```

**Response (Stub - Stripe não configurado)**:

```json
{
  "accountId": "acct_stub_1699999999"
}
```

**Códigos de Erro**:

- `E_AUTH`: Token Stripe inválido
- `E_SERVER`: Erro ao criar conta
- `E_NETWORK`: Falha ao conectar com Stripe

**Nota**: Quando Stripe não está configurado (sem `STRIPE_SECRET_KEY`), retorna ID stub para permitir desenvolvimento local.

---

### 2. Criar Link de Onboarding

**Status**: 🟢 Implementado (stub quando Stripe não configurado)

**Endpoint**: `POST /api/stripe/create-account-link`

**Descrição**: Gera link para prestador completar onboarding Stripe.

**Request Body**:

```json
{
  "userId": "usuario@email.com"
}
```

**Response (Stripe configurado)**:

```json
{
  "url": "https://connect.stripe.com/setup/s/..."
}
```

**Response (Stub)**:

```json
{
  "url": "https://mock.stripe.com/onboarding-link"
}
```

---

### 3. Criar Sessão de Checkout

**Status**: 🟢 Implementado

**Endpoint**: `POST /create-checkout-session`

**Descrição**: Cria sessão Stripe Checkout para pagamento de serviço.

**Request Body**:

```json
{
  "job": {
    "id": "job-123",
    "description": "Instalação elétrica",
    "clientId": "cliente@email.com",
    "providerId": "prestador@email.com"
  },
  "amount": 250.0
}
```

**Response**:

```json
{
  "id": "cs_test_1234567890"
}
```

---

### 4. Liberar Pagamento

**Status**: 🟢 Implementado

**Endpoint**: `POST /jobs/:jobId/release-payment`

**Descrição**: Libera pagamento retido para prestador após conclusão do serviço.

**Request Body**: Nenhum (jobId na URL)

**Response**:

```json
{
  "success": true,
  "message": "Pagamento liberado com sucesso"
}
```

---

## Endpoints de Usuários

### 1. Listar Todos os Usuários

**Status**: 🟢 Implementado

**Endpoint**: `GET /users`

**Response**:

```json
[
  {
    "email": "usuario@email.com",
    "name": "João Silva",
    "type": "prestador",
    "verificationStatus": "verificado",
    "memberSince": "2024-01-01",
    ...
  }
]
```

---

### 2. Listar Prestadores Verificados

**Status**: 🟢 Implementado

**Endpoint**: `GET /users?type=prestador&verificationStatus=verificado`

**Response**: Array de usuários prestadores verificados

---

### 3. Buscar Usuário por ID

**Status**: 🟢 Implementado

**Endpoint**: `GET /users/:userId`

**Response**:

```json
{
  "email": "usuario@email.com",
  "name": "João Silva",
  ...
}
```

**Códigos de Erro**:

- `E_NOT_FOUND`: Usuário não existe

---

### 4. Criar Usuário

**Status**: 🟢 Implementado

**Endpoint**: `POST /users`

**Request Body**:

```json
{
  "email": "novo@email.com",
  "name": "Novo Usuário",
  "type": "cliente",
  "phone": "+55 11 99999-9999"
}
```

**Response**:

```json
{
  "email": "novo@email.com",
  "memberSince": "2024-11-13T23:20:00Z",
  ...
}
```

---

### 5. Atualizar Usuário

**Status**: 🟢 Implementado

**Endpoint**: `PUT /users/:userId`

**Request Body**: Campos parciais para atualizar

**Response**: Usuário atualizado

---

## Endpoints de Jobs

### 1. Listar Jobs

**Status**: 🟢 Implementado

**Endpoint**: `GET /jobs`

**Query Params**:

- `clientId`: Filtrar por cliente
- `providerId`: Filtrar por prestador
- `status`: Filtrar por status (ativo, em_leilao, agendado, etc)

---

### 2. Buscar Job por ID

**Status**: 🟢 Implementado

**Endpoint**: `GET /jobs/:jobId`

**Códigos de Erro**:

- `E_NOT_FOUND`: Job não existe

---

### 3. Criar Job

**Status**: 🟢 Implementado

**Endpoint**: `POST /jobs`

**Request Body**:

```json
{
  "clientId": "cliente@email.com",
  "description": "Instalação de tomadas",
  "category": "eletricista",
  "serviceType": "tabelado",
  "urgency": "normal",
  "address": "Rua ABC, 123",
  "fixedPrice": 150,
  "jobMode": "normal"
}
```

**Response**:

```json
{
  "id": "job-1699999999",
  "status": "ativo",
  "createdAt": "2024-11-13T23:20:00Z",
  ...
}
```

---

### 4. Atualizar Job

**Status**: 🟢 Implementado

**Endpoint**: `PUT /jobs/:jobId`

**Request Body**: Campos parciais para atualizar

---

## Endpoints de Propostas

### 1. Listar Propostas

**Status**: 🟢 Implementado

**Endpoint**: `GET /proposals`

**Query Params**:

- `providerId`: Filtrar por prestador

---

### 2. Criar Proposta

**Status**: 🟢 Implementado

**Endpoint**: `POST /proposals`

**Request Body**:

```json
{
  "jobId": "job-123",
  "providerId": "prestador@email.com",
  "price": 250.0,
  "description": "Proposta para instalação elétrica...",
  "estimatedDuration": "2-3 horas"
}
```

**Response**:

```json
{
  "id": "prop-1699999999",
  "status": "pendente",
  "createdAt": "2024-11-13T23:20:00Z",
  ...
}
```

**Códigos de Erro**:

- `E_SERVER`: Validações (preço mínimo R$ 50, descrição obrigatória, duplicata)

---

### 3. Atualizar Proposta

**Status**: 🟢 Implementado

**Endpoint**: `PUT /proposals/:proposalId`

---

## Comportamento de Fallback

### Ordem de Precedência

1. **IA Gemini Disponível**: Usa modelo generativo
2. **Gemini Indisponível**: Usa heurísticas inteligentes
3. **Erro de Rede**: Retry automático (1x, delay 300ms)
4. **Erro Persistente**: Retorna fallback genérico

### Fallbacks Implementados

| Endpoint               | Fallback                            |
| ---------------------- | ----------------------------------- |
| `/api/enhance-job`     | Heurística robusta (palavras-chave) |
| `/api/match-providers` | Prestadores verificados básicos     |
| `/api/generate-tip`    | Dica genérica ou mock (em testes)   |
| `/api/enhance-profile` | Template de boas práticas           |
| Stripe endpoints       | Stubs com IDs mock                  |

### Console Warnings

Quando fallback é usado:

```
[enhanceJobRequest] Fallback heuristic used due to AI backend error: [erro]
AI matching failed, using basic local matching
```

---

## Configuração do Backend

### Variáveis de Ambiente

```bash
# Obrigatórias
PORT=5000
NODE_ENV=development

# Opcionais (ativam funcionalidades)
GEMINI_API_KEY=AIza...           # Habilita IA generativa
STRIPE_SECRET_KEY=sk_test_...    # Habilita pagamentos reais
FIREBASE_PROJECT_ID=servio-ai    # Habilita Firestore

# Frontend
VITE_API_BASE_URL=http://localhost:5000
VITE_DEBUG=true                   # Ativa console.warn em dev
```

### Modo de Desenvolvimento

Quando variáveis opcionais não estão configuradas:

- ✅ Endpoints respondem com stubs
- ✅ Fallbacks heurísticos ativos
- ✅ Aplicação funciona totalmente offline
- ✅ Testes não dependem de serviços externos

---

## Exemplos de Uso

### JavaScript/TypeScript (Frontend)

```typescript
import { ApiError, apiCall } from './services/api';

try {
  const result = await apiCall<{ tip: string }>('/api/generate-tip', {
    method: 'POST',
    body: JSON.stringify({ user }),
  });

  console.log(result.tip);
} catch (error) {
  const apiError = error as ApiError;

  switch (apiError.code) {
    case 'E_NETWORK':
      showToast('Verifique sua conexão com a internet');
      break;
    case 'E_TIMEOUT':
      showToast('Operação demorou muito. Tente novamente');
      break;
    case 'E_AUTH':
      redirectToLogin();
      break;
    default:
      showToast(apiError.message);
  }
}
```

### cURL (Testing)

```bash
# Testar endpoint de dica
curl -X POST http://localhost:5000/api/generate-tip \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "João Silva",
      "email": "joao@email.com",
      "type": "prestador"
    }
  }'

# Testar enhance-job
curl -X POST http://localhost:5000/api/enhance-job \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "preciso consertar tomada",
    "address": "São Paulo"
  }'
```

---

## Logs e Monitoramento

### Console Logs (Desenvolvimento)

Com `VITE_DEBUG=true`:

```
[api] Service initialized { BACKEND_URL: 'http://localhost:5000', USE_MOCK: false }
[api] mock users
[api] Timeout on /api/generate-tip ApiError { code: 'E_TIMEOUT', ... }
[enhanceJobRequest] Fallback heuristic used due to AI backend error: ...
```

### Produção

- Logs estruturados enviados para Cloud Logging
- Alertas configurados para:
  - Taxa de erro > 5%
  - Latência p95 > 2s
  - Fallback usage > 50%

---

## Roadmap de Implementação

### ✅ Fase 1 - Stubs (Completo)

- [x] Todos endpoints retornam JSON válido
- [x] Fallbacks implementados
- [x] Tratamento de erros estruturado

### 🔄 Fase 2 - Gemini Real (Em Progresso)

- [x] `GEMINI_API_KEY` suportado
- [ ] Prompt engineering otimizado
- [ ] Rate limiting
- [ ] Caching de respostas

### 📋 Fase 3 - Produção

- [ ] Autenticação obrigatória
- [ ] Rate limiting por usuário
- [ ] Logging estruturado
- [ ] Métricas de uso
- [ ] Webhooks Stripe reais

---

## Suporte

Para dúvidas ou problemas:

- **Documentação**: `README.md`, `DOCUMENTO_MESTRE_SERVIO_AI.md`
- **Issues**: Reportar no repositório GitHub
- **Testes**: Consultar `tests/api.*.test.ts` para exemplos

---

**Última Atualização**: 13/11/2025 23:20  
**Autor**: Sistema Servio.AI  
**Versão**: 1.0.0
