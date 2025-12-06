# 🚀 Guia Prático: Próxima Execução de Testes E2E

**Criado**: 6 de dezembro de 2025  
**Objetivo**: Corrigir os 37 testes falhando com ações práticas e rápidas

---

## 📊 Situação Atual

```
✅ PASSANDO:  21 testes (Smoke + Critical Flows)
❌ FALHANDO:  37 testes (Fluxos de negócio + Componentes)
⏱️ TEMPO:      2.4 minutos por execução
```

**Bom sinal**: Frontend e infraestrutura está 100% estável ✓

---

## 🎯 Ação 1: Iniciar Backend (5 minutos)

Este é o **passo bloqueador número 1**. Sem backend, 6 testes de WhatsApp falham automaticamente.

### Via PowerShell (Novo Terminal):

```powershell
# Abra NOVO terminal PowerShell
cd c:\Users\JE\servio.ai\backend
npm start

# Esperado: Você vê algo como:
# ✓ Backend iniciado
# ✓ Listening on port 8081
# ✓ Firebase initialized
```

### Validar Que Começou:

Abra outro terminal e teste:

```powershell
Invoke-WebRequest -Uri "http://localhost:8081/api/health" -Method GET

# Resposta esperada: 200 OK ou similar
```

---

## 🎯 Ação 2: Reexecutar Smoke Tests (2 minutos)

Agora que temos os 2 servidores rodando (frontend dev + backend), vamos executar:

```powershell
cd c:\Users\JE\servio.ai

# Testes básicos (devem passar 100%)
npx playwright test tests/e2e/smoke/basic-smoke.spec.ts --project=chromium

# Testes críticos
npx playwright test tests/e2e/smoke/critical-flows.spec.ts --project=chromium

# Testes WhatsApp (ANTES NÃO PASSAVA, AGORA DEVE PASSAR!)
npx playwright test tests/e2e/whatsapp/ --project=chromium
```

**Esperado**:

- ✅ Smoke tests: 10/10 ✓
- ✅ Critical flows: 8/8 ✓
- ✅ WhatsApp: 3/3 ✓ (NOS AGORA!)

---

## 🎯 Ação 3: Diagnosticar Provider Flows (5 minutos)

Provider flows está falhando porque não encontra elementos. Vamos diagnosticar:

```powershell
# Gerar screenshot do erro
npx playwright test tests/e2e/provider/provider-flows.spec.ts --project=chromium --debug

# Isso abre o Playwright Inspector
# Você vê onde está falhando e pode debugar em tempo real
```

### Possíveis Causas:

1. **Rota incorreta** → Verificar `page.goto('/provider/dashboard')`
2. **Elementos não carregam** → Adicionar `await page.waitForLoadState('networkidle')`
3. **Seletores errados** → Abrir DevTools e procurar por "jobs disponíveis"

---

## 🎯 Ação 4: Implementar Helper de Login (30 minutos)

Muitos testes faltam autenticação. Vamos criar um helper:

### Criar arquivo:

`tests/e2e/helpers/auth.ts`

```typescript
import { Page } from '@playwright/test';

export async function loginAsProvider(page: Page) {
  // Credenciais de teste
  const email = 'provider-test@example.com';
  const password = 'TestPass123!';

  // Ir para login
  await page.goto('/auth/login');

  // Preencher formulário
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|senha/i).fill(password);

  // Clicar login
  await page.getByRole('button', { name: /login|entrar/i }).click();

  // Aguardar redirecionamento
  await page.waitForURL('/prospector/**', { timeout: 10000 });
}

export async function loginAsClient(page: Page) {
  const email = 'client-test@example.com';
  const password = 'TestPass123!';

  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|senha/i).fill(password);
  await page.getByRole('button', { name: /login|entrar/i }).click();
  await page.waitForURL('/client/**', { timeout: 10000 });
}

export async function loginAsAdmin(page: Page) {
  const email = 'admin@servio.ai';
  const password = 'TestPass123!';

  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|senha/i).fill(password);
  await page.getByRole('button', { name: /login|entrar/i }).click();
  await page.waitForURL('/admin/**', { timeout: 10000 });
}
```

### Usar nos testes:

```typescript
import { loginAsProvider } from '../helpers/auth';

test('ver lista de jobs', async ({ page }) => {
  await loginAsProvider(page); // ← Nova função!
  await page.goto('/provider/dashboard');
  await expect(page.getByText(/jobs disponíveis/i)).toBeVisible();
});
```

---

## 🎯 Ação 5: Corrigir Seletores Quebrados (10 minutos)

Alguns testes têm seletores desatualizados. Vamos corrigir:

### Abrir DevTools para inspecionar:

```powershell
# Roda o teste em modo interativo
npx playwright test tests/e2e/prospector/crm-kanban.spec.ts --project=chromium --debug --headed

# Você vê o browser + inspector
# Inspeciona elementos e copia seletores corretos
```

### Padrão de Correção:

```typescript
// ❌ ANTES (não encontra)
await page.getByText('Novos Leads').first().click();

// ✅ DEPOIS (funciona)
await page.getByTestId('kanban-column-new').getByText('Novos').click();
```

---

## 📋 Checklist de Execução

### Antes:

- [ ] Terminal 1: Backend rodando (`npm start` na pasta backend)
- [ ] Terminal 2: Frontend dev (`npm run dev`)
- [ ] Terminal 3: Testes

### Executar em Ordem:

```powershell
# 1. Smoke tests (deve passar)
npx playwright test tests/e2e/smoke/ --project=chromium
# Resultado esperado: 18/18 passando ✅

# 2. WhatsApp tests (agora com backend)
npx playwright test tests/e2e/whatsapp/ --project=chromium
# Resultado esperado: 3/3 passando ✅

# 3. Provider flows (diagnosticar)
npx playwright test tests/e2e/provider/ --project=chromium --headed
# Resultado esperado: ver por que falha

# 4. Todos (visão geral)
npx playwright test tests/e2e/ --project=chromium --reporter=list
# Resultado esperado: 24+ passando (objetivo)
```

---

## 🏁 Meta

Chegar de **21/59 (35.6%)** para **30+/59 (50%+)** nos próximos testes.

**Como?** Iniciando backend e implementando helper de login (20 min de trabalho = +10 testes passando).

---

## 📝 Documentar Resultado

Após executar, atualize este arquivo com:

```markdown
## Execução de [DATA]

✅ Passando: X/59
❌ Falhando: Y/59
⏱️ Tempo: Z minutos

### Mudanças Feitas:

- [ ] Backend iniciado
- [ ] Helper de login implementado
- [ ] Seletores corrigidos
- [ ] Etc.

### Próximo:

- Implementar...
```

---

## 🆘 Se Algo Falhar

1. **Backend não inicia**: Verificar `npm install` no backend, variáveis de ambiente
2. **Testes timeout**: Aumentar timeout em `playwright.config.ts` (atualmente 30s)
3. **Seletores não funcionam**: Abrir DevTools com `--debug --headed`
4. **Auth falha**: Verificar se credenciais de teste existem no Firestore

---

**Próximo passo**: Você escolhe - quer começar com Ação 1 agora? 🚀
