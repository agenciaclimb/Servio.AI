# 🧪 PLANO DE TESTES PRODUÇÃO — Servio.AI

**Data**: 05/01/2026  
**Responsável**: Talina  
**Objetivo**: Validar 100% das funcionalidades críticas antes e após deploy em produção  
**Status**: 🟢 ATIVO

---

## 📋 ÍNDICE

1. [Estratégia de Testes](#estratégia-de-testes)
2. [Casos de Teste Críticos](#casos-de-teste-críticos)
3. [Testes Automatizados](#testes-automatizados)
4. [Testes Manuais](#testes-manuais)
5. [Protocolo de Correção de Erros](#protocolo-de-correção-de-erros)
6. [Usando IAs para Debugging](#usando-ias-para-debugging)
7. [Matriz de Severidade](#matriz-de-severidade)

---

## 🎯 ESTRATÉGIA DE TESTES

### Pirâmide de Testes

```
           /\
          /  \        E2E (10 smoke tests)
         /____\       - Jornadas críticas
        /      \      - User flows completos
       /        \
      /__________\    Integration (261 tests)
     /            \   - Components + Services
    /              \  - API calls + Firebase
   /________________\ Unit (2574 tests)
                      - Funções isoladas
                      - Lógica de negócio
```

**Total**: 2835 testes (45.06% cobertura)

### Gates de Qualidade

| Gate             | Comando                | Critério de Sucesso      |
| ---------------- | ---------------------- | ------------------------ |
| **Unit**         | `npm test`             | ≥45% cobertura, 0 falhas |
| **Lint**         | `npm run lint`         | ≤1000 warnings, 0 errors |
| **TypeCheck**    | `npm run typecheck`    | 0 erros TypeScript       |
| **Build**        | `npm run build`        | Sucesso, bundle <250KB   |
| **E2E Smoke**    | `npm run e2e:smoke`    | 10/10 passando           |
| **E2E Critical** | `npm run e2e:critical` | 100% passando            |

---

## 🔥 CASOS DE TESTE CRÍTICOS

### CT-001: Cadastro de Cliente

**Pré-requisitos**: Nenhum  
**Dados de Teste**:

- Email: `cliente.teste+001@servio.ai`
- Nome: `João Silva`
- Telefone: `+55 11 98765-4321`

**Passos**:

1. Acessar homepage → Clicar "Cadastrar"
2. Selecionar "Sou Cliente"
3. Preencher formulário
4. Aceitar termos de uso
5. Clicar "Criar Conta"
6. Verificar email de confirmação

**Resultado Esperado**:

- ✅ Conta criada com sucesso
- ✅ Email de boas-vindas recebido (Gmail)
- ✅ Redirect para dashboard cliente
- ✅ Firestore: Documento criado em `users/[email]`

**Critérios de Aceitação**:

- Tempo de resposta <2s
- Sem erros 400/500 nos logs
- Custom claim `role: 'cliente'` no JWT token

---

### CT-002: Login Cliente

**Pré-requisitos**: Conta criada (CT-001)  
**Dados de Teste**:

- Email: `cliente.teste+001@servio.ai`
- Senha: (definida em CT-001)

**Passos**:

1. Acessar homepage → "Entrar"
2. Preencher email/senha
3. Clicar "Entrar"

**Resultado Esperado**:

- ✅ Login bem-sucedido
- ✅ Redirect para `/dashboard/cliente`
- ✅ Nome exibido no header: "João Silva"
- ✅ Firebase Auth token válido

**Critérios de Aceitação**:

- Tempo <1s
- Token JWT contém `email` e `role: 'cliente'`

---

### CT-003: Criar Job (Cliente)

**Pré-requisitos**: Login como cliente (CT-002)  
**Dados de Teste**:

```json
{
  "titulo": "Conserto de Ar-Condicionado",
  "descricao": "Split 12000 BTUs não está gelando. Preciso de técnico urgente.",
  "categoria": "Manutenção e Reparos",
  "orcamento": 300.0,
  "prazo": "2026-01-10"
}
```

**Passos**:

1. Dashboard cliente → "Novo Job"
2. Preencher formulário
3. Upload foto (opcional): `ar-condicionado.jpg`
4. Clicar "Publicar Job"

**Resultado Esperado**:

- ✅ Job criado com status `'aberto'`
- ✅ ID gerado (formato: `JOB-20260105-ABC123`)
- ✅ Firestore: Documento em `jobs/[jobId]`
- ✅ Notificação para prestadores da categoria

**Critérios de Aceitação**:

- Job visível em "Meus Jobs"
- `clientId` = email do usuário logado
- Campo `createdAt` com timestamp correto

---

### CT-004: Enviar Proposta (Prestador)

**Pré-requisitos**:

- Conta prestador criada
- Job disponível (CT-003)

**Dados de Teste**:

```json
{
  "jobId": "JOB-20260105-ABC123",
  "valorProposto": 280.0,
  "prazoEstimado": "3 dias",
  "descricao": "Tenho 10 anos de experiência. Posso ir amanhã avaliar."
}
```

**Passos**:

1. Login como prestador
2. Dashboard → "Jobs Disponíveis"
3. Clicar no job "Conserto de Ar-Condicionado"
4. Clicar "Enviar Proposta"
5. Preencher formulário
6. Clicar "Enviar"

**Resultado Esperado**:

- ✅ Proposta criada com status `'pendente'`
- ✅ Firestore: Documento em `proposals/[proposalId]`
- ✅ Notificação para cliente (email + in-app)
- ✅ Proposta aparece na lista do job

**Critérios de Aceitação**:

- `providerId` = email do prestador
- `jobId` = ID do job correto
- Cliente vê proposta em tempo real (listener Firestore)

---

### CT-005: Aceitar Proposta e Pagamento

**Pré-requisitos**:

- Proposta enviada (CT-004)
- Cliente logado

**Dados de Teste**:

- Proposta: `PROP-20260105-XYZ789`
- Cartão teste Stripe: `4242 4242 4242 4242`

**Passos**:

1. Dashboard cliente → "Meus Jobs" → Abrir job
2. Ver propostas recebidas
3. Clicar "Aceitar" na proposta do prestador
4. Redirect para Stripe Checkout
5. Preencher dados:
   - Cartão: `4242 4242 4242 4242`
   - Expiração: `12/28`
   - CVV: `123`
6. Clicar "Pay"
7. Aguardar redirect de volta

**Resultado Esperado**:

- ✅ Pagamento processado (Stripe `payment_intent.succeeded`)
- ✅ Job status: `'aberto'` → `'em_progresso'`
- ✅ Proposta status: `'pendente'` → `'aceita'`
- ✅ Escrow criado em Firestore: `escrow/[jobId]`
- ✅ Webhook recebido pelo backend (log: "Stripe webhook signature validated")
- ✅ Email para cliente: "Pagamento confirmado"
- ✅ Email para prestador: "Você foi selecionado!"

**Critérios de Aceitação**:

- Transação visível em Stripe Dashboard
- Valor em escrow = valor da proposta aceita
- Outras propostas marcadas como `'rejeitada'`

---

### CT-006: Concluir Job e Liberar Pagamento

**Pré-requisitos**:

- Job em andamento (CT-005)
- Prestador logado

**Passos**:

1. Dashboard prestador → "Meus Jobs Ativos"
2. Clicar no job em progresso
3. Clicar "Marcar como Concluído"
4. Upload foto do resultado (opcional)
5. Confirmar conclusão
6. (Sistema notifica cliente)
7. Cliente confirma recebimento
8. Sistema libera pagamento

**Resultado Esperado**:

- ✅ Job status: `'em_progresso'` → `'concluido'`
- ✅ Escrow status: `'held'` → `'released'`
- ✅ Stripe payout para conta Connect do prestador
- ✅ Plataforma retém 15% de comissão
- ✅ Email para prestador: "Pagamento liberado"

**Critérios de Aceitação**:

- `completedAt` timestamp registrado
- Prestador recebe 85% do valor
- Plataforma recebe 15%

---

### CT-007: Dashboard Admin — Métricas

**Pré-requisitos**: Login como admin

**Passos**:

1. Login como admin
2. Acessar `/dashboard/admin`
3. Ver seção "Métricas Gerais"

**Resultado Esperado**:

- ✅ GMV (Gross Merchandise Value) exibido
- ✅ Total de jobs (abertos, em progresso, concluídos)
- ✅ Total de usuários (clientes, prestadores)
- ✅ Receita da plataforma (15% das transações)
- ✅ Gráficos de tendência (últimos 30 dias)

**Critérios de Aceitação**:

- Cálculos corretos (validar manualmente via Firestore query)
- Gráficos renderizando (Chart.js)
- Tempo de carregamento <3s

---

### CT-008: Alertas de Fraude

**Pré-requisitos**:

- Admin logado
- Alerta de fraude criado (pode ser mock)

**Dados de Teste**:

```json
{
  "alertId": "FRAUD-20260105-001",
  "providerId": "prestador.suspeito@example.com",
  "riskScore": 92,
  "reason": "Múltiplos jobs cancelados (5 em 7 dias)"
}
```

**Passos**:

1. Dashboard admin → "Alertas de Fraude"
2. Ver lista de alertas
3. Clicar no alerta `FRAUD-20260105-001`
4. Ver detalhes (histórico do prestador)
5. Ações: "Revisar" ou "Suspender Conta"

**Resultado Esperado**:

- ✅ Alerta exibido com badge de severidade (vermelho se >85%)
- ✅ Histórico do usuário carregado
- ✅ Botões de ação funcionais

**Critérios de Aceitação**:

- Status pode mudar: `'novo'` → `'revisado'` → `'resolvido'`
- Ações registradas em `audit_logs` collection

---

### CT-009: Prospector CRM — Lead Management

**Pré-requisitos**: Login como prospector

**Dados de Teste**:

```json
{
  "leadName": "Maria Oliveira",
  "company": "Construtora ABC",
  "email": "maria@construtorabc.com",
  "phone": "+55 11 99999-8888",
  "stage": "new",
  "temperature": "hot"
}
```

**Passos**:

1. Login como prospector
2. Dashboard → "Novo Lead"
3. Preencher formulário
4. Clicar "Salvar Lead"
5. Ver lead na lista
6. Mover stage: `'new'` → `'contacted'` → `'negotiating'`
7. Usar AI Action Card: "Sugerir próxima ação"
8. Ver sugestão (ex: "Enviar proposta comercial")

**Resultado Esperado**:

- ✅ Lead criado em Firestore: `crm_leads/[leadId]`
- ✅ Stage transitions funcionando (drag-and-drop)
- ✅ AI suggestions exibidas (via Gemini)
- ✅ Follow-up automático agendado (Gmail service)

**Critérios de Aceitação**:

- Lead visível apenas para o prospector dono
- Timestamps de stage changes registrados
- AI suggestions relevantes (validar manualmente)

---

### CT-010: WhatsApp Business — Notificação

**Pré-requisitos**:

- WhatsApp Business API configurada
- Job criado (CT-003)
- Prestador com telefone cadastrado

**Dados de Teste**:

- Prestador telefone: `+55 11 98765-4321`
- Job: "Conserto de Ar-Condicionado"

**Passos**:

1. Job publicado (trigger automático)
2. Backend chama `whatsappService.sendTemplateMessage()`
3. Prestador recebe mensagem WhatsApp

**Mensagem Esperada**:

```
🔔 Novo Job Disponível!

Categoria: Manutenção e Reparos
Título: Conserto de Ar-Condicionado
Orçamento: R$ 300,00

Ver detalhes: https://servio.ai/jobs/JOB-20260105-ABC123
```

**Resultado Esperado**:

- ✅ Mensagem enviada (status 200 da Meta API)
- ✅ Log em backend: "WhatsApp sent to +5511987654321"
- ✅ Mensagem recebida no dispositivo do prestador

**Critérios de Aceitação**:

- Latência <5s entre job criado e mensagem enviada
- Template aprovado pela Meta (pre-requisito)

---

## 🤖 TESTES AUTOMATIZADOS

### Smoke Tests (10 testes, ~1-2 min)

**Comando**: `npm run e2e:smoke`

**Cobertura**:

1. ✅ Homepage carrega (<2s)
2. ✅ Login cliente funciona
3. ✅ Login prestador funciona
4. ✅ Criar job (cliente)
5. ✅ Enviar proposta (prestador)
6. ✅ Dashboard admin carrega
7. ✅ Analytics exibe métricas
8. ✅ Notificações in-app funcionam
9. ✅ Busca de serviços
10. ✅ Logout funciona

**Quando executar**:

- ✅ Pré-deploy staging
- ✅ Pós-deploy produção (10%, 50%, 100%)
- ✅ Após hotfix
- ✅ Antes de PR merge

---

### Critical Path Tests (~10 min)

**Comando**: `npm run e2e:critical`

**Cobertura**: Jornadas completas (20+ testes)

- Cadastro → Login → Criar Job → Proposta → Pagamento → Conclusão
- Admin flow: Login → Ver métricas → Alertas → Exportar relatório
- Prospector flow: Login → Criar lead → AI suggestions → Follow-up

**Quando executar**:

- ✅ Antes de deploy produção (obrigatório)
- ✅ Após mudanças críticas em auth/payments
- ✅ Regressão testing (semanal)

---

### Unit + Integration Tests (2835 testes, ~30s)

**Comando**: `npm test`

**Cobertura**: 45.06%

- Components (AIActionCard, AdminFinancials, AdminFraudAlerts, etc.)
- Services (messagingService, authService, jobService, etc.)
- Utils (formatters, validators, helpers)
- Hooks (useAuth, useJobs, useNotifications)

**Quando executar**:

- ✅ A cada commit (pre-commit hook)
- ✅ Antes de PR (CI automático)
- ✅ Localmente durante desenvolvimento

---

## 👨‍💻 TESTES MANUAIS

### Checklist Pré-Deploy Staging

**Validação Visual** (15 min):

- [ ] Todas as páginas carregam sem erro 404
- [ ] Imagens/ícones renderizando corretamente
- [ ] Responsive design OK (mobile, tablet, desktop)
- [ ] Sem erros no console do browser (`F12`)
- [ ] Botões/links funcionais
- [ ] Formulários validando inputs

**Validação Funcional** (30 min):

- [ ] CT-001: Cadastro cliente → ✅
- [ ] CT-002: Login cliente → ✅
- [ ] CT-003: Criar job → ✅
- [ ] CT-004: Enviar proposta → ✅
- [ ] CT-005: Pagamento (Stripe test mode) → ✅
- [ ] CT-007: Dashboard admin → ✅
- [ ] CT-009: Prospector CRM → ✅

**Validação de Integração** (20 min):

- [ ] Email recebido (Gmail) → ✅
- [ ] WhatsApp recebido (se configurado) → ✅
- [ ] Webhook Stripe acionado → ✅ (ver logs Cloud Run)
- [ ] Firestore atualizado em tempo real → ✅
- [ ] AI suggestions Gemini funcionando → ✅

---

### Checklist Pós-Deploy Produção

**Validação Imediata** (5 min):

- [ ] Homepage carrega (https://servio.ai)
- [ ] Login funciona
- [ ] API responde (curl https://backend.servio.ai/health)
- [ ] Smoke tests passam: `npm run e2e:smoke`

**Validação Estendida** (30 min):

- [ ] Criar conta real (seu email)
- [ ] Criar job real
- [ ] Processar pagamento teste (Stripe test mode se disponível)
- [ ] Ver transação no Stripe Dashboard
- [ ] Verificar logs sem erros 500

---

## 🔧 PROTOCOLO DE CORREÇÃO DE ERROS

### Fluxo de Debugging

```
┌─────────────────┐
│  Erro Detectado │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   1. TRIAGE     │ ← Avaliar severidade (P0/P1/P2/P3)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. REPRODUZIR   │ ← Local, staging ou produção?
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. INVESTIGAR   │ ← Logs, stack trace, Firestore state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. CORRIGIR    │ ← Code fix (usar IA se necessário)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. TESTAR      │ ← npm test + smoke tests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. DEPLOY      │ ← Hotfix branch → PR → Merge → Deploy
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. VALIDAR      │ ← Confirmar fix em produção
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 8. DOCUMENTAR   │ ← Post-mortem (se P0/P1)
└─────────────────┘
```

---

### Passo 1: Triage (5 min)

**Perguntas-chave**:

1. Quantos usuários afetados?
2. Funcionalidade crítica? (auth, payments, jobs)
3. Data loss possível?
4. Workaround disponível?

**Classificação**:

| Prioridade | Descrição                       | Exemplo                   | SLA     |
| ---------- | ------------------------------- | ------------------------- | ------- |
| **P0** 🔴  | Sistema down, pagamentos falham | "Erro 500 ao fazer login" | 15min   |
| **P1** 🟠  | Feature crítica quebrada        | "Criar job retorna erro"  | 2h      |
| **P2** 🟡  | Feature secundária              | "Notificação não enviada" | 24h     |
| **P3** 🟢  | Cosmético, low impact           | "Botão desalinhado"       | Backlog |

**Ação por Prioridade**:

- **P0**: ROLLBACK imediato → Investigar → Hotfix → Deploy
- **P1**: Hotfix branch → Deploy em 2h
- **P2**: Issue no GitHub → Fix no próximo deploy
- **P3**: Backlog (Trello/Jira)

---

### Passo 2: Reproduzir (10 min)

**Localmente**:

```powershell
cd C:\Users\JE\servio.ai

# Rodar em dev mode
npm run dev

# Tentar reproduzir o erro
# Abrir DevTools (F12) → Console + Network tabs
```

**Em Staging**:

- Acessar URL staging
- Seguir mesmo fluxo do usuário que reportou
- Capturar screenshot/vídeo

**Em Produção**:

- ⚠️ CUIDADO: Não testar pagamentos reais
- Usar conta de teste se disponível
- Verificar logs Cloud Run:
  ```powershell
  gcloud run services logs tail servio-backend --limit=100
  ```

---

### Passo 3: Investigar (15-30 min)

**Logs Backend (Cloud Run)**:

```powershell
# Erros últimas 24h
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=50 \
  --format=json \
  --project=servio-ai

# Filtrar por endpoint específico
gcloud logging read 'resource.type=cloud_run_revision AND jsonPayload.url="/api/jobs"' \
  --limit=20
```

**Logs Frontend (Browser DevTools)**:

- Console: Erros JavaScript
- Network: Requests falhando (status 400/500)
- Application: LocalStorage/SessionStorage state

**Firestore State**:

```powershell
# Via Firebase Console
# https://console.firebase.google.com/project/servio-ai/firestore/data

# Verificar documento específico
# Collection: jobs / Document: JOB-20260105-ABC123
# Campos esperados: status, clientId, providerId, createdAt
```

**Stack Trace**:

- Identificar linha exata do erro
- Verificar se erro é consistente ou intermitente
- Checar se relacionado a mudança recente (git log)

---

### Passo 4: Corrigir (30-60 min)

#### Opção A: Correção Manual

**Identificar causa raiz**:

- Typo no código?
- Null pointer exception?
- API externa falhando (Stripe, Gemini)?
- Firestore rule bloqueando?

**Fazer fix mínimo**:

```powershell
# Criar branch de hotfix
git checkout main
git pull origin main
git checkout -b hotfix/descricao-bug

# Editar arquivo com problema
# (Usar VS Code + Copilot)

# Exemplo: Fix null check
# Antes:
const userName = user.profile.name; // ❌ Crash se profile null

# Depois:
const userName = user?.profile?.name ?? 'Usuário'; // ✅ Safe
```

**Testar localmente**:

```powershell
npm test -- path/to/affected.test.ts
npm run build
npm run dev # Validar manualmente
```

---

#### Opção B: Correção com IA (GitHub Copilot)

**Para erros TypeScript**:

1. Abrir arquivo com erro no VS Code
2. Selecionar linha com erro
3. `Ctrl+Shift+I` (Copilot Chat)
4. Prompt:
   ```
   @workspace Fix this TypeScript error following Servio.AI conventions.
   Maintain type safety and test coverage. Do not break existing functionality.
   ```
5. Revisar sugestão → Aceitar/Rejeitar
6. Rodar testes: `npm test`

**Para bugs lógicos**:

```
@workspace This function is returning incorrect results: [descrever comportamento].
Expected: [X], Got: [Y]. Fix the logic following best practices.
Ensure backward compatibility and add tests if missing.
```

**Para falhas de teste**:

```
@workspace Test "should create job successfully" is failing with error:
[colar erro completo].
Fix the test without changing production code unless necessary.
Follow existing test patterns in tests/ directory.
```

---

#### Opção C: Correção com Gemini (Terminal/Console)

**Para análise de logs complexos**:

```powershell
# Exportar logs
gcloud logging read "severity>=ERROR" --limit=100 --format=json > errors.json

# Analisar com Gemini (via Google AI Studio ou script)
# Prompt:
"""
Analyze these Cloud Run error logs from a Node.js + Express backend.
Identify:
1. Most common error
2. Root cause
3. Suggested fix (code snippet)

Logs:
[colar conteúdo errors.json]
"""
```

**Para otimização de queries Firestore**:

```
I have a slow Firestore query:
db.collection('jobs').where('status', '==', 'aberto').get()

It's timing out with 10k+ documents. Suggest:
1. Composite index needed
2. Pagination strategy
3. Query optimization
```

---

### Passo 5: Testar (10-20 min)

**Testes Unitários**:

```powershell
# Rodar todos os testes
npm test

# ✅ DEVE PASSAR: 2835/2835
# ❌ SE FALHAR: Revisar fix, não quebrou nada?
```

**Testes E2E (se feature crítica)**:

```powershell
npm run e2e:smoke

# ✅ DEVE PASSAR: 10/10
```

**Teste Manual**:

- Reproduzir cenário original do bug
- Confirmar: Bug resolvido? ✅
- Regressão: Outras features OK? ✅

---

### Passo 6: Deploy (5-15 min)

**Para P0 (Emergência)**:

```powershell
# Commit + push
git add .
git commit -m "hotfix: [descrição] - P0 critical"
git push origin hotfix/descricao-bug

# Merge direto para main (bypass protection)
gh pr create --title "Hotfix P0: [bug]" --body "Critical fix"
gh pr merge --squash --admin

# Deploy imediato
git checkout main
git pull origin main

# Frontend
firebase deploy --only hosting

# Backend
cd backend
gcloud run deploy servio-backend --source .
```

**Para P1/P2 (Normal)**:

- Criar PR no GitHub
- Aguardar CI passar (se habilitado)
- Code review (se possível)
- Merge para main
- Deploy via pipeline normal

---

### Passo 7: Validar (5-10 min)

**Pós-deploy**:

```powershell
# Smoke test produção
$env:PLAYWRIGHT_BASE_URL="https://servio.ai"
npm run e2e:smoke

# ✅ Deve passar 10/10
```

**Monitorar logs (30 min)**:

```powershell
# Tail logs em tempo real
gcloud run services logs tail servio-backend

# Verificar:
# ✅ Sem erros 500
# ✅ Requests bem-sucedidas
# ✅ Bug específico não reaparecendo
```

**Confirmar com usuário** (se reportado por beta tester):

- Email: "Corrigimos o bug [X]. Pode testar novamente?"
- Aguardar confirmação

---

### Passo 8: Documentar (10-20 min)

**Para P0/P1 → Post-Mortem Obrigatório**:

Criar `POST_MORTEM_[DATA]_[BUG].md`:

```markdown
# Post-Mortem: [Bug Description]

**Data**: 05/01/2026
**Severidade**: P0
**Duração**: 15 minutos (10:30 - 10:45)
**Impacto**: 5 usuários afetados

## O que aconteceu?

[Descrição factual do incidente]

## Causa Raiz

[Análise técnica: por que o bug ocorreu?]

## Timeline

- 10:30 - Bug detectado (alerta Slack)
- 10:32 - Rollback executado
- 10:35 - Investigação iniciada
- 10:40 - Fix aplicado
- 10:45 - Deploy hotfix concluído
- 10:50 - Validação OK

## Correção Aplicada

[Code snippet ou PR link]

## Prevenção Futura

- [ ] Adicionar teste E2E para este cenário
- [ ] Melhorar alerting (detectar mais cedo)
- [ ] Code review obrigatório para [área afetada]

## Lições Aprendidas

-
```

**Para P2/P3 → Issue no GitHub**:

- Criar issue descrevendo bug
- Label: `bug`, `priority:P2`
- Assignee: [dev responsável]
- Milestone: [próximo sprint]

---

## 🤖 USANDO IAS PARA DEBUGGING

### GitHub Copilot (Recomendado)

**Comandos Úteis**:

| Situação            | Prompt                                                           | Exemplo                                              |
| ------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| **Erro TypeScript** | `@workspace Fix TypeScript error: [erro]`                        | Error: Property 'name' does not exist on type 'User' |
| **Teste falhando**  | `@workspace Why is this test failing? [erro]`                    | Expected 200, got 404                                |
| **Bug lógico**      | `@workspace This function returns wrong result: [comportamento]` | Sum should be 10, got 5                              |
| **Otimização**      | `@workspace Optimize this Firestore query for performance`       | Slow query taking 5s                                 |
| **Criar teste**     | `@workspace Create test for [função] covering edge cases`        | Test validateEmail()                                 |

**Fluxo Recomendado**:

1. Reproduzir erro localmente
2. Abrir arquivo com problema no VS Code
3. Selecionar código relevante (função/componente)
4. Abrir Copilot Chat (`Ctrl+Shift+I`)
5. Descrever problema com contexto
6. Revisar sugestão (SEMPRE validar!)
7. Aplicar fix
8. Rodar testes

**⚠️ CUIDADOS**:

- ❌ Nunca aceitar sugestão cegamente
- ✅ Sempre rodar `npm test` após aplicar fix
- ✅ Validar se segue Protocol Supremo (enums em PT, funções em EN)
- ✅ Confirmar não quebra outras funcionalidades

---

### Gemini (Para Análises Complexas)

**Use cases**:

- Análise de múltiplos logs (100+ linhas)
- Sugestões arquiteturais
- Performance optimization
- Security review

**Exemplo: Análise de Logs**:

```powershell
# Exportar logs
gcloud logging read "severity>=ERROR" --limit=200 --format=json > errors.json

# Prompt para Gemini:
"""
Você é um engenheiro de confiabilidade de site (SRE).
Analise estes logs de erro de um backend Node.js + Express + Firestore.

Identifique:
1. Erro mais comum (com % de ocorrências)
2. Causa raiz provável
3. Fix sugerido (código Node.js)
4. Ações preventivas

Logs:
[colar conteúdo errors.json]
"""
```

---

### Protocol Supremo (Qualidade de Código)

**Antes de commitar qualquer fix**:

**Checklist Obrigatório**:

- [ ] ✅ Código segue convenções (enums PT, funções EN)
- [ ] ✅ Testes criados/atualizados
- [ ] ✅ Cobertura ≥45% mantida
- [ ] ✅ `npm run lint` passa
- [ ] ✅ `npm run typecheck` passa
- [ ] ✅ `npm test` passa (2835 tests)
- [ ] ✅ Build sucede: `npm run build`
- [ ] ✅ Commit message: `fix: [descrição] - [task]`

**Se IA sugerir código que viola protocolo**:

```
@workspace Redo this fix following Protocol Supremo guidelines in .github/copilot-instructions.md:
- Enums in Portuguese (e.g., 'aberto', 'em_progresso')
- Function names in English
- Maintain test coverage ≥45%
- Follow existing patterns in codebase
```

---

## 📊 MATRIZ DE SEVERIDADE

### Definições de Prioridade

| P0 🔴 CRÍTICO            | P1 🟠 ALTO               | P2 🟡 MÉDIO               | P3 🟢 BAIXO                 |
| ------------------------ | ------------------------ | ------------------------- | --------------------------- |
| Sistema down             | Feature crítica quebrada | Feature secundária        | Cosmético                   |
| Data loss                | Pagamentos falham        | Notificação não envia     | Texto desalinhado           |
| Security breach          | Login não funciona       | Busca lenta               | Link quebrado (não-crítico) |
| Pagamentos indisponíveis | Job não cria             | Dashboard carrega devagar | Ícone faltando              |

---

### SLA de Resposta

| Prioridade | Detection         | Response | Fix         | Communication |
| ---------- | ----------------- | -------- | ----------- | ------------- |
| **P0**     | Imediato (alerta) | 15 min   | 1-2h        | A cada 30 min |
| **P1**     | <1h               | 1h       | 4h          | Diário        |
| **P2**     | <24h              | 24h      | 3 dias      | Semanal       |
| **P3**     | Backlog           | -        | Next sprint | -             |

---

### Ações por Severidade

**P0 — ROLLBACK FIRST, FIX LATER**:

1. Executar rollback imediato (5 min)
2. Notificar stakeholders + usuários
3. Investigar causa raiz (offline)
4. Criar hotfix
5. Testar em staging
6. Deploy com monitoramento ativo
7. Post-mortem obrigatório

**P1 — HOTFIX URGENTE**:

1. Criar hotfix branch
2. Fix + testes
3. Code review rápido (se possível)
4. Deploy em 2h
5. Monitorar por 1h
6. Issue post-mortem (simples)

**P2 — FIX NORMAL**:

1. Criar issue no GitHub
2. Priorizar no próximo sprint
3. Fix + testes completos
4. Code review padrão
5. Deploy no ciclo normal

**P3 — BACKLOG**:

1. Adicionar ao Trello/Jira
2. Priorizar quando tempo disponível
3. Pode ser delegado para júnior

---

## ✅ CRITÉRIOS DE APROVAÇÃO

**Sistema considerado estável se**:

- [ ] ✅ Smoke tests passando (10/10)
- [ ] ✅ Error rate <1% (últimas 24h)
- [ ] ✅ Latency P95 <2s
- [ ] ✅ Uptime >99.5%
- [ ] ✅ Pagamentos funcionando (0 falhas)
- [ ] ✅ Nenhum bug P0/P1 aberto
- [ ] ✅ Feedback usuários positivo (≥4/5 stars)

---

## 📞 SUPORTE E ESCALAÇÃO

### Quando Escalar?

| Situação                | Escalar Para   | Canal       |
| ----------------------- | -------------- | ----------- |
| P0 não resolvido em 1h  | Tech Lead      | Telefone    |
| Deploy bloqueado        | DevOps         | Email/Slack |
| Dúvida técnica complexa | Copilot/Gemini | Chat        |
| Decisão arquitetural    | Stakeholders   | Reunião     |

---

## 📚 ANEXOS

### Anexo A: Comandos Rápidos

```powershell
# Validação completa
npm run validate:prod

# Testes específicos
npm test -- tests/components/AdminDashboard.test.tsx
npm run e2e:smoke
npm run e2e:critical

# Logs
gcloud run services logs tail servio-backend --limit=100
gcloud logging read "severity>=ERROR" --limit=50

# Deploy
firebase deploy --only hosting
cd backend && gcloud run deploy servio-backend --source .

# Rollback
firebase hosting:channel:deploy rollback
gcloud run services update-traffic servio-backend --to-revisions=REVISION=100
```

---

### Anexo B: Links Úteis

- **Firebase Console**: https://console.firebase.google.com/project/servio-ai
- **Cloud Run Console**: https://console.cloud.google.com/run?project=servio-ai
- **Stripe Dashboard**: https://dashboard.stripe.com
- **GitHub Repo**: https://github.com/seu-repo/servio.ai
- **VS Code Copilot Docs**: https://code.visualstudio.com/docs/copilot
- **Gemini AI Studio**: https://aistudio.google.com

---

**Data de Criação**: 05/01/2026  
**Versão**: 1.0  
**Status**: 🟢 ATIVO  
**Próxima Revisão**: Pós-deploy (12/01/2026)
