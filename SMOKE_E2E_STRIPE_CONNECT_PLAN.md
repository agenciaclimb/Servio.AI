# 🧪 Plano Smoke E2E - Stripe Connect Onboarding

**Data**: 2025-12-13  
**Feature**: Stripe Connect Provider Onboarding (PR #31)  
**Status**: 🟡 Planejado (não executado - fase de documentação)  
**Escopo**: Validação mínima do fluxo happy-path de onboarding de prestador com Stripe Connect

---

## 📋 Objetivo

Validar que um prestador consegue completar o onboarding e conectar sua conta Stripe Connect com sucesso, habilitando a receita de pagamentos para jobs concluídos.

---

## 🔄 Fluxo Happy-Path (5 passos)

### Passo 1: Login como Prestador

```
✅ Entrada: Credenciais de teste (email: provider@test.com)
✅ Ação: Realizar login via Firebase Auth
✅ Validação: Usuário autenticado, contexto auth carregado
```

### Passo 2: Acessar Onboarding Wizard

```
✅ Entrada: Usuário logado no dashboard
✅ Ação: Clicar em "Completar Onboarding" ou navegar para /onboarding
✅ Validação: ProviderOnboardingWizard renderizado, wizard ativo
```

### Passo 3: Navegar até Step 5 (Stripe Connect)

```
✅ Entrada: Wizard em step anterior (Step 4)
✅ Ação: Clicar "Próximo" até chegar em Step 5 (Pagamentos)
✅ Validação: Step 5 exibido, botão "Conectar Stripe" visível
```

### Passo 4: Criar Conta Stripe Connect

```
✅ Entrada: Step 5 carregado, user.email disponível
✅ Ação: Clicar botão "Conectar Stripe"
✅ Backend Call: POST /api/stripe/create-connect-account
   - Payload: { userId: "provider@test.com", type: "express" }
   - Resposta esperada: { connectAccountId: "acct_xxxxx" }
✅ Validação: connectAccountId retornado, mensagem de sucesso exibida
```

### Passo 5: Gerar Account Link e Redirecionar

```
✅ Entrada: connectAccountId obtido do Passo 4
✅ Ação: Sistema gera account link automaticamente
✅ Backend Call: POST /api/stripe/create-account-link
   - Payload: { userId: "provider@test.com", accountId: "acct_xxxxx", returnUrl: "..." }
   - Resposta esperada: { url: "https://connect.stripe.com/..." }
✅ Ação 2: Redirecionar para Stripe Connect onboarding (URL retornada)
✅ Validação: Usuário redirecionado, Stripe Connect page carregada
```

---

## 🛠️ Configuração de Teste

### Credenciais Necessárias

- **Email de Teste**: `provider@test.com` (ou similar)
- **Senha**: Deve estar criada no Firebase Auth
- **Stripe Test Account**: Configurado com modo test (chaves de teste)

### Ambiente

```bash
# .env.local (frontend)
VITE_FIREBASE_API_KEY=xxx
VITE_BACKEND_API_URL=http://localhost:8081

# backend/.env
STRIPE_SECRET_KEY=sk_test_xxx
GEMINI_API_KEY=xxx
```

### Ferramentas

- **Browser**: Chrome/Edge (driver Playwright)
- **Framework**: Playwright (e2e-smoke)
- **Timeout**: 30 segundos por passo

---

## ✅ Critérios de Sucesso

| Passo | Critério                                                                                    | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------ |
| 1     | Login bem-sucedido, auth context carregado                                                  | 🔲     |
| 2     | Wizard renderizado, Step 5 acessível                                                        | 🔲     |
| 3     | Botão Stripe visível, clicável                                                              | 🔲     |
| 4     | POST /api/stripe/create-connect-account retorna 200, connectAccountId preenchido            | 🔲     |
| 5     | POST /api/stripe/create-account-link retorna 200, URL válida, redirecionamento bem-sucedido | 🔲     |

---

## 🚀 Execução (Futuro - Sprint 2)

```bash
# Comando esperado (pseudo)
npm run e2e:stripe-connect-smoke

# Alternativa via Playwright CLI
npx playwright test tests/e2e/stripe-connect-smoke.spec.ts --headed
```

### Estrutura do Arquivo de Teste (exemplo)

```typescript
// tests/e2e/stripe-connect-smoke.spec.ts
import { test, expect } from '@playwright/test';

test('Provider Stripe Connect Onboarding - Happy Path', async ({ page }) => {
  // Step 1: Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'provider@test.com');
  // ... complete auth

  // Step 2-5: Wizard navigation + Stripe Connect
  await page.goto('http://localhost:5173/onboarding');
  // ... navigate to step 5

  // Step 4: Create account
  await page.click('button:has-text("Conectar Stripe")');
  const createResponse = await page.waitForResponse(
    response =>
      response.url().includes('/api/stripe/create-connect-account') && response.status() === 200
  );

  // Step 5: Account link
  const accountLinkResponse = await page.waitForResponse(
    response =>
      response.url().includes('/api/stripe/create-account-link') && response.status() === 200
  );

  // Validate redirect
  await page.waitForURL(/connect\.stripe\.com/);
  expect(page.url()).toContain('connect.stripe.com');
});
```

---

## 📌 Notas Importantes

1. **Não Usar Cartão Real**: Teste usa Stripe test mode (`sk_test_` keys)
2. **Mock de Redirects**: Pode ser necessário mockar o redirecionamento para Stripe Connect se executado em CI
3. **Independência**: Este teste é independente de outros; não requer dados pré-existentes
4. **Frequência**: Executar antes de cada release ou após mudanças em Stripe/ProviderOnboardingWizard
5. **Logs**: Capturar URLs de request/response para diagnóstico

---

## 📊 Status de Implementação

- [x] Plano documentado
- [x] Fluxo validado manualmente (dev)
- [x] Unit tests passando (34/34)
- [x] Audit aprovado (PR #31)
- [ ] E2E smoke test escrito (planejado Sprint 2)
- [ ] E2E smoke test executado (planejado Sprint 2)
- [ ] CI/CD integrado (planejado Sprint 2)

---

## 🔗 Referências

- **Código**: [src/components/ProviderOnboardingWizard.tsx](src/components/ProviderOnboardingWizard.tsx#L368-L406)
- **Endpoints**: [API_ENDPOINTS.md](API_ENDPOINTS.md) - Seção "Stripe Connect"
- **PR Merged**: [PR #31](https://github.com/agenciaclimb/Servio.AI/pull/31)
- **Audit**: `ai-tasks/events/audit-result-PR_31.json`

---

_Plano criado por: COPILOT EXECUTOR (Protocolo Supremo v4.0)_  
_Documento tipo: Guidance (não executável nesta fase)_
