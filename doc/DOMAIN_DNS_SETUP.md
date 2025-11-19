# Configuração de Domínio servio-ai.com no Cloud Run

**Domínio:** servio-ai.com  
**Zona DNS:** Já configurada no Cloud DNS  
**Data:** 19/11/2025

---

## 📋 Passo a Passo

### 1. Mapear Domínio no Cloud Run (Console)

Como você já tem a zona DNS no Cloud DNS, vamos configurar o mapeamento via Console do Google Cloud:

#### Para o Frontend (servio-ai service):

1. Acesse: https://console.cloud.google.com/run/detail/us-west1/servio-ai/networking?project=gen-lang-client-0737507616

2. Na aba "NETWORKING", clique em "Manage Custom Domains"

3. Clique em "Add Mapping"

4. Configure:
   - **Service:** servio-ai
   - **Domain:** servio-ai.com
   - **Também adicionar www:** ✅ Marque esta opção para incluir www.servio-ai.com

5. O Google Cloud vai gerar instruções com registros DNS necessários

#### Para o Backend (servio-backend service):

1. Acesse: https://console.cloud.google.com/run/detail/us-west1/servio-backend/networking?project=gen-lang-client-0737507616

2. Repita o processo, mas use:
   - **Service:** servio-backend
   - **Domain:** api.servio-ai.com (subdomínio para API)

---

### 2. Adicionar Registros DNS (Baseado nas Instruções do Console)

Após mapear no Cloud Run, o Google vai fornecer os registros exatos. Geralmente são:

#### Para servio-ai.com (apex):

```bash
# Adicionar registro A
gcloud dns record-sets create servio-ai.com. \
  --zone=servio-ai-com \
  --type=A \
  --ttl=300 \
  --rrdatas="216.239.32.21,216.239.34.21,216.239.36.21,216.239.38.21"

# Adicionar registro AAAA (IPv6)
gcloud dns record-sets create servio-ai.com. \
  --zone=servio-ai-com \
  --type=AAAA \
  --ttl=300 \
  --rrdatas="2001:4860:4802:32::15,2001:4860:4802:34::15,2001:4860:4802:36::15,2001:4860:4802:38::15"
```

#### Para www.servio-ai.com:

```bash
# Adicionar registro CNAME
gcloud dns record-sets create www.servio-ai.com. \
  --zone=servio-ai-com \
  --type=CNAME \
  --ttl=300 \
  --rrdatas="ghs.googlehosted.com."
```

#### Para api.servio-ai.com (backend):

```bash
# Adicionar registro CNAME
gcloud dns record-sets create api.servio-ai.com. \
  --zone=servio-ai-com \
  --type=CNAME \
  --ttl=300 \
  --rrdatas="ghs.googlehosted.com."
```

---

### 3. Verificar Propagação DNS

```bash
# Verificar registro A
nslookup servio-ai.com 8.8.8.8

# Verificar CNAME www
nslookup www.servio-ai.com 8.8.8.8

# Verificar CNAME api
nslookup api.servio-ai.com 8.8.8.8
```

**Tempo de propagação:** 5-30 minutos (TTL: 300 segundos)

---

### 4. Verificar Certificado SSL/TLS

O Google Cloud Run provisiona automaticamente certificados gerenciados.

1. Acesse: https://console.cloud.google.com/run/detail/us-west1/servio-ai/networking?project=gen-lang-client-0737507616

2. Verifique se o status do certificado é "Active" (pode levar até 15 minutos após DNS propagar)

3. Teste HTTPS:
   ```bash
   curl -I https://servio-ai.com
   curl -I https://www.servio-ai.com
   curl -I https://api.servio-ai.com
   ```

---

### 5. Atualizar Firebase Auth

1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/settings

2. Na seção "Authorized domains", adicione:
   - `servio-ai.com`
   - `www.servio-ai.com`
   - `api.servio-ai.com`

3. Clique em "Add domain" e salve

---

### 6. Atualizar Variáveis de Ambiente

#### GitHub Secrets (para CI/CD):

```bash
# Atualizar via GitHub Settings → Secrets → Actions
FRONTEND_URL=https://servio-ai.com
BACKEND_URL=https://api.servio-ai.com
```

#### Cloud Run (servio-ai service):

```bash
gcloud run services update servio-ai \
  --region=us-west1 \
  --set-env-vars="VITE_BACKEND_API_URL=https://api.servio-ai.com"
```

#### Cloud Run (servio-backend service):

```bash
gcloud run services update servio-backend \
  --region=us-west1 \
  --set-env-vars="FRONTEND_URL=https://servio-ai.com"
```

---

### 7. Atualizar Arquivos de Configuração

#### `.env.production`:

```env
VITE_BACKEND_API_URL=https://api.servio-ai.com
VITE_AI_API_URL=https://servio-ai.com
VITE_FRONTEND_URL=https://servio-ai.com
```

#### `firebaseConfig.ts`:

```typescript
// Atualizar domínios autorizados se necessário
```

---

### 8. Testar End-to-End

```bash
# 1. Frontend
curl -I https://servio-ai.com
curl -I https://www.servio-ai.com

# 2. Backend API
curl https://api.servio-ai.com/health

# 3. Login Google (testar no navegador)
# https://servio-ai.com → clicar em "Login with Google"
```

---

## ✅ Checklist de Verificação

- [ ] Domínio mapeado no Cloud Run (console)
- [ ] Registros DNS adicionados (A, AAAA, CNAME)
- [ ] DNS propagado (nslookup confirma)
- [ ] Certificado SSL ativo (HTTPS funciona)
- [ ] Firebase Auth tem domínio autorizado
- [ ] Variáveis de ambiente atualizadas (GitHub + Cloud Run)
- [ ] Frontend acessível via https://servio-ai.com
- [ ] Backend acessível via https://api.servio-ai.com
- [ ] Login Google funciona no domínio real

---

## 🔍 Troubleshooting

### DNS não propaga após 30 minutos

```bash
# Verificar registros na zona
gcloud dns record-sets list --zone=servio-ai-com

# Forçar atualização
gcloud dns record-sets update servio-ai.com. \
  --zone=servio-ai-com \
  --type=A \
  --ttl=60
```

### Certificado SSL não ativa

- Aguardar até 15 minutos após DNS propagar
- Verificar que domínio está corretamente apontado para Cloud Run
- Tentar remover e readicionar o mapeamento

### Login Google falha

- Confirmar que domínio está em Firebase Auth → Authorized domains
- Limpar cache do navegador
- Testar em janela anônima

---

## 📚 Links Úteis

- [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Cloud DNS Quickstart](https://cloud.google.com/dns/docs/quickstart)
- [Firebase Auth Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#customize-domains)

---

**Última atualização:** 19/11/2025
