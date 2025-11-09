# 🧪 Guia de Testes - Servio.AI

## Status Atual

✅ **Código commitado e pushed**
🚀 **Deploy em andamento** (tag v1.5.0-backend)

---

## 1. Monitorar o Deploy (5-10 min)

### Opção A: Via Browser

Abra: https://github.com/agenciaclimb/Servio.AI/actions

Procure pelo workflow **"Deploy to Cloud Run"** acionado pela tag `v1.5.0-backend`.

### Opção B: Via CLI (se tiver gh CLI instalado)

```powershell
gh run list --workflow="Deploy to Cloud Run" --limit 5
gh run watch  # Acompanha o último run em tempo real
```

**O que esperar:**

- ✅ Build do Docker image (2-3 min)
- ✅ Push para Artifact Registry (1-2 min)
- ✅ Deploy no Cloud Run (2-3 min)
- ✅ Verificação de saúde

---

## 2. Validar Endpoints Novos (após deploy)

### Script Automatizado

```powershell
node scripts/validate_disputes_endpoints.mjs
```

**Valida:**

- ✅ GET /disputes (200)
- ✅ POST /disputes (201)
- ✅ GET /sentiment-alerts (200)

### Teste Manual (alternativa)

```powershell
# Listar disputas
curl https://servio-backend-h5ogjon7aa-uw.a.run.app/disputes

# Criar disputa de teste
curl -X POST https://servio-backend-h5ogjon7aa-uw.a.run.app/disputes `
  -H "Content-Type: application/json" `
  -d '{\"jobId\":\"test\",\"initiatedBy\":\"test@example.com\",\"reason\":\"teste\",\"description\":\"validação\"}'
```

---

## 3. Executar Testes E2E Completos

### Suite Admin Dashboard (com backend de produção)

```powershell
npm test tests/e2e_admin_dashboard.test.mjs
```

**Espera-se:**

- ✅ 10 testes executados (nenhum skip de disputas)
- ✅ Criação de usuários, jobs, disputas e alertas
- ✅ Validação de métricas de receita

### Suite Completa (todos os testes)

```powershell
npm test
```

**Espera-se:**

- ✅ 16-20 testes passando
- ✅ Coverage report atualizado
- ✅ Sem erros de tipo

---

## 4. Testes Manuais no Frontend Local

### Iniciar o Frontend

```powershell
npm run dev
```

Acesse: http://localhost:5173

### Fluxo Admin Analytics

1. **Login como Admin:**
   - Email: `admin@servio.test` (ou qualquer admin do Firestore)
2. **Navegar para Dashboard Admin:**
   - Clique na aba "Analytics"
3. **Verificar Métricas:**
   - ✅ Total de usuários carregando
   - ✅ Jobs criados e taxa de conclusão
   - ✅ Receita da plataforma (R$)
   - ✅ Disputas (total, abertas, taxa)
   - ✅ Alertas de fraude (novos, alto risco)
   - ✅ Top 5 categorias com barra de progresso
   - ✅ Top 5 prestadores com contagem de jobs

4. **Console do Browser (F12):**
   - Verificar chamadas API bem-sucedidas
   - Confirmar ausência de erros 404 ou CORS

---

## 5. Teste de Integração: Criar Disputa

### Via Interface (quando disponível)

1. Login como cliente
2. Ir para "Meus Jobs"
3. Job em status "em_progresso" ou "concluído"
4. Clicar em "Abrir Disputa"
5. Preencher motivo e descrição
6. Verificar no Admin Dashboard: contagem de disputas aumentou

### Via API Direta

```powershell
# Criar job primeiro (opcional)
$jobId = "test-job-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Criar disputa
$dispute = @{
  jobId = $jobId
  initiatedBy = "client@example.com"
  reason = "Serviço não concluído"
  description = "Teste de integração da nova funcionalidade"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://servio-backend-h5ogjon7aa-uw.a.run.app/disputes" `
  -Method POST `
  -Body $dispute `
  -ContentType "application/json"
```

---

## 6. Validar Dados no Firestore

### Via Console GCP

https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore

**Collections para verificar:**

- ✅ `disputes` - deve ter novos documentos de teste
- ✅ `sentiment_alerts` - alertas criados via E2E
- ✅ `jobs` - earnings object presente em jobs concluídos
- ✅ `users` - stripeAccountId presente em prestadores

---

## 7. Logs e Debug (se algo falhar)

### Logs do Cloud Run

```powershell
# Via gcloud CLI
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend" `
  --limit 50 `
  --format json `
  --project gen-lang-client-0737507616

# Ou via console
```

https://console.cloud.google.com/logs/query?project=gen-lang-client-0737507616

**Filtro recomendado:**

```
resource.type="cloud_run_revision"
resource.labels.service_name="servio-backend"
severity>=ERROR
```

### Logs do Frontend (local)

- Console do browser (F12 → Console)
- Network tab para ver requests/responses
- Redux DevTools (se instalado)

---

## 8. Testes de Carga/Performance (opcional)

### Benchmark Simples

```powershell
# Instalar k6 (https://k6.io/docs/getting-started/installation/)
# Ou usar Apache Bench
ab -n 100 -c 10 https://servio-backend-h5ogjon7aa-uw.a.run.app/disputes
```

### Monitorar Métricas Cloud Run

https://console.cloud.google.com/run/detail/us-west1/servio-backend/metrics

Verificar:

- Latência (p50, p95, p99)
- Taxa de erro
- Instâncias ativas
- CPU/Memória

---

## 9. Checklist Final

Antes de considerar pronto para produção:

- [ ] Deploy do backend concluído com sucesso
- [ ] Script de validação passou (validate_disputes_endpoints.mjs)
- [ ] E2E completo passou sem skips
- [ ] Frontend local renderiza analytics sem erros
- [ ] Criação manual de disputa funciona
- [ ] Dados aparecem corretamente no Firestore
- [ ] Logs do Cloud Run sem erros críticos
- [ ] Performance aceitável (< 500ms p95)

---

## 10. Rollback (se necessário)

Se algo der errado:

```powershell
# Reverter para versão anterior
gcloud run services update-traffic servio-backend `
  --to-revisions=REVISION_ANTERIOR=100 `
  --region=us-west1 `
  --project=gen-lang-client-0737507616

# Ou via tag
git tag -d v1.5.0-backend
git push origin :refs/tags/v1.5.0-backend
git revert HEAD
git push origin main
```

---

## 📞 Suporte

**Documentos relevantes:**

- `SPRINT_SUMMARY.md` - O que foi implementado
- `tests/e2e_admin_dashboard.test.mjs` - Casos de teste
- `src/analytics/adminMetrics.ts` - Lógica de cálculo

**Endpoints documentados:**

- GET /disputes
- POST /disputes
- POST /disputes/:id/resolve
- GET /sentiment-alerts
- POST /sentiment-alerts

**Contato:**

- Issues: https://github.com/agenciaclimb/Servio.AI/issues
- Actions: https://github.com/agenciaclimb/Servio.AI/actions
