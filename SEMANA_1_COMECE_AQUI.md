# 🚀 Semana 1 - Início Prático - Instruções

**Data:** 25/11/2025  
**Status:** ✅ Plano pronto, começar testes hoje

---

## Próximo Passo: Criar Testes

### 1. Abrir VS Code

```bash
cd c:\Users\JE\servio.ai
code .
```

### 2. Criar pasta para testes da Semana 1

```bash
mkdir -p tests/week1
```

### 3. Começar com ProfilePage.test.tsx

Usar o template em `TEST_TEMPLATE_GUIDE.md` como base.

**Estrutura básica:**

```typescript
// tests/week1/ProfilePage.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '@/components/ProfilePage';
import * as API from '@/services/api';

// Mock APIs
vi.mock('@/services/api');
vi.mock('@/services/geminiService');

// Setup mocks
const mockUser = { email: 'test@test.com', name: 'Test User', type: 'prestador' };

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.mocked(API.fetchUserById).mockResolvedValue(mockUser);
  });

  // Add 20 tests based on SEMANA_1_PLANO_PRATICO.md
});
```

### 4. Rodar testes enquanto escreve

```bash
npm run test -- tests/week1/ProfilePage.test.tsx --watch
```

### 5. Acompanhar coverage

```bash
npm run test -- tests/week1 --coverage
open coverage/index.html
```

---

## Referências Rápidas

| Documento                       | Propósito                           |
| ------------------------------- | ----------------------------------- |
| `SEMANA_1_PLANO_PRATICO.md`     | 20 testes específicos a implementar |
| `TEST_TEMPLATE_GUIDE.md`        | Exemplo de cada tipo de teste       |
| `PLANO_80_PORCENTO_COVERAGE.md` | Visão geral 80% coverage            |

---

## Checklist Semana 1

**Dia 1-2:**

- [ ] Criar tests/week1/ProfilePage.test.tsx
- [ ] Implementar TESTES 1-2 (Happy path)
- [ ] Rodar: `npm run test -- ProfilePage --coverage`
- [ ] Commit

**Dia 3-4:**

- [ ] Implementar TESTES 3-5 (States & Conditionals)
- [ ] Rodar testes com coverage
- [ ] Commit

**Dia 5:**

- [ ] Implementar TESTES 6-10 (Edge cases)
- [ ] Coverage check
- [ ] Commit

**Dia 6:**

- [ ] Implementar TESTES 11-20 (SEO, Interactions, Rating)
- [ ] Validar 85% coverage
- [ ] Commit

**Dia 7:**

- [ ] AIJobRequestWizard tests (10-15 testes)
- [ ] Final validation
- [ ] Coverage report

---

## Exemplo Simples - Primeiro Teste

```typescript
// tests/week1/ProfilePage.test.tsx

describe('ProfilePage - Happy Path', () => {
  it('TEST 1: should render profile with user data', async () => {
    // Setup
    vi.mocked(API.fetchUserById).mockResolvedValue(mockUser)
    vi.mocked(API.fetchJobs).mockResolvedValue([])
    vi.mocked(API.fetchAllUsers).mockResolvedValue([])

    // Render
    render(
      <BrowserRouter>
        <ProfilePage
          userId="test@test.com"
          isPublicView={false}
          onBackToDashboard={() => {}}
          onLoginToContact={() => {}}
        />
      </BrowserRouter>
    )

    // Assert
    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    })
  })
})
```

---

## Git Workflow Semana 1

```bash
# Cada dia ou cada 2-3 testes
git add tests/week1/ProfilePage.test.tsx
git commit -m "test(ProfilePage): add tests 1-2 for happy path scenario"
git push origin main

# Depois para AIJobRequestWizard
git add tests/week1/AIJobRequestWizard.test.tsx
git commit -m "test(AIJobRequestWizard): add tests 1-5 for step navigation"
git push origin main
```

---

## Meta Cobertura Semana 1

```
Início: 26.24%
Dia 1-2: +2% → 28%
Dia 3-4: +2% → 30%
Dia 5: +2% → 32%
Dia 6: +2% → 34%
Dia 7: +1% → 35% ✅

Total: +8.76% | 26 tests adicionados
```

---

## Recursos

- **Vitest Docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/
- **Component Location:** `components/ProfilePage.tsx`
- **Template:** `TEST_TEMPLATE_GUIDE.md`

---

**Começar agora! 🎯**
