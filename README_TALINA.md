# 🚀 GUIA RÁPIDO TALINA — Servio.AI Deploy

**Data**: 05/01/2026  
**Status**: 🟢 SISTEMA PRONTO PARA LANÇAMENTO

---

## 📌 SUMÁRIO EXECUTIVO

Você vai executar o lançamento em produção do **Servio.AI** em **7 dias** (05/01 → 12/01/2026).

### ✅ Estado Atual

- **Cobertura**: 45.06% (meta alcançada!)
- **Testes**: 2835 passando
- **Build**: OK (~200KB)
- **Segurança**: Enterprise-grade (PR #62)
- **Veredito**: 🚀 **DEPLOY AUTORIZADO**

### 🎯 Sua Missão

Executar deploy seguindo protocolo rigoroso com **zero downtime** e **zero data loss**.

---

## 📋 CHECKLIST DIÁRIO

### **Segunda 05/01** — Preparação

- [ ] Rodar `npm run validate:prod` → ✅ Deve passar
- [ ] Criar `C:\secrets\servio-prod.env` com variáveis de produção
- [ ] Configurar Firebase (7 variáveis)
- [ ] Configurar Stripe (live keys: pk*live*, sk*live*)
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Criar tag: `git tag v1.0.0 && git push --tags`

### **Terça 06/01** — Preparação (continuação)

- [ ] Validar credenciais (testar login local)
- [ ] Configurar Cloud Run secrets (Stripe, Gmail)
- [ ] Revisar [HANDOFF_TALINA.md](HANDOFF_TALINA.md) completo
- [ ] Revisar [PLANO_TESTES_PRODUCAO.md](PLANO_TESTES_PRODUCAO.md)

### **Quarta 07/01** — Deploy Staging

- [ ] Build staging: `npm run build -- --mode staging`
- [ ] Deploy frontend: `firebase hosting:channel:deploy staging`
- [ ] Deploy backend: `gcloud run deploy servio-backend-staging --source .`
- [ ] Smoke tests: `npm run e2e:smoke` → ✅ 10/10
- [ ] Validação manual (15 min) — Ver CT-001 a CT-007

### **Quinta 08/01** — Validação Staging

- [ ] Testes de performance: `npx lighthouse [URL]` → >90
- [ ] Critical path tests: `npm run e2e:critical`
- [ ] Verificar logs (sem erros 500)
- [ ] Aprovar para produção (Go/No-Go meeting)

### **Sexta 09/01** — Deploy Produção 🚀

- [ ] **09:00** - Build produção: `npm run build`
- [ ] **09:15** - Deploy canary 10%: `firebase deploy --rollout-percentage 10`
- [ ] **09:15-09:45** - Monitorar (error rate <1%, latency <2s)
- [ ] **09:45** - Deploy canary 50%: `firebase deploy --rollout-percentage 50`
- [ ] **09:45-10:15** - Monitorar
- [ ] **10:15** - Deploy 100%: `firebase deploy --only hosting`
- [ ] **10:30** - Deploy backend: `gcloud run deploy servio-backend`
- [ ] **10:45** - Configurar Stripe webhook (produção)
- [ ] **11:00** - Smoke tests produção: `npm run e2e:smoke`
- [ ] **11:15** - 🎉 **SISTEMA NO AR!**

### **Sábado 10/01** — Monitoramento

- [ ] **A cada 2h**: Verificar dashboards (Firebase, Cloud Run, Stripe)
- [ ] Revisar logs de erro
- [ ] Testar funcionalidades críticas (login, jobs, pagamento)
- [ ] Confirmar alertas configurados
- [ ] Coletar feedback usuários beta

### **Domingo 11/01** — Monitoramento (continuação)

- [ ] Continuar monitoramento (cada 4h)
- [ ] Responder a feedback
- [ ] Resolver bugs P2/P3 (se houver)
- [ ] Preparar relatório semanal

### **Segunda 12/01** — Estabilização

- [ ] Análise de métricas (GMV, conversão, latência)
- [ ] Ajustes de performance (se necessário)
- [ ] Atualizar documentação
- [ ] Criar `PRODUCAO_V1_RELATORIO.md`
- [ ] Reunião de retrospectiva

---

## 🔗 LINKS RÁPIDOS

### 📄 Documentação

| Documento                                                      | Quando Usar                       |
| -------------------------------------------------------------- | --------------------------------- |
| [HANDOFF_TALINA.md](HANDOFF_TALINA.md)                         | **Guia completo** — Ler primeiro! |
| [PLANO_TESTES_PRODUCAO.md](PLANO_TESTES_PRODUCAO.md)           | Casos de teste + Debugging        |
| [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)                     | Checklist técnico pré-deploy      |
| [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md) | Estado do sistema                 |
| [API_ENDPOINTS.md](API_ENDPOINTS.md)                           | Referência de APIs                |
| [COMANDOS_UTEIS.md](COMANDOS_UTEIS.md)                         | Cheat sheet comandos              |

### 🖥️ Consoles

- **Firebase**: https://console.firebase.google.com/project/servio-ai
- **Cloud Run**: https://console.cloud.google.com/run?project=servio-ai
- **Stripe**: https://dashboard.stripe.com
- **Logs**: https://console.cloud.google.com/logs?project=servio-ai

### 🤖 IAs

- **GitHub Copilot**: `Ctrl+Shift+I` no VS Code
- **Gemini AI Studio**: https://aistudio.google.com

---

## ⚡ COMANDOS ESSENCIAIS

### Validação

```powershell
npm run validate:prod  # Gate completo (lint+test+build+audit)
npm test              # 2835 testes (~30s)
npm run e2e:smoke     # 10 testes críticos (~1-2min)
```

### Deploy Frontend

```powershell
# Staging
firebase hosting:channel:deploy staging

# Produção (gradual)
firebase deploy --rollout-percentage 10  # Canary 10%
firebase deploy --rollout-percentage 50  # Canary 50%
firebase deploy --only hosting           # Full deploy

# Rollback
firebase hosting:channel:deploy rollback
```

### Deploy Backend

```powershell
cd backend

# Staging
gcloud run deploy servio-backend-staging --source . --region us-west2

# Produção
gcloud run deploy servio-backend --source . --region us-west2 \
  --set-env-vars="NODE_ENV=production" \
  --min-instances=1 --max-instances=50 \
  --memory=1Gi --cpu=2
```

### Logs

```powershell
# Tail logs (tempo real)
gcloud run services logs tail servio-backend --limit=100

# Erros últimas 24h
gcloud logging read "severity>=ERROR" --limit=50
```

---

## 🆘 EMERGÊNCIAS

### Sistema Down (P0)

**Ação Imediata** (5 min):

```powershell
# 1. Rollback frontend
firebase hosting:channel:deploy rollback

# 2. Rollback backend
gcloud run services update-traffic servio-backend \
  --to-revisions=PREVIOUS_REVISION=100

# 3. Validar
npm run e2e:smoke

# 4. Notificar equipe + usuários
```

### Error Rate Alto (>5%)

1. Verificar logs: `gcloud run services logs tail servio-backend`
2. Identificar erro comum
3. Se não corrigível em 15min → ROLLBACK
4. Investigar offline
5. Criar hotfix
6. Re-deploy

### Deploy Falha

1. Ler erro completo: `firebase deploy --debug`
2. Perguntar ao Copilot: `@workspace Why is this deploy failing? [erro]`
3. Corrigir (geralmente IAM ou quota)
4. Re-tentar

---

## ✅ CRITÉRIOS DE SUCESSO

**Deploy OK se**:

- ✅ Uptime >99.5%
- ✅ Error rate <1%
- ✅ Latency P95 <2s
- ✅ Pagamentos 100% funcionando
- ✅ Smoke tests passando
- ✅ Feedback usuários positivo

---

## 🎯 REGRAS DE OURO

1. 🐢 **Vá devagar** — Staging → Canary 10% → 50% → 100%
2. 👀 **Monitore ativamente** — Logs + métricas constantemente
3. 🚨 **Rollback se necessário** — Não hesite!
4. 📝 **Documente tudo** — Cada ação, cada problema
5. 🤖 **Use as IAs** — Copilot e Gemini são suas aliadas

**Você não está sozinha! Protocolo + IAs + Documentação completa.**

---

## 📞 SUPORTE

| Situação         | Canal                           |
| ---------------- | ------------------------------- |
| Dúvida técnica   | GitHub Copilot (`Ctrl+Shift+I`) |
| Bug crítico      | [Telefone Tech Lead]            |
| Deploy bloqueado | [Email DevOps]                  |

---

**Boa sorte, Talina! 🚀**

**Versão**: 1.0  
**Data**: 05/01/2026  
**Status**: 🟢 ATIVO
