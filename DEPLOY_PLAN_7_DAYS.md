# 🚀 DEPLOY_PLAN_7_DAYS.md — Plano de Lançamento em 7 Dias

**Versão**: 1.0  
**Data Início**: 11 de dezembro de 2025  
**Data Go Live**: 18 de dezembro de 2025

---

## Dia 1 (11/12) — Auditoria Geral

**Responsável**: Gemini System Review

```bash
node /ai-engine/gemini/system-review.cjs
```

**Deliverables**:

- [ ] Relatório de saúde completo
- [ ] Lista de blockers críticos
- [ ] Score geral do sistema
- [ ] Recomendações prioritárias

**Critério de Sucesso**: Score ≥ 85/100

---

## Dia 2 (12/12) — Corrigir Blockers

**Tarefas**:

- [ ] Corrigir todos os bugs críticos
- [ ] Aumentar coverage para ≥ 80%
- [ ] 100% testes passando
- [ ] Zero npm vulnerabilidades

**Validação**:

```bash
npm test -- --coverage
npm audit
```

**Critério de Sucesso**: Todos os checks verdes

---

## Dia 3 (13/12) — Performance + Segurança

**Tasks**:

- [ ] Lighthouse score ≥ 85
- [ ] Performance time < 200ms
- [ ] Security review completa
- [ ] OWASP Top 10 auditado

**Validação**:

```bash
npm run lighthouse
npm audit
npm run sonar
```

**Critério de Sucesso**: Todas as métricas no alvo

---

## Dia 4 (14/12) — Testes E2E Completos

**Testes**:

- [ ] Smoke tests: 100%
- [ ] Critical flows: 100%
- [ ] Edge cases: cobertos
- [ ] Documentação E2E: pronta

**Validação**:

```bash
npm run e2e:smoke
npm run e2e:critical
npm run e2e
```

**Critério de Sucesso**: Sem falhas

---

## Dia 5 (15/12) — Deploy Staging

**Backend**:

- [ ] Deploy em Cloud Run (staging)
- [ ] Health checks: OK
- [ ] Logs: monitorados

**Frontend**:

- [ ] Deploy Firebase Hosting (staging)
- [ ] CDN: ativo
- [ ] HTTPS: válido

**Integração**:

- [ ] API conectada ao staging
- [ ] Firestore staging: OK
- [ ] Stripe: modo teste

**Validação**:

```bash
curl https://staging-backend.servio.ai/health
curl https://staging.servio.ai/
```

**Critério de Sucesso**: Endpoints respondendo

---

## Dia 6 (16/12) — Validação Produção

**Pre-launch checks**:

- [ ] Backup: verificado
- [ ] Disaster recovery: testado
- [ ] Monitoring: ativo
- [ ] Alertas: configurados
- [ ] Runbooks: prontos
- [ ] Support: 24/7

**Testes finais**:

- [ ] Fluxo completo: cliente a cliente
- [ ] Pagamento: end-to-end
- [ ] Notificações: funcionando
- [ ] Admin dashboard: OK

**Critério de Sucesso**: Sem bloqueadores

---

## Dia 7 (17/12) — Go Live

### Morning (08:00)

- [ ] Backup pré-launch
- [ ] Team standby
- [ ] Monitoramento ativo

### Afternoon (14:00)

```bash
# Deploy produção
./scripts/deploy-production.sh

# Health checks
curl https://api.servio.ai/health
curl https://servio.ai/

# Smoke tests
npm run e2e:smoke -- --env=production
```

### Evening (20:00)

- [ ] Monitoring: 2h contínuo
- [ ] Support: escalado
- [ ] Métricas: coletadas

---

## Rollback Plan

Se problemas em produção:

```bash
# Revert último deploy
git revert HEAD

# Deploy anterior
gcloud run deploy servio-backend --image [previous-image]

# Validar
curl https://api.servio.ai/health
```

---

## Métricas de Sucesso (Go Live)

| Métrica           | Target  | Atual |
| ----------------- | ------- | ----- |
| Uptime            | 99.9%   | -     |
| Response time     | < 200ms | -     |
| Error rate        | < 0.1%  | -     |
| User signups/dia  | TBD     | -     |
| Transactions/hora | TBD     | -     |
| Coverage          | ≥ 80%   | -     |
| Lighthouse        | ≥ 85    | -     |
| npm audit         | 0 vulns | -     |

---

## Post-Launch (Dia 8+)

- [ ] Monitorar 24/7 por 7 dias
- [ ] Coletar feedback usuarios
- [ ] Hotfixes conforme necessário
- [ ] Célula de escalação ativa

---

_Deploy Plan 7 Dias | Servio.AI | Production Launch_
