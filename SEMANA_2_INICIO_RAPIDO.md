# 🚀 SEMANA 2 - INÍCIO RÁPIDO

**Data**: 26/11/2025  
**Status**: 🟢 PRONTO PARA COMEÇAR  
**Meta**: 46.81% → 55-60% (+8-13 pts)

---

## ⚡ PRÓXIMOS PASSOS (Ordem de Prioridade)

### HOJE (27/11) - Morning Session

1. **ClientDashboard.test.tsx** (40 testes, ~4% cobertura)

   ```bash
   # Criar arquivo: tests/week2/ClientDashboard.test.tsx
   # - Mock useClientDashboardData hook
   # - Test: proposals, jobs, reviews, payments
   # - Test interactions: accept, reject, modals
   ```

   ✅ Commit: "tests(week2): ClientDashboard comprehensive suite"

2. **FindProvidersPage.test.tsx** (25 testes, ~1-2% cobertura)
   ```bash
   # Criar arquivo: tests/FindProvidersPage.test.tsx
   # - Mock API: GET /api/providers
   # - Test: search, filters, pagination, cards
   ```
   ✅ Commit: "tests(week2): FindProvidersPage search tests"

**Checkpoint**: ~48-50% cobertura

---

### HOJE (27/11) - Afternoon + Next Days

3. **ProviderDashboard.test.tsx** (30 testes, retry com mock simplificado)
4. **Admin Dashboards Suite** (AdminDashboard, AdminUsersPanel, AdminJobsPanel)
5. **fcmService.test.ts** (35 testes, Firebase Messaging)
6. **stripeService.test.ts** (40 testes, Stripe API)

**Final Target**: 55-60% ✅

---

## 🎯 CRITÉRIO SUCESSO

```
✅ Todos os testes passando
✅ ESLint 0 errors
✅ 55-60% cobertura (mínimo 54%)
✅ 6+ commits bem-sucedidos
✅ Import paths corretos (../../ para week2/)
```

---

## 📚 REFERÊNCIAS

- **Plano Detalhado**: `SEMANA_2_PLANO_DETALHADO.md`
- **Documento Mestre**: `DOCUMENTO_MESTRE_SERVIO_AI.md` (com sumário Semana 1)
- **Template Testes**: Veja `SEMANA_2_PLANO_DETALHADO.md` seção "TEMPLATE DE TESTE"
- **Padrões Semana 1**: Import paths, mock strategies em `SEMANA_2_PLANO_DETALHADO.md`

---

## 🔗 COMANDOS ÚTEIS

```powershell
# Rodar testes específico
npm test -- tests/week2/ClientDashboard.test.tsx --reporter=verbose

# Rodar com coverage
npm test 2>&1 | Select-Object -Last 30

# Validar ESLint
npm run lint

# Commit com validação
git add tests/week2/ClientDashboard.test.tsx
git commit -m "tests(week2): ClientDashboard comprehensive test suite"
```

---

**Status**: 🟢 READY TO START  
_Criado: 26/11/2025 23:45_
