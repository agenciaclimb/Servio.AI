# ✅ Configuração de Produção - servio-ai.com

**Data de Conclusão:** 19/11/2025  
**Status:** ✅ ATIVO

---

## 🌐 Domínios Configurados

| Domínio           | Serviço                 | Status               | URL                       |
| ----------------- | ----------------------- | -------------------- | ------------------------- |
| servio-ai.com     | servio-ai (Frontend/AI) | ✅ Ativo             | https://servio-ai.com     |
| www.servio-ai.com | servio-ai (Frontend/AI) | ⏳ Provisionando SSL | https://www.servio-ai.com |
| api.servio-ai.com | servio-backend (API)    | ⏳ Provisionando SSL | https://api.servio-ai.com |

**Nota:** Certificados SSL para www e api levam até 15 minutos para provisionar após DNS propagar.

---

## 🔧 Configurações Aplicadas

### DNS Records (Cloud DNS - Zone: servio-ai-com)

```bash
# Apex domain
servio-ai.com.  A     300  216.239.32.21,216.239.34.21,216.239.36.21,216.239.38.21
servio-ai.com.  AAAA  300  2001:4860:4802:32::15,...

# Subdomains
www.servio-ai.com.  CNAME  300  ghs.googlehosted.com.
api.servio-ai.com.  CNAME  300  ghs.googlehosted.com.
```

### Cloud Run Domain Mappings

```bash
# Frontend/AI Service
gcloud beta run domain-mappings create --service=servio-ai --domain=servio-ai.com --region=us-west1
gcloud beta run domain-mappings create --service=servio-ai --domain=www.servio-ai.com --region=us-west1

# Backend API Service
gcloud beta run domain-mappings create --service=servio-backend --domain=api.servio-ai.com --region=us-west1
```

### Environment Variables

#### servio-ai (Frontend/AI):

```bash
VITE_BACKEND_API_URL=https://api.servio-ai.com
VITE_FRONTEND_URL=https://servio-ai.com
```

#### servio-backend (API):

```bash
FRONTEND_URL=https://servio-ai.com
```

### Firebase Auth - Authorized Domains

✅ Adicionados manualmente via Console:

- servio-ai.com
- www.servio-ai.com
- api.servio-ai.com
- servio.ai.com (variação)

---

## ✅ Verificação de Funcionamento

### Testes Realizados:

```bash
# 1. Domínio principal
curl -I https://servio-ai.com
# ✅ HTTP/1.1 200 OK
# ✅ server: Google Frontend

# 2. Conteúdo da resposta
curl -s https://servio-ai.com
# ✅ {"name":"Servio.AI - AI Server","status":"running",...}

# 3. DNS propagation
nslookup servio-ai.com
# ✅ Address: 216.239.32.21

# 4. Cloud Run mappings
gcloud beta run domain-mappings list --region=us-west1
# ✅ servio-ai.com      servio-ai       us-west1  [ACTIVE]
# ⏳ www.servio-ai.com  servio-ai       us-west1  [PROVISIONING]
# ⏳ api.servio-ai.com  servio-backend  us-west1  [PROVISIONING]
```

---

## 📋 Próximos Passos (Pós-Provisionamento)

### 1. Aguardar Certificados SSL (10-15 minutos)

Verificar status periodicamente:

```bash
gcloud beta run domain-mappings list --region=us-west1
```

Quando todos mostrarem `+` (ativo), testar:

```bash
curl -I https://www.servio-ai.com
curl -I https://api.servio-ai.com/health
```

### 2. Atualizar GitHub Secrets

```
Settings → Secrets and variables → Actions:

FRONTEND_URL=https://servio-ai.com
BACKEND_URL=https://api.servio-ai.com
```

### 3. Atualizar Arquivos de Configuração Local

#### `.env.production`:

```env
VITE_BACKEND_API_URL=https://api.servio-ai.com
VITE_AI_API_URL=https://servio-ai.com
VITE_FRONTEND_URL=https://servio-ai.com
```

### 4. Testar Login Google

1. Acessar https://servio-ai.com
2. Clicar em "Login with Google"
3. Verificar que não há erro de "unauthorized domain"

### 5. Configurar Redirects (Opcional)

Se quiser redirecionar www → apex ou vice-versa, configurar via Cloud Load Balancer.

---

## 🔍 Troubleshooting

### Certificado SSL não provisiona após 15 minutos

```bash
# Verificar registros DNS
gcloud dns record-sets list --zone=servio-ai-com | grep -E "www|api"

# Recriar mapeamento se necessário
gcloud beta run domain-mappings delete www.servio-ai.com --region=us-west1
gcloud beta run domain-mappings create --service=servio-ai --domain=www.servio-ai.com --region=us-west1
```

### Erro "This site can't provide a secure connection"

- Aguardar mais tempo (até 15 min)
- Verificar que CNAME aponta para `ghs.googlehosted.com.`
- Confirmar que domain mapping foi criado

### Login Google falha

- Confirmar domínio em Firebase Auth → Authorized domains
- Limpar cache do navegador
- Testar em janela anônima

---

## 📚 Documentação de Referência

- [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Firebase Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#customize-domains)
- [Cloud DNS Quickstart](https://cloud.google.com/dns/docs/quickstart)

---

**Última Verificação:** 19/11/2025 12:04
**Status Geral:** ✅ OPERACIONAL (aguardando SSL para www e api)
