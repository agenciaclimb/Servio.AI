# 🚀 Plano de Deploy para Teste e Produção - SERVIO.AI

**Data**: 1 de novembro de 2025  
**Status Atual**: Build limpo ✅ | Deploy CI/CD configurado ✅ | Backend parcialmente pronto ⚠️

---

## 📊 Resumo Executivo

### O que ESTÁ funcionando

- ✅ Frontend React com TypeScript (build passando)
- ✅ Servidor de IA (server.cjs) com 20+ endpoints Gemini funcionais
- ✅ Firebase Auth + Firestore configurado
- ✅ CI/CD com GitHub Actions → Cloud Build → Cloud Run
- ✅ Dockerfile otimizado para produção
- ✅ Preview local rodando (localhost:4173)

### O que PRECISA ser feito

- ⚠️ **Backend REST API** (backend/src/index.js) - integração incompleta
- ⚠️ **Stripe Payouts** - transferências para prestadores não implementadas
- ⚠️ **Testes E2E** - cobertura insuficiente
- ⚠️ **Configuração de Domínio** - ainda usando URLs .run.app
- ⚠️ **Monitoramento** - alertas e logging estruturado faltando

---

## 🎯 Fase 1: Deploy em Ambiente de TESTE (1-2 dias)

### Objetivo

Ter uma versão funcional em **staging/teste** onde você e beta testers podem validar os fluxos principais sem risco.

### 1.1 Completar Backend REST API ⚠️ CRÍTICO

**Arquivo**: `backend/src/index.js`

**O que falta**:

```javascript
// ❌ Endpoints que não existem mas o frontend espera:
POST /proposals                    // Criar proposta de prestador
GET  /proposals                    // Listar propostas
POST /jobs                         // Criar novo job
GET  /jobs/:jobId                  // Buscar job específico
POST /jobs/:jobId/messages         // Enviar mensagem no chat
GET  /jobs/:jobId/messages         // Buscar mensagens do chat
POST /jobs/:jobId/complete         // Cliente confirma conclusão
POST /users/:userId/earnings       // Buscar estatísticas de ganhos

// ✅ Endpoints que JÁ existem:
POST /create-checkout-session      // Pagamento Stripe (job)
POST /create-subscription-session  // Assinatura Stripe
POST /stripe-webhook               // Webhook Stripe
POST /jobs/:jobId/release-payment  // Liberar pagamento (parcial)
```

**Ação Necessária**:

1. Adicionar os endpoints faltantes em `backend/src/index.js`
2. Conectar com Firestore (já inicializado no arquivo)
3. Validar com `npm run test:backend`

**Tempo estimado**: 4-6 horas

---

### 1.2 Implementar Stripe Payouts (Transferências) 🔴 CRÍTICO

**Arquivo**: `backend/src/index.js:272` (linha com TODO)

**Situação Atual**:

```javascript
// TODO: Implement Stripe Payout/Transfer to the provider's connected account.
// This is a critical step for a real application.
// For now, we simulate the success by updating our internal state.
```

**O que precisa ser feito**:

**Opção A - Stripe Connect (RECOMENDADO para produção)**:

```javascript
// 1. Prestadores precisam criar conta Stripe Connect
// 2. Salvar stripeAccountId no perfil do prestador
// 3. Usar Stripe Transfers na liberação:

const transfer = await stripe.transfers.create({
  amount: Math.round(providerShare * 100),
  currency: "brl",
  destination: providerDoc.data().stripeAccountId,
  transfer_group: jobId,
});
```

**Opção B - Manual (TEMPORÁRIO para teste)**:

- Admin vê lista de "pagamentos pendentes"
- Admin faz Pix/transferência manual
- Admin marca como "pago" no sistema

**Para TESTE**, recomendo **Opção B** (manual).  
**Para PRODUÇÃO**, implementar **Opção A** (automático).

**Tempo estimado**:

- Opção B (manual): 2 horas
- Opção A (Connect): 8-12 horas

---

### 1.3 Conectar Frontend aos Endpoints de Backend

**Arquivos principais**:

- `src/contexts/AppContext.tsx` - Busca dados (jobs, proposals, messages)
- `src/components/*Dashboard.tsx` - Exibem dados

**Situação Atual**:

- ✅ Frontend busca dados do Firestore diretamente
- ⚠️ Algumas operações (criar job, enviar proposta) precisam passar pelo backend

**O que fazer**:

1. Criar arquivo `src/lib/api.ts` (atualmente faltando):

```typescript
const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export const api = {
  post: async (path: string, body: any) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  // ... get, put, delete
};
```

2. Ajustar componentes que usam `../lib/api` (já stubamos localmente, agora conectar de verdade)

**Tempo estimado**: 3-4 horas

---

### 1.4 Configurar Variáveis de Ambiente

**Arquivos**:

- `.env.local` (desenvolvimento local)
- GitHub Secrets (CI/CD)
- Cloud Run Environment Variables

**Checklist de Secrets**:

| Secret                  | Onde usar           | Status                  |
| ----------------------- | ------------------- | ----------------------- |
| `GEMINI_API_KEY`        | server.cjs          | ✅ Configurado          |
| `STRIPE_SECRET_KEY`     | backend             | ✅ Configurado          |
| `STRIPE_WEBHOOK_SECRET` | backend webhook     | ❌ Falta configurar     |
| `FRONTEND_URL`          | CORS + redirects    | ✅ Configurado          |
| `BACKEND_API_URL`       | Frontend → Backend  | ⚠️ Precisa validar URL  |
| `AI_API_URL`            | Backend → IA server | ⚠️ Precisa validar URL  |
| `GCP_STORAGE_BUCKET`    | Upload de mídia     | ✅ Configurado          |
| `FIREBASE_*`            | Firebase config     | ✅ No firebaseConfig.ts |

**Ação**:

1. Obter `STRIPE_WEBHOOK_SECRET` do Stripe Dashboard
2. Atualizar GitHub Secrets com o novo webhook secret
3. Validar que `BACKEND_API_URL` aponta para o Cloud Run do backend (não o do IA)

**Tempo estimado**: 30 minutos

---

### 1.5 Deploy dos 2 Serviços no Cloud Run

**Arquitetura Atual**:

```
┌─────────────────┐
│  Cloud Run #1   │  ← server.cjs (IA/Gemini)
│  servio-ai      │  ← PORT 8080
│  (atual)        │  ← Tag: v0.0.6-docker-deploy
└─────────────────┘

┌─────────────────┐
│  Cloud Run #2   │  ← backend/src/index.js (REST API)
│  servio-backend │  ← PORT 8081
│  (FALTA CRIAR)  │  ← Precisa Dockerfile próprio
└─────────────────┘
```

**O que fazer**:

#### 1.5.1 Criar Dockerfile para o Backend

```dockerfile
# backend/Dockerfile
FROM node:18-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src
ENV PORT=8081
EXPOSE 8081
CMD ["node", "src/index.js"]
```

#### 1.5.2 Criar cloudbuild-backend.yaml

```yaml
steps:
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "-t"
      - "${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/backend:${SHORT_SHA}"
      - "-f"
      - "backend/Dockerfile"
      - "."

  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "push",
        "${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/backend:${SHORT_SHA}",
      ]

  - name: "gcr.io/cloud-builders/gcloud"
    args:
      - "run"
      - "deploy"
      - "servio-backend"
      - "--image=${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_REPO}/backend:${SHORT_SHA}"
      - "--region=${_REGION}"
      - "--platform=managed"
      - "--allow-unauthenticated"
      - "--set-env-vars=STRIPE_SECRET_KEY=${_STRIPE_SECRET_KEY},FRONTEND_URL=${_FRONTEND_URL}"

substitutions:
  _REGION: us-west1
  _REPO: servio-ai
```

#### 1.5.3 Atualizar Workflow GitHub Actions

Adicionar job separado para deploy do backend em `.github/workflows/deploy-cloud-run.yml`

**Tempo estimado**: 2-3 horas

---

### 1.6 Testes Essenciais Antes de Liberar para Beta

**Fluxo Cliente**:

1. ✅ Login com Google
2. ✅ Criar job (wizard IA)
3. ⚠️ Receber propostas de prestadores
4. ⚠️ Aceitar proposta
5. ⚠️ Chat com prestador
6. ⚠️ Pagar via Stripe (modo teste)
7. ⚠️ Confirmar conclusão
8. ⚠️ Avaliar prestador

**Fluxo Prestador**:

1. ✅ Login com Google
2. ✅ Completar onboarding
3. ⚠️ Ver oportunidades no funil
4. ⚠️ Enviar proposta
5. ⚠️ Chat com cliente
6. ⚠️ Marcar "a caminho"
7. ⚠️ Receber pagamento

**Ferramentas**:

- Cypress para E2E (já configurado, mas precisa ampliar)
- Stripe Test Mode (usar cartões de teste)
- Firebase Emulators (opcional, para teste local sem gastar Firestore)

**Tempo estimado**: 4-6 horas (escrever + rodar testes)

---

### 1.7 Checklist Final para Deploy de TESTE

- [ ] Backend REST API com todos endpoints necessários
- [ ] Stripe Payouts implementado (opção manual OK para teste)
- [ ] Frontend conectado aos endpoints backend via `api.ts`
- [ ] 2 serviços Cloud Run rodando (IA + Backend)
- [ ] Variáveis de ambiente todas configuradas
- [ ] Testes E2E principais passando
- [ ] URL de teste documentada (ex: `https://test.servio-ai.web.app`)
- [ ] 3-5 usuários beta convidados para testar

**Prazo total Fase 1**: 2-3 dias úteis (se trabalhar full-time)

---

## 🎯 Fase 2: Preparar para PRODUÇÃO (3-5 dias)

### 2.1 Stripe: Trocar de Test Mode para Live Mode

**O que fazer**:

1. Stripe Dashboard → Developers → API Keys
2. Copiar **Live Secret Key** (começa com `sk_live_...`)
3. Atualizar secret `STRIPE_SECRET_KEY` no GitHub
4. Criar novo Webhook endpoint para **Live Mode**
5. Copiar **Live Webhook Secret** e atualizar `STRIPE_WEBHOOK_SECRET`

**⚠️ IMPORTANTE**:

- Antes de ativar Live, completar onboarding Stripe (informações fiscais, conta bancária)
- Configurar **Radar** (antifraude) e **Billing** (faturas)

---

### 2.2 Configurar Domínio Personalizado

**Situação Atual**: URLs `.run.app` (Cloud Run)

**Meta**:

- Frontend: `https://www.servio.ai` (ou `.app`, `.com.br`)
- Backend: `https://api.servio.ai`
- IA Server: `https://ai.servio.ai`

**Passos**:

1. Registrar domínio (se ainda não tiver)
2. Firebase Hosting → Add custom domain
3. Cloud Run → Add domain mapping para backend/IA
4. Configurar DNS (geralmente A/AAAA records)
5. Aguardar propagação (pode levar 48h)

**Tempo estimado**: 1-2 dias (considerando propagação DNS)

---

### 2.3 Implementar Monitoramento e Alertas

**Ferramentas GCP**:

1. **Cloud Monitoring** (métricas):
   - CPU, memória, requests/s dos Cloud Run
   - Latência de endpoints
   - Taxa de erro (5xx)

2. **Cloud Logging** (logs estruturados):
   - Substituir `console.log` por Winston/Pino
   - Adicionar trace IDs para rastrear requests

3. **Cloud Error Reporting** (erros em produção):
   - Capturar exceções não tratadas
   - Alertas por email/Slack

4. **Uptime Checks** (disponibilidade):
   - Ping em `/health` a cada 5min
   - Alerta se serviço cair

**Configuração Mínima**:

```javascript
// backend/src/index.js - adicionar no topo
const { Logging } = require("@google-cloud/logging");
const logging = new Logging();
const log = logging.log("servio-backend");

// Substituir console.log por:
log.info(log.entry({ message: "User action", userId, action }));
```

**Tempo estimado**: 4-6 horas

---

### 2.4 Segurança e Compliance

**Checklist**:

- [ ] **HTTPS** obrigatório em todas APIs (Cloud Run já fornece)
- [ ] **Firestore Rules** restritivas:
  ```javascript
  // firestore.rules - endurecer regras
  match /users/{userId} {
    allow read: if request.auth != null;
    allow write: if request.auth.token.email == userId;
  }
  match /jobs/{jobId} {
    allow create: if request.auth != null;
    allow update: if isOwnerOrProvider(jobId);
  }
  ```
- [ ] **Rate Limiting** nos endpoints (ex: express-rate-limit)
- [ ] **Validação de Inputs** (Joi, Zod) em todos endpoints
- [ ] **Sanitização** de dados de usuário (evitar XSS)
- [ ] **LGPD**: Política de Privacidade + Termos de Uso atualizados
- [ ] **Backup Firestore**: Agendar exports diários para Cloud Storage

**Tempo estimado**: 6-8 horas

---

### 2.5 Performance e Otimizações

**Frontend**:

- [ ] Code splitting (React.lazy para routes)
- [ ] Lazy load de imagens (react-lazyload)
- [ ] Minificar assets (Vite já faz)
- [ ] CDN para assets estáticos (Firebase Hosting já usa)

**Backend**:

- [ ] Conexão pool do Firestore (já gerenciado pelo SDK)
- [ ] Cache de queries frequentes (Redis opcional)
- [ ] Compressão gzip/brotli (Cloud Run já faz)

**Banco de Dados**:

- [ ] Índices compostos no Firestore para queries complexas
- [ ] Cleanup de dados antigos (jobs > 1 ano, notificações lidas)

**Tempo estimado**: 4-6 horas

---

### 2.6 Documentação Final

**O que criar**:

1. **README.md Executivo**:
   - Visão geral do sistema
   - Arquitetura (diagrama)
   - Como rodar localmente
   - Como fazer deploy

2. **API Documentation** (Swagger/OpenAPI):
   - Documentar todos endpoints REST
   - Exemplos de requests/responses
   - Códigos de erro

3. **Runbook** (para operações):
   - Como escalar Cloud Run
   - Como investigar erros
   - Rollback de deploy
   - Contatos de emergência

4. **Guia do Usuário**:
   - Como se cadastrar
   - Como contratar/prestar serviço
   - FAQ

**Tempo estimado**: 6-8 horas

---

### 2.7 Checklist Final para PRODUÇÃO

- [ ] Stripe em Live Mode e onboarding completo
- [ ] Domínio personalizado configurado e propagado
- [ ] Monitoramento e alertas configurados
- [ ] Firestore rules restritivas aplicadas
- [ ] Rate limiting e validações implementadas
- [ ] Backup Firestore agendado
- [ ] Política de Privacidade e Termos publicados
- [ ] Documentação completa (API + Runbook)
- [ ] Testes E2E cobrindo 80%+ dos fluxos críticos
- [ ] Load testing (simular 100+ usuários simultâneos)
- [ ] Rollback plan documentado
- [ ] Suporte ao cliente configurado (chat, email)

**Prazo total Fase 2**: 5-7 dias úteis

---

## 📅 Cronograma Sugerido

### Semana 1 - Deploy de TESTE

- **Dia 1-2**: Completar backend REST API + Stripe manual
- **Dia 3**: Conectar frontend + deploy 2 serviços Cloud Run
- **Dia 4**: Testes E2E + ajustes
- **Dia 5**: Beta teste com 3-5 usuários

### Semana 2 - Preparação para PRODUÇÃO

- **Dia 6-7**: Stripe Live + Domínio personalizado
- **Dia 8**: Monitoramento + Segurança
- **Dia 9**: Performance + Documentação
- **Dia 10**: Load testing + Ajustes finais

### Semana 3 - LANÇAMENTO

- **Dia 11**: Deploy produção
- **Dia 12-14**: Monitorar métricas + Suporte usuários iniciais
- **Dia 15**: Retrospectiva + Planejar v1.1

---

## 🚨 Riscos e Mitigações

| Risco                               | Probabilidade | Impacto | Mitigação                                    |
| ----------------------------------- | ------------- | ------- | -------------------------------------------- |
| Stripe Payouts falhar               | Média         | Alto    | Implementar opção manual + notificar admin   |
| Cloud Run exceder cota              | Baixa         | Médio   | Configurar alertas de custo + scaling limits |
| Firestore atingir limite read/write | Baixa         | Médio   | Monitorar uso + implementar cache            |
| Usuário final não saber usar        | Alta          | Médio   | Tutorial interativo + vídeos explicativos    |
| Bug crítico em produção             | Média         | Alto    | Rollback automático + testes pre-deploy      |

---

## 💰 Estimativa de Custos (Produção)

**Premissas**: 1.000 usuários ativos/mês, 500 jobs/mês

| Serviço                | Custo Mensal (USD)       | Notas                       |
| ---------------------- | ------------------------ | --------------------------- |
| Cloud Run (2 serviços) | $20-50                   | Free tier: 2M requests/mês  |
| Firestore              | $30-80                   | Depende de reads/writes     |
| Cloud Storage          | $5-15                    | Uploads de fotos            |
| Firebase Auth          | $0                       | Gratuito até 50k MAU        |
| Stripe                 | 3.99% + R$0.39/transação | Sobre cada pagamento        |
| Gemini API             | $50-150                  | 15M tokens flash grátis/mês |
| **TOTAL**              | **$100-300/mês**         | Escala conforme uso         |

**Dica**: Configurar **Budget Alerts** no GCP para evitar surpresas.

---

## 📞 Próximos Passos IMEDIATOS

### Você precisa fazer AGORA:

1. **Decidir**: Vai direto para produção ou prefere fase de teste com beta users?
   - ✅ Recomendo: **Teste primeiro** (mais seguro)

2. **Definir prioridade**: O que é bloqueador vs. pode esperar?
   - 🔴 **Crítico**: Backend REST API + Stripe Payouts
   - 🟡 **Importante**: Testes E2E + Monitoramento
   - 🟢 **Pode esperar**: Domínio personalizado + Docs extensivas

3. **Alocar tempo**: Quantas horas/dia pode dedicar?
   - **Full-time** (8h/dia): 2 semanas até produção
   - **Part-time** (4h/dia): 3-4 semanas até produção
   - **Weekends** (2h/dia): 6-8 semanas até produção

---

## 🤝 Como Posso Ajudar

Posso auxiliar em qualquer etapa:

### Backend

- ✅ Criar os endpoints REST faltantes em `backend/src/index.js`
- ✅ Implementar Stripe Payouts (opção manual ou Connect)
- ✅ Conectar frontend aos endpoints via `api.ts`

### Deploy

- ✅ Criar Dockerfile para o backend
- ✅ Configurar segundo Cloud Run service
- ✅ Atualizar workflows GitHub Actions

### Testes

- ✅ Escrever testes E2E com Cypress
- ✅ Configurar testes de carga (k6, Artillery)
- ✅ Validar fluxos críticos

### Docs

- ✅ Gerar documentação Swagger/OpenAPI
- ✅ Criar runbook operacional
- ✅ Escrever guias de usuário

---

## 📚 Recursos Úteis

- [Guia Cloud Run](https://cloud.google.com/run/docs)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)

---

**Perguntas?** Me diga qual parte você quer atacar primeiro e eu te ajudo passo a passo! 🚀
