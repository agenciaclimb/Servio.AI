# 📋 TEST_PLAN.md — Plano de Testes Completo

**Versão**: 1.0  
**Cobertura Target**: ≥ 80%  
**Data**: 11 de dezembro de 2025

---

## Pilares de Teste

### 1. Unit Tests

**Framework**: Vitest + React Testing Library

```bash
# Rodar testes unitários
npm test

# Watch mode
npm test:watch

# Com coverage
npm test -- --coverage
```

**Cobertura por área**:

- Componentes: ≥ 85%
- Services: ≥ 90%
- Hooks: ≥ 80%
- Utils: ≥ 95%

### 2. Integration Tests

**Verificar integração entre camadas**:

- Frontend ↔ Backend API
- Backend ↔ Firestore
- Backend ↔ Stripe
- Backend ↔ Gemini

### 3. E2E Tests

**Framework**: Playwright

```bash
# Smoke tests críticos
npm run e2e:smoke

# Critical flows
npm run e2e:critical

# Full suite
npm run e2e
```

**Cenários cobertos**:

- ✅ Login/Logout
- ✅ Criar job
- ✅ Proposta → Pagamento
- ✅ Job completion
- ✅ Admin dashboard

### 4. Security Tests

**Scans**:

- npm audit
- Gitleaks
- SonarCloud SAST
- Firewall rules validation

### 5. Performance Tests

**Métricas**:

- Lighthouse score ≥ 85
- API response time < 200ms
- Build time < 60s
- Bundle size < 500KB

---

## Checklist por Feature

Toda feature deve ter:

- [ ] Unit tests (≥ 80% cobertura)
- [ ] Integration test (se aplicável)
- [ ] E2E test (se fluxo crítico)
- [ ] Security review
- [ ] Performance audit
- [ ] Documentação atualizada

---

## CI/CD Pipeline

```
commit → lint → unit tests → build → e2e → deploy
                ↓
            Se falhar: BLOCK
```

**Requerimentos para merge**:

- ✅ Testes: 100% green
- ✅ Coverage: ≥ 80%
- ✅ Lint: 0 warnings
- ✅ Build: OK
- ✅ Security: OK

---

_Test Plan | Servio.AI | Production_
