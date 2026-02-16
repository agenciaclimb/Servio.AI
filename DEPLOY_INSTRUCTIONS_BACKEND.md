# INSTRUÇÕES DE DEPLOY — Cloud Run Backend

**Data**: 10/02/2026  
**Commit**: 209dcec  
**Objetivo**: Deploy do backend atualizado com rotas `/api/version` e `/api/routes`

---

## 🎯 MÉTODO 1 — GitHub Actions (RECOMENDADO)

### Passos:

1. **Acesse**: https://github.com/agenciaclimb/Servio.AI/actions/workflows/deploy-cloud-run.yml

2. **Clique em**: "Run workflow" (botão verde no canto superior direito)

3. **Configure**:
   - **Use workflow from**: `main`
   - **Branch ou tag para deploy**: `main`
   - **Serviço para deploy**: `backend`

4. **Confirme**: Clique em "Run workflow" (botão verde no modal)

5. **Aguarde**: ~5-10 minutos para conclusão do deploy

6. **Valide**: Execute os testes abaixo após deploy concluído

---

## 🎯 MÉTODO 2 — gcloud CLI (Se instalado)

```bash
# 1. Autenticar
gcloud auth login

# 2. Configurar projeto
gcloud config set project gen-lang-client-0737507616

# 3. Deploy do backend
gcloud run deploy servio-backend \
  --source ./backend \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080"

# 4. Confirmar nova revisão
gcloud run services describe servio-backend \
  --region us-west1 \
  --format="value(status.latestCreatedRevisionName)"
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

Execute os seguintes testes via PowerShell:

```powershell
# Teste 1: /api/health
Invoke-WebRequest -Uri "https://servio-backend-h5ogjon7aa-uw.a.run.app/api/health" -Method GET | Select-Object StatusCode, @{Name='Body';Expression={$_.Content}}

# Teste 2: /api/version (NOVA ROTA)
Invoke-WebRequest -Uri "https://servio-backend-h5ogjon7aa-uw.a.run.app/api/version" -Method GET | Select-Object StatusCode, @{Name='Body';Expression={$_.Content}}

# Teste 3: /api/routes (NOVA ROTA)
$routes = Invoke-WebRequest -Uri "https://servio-backend-h5ogjon7aa-uw.a.run.app/api/routes" -Method GET
$json = ($routes.Content | ConvertFrom-Json)
Write-Output "Total de Rotas: $($json.total)"
$json.routes | Where-Object { $_.path -like '*version*' -or $_.path -like '*routes*' }
```

**Resultados Esperados**:

- ✅ `/api/health` → HTTP 200
- ✅ `/api/version` → HTTP 200 (não mais 404)
- ✅ `/api/routes` → HTTP 200 + JSON com 189 rotas

---

## 🚨 TROUBLESHOOTING

### Se deploy falhar com erro de permissões:

```bash
# Verificar IAM roles
gcloud projects get-iam-policy gen-lang-client-0737507616 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount"
```

### Se Cloud Run não iniciar:

```bash
# Ver logs do Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend" \
  --limit 50 \
  --format json
```

---

## 📊 STATUS ATUAL (PRÉ-DEPLOY)

**Cloud Run**: ✅ ATIVO  
**Versão Deployed**: Antiga (sem `/api/version` e `/api/routes`)  
**Commit Local**: 209dcec (contém rotas novas)  
**Ação Necessária**: Deploy via GitHub Actions ou gcloud CLI

---

**ÚLTIMA ATUALIZAÇÃO**: 10/02/2026 14:25 UTC
