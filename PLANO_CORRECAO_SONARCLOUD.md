# 🚨 PLANO DE CORREÇÃO COMPLETO - SONARCLOUD QUALITY GATE

**Objetivo:** Passar no Quality Gate do SonarCloud (Coverage ≥80% + 0 issues bloqueadores)  
**Status Atual:** FAILED (Coverage: 68.61%, 896 issues totais)  
**Data:** 17 de novembro de 2025  
**Prioridade:** MÁXIMA - Sistema não lança sem passar no Quality Gate

---

## 📊 ANÁLISE DE ISSUES SONARCLOUD

### BLOCKER (7 issues) - PRIORIDADE P0

**Problema:** "Avoid using quoted identifiers"  
**Localização:**

- `agenciaclimb / vite-smart-coach / components/functionsModal.tsx`
- `agenciaclimb / vite-smart-coach / superPromptingReactNonXML.txt`
- Vários arquivos com strings entre aspas duplas em keys de objetos

**Solução:**

```typescript
// ❌ ERRADO
const obj = {
  'my-key': value,
  'another-key': value2,
};

// ✅ CORRETO
const obj = {
  myKey: value,
  anotherKey: value2,
};
// OU se precisar de hífen:
const obj = {
  'my-key': value, // usar aspas simples, não duplas
};
```

**Ação:**

1. Buscar todos os arquivos com pattern: `"[a-z-]+"\s*:`
2. Substituir por camelCase ou aspas simples
3. Atualizar referências

---

### HIGH (162 issues) - PRIORIDADE P1

**Problema:** "Refactor this code to not nest functions more than 4 levels deep"  
**Causa:** Componentes React com lógica muito aninhada (callbacks dentro de callbacks)

**Padrão encontrado:**

```typescript
// ❌ ERRADO - 5+ níveis de aninhamento
const Component = () => {
  const handleSubmit = () => {
    // Nível 1
    validateData().then(() => {
      // Nível 2
      processData().then(() => {
        // Nível 3
        saveData().then(() => {
          // Nível 4
          showSuccess(() => {
            // Nível 5 ❌
            cleanup();
          });
        });
      });
    });
  };
};

// ✅ CORRETO - Extrair funções auxiliares
const Component = () => {
  const handleSubmit = async () => {
    try {
      await validateData();
      await processData();
      await saveData();
      await showSuccess();
      cleanup();
    } catch (error) {
      handleError(error);
    }
  };
};
```

**Arquivos mais afetados:**

- `components/ClientDashboard.tsx`
- `components/ProviderDashboard.tsx`
- `components/AdminDashboard.tsx`
- `components/AIJobRequestWizard.tsx`
- `App.tsx`

**Estratégia de correção:**

1. Converter callbacks aninhados para async/await
2. Extrair lógica complexa para custom hooks
3. Criar funções auxiliares fora do componente
4. Simplificar condicionais aninhados com early returns

---

### MEDIUM/CODE_SMELL (718 issues) - PRIORIDADE P2

#### 1. **Cognitive Complexity (476 issues)**

**Problema:** Funções muito complexas para entender  
**Limite:** Cognitive Complexity ≤ 15

**Solução:**

- Quebrar funções grandes em funções menores
- Simplificar condicionais com early returns
- Extrair validações para funções separadas
- Usar operador ternário para casos simples

#### 2. **Accessibility (245 issues)**

**Problemas:**

- Form labels não associados a controles
- Elementos interativos sem handlers de teclado
- Divs clicáveis sem role="button"
- Falta de aria-labels

**Solução:**

```typescript
// ❌ ERRADO
<div onClick={handleClick}>Clique aqui</div>

// ✅ CORRETO
<button
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  aria-label="Descrição clara"
>
  Clique aqui
</button>
```

#### 3. **Deprecated APIs (287 issues)**

**Problemas:**

- `isNaN()` → usar `Number.isNaN()`
- `String.replace()` → usar `String.replaceAll()`
- `parseInt()` → usar `Number.parseInt()`

#### 4. **Code Structure (614 issues)**

- Non-interactive elements com handlers
- Conditional rendering complexo
- Form validation inadequada

---

### SECURITY HOTSPOTS (462 issues)

**Problema principal:** `githubactions.S7637`  
"Using external GitHub actions and workflows without a commit reference is security-sensitive"

**Localização:** `.github/workflows/deploy-cloud-run.yml:80`

```yaml
# ❌ ERRADO
uses: google-github-actions/auth@v2

# ✅ CORRETO
uses: google-github-actions/auth@55bd3a7c6e2ae7cf1877fd1ccb9d54c0503c457c  # v2.1.4
```

**Ação:**

1. Substituir TODAS as referências de actions por commit SHA completo
2. Adicionar comentário com a versão para referência
3. Evitar expansão de secrets em run blocks

---

## 🎯 PLANO DE EXECUÇÃO (5 FASES)

### FASE 1: BLOCKER ISSUES (2-3 horas)

**Meta:** Eliminar todos os 7 BLOCKER issues

**Passos:**

1. ✅ Buscar padrão `"[a-zA-Z-_]+"\s*:` em todos os arquivos
2. ✅ Converter para camelCase ou aspas simples
3. ✅ Executar testes para validar
4. ✅ Commit: `fix(blocker): corrigir 7 quoted identifiers`

---

### FASE 2: HIGH ISSUES - REFATORAÇÃO (1-2 dias)

**Meta:** Reduzir 162 HIGH issues para <50

**Estratégia:**

1. **Dashboards (60% dos issues):**
   - ClientDashboard.tsx
   - ProviderDashboard.tsx
   - AdminDashboard.tsx

   **Ação:** Extrair lógica para custom hooks

   ```typescript
   // Antes
   const Dashboard = () => {
     const [state, setState] = useState();
     useEffect(() => { /* lógica aninhada */ }, []);
     // ... mais 500 linhas
   }

   // Depois
   const useDashboardLogic = () => { /* lógica extraída */ };
   const Dashboard = () => {
     const { state, handlers } = useDashboardLogic();
     return <UI state={state} {...handlers} />;
   }
   ```

2. **AIJobRequestWizard (20% dos issues):**
   - Extrair cada step para componente separado
   - Criar context para estado compartilhado
   - Simplificar validações

3. **App.tsx (10% dos issues):**
   - Extrair roteamento para componente separado
   - Simplificar lógica de autenticação
   - Usar React Router de forma mais eficiente

**Commits incrementais:**

- `refactor(dashboard): extrair logica para custom hooks`
- `refactor(wizard): simplificar steps e validacoes`
- `refactor(app): melhorar estrutura de roteamento`

---

### FASE 3: COBERTURA 68.61% → 80% (1 dia)

**Meta:** Aumentar cobertura em +11.39%

**Estratégia:**

1. **Identificar arquivos com 0% coverage que impactam métrica:**

   ```bash
   npm test -- --coverage --reporter=json
   # Analisar coverage-final.json
   ```

2. **Criar testes REAIS (não helpers genéricos):**
   - App.tsx: Testes de roteamento completo
   - Dashboards: Testes de renderização e interações
   - Modals: Testes de abertura/fechamento e submissão
   - Pages: Testes de navegação e formulários

3. **Exemplo de teste efetivo:**

   ```typescript
   // tests/App.real-coverage.test.tsx
   import { render, screen } from '@testing-library/react';
   import { BrowserRouter } from 'react-router-dom';
   import App from '../App';
   import { AppProvider } from '../src/contexts/AppContext';

   test('renderiza App completo e navega', async () => {
     render(
       <BrowserRouter>
         <AppProvider>
           <App />
         </AppProvider>
       </BrowserRouter>
     );

     // Testa roteamento real
     expect(screen.getByRole('main')).toBeInTheDocument();

     // Testa autenticação
     const loginButton = screen.getByRole('button', { name: /entrar/i });
     await userEvent.click(loginButton);

     // Isso executa código REAL de App.tsx
   });
   ```

**Meta numérica:**

- App.tsx: 0% → 60% (arquivo principal)
- Dashboards: 20% → 70%
- Modals: 30% → 75%
- Pages: 0% → 65%

---

### FASE 4: CODE SMELLS + SECURITY (2 dias)

#### 4.1 Accessibility (245 issues)

**Ferramentas:**

- eslint-plugin-jsx-a11y (já configurado)
- axe-core para testes automatizados

**Correções principais:**

1. Adicionar labels em todos os forms
2. Converter divs clicáveis para buttons
3. Adicionar keyboard handlers (onKeyDown)
4. Incluir aria-labels descritivos

#### 4.2 Deprecated APIs (287 issues)

**Busca e substituição em massa:**

```bash
# isNaN → Number.isNaN
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/isNaN(/Number.isNaN(/g'

# parseInt → Number.parseInt
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/parseInt(/Number.parseInt(/g'

# replace → replaceAll (quando usar regex global)
# (fazer manualmente para evitar quebrar)
```

#### 4.3 Security Hotspots (462 issues)

**Workflow fixes:**

```yaml
# deploy-cloud-run.yml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
- uses: google-github-actions/auth@55bd3a7c6e2ae7cf1877fd1ccb9d54c0503c457c # v2.1.4
- uses: google-github-actions/setup-gcloud@98ddc00a17442e89a24bbf282954a3b65ce6d200 # v2.1.0
- uses: docker/setup-buildx-action@2b51285047da1547ffb1b2203d8be4c0af6b1f20 # v3.2.0
- uses: docker/login-action@e92390c5fb421da1463c202d546fed0ec5c39f20 # v3.1.0
- uses: docker/build-push-action@2cdde995de11925a030ce8070c3d77a52ffcf1c0 # v6.5.0
```

---

### FASE 5: VALIDAÇÃO E TESTES E2E (1 dia)

#### 5.1 Playwright E2E

```bash
npm install -D @playwright/test
npx playwright install
```

**Converter testes existentes:**

- client-complete-journey.spec.tsx → client.spec.ts (Playwright)
- provider-complete-journey.spec.tsx → provider.spec.ts
- admin-complete-journey.spec.tsx → admin.spec.ts

#### 5.2 Performance & Accessibility Audits

```bash
npm install -D @lhci/cli
npx lhci autorun
```

**Metas:**

- Performance: >90
- Accessibility: 100
- Best Practices: >90
- SEO: 100

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Quality Gate Requirements

- [ ] Coverage on New Code ≥ 80% (atual: 68.61%)
- [ ] 0 BLOCKER issues (atual: 7)
- [ ] 0 CRITICAL issues (atual: 1)
- [ ] Reliability Rating A (atual: B)
- [ ] Security Rating A (atual: A ✅)
- [ ] Maintainability Rating A (atual: A ✅)

### Testes

- [ ] 433+ testes unitários passando
- [ ] 29 testes E2E passando com Playwright
- [ ] Coverage HTML report gerado
- [ ] 0 testes flakey

### CI/CD

- [ ] SonarCloud workflow passando
- [ ] CI workflow passando
- [ ] Deploy workflow funcionando
- [ ] Security scan passando

### Documentação

- [ ] PLANO_TESTES_COMPLETO.md atualizado
- [ ] DOCUMENTO_MESTRE_SERVIO_AI.md atualizado
- [ ] README.md com badges atualizados
- [ ] CHANGELOG.md criado

---

## 🚀 PRÓXIMAS AÇÕES IMEDIATAS

1. ✅ **Buscar e corrigir 7 BLOCKER issues** (quoted identifiers)
2. ✅ **Refatorar top 10 arquivos com HIGH issues**
3. ✅ **Criar 50+ testes reais para aumentar coverage**
4. ✅ **Corrigir Security Hotspots nos workflows**
5. ✅ **Executar validação completa**

**Estimativa total:** 5-7 dias de trabalho focado  
**Prioridade:** MÁXIMA - Bloqueador para lançamento
