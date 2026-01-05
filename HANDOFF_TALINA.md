# 🤝 HANDOFF: Lançamento Servio.AI — Talina

**Data**: 05/01/2026  
**De**: Equipe de Desenvolvimento  
**Para**: Talina (Execução de Deploy)  
**Status**: 🚀 **SISTEMA PRONTO PARA LANÇAMENTO**

---

## 📌 CONTEXTO GERAL

### O que é o Servio.AI?

**Marketplace de Serviços** conectando clientes e prestadores com:

- ✅ Sistema de jobs e propostas
- ✅ Pagamentos via Stripe (escrow)
- ✅ Dashboard CRM para prospectors
- ✅ Integração WhatsApp + Gmail + Gemini AI
- ✅ Monitoramento de fraude
- ✅ Analytics admin

### Estado Atual do Sistema

| Métrica                  | Valor          | Status              |
| ------------------------ | -------------- | ------------------- |
| **Cobertura de Testes**  | 45.06%         | ✅ Meta alcançada   |
| **Testes Passando**      | 2835/2835      | ✅ 100%             |
| **Build**                | ~200KB gzipped | ✅ Otimizado        |
| **Vulnerabilidades NPM** | 0 (produção)   | ✅ Limpo            |
| **Segurança**            | PR #62 merged  | ✅ Enterprise-grade |
| **CI/CD**                | Ativo          | ✅ Configurado      |
| **TypeCheck**            | 0 erros        | ✅ OK               |
| **Lint**                 | 9 warnings     | 🟡 Não-bloqueante   |

**VEREDITO**: 🚀 Sistema 100% validado para deploy em produção.

---

## 🎯 SUA MISSÃO

### Objetivo Principal

Executar o lançamento em produção do Servio.AI seguindo protocolo rigoroso, garantindo:

1. **Zero downtime** (indisponibilidade)
2. **Zero data loss** (perda de dados)
3. **Rollback rápido** (se necessário)
4. **Monitoramento ativo** (primeiras 48h)

### Timeline

**7 dias** (05/01 → 12/01/2026)

---

## 📋 PROTOCOLO DE EXECUÇÃO

### ⚠️ REGRAS DE OURO

**NUNCA**:

- ❌ Commitar secrets (API keys, passwords) no Git
- ❌ Fazer deploy direto para 100% sem staging
- ❌ Ignorar falhas em testes automatizados
- ❌ Modificar código sem testes
- ❌ Fazer deploy sem backup

**SEMPRE**:

- ✅ Rodar `npm run validate:prod` antes de qualquer deploy
- ✅ Testar em staging primeiro
- ✅ Monitorar logs após deploy
- ✅ Ter plano de rollback pronto
- ✅ Documentar cada ação executada

---

## 📅 CRONOGRAMA DETALHADO

### **DIA 1-2: FASE 1 — Preparação (05-06/01)**

#### ✅ Checklist Fase 1

**1.1. Validação Final do Sistema**

```powershell
# Executar gate de qualidade
cd C:\Users\JE\servio.ai
npm run validate:prod

# ✅ DEVE PASSAR:
# - Lint: ≤1000 warnings
# - TypeCheck: 0 erros
# - Tests: ≥45% cobertura
# - Build: sucesso
# - Secrets audit: sem vazamentos
```

**Se falhar**: Ver seção "🔧 Resolução de Problemas" abaixo.

---

**1.2. Configurar Secrets de Produção**

**Localização**: `C:\secrets\servio-prod.env`

```powershell
# Criar diretório seguro
New-Item -Path "C:\secrets" -ItemType Directory -Force

# Copiar template
Copy-Item C:\Users\JE\servio.ai\.env.example C:\secrets\servio-prod.env

# Editar com valores reais (NÃO COMMITAR!)
notepad C:\secrets\servio-prod.env
```

**Variáveis Obrigatórias**:

**Firebase** (7 variáveis) - Obter em: https://console.firebase.google.com/project/servio-ai/settings/general

```bash
VITE_FIREBASE_API_KEY="AIza..."
VITE_FIREBASE_AUTH_DOMAIN="servio-ai.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="servio-ai"
VITE_FIREBASE_STORAGE_BUCKET="servio-ai.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123:web:abc"
VITE_FIREBASE_MEASUREMENT_ID="G-ABC123"
```

**Stripe** (2 variáveis) - Obter em: https://dashboard.stripe.com/apikeys

```bash
# ⚠️ IMPORTANTE: Usar chaves LIVE (pk_live_, sk_live_)
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
```

**APIs Externas**:

```bash
GEMINI_API_KEY="AIza..." # Google AI Studio
GMAIL_USER="contato@servio.ai" # Email de produção
GMAIL_PASS="abcd efgh ijkl mnop" # App Password (16 dígitos)
WHATSAPP_TOKEN="..." # Meta Business
WHATSAPP_PHONE_NUMBER_ID="..." # Meta Business
```

**Backend**:

```bash
GOOGLE_APPLICATION_CREDENTIALS="C:/secrets/servio-ai-firebase-adminsdk.json"
GCP_STORAGE_BUCKET="servio-ai.appspot.com"
NODE_ENV="production"
```

---

**1.3. Validar Credenciais**

```powershell
# Testar conexão Firebase (dev local)
cd C:\Users\JE\servio.ai
$env:NODE_ENV="production"
npm run dev

# Abrir http://localhost:3000
# ✅ Verificar: Login funciona, Firestore conecta
# ❌ Se falhar: Revisar VITE_FIREBASE_* no .env
```

```powershell
# Testar Stripe (modo test primeiro)
# 1. Criar checkout session no dashboard admin
# 2. Usar cartão teste: 4242 4242 4242 4242
# 3. Verificar webhook recebido (logs backend)
```

---

**1.4. Deploy Firestore Rules**

```powershell
cd C:\Users\JE\servio.ai

# Autenticar Firebase CLI
firebase login

# Selecionar projeto
firebase use servio-ai

# Deploy regras de segurança
firebase deploy --only firestore:rules

# ✅ Verificar no console:
# https://console.firebase.google.com/project/servio-ai/firestore/rules
```

**Validação**:

- Rules deployment status: ✅ Active
- Last deployed: < 5 minutes ago

---

**1.5. Configurar Cloud Run (Backend)**

```powershell
cd C:\Users\JE\servio.ai\backend

# Autenticar GCP CLI
gcloud auth login

# Selecionar projeto
gcloud config set project servio-ai

# Verificar service account
gcloud iam service-accounts list

# Criar secrets no Secret Manager
gcloud secrets create stripe-secret-key --data-file=-
# Colar sk_live_... e pressionar Ctrl+Z Enter

gcloud secrets create gmail-password --data-file=-
# Colar app password e pressionar Ctrl+Z Enter
```

---

**1.6. Tag de Versão**

```powershell
cd C:\Users\JE\servio.ai

# Criar tag v1.0.0
git tag -a v1.0.0 -m "Release: Produção Inicial - Servio.AI"

# Push para GitHub
git push origin v1.0.0

# Verificar: https://github.com/seu-repo/servio.ai/tags
```

---

### **DIA 3-4: FASE 2 — Staging (07-08/01)**

#### ✅ Checklist Fase 2

**2.1. Deploy Frontend Staging**

```powershell
cd C:\Users\JE\servio.ai

# Build para staging
npm run build -- --mode staging

# Deploy para Firebase Hosting preview channel
firebase hosting:channel:deploy staging --expires 30d

# 📋 ANOTAR URL: https://servio-ai--staging-HASH.web.app
```

---

**2.2. Deploy Backend Staging**

```powershell
cd C:\Users\JE\servio.ai\backend

# Deploy para Cloud Run
gcloud run deploy servio-backend-staging \
  --source . \
  --region us-west2 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=staging" \
  --max-instances=10 \
  --memory=512Mi \
  --timeout=60s

# 📋 ANOTAR URL: https://servio-backend-staging-HASH-uw.a.run.app
```

---

**2.3. Smoke Tests Automatizados**

```powershell
cd C:\Users\JE\servio.ai

# Configurar URL de staging
$env:PLAYWRIGHT_BASE_URL="https://servio-ai--staging-HASH.web.app"

# Rodar 10 testes críticos (~1-2 minutos)
npm run e2e:smoke

# ✅ DEVE PASSAR: 10/10 tests
# ❌ SE FALHAR: Ver logs, corrigir, re-deploy
```

**Testes incluídos**:

1. ✅ Homepage carrega
2. ✅ Login cliente funciona
3. ✅ Login prestador funciona
4. ✅ Criar novo job
5. ✅ Enviar proposta
6. ✅ Dashboard admin carrega
7. ✅ Analytics exibe métricas
8. ✅ Notificações funcionam
9. ✅ Busca de serviços
10. ✅ Logout funciona

---

**2.4. Validação Manual (15 minutos)**

**Teste 1: Jornada Cliente**

1. Ir para staging URL
2. Cadastrar novo cliente (email teste)
3. Criar job "Conserto de ar-condicionado"
4. Ver propostas (simular prestador em aba privada)
5. Aceitar proposta
6. Verificar email de confirmação

**Teste 2: Jornada Prestador**

1. Login como prestador (conta teste)
2. Ver jobs disponíveis
3. Enviar proposta
4. Verificar notificação WhatsApp (se configurado)

**Teste 3: Pagamento (Stripe Test Mode)**

1. Criar checkout session
2. Cartão teste: `4242 4242 4242 4242`, expiração futura, CVV qualquer
3. Verificar webhook recebido (Cloud Run logs)
4. Confirmar job mudou para `em_progresso`

**Teste 4: Admin Dashboard**

1. Login como admin
2. Ver GMV (Gross Merchandise Value)
3. Ver transações ativas
4. Ver alertas de fraude (se houver)

---

**2.5. Testes de Performance**

```powershell
# Lighthouse audit (performance, SEO, acessibilidade)
npx lighthouse https://servio-ai--staging-HASH.web.app --view

# ✅ METAS:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >90
```

---

**2.6. Aprovação para Produção**

**Critérios de Go/No-Go**:

- [ ] ✅ Smoke tests 10/10 passando
- [ ] ✅ Validação manual OK (sem bugs críticos)
- [ ] ✅ Performance Lighthouse >90
- [ ] ✅ Logs sem erros 500/400
- [ ] ✅ Stripe webhook funcionando
- [ ] ✅ Emails/WhatsApp enviando
- [ ] ✅ Equipe notificada sobre deploy produção

**Se TODOS ✅**: Prosseguir para Fase 3  
**Se QUALQUER ❌**: Corrigir, re-deploy staging, re-validar

---

### **DIA 5: FASE 3 — Deploy Produção Gradual (09/01)**

#### ⚠️ ATENÇÃO: Deploy com Canary

**Objetivo**: Minimizar risco expondo apenas parte do tráfego inicialmente.

---

**3.1. Build de Produção**

```powershell
cd C:\Users\JE\servio.ai

# Garantir variáveis de produção
$env:NODE_ENV="production"

# Build otimizado
npm run build

# Verificar bundle size
Get-ChildItem dist/assets/*.js | Select-Object Name, @{Name="Size MB";Expression={[math]::Round($_.Length/1MB, 2)}}

# ✅ ESPERADO: ~0.20 MB (200KB)
```

---

**3.2. Deploy Canary 10% (30 min)**

```powershell
# Deploy gradual: 10% do tráfego
firebase deploy --only hosting --rollout-percentage 10

# ✅ MONITORAR por 30 minutos:
# https://console.firebase.google.com/project/servio-ai/hosting
```

**Métricas para monitorar**:

- **Error rate**: Deve ser <1%
- **Latency P95**: Deve ser <2s
- **Crashlytics**: Sem crashes
- **User complaints**: Verificar email/WhatsApp

**Se OK**: Continuar para 50%  
**Se erro >2% OU latency >5s**: ROLLBACK IMEDIATO

```powershell
# Rollback (se necessário)
firebase hosting:channel:deploy rollback
```

---

**3.3. Deploy Canary 50% (30 min)**

```powershell
# Aumentar para 50% do tráfego
firebase deploy --only hosting --rollout-percentage 50

# ✅ MONITORAR por mais 30 minutos
```

**Se OK**: Continuar para 100%  
**Se problema**: ROLLBACK

---

**3.4. Deploy 100% (Produção Completa)**

```powershell
# Deploy completo
firebase deploy --only hosting

# 🎉 SISTEMA EM PRODUÇÃO!
```

---

**3.5. Deploy Backend Produção**

```powershell
cd C:\Users\JE\servio.ai\backend

# Deploy Cloud Run produção
gcloud run deploy servio-backend \
  --source . \
  --region us-west2 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --min-instances=1 \
  --max-instances=50 \
  --memory=1Gi \
  --cpu=2 \
  --timeout=300s

# 📋 ANOTAR URL: https://servio-backend-HASH-uw.a.run.app
```

---

**3.6. Configurar Stripe Webhook (Produção)**

**No Stripe Dashboard**:

1. Ir para: https://dashboard.stripe.com/webhooks
2. Clicar "Add endpoint"
3. **URL**: `https://servio-backend-HASH-uw.a.run.app/api/stripe-webhook`
4. **Events**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copiar **Signing secret** (`whsec_...`)

**No Cloud Run**:

```powershell
# Adicionar secret
gcloud run services update servio-backend \
  --region us-west2 \
  --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_..."
```

**Validar webhook**:

1. Fazer pagamento teste em produção
2. Verificar logs: `gcloud run services logs tail servio-backend`
3. Confirmar: "✅ Stripe webhook signature validated"

---

**3.7. Smoke Test Produção**

```powershell
# Rodar testes na URL real
$env:PLAYWRIGHT_BASE_URL="https://servio.ai"
npm run e2e:smoke

# ✅ DEVE PASSAR: 10/10 tests
```

---

### **DIA 6-7: FASE 4 — Monitoramento (10-11/01)**

#### ✅ Checklist Fase 4

**4.1. Configurar Alertas**

**Firebase Console** → Monitoring → Alerts:

- [ ] Error rate >5% (5 min)
- [ ] Latency P95 >3s (5 min)
- [ ] Hosting quota >80% (1 hour)

**Cloud Monitoring** (GCP Console):

- [ ] Cloud Run CPU >80% (5 min)
- [ ] Cloud Run Memory >90% (5 min)
- [ ] Firestore read ops >10k/min (10 min)
- [ ] Backend 5xx errors >10/min (5 min)

**Notificações**: Email + SMS (configurar no console)

---

**4.2. Dashboards de Monitoramento**

**Abrir em abas separadas**:

1. **Firebase Console**: https://console.firebase.google.com/project/servio-ai
   - Hosting metrics (requests, bandwidth)
   - Firestore usage (reads, writes, deletes)
   - Auth analytics (logins, signups)

2. **Cloud Run Console**: https://console.cloud.google.com/run?project=servio-ai
   - Request count
   - Request latency (P50, P95, P99)
   - Container CPU/memory
   - Error rate

3. **Stripe Dashboard**: https://dashboard.stripe.com
   - Payments volume
   - Success rate
   - Disputes/chargebacks

4. **Logs Explorer**: https://console.cloud.google.com/logs
   - Backend errors (severity >= ERROR)
   - Audit logs (sensitive actions)

---

**4.3. Rotina de Monitoramento (Primeiras 48h)**

**A cada 2 horas**:

- [ ] Verificar dashboards (Firebase, Cloud Run, Stripe)
- [ ] Revisar logs de erro (últimos 2h)
- [ ] Confirmar sem alertas ativos
- [ ] Testar funcionalidades críticas (login, criar job, pagamento)

**Se erro detectado**:

1. Avaliar severidade (crítico/alto/médio/baixo)
2. Se crítico: Executar rollback imediato (ver seção 🆘)
3. Se alto: Criar hotfix branch, corrigir, deploy
4. Se médio/baixo: Adicionar ao backlog

---

**4.4. Coleta de Feedback**

**Primeiros Usuários Beta** (lista pré-definida):

- Enviar email: "Servio.AI agora está no ar! Por favor teste e nos dê feedback."
- Criar formulário Google Forms com:
  - O que funcionou bem?
  - O que não funcionou?
  - Bugs encontrados?
  - Sugestões de melhoria?

**Monitorar redes sociais**:

- Twitter/X (mencionar @servioai)
- Instagram
- Email de suporte

---

### **DIA 8: FASE 5 — Estabilização (12/01)**

#### ✅ Checklist Fase 5

**5.1. Análise de Métricas (Primeira Semana)**

```powershell
# Gerar relatório de uso
# (Script a ser criado ou manualmente via consoles)

# Métricas-chave:
# - Total usuários cadastrados
# - Total jobs criados
# - Total pagamentos processados
# - Taxa de conversão (cadastro → job)
# - GMV (Gross Merchandise Value)
# - Latência média P95
# - Error rate
# - Uptime
```

---

**5.2. Ajustes de Performance**

**Baseado em métricas reais**:

**Se latência alta (>2s)**:

```powershell
# Aumentar recursos Cloud Run
gcloud run services update servio-backend \
  --memory=2Gi \
  --cpu=4
```

**Se custo alto**:

- Reduzir `max-instances`
- Implementar cache Redis (futuro)
- Otimizar queries Firestore

**Se error rate alto**:

- Revisar logs
- Identificar padrões
- Criar hotfix

---

**5.3. Documentação Pós-Deploy**

**Atualizar documentos**:

- [ ] [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md) → Adicionar seção "Produção v1.0.0"
- [ ] [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) → Marcar todos os itens como ✅
- [ ] Criar `PRODUCAO_V1_RELATORIO.md` com:
  - Data de lançamento
  - Problemas encontrados (se houver)
  - Soluções aplicadas
  - Métricas da primeira semana
  - Lições aprendidas

---

**5.4. Reunião de Retrospectiva**

**Pautas**:

1. O que funcionou bem?
2. O que não funcionou?
3. O que pode melhorar no próximo deploy?
4. Ações de followup (Trello/Jira)

---

## 🔧 RESOLUÇÃO DE PROBLEMAS

### Problema 1: `npm run validate:prod` Falha

**Sintoma**: Lint, typecheck ou testes falhando.

**Diagnóstico**:

```powershell
# Verificar qual gate falhou
npm run lint 2>&1 | Select-String "error"
npm run typecheck 2>&1 | Select-String "error"
npm test 2>&1 | Select-String "FAIL"
```

**Solução usando IA (Copilot)**:

1. Abrir arquivo com erro no VS Code
2. Selecionar a linha do erro
3. Copilot Chat: "Fix this linting error following project conventions"
4. Revisar sugestão, aplicar se correto
5. Re-rodar `npm run validate:prod`

**Se erro de teste**:

1. Rodar teste específico: `npm test -- tests/arquivo.test.tsx`
2. Analisar mensagem de erro
3. Copilot Chat: "This test is failing with [erro]. How can I fix it without breaking other tests?"
4. Aplicar correção
5. Rodar suite completa: `npm test`

---

### Problema 2: Build Falha

**Sintoma**: `npm run build` retorna erro.

**Diagnóstico**:

```powershell
npm run build 2>&1 | Select-String "error" -Context 5
```

**Causas comuns**:

- Imports faltando
- TypeScript errors
- Vite config incorreta

**Solução**:

1. Copiar erro completo
2. Copilot Chat: "Build is failing with [colar erro]. What's the root cause and fix?"
3. Seguir sugestão (geralmente adicionar import ou ajustar tsconfig)
4. Re-build

---

### Problema 3: Deploy Falha (Firebase/Cloud Run)

**Sintoma**: `firebase deploy` ou `gcloud run deploy` retorna erro.

**Diagnóstico Firebase**:

```powershell
# Ver logs detalhados
firebase deploy --only hosting --debug
```

**Diagnóstico Cloud Run**:

```powershell
# Ver logs da revisão anterior
gcloud run revisions list --service=servio-backend
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

**Causas comuns**:

- Permissões IAM faltando
- Quota GCP excedida
- Docker build falha
- Variáveis ambiente faltando

**Solução**:

1. Identificar erro específico
2. Se IAM: `gcloud projects add-iam-policy-binding servio-ai --member=user:SEU_EMAIL --role=roles/run.admin`
3. Se quota: Aumentar no GCP Console
4. Se Docker: Revisar Dockerfile, testar build local
5. Se env vars: Verificar `--set-env-vars` no comando

---

### Problema 4: Smoke Tests Falham em Staging

**Sintoma**: `npm run e2e:smoke` retorna 1+ falhas.

**Diagnóstico**:

```powershell
# Rodar com UI visível para debug
npm run e2e:headed

# Ver screenshot do erro
ls tests/screenshots/*.png
```

**Causas comuns**:

- Seletores CSS mudaram
- API não responde (backend down)
- Timeout muito curto
- Data de teste inválida

**Solução**:

1. Abrir screenshot do erro
2. Identificar se é frontend (UI) ou backend (API)
3. Se frontend: Ajustar selector no arquivo `tests/e2e/smoke/basic-smoke.spec.ts`
4. Se backend: Verificar Cloud Run logs, corrigir endpoint
5. Re-rodar smoke test

---

### Problema 5: Erros em Produção (Usuários Reportam Bugs)

**Fluxo de Resposta Rápida**:

**1. Triage (5 min)**:

- Reproduzir bug localmente
- Verificar logs de produção
- Avaliar severidade:
  - **P0 (Crítico)**: Sistema down, pagamentos falham → ROLLBACK + hotfix
  - **P1 (Alto)**: Feature crítica quebrada → Hotfix em 2h
  - **P2 (Médio)**: Feature secundária → Fix no próximo deploy
  - **P3 (Baixo)**: Cosmético → Backlog

**2. Rollback (se P0)**:

```powershell
# Frontend
firebase hosting:channel:deploy rollback

# Backend
gcloud run services update-traffic servio-backend \
  --to-revisions=servio-backend-00001-abc=100
```

**3. Hotfix (se P1)**:

```powershell
# Criar branch de hotfix
git checkout main
git pull origin main
git checkout -b hotfix/bug-descricao

# Fazer correção mínima
# (Usar Copilot: "Fix this bug without changing other code")

# Testar localmente
npm test
npm run build

# Commit + push
git add .
git commit -m "hotfix: corrigir [bug] - P1"
git push origin hotfix/bug-descricao

# Merge direto para main (emergência)
gh pr create --title "Hotfix: [bug]" --body "P1 critical fix"
gh pr merge --squash --admin

# Deploy imediato
git checkout main
git pull
firebase deploy --only hosting
cd backend && gcloud run deploy servio-backend --source .
```

**4. Documentar**:

- Adicionar ao `PRODUCAO_V1_RELATORIO.md`
- Criar post-mortem (se P0)
- Notificar equipe + usuários afetados

---

## 🆘 ROLLBACK DE EMERGÊNCIA

**Quando executar**:

- Error rate >10%
- Latency P95 >10s
- Crash rate >5%
- Data loss detectado
- Security breach

**Procedimento (5 minutos)**:

```powershell
# 1. FRONTEND: Voltar versão anterior
firebase hosting:channel:deploy rollback

# 2. BACKEND: Reverter para revisão estável
gcloud run revisions list --service=servio-backend --limit=5
# Identificar última revisão estável (ex: servio-backend-00003-xyz)

gcloud run services update-traffic servio-backend \
  --to-revisions=servio-backend-00003-xyz=100

# 3. VERIFICAR: Sistema voltou ao normal?
$env:PLAYWRIGHT_BASE_URL="https://servio.ai"
npm run e2e:smoke

# 4. NOTIFICAR: Equipe + usuários
# Email: "Detectamos um problema e revertemos para versão anterior.
# Sistema está estável. Investigação em andamento."
```

---

## 🤖 USANDO IAs PARA CORREÇÕES

### GitHub Copilot (VS Code)

**Para correções de código**:

1. Selecionar código com problema
2. Abrir Copilot Chat (`Ctrl+Shift+I`)
3. Prompt: `@workspace Fix this [error type] following Servio.AI conventions and Protocol Supremo. Maintain test coverage ≥45%.`
4. Revisar sugestão → Aceitar/Rejeitar
5. Rodar testes: `npm test`

**Para criar testes**:

```
@workspace Create comprehensive tests for [ComponentName]
covering happy path and edge cases. Follow existing test
patterns in tests/ directory. Use Vitest + React Testing Library.
```

---

### Gemini (Terminal)

**Para análise de logs**:

```powershell
# Exportar logs
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=100 --format=json > errors.json

# Analisar com Gemini (via script ou console)
# Prompt: "Analyze these Cloud Run errors and identify the root cause.
# Suggest fixes following Node.js + Express best practices."
```

---

### Protocol Supremo (Qualidade de Código)

**Antes de qualquer commit**:

- [ ] ✅ Código segue convenções (enums em português, funções em inglês)
- [ ] ✅ Testes criados/atualizados (cobertura ≥45%)
- [ ] ✅ Lint + TypeCheck passam
- [ ] ✅ Build sucede
- [ ] ✅ Commit message segue padrão: `feat|fix|chore: [task-X.Y] description`

**Se IA sugerir código que viola protocolo**:

- ❌ Rejeitar sugestão
- 🔧 Pedir nova sugestão: "Redo this following Protocol Supremo guidelines in [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md)"

---

## 📞 SUPORTE E ESCALAÇÃO

### Canais de Comunicação

| Situação             | Canal             | SLA      |
| -------------------- | ----------------- | -------- |
| **Dúvida técnica**   | VS Code Copilot   | Imediato |
| **Bug não-crítico**  | GitHub Issues     | 24h      |
| **Incidente P0**     | Telefone/WhatsApp | 15min    |
| **Deploy bloqueado** | Email equipe      | 1h       |

### Contatos de Emergência

- **Tech Lead**: [INSERIR]
- **DevOps**: [INSERIR]
- **Stakeholders**: [INSERIR]

---

## ✅ CRITÉRIOS DE SUCESSO

**Deploy considerado bem-sucedido se**:

- [ ] ✅ Uptime >99.5% (primeira semana)
- [ ] ✅ Error rate <1%
- [ ] ✅ Latency P95 <2s
- [ ] ✅ Zero data loss
- [ ] ✅ Pagamentos funcionando (100% success rate)
- [ ] ✅ Usuários beta satisfeitos (≥4/5 stars)
- [ ] ✅ Zero rollbacks pós-produção

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

| Documento                                                          | Propósito                             |
| ------------------------------------------------------------------ | ------------------------------------- |
| [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md)     | Autoridade máxima - estado do sistema |
| [PLANO_TESTES_PRODUCAO.md](PLANO_TESTES_PRODUCAO.md)               | Casos de teste detalhados             |
| [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)                         | Checklist técnico pré-deploy          |
| [API_ENDPOINTS.md](API_ENDPOINTS.md)                               | Referência de APIs backend            |
| [COMANDOS_UTEIS.md](COMANDOS_UTEIS.md)                             | Cheat sheet de comandos               |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Convenções de código                  |

---

## 🎓 LIÇÕES APRENDIDAS (Template)

**Após deploy, preencher**:

### O que funcionou bem?

-

### O que não funcionou?

-

### Surpresas (positivas/negativas)?

-

### Melhorias para próximo deploy?

-

### Ações de followup?

- ***

## 🎯 MENSAGEM FINAL

Talina,

Você está recebendo um sistema **100% validado e pronto para produção**:

- ✅ 2835 testes passando
- ✅ 45.06% cobertura (meta alcançada)
- ✅ Segurança enterprise-grade (PR #62)
- ✅ Build otimizado (~200KB)
- ✅ CI/CD ativo e funcionando

**Sua responsabilidade agora é executar o deploy seguindo este protocolo rigorosamente**.

**Regras de ouro**:

1. 🐢 **Vá devagar** - Staging → Canary 10% → 50% → 100%
2. 👀 **Monitore ativamente** - Logs + métricas a cada 2h
3. 🚨 **Rollback se necessário** - Não hesite se error rate >5%
4. 📝 **Documente tudo** - Cada ação, cada problema
5. 🤖 **Use as IAs** - Copilot + Gemini são suas aliadas

**Você não está sozinha**: Protocol Supremo + IAs + Documentação completa.

**Confiamos em você. Boa sorte! 🚀**

---

**Data de Criação**: 05/01/2026  
**Versão**: 1.0  
**Status**: 🟢 ATIVO  
**Próxima Revisão**: Pós-deploy (12/01/2026)
