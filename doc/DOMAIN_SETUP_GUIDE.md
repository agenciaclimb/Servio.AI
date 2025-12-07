# Guia de Configuração de Domínio - SERVIO.AI

**Data:** 19/11/2025  
**Status:** 🟡 EM PROGRESSO  
**Objetivo:** Configurar domínio personalizado para os serviços Cloud Run

---

## 📋 Informações dos Serviços Atuais

| Serviço                     | URL Atual (Cloud Run)                         | Domínio Desejado           |
| --------------------------- | --------------------------------------------- | -------------------------- |
| Frontend (Firebase Hosting) | gen-lang-client-0737507616.web.app            | www.servio.ai ou servio.ai |
| AI Service                  | servio-ai-1000250760228.us-west1.run.app      | api.servio.ai              |
| Backend API                 | servio-backend-1000250760228.us-west1.run.app | backend.servio.ai          |

---

## 🎯 FASE 1: Escolher e Registrar Domínio

### Opções de Domínio Recomendadas

| Domínio      | Disponibilidade | Preço Anual | Registrador | Prioridade |
| ------------ | --------------- | ----------- | ----------- | ---------- |
| servio.ai    | ❌ Registrado   | N/A         | N/A         | N/A        |
| servio.app   | ❌ Registrado   | N/A         | N/A         | N/A        |
| servioai.com | ❌ Registrado   | N/A         | N/A         | N/A        |

**⚠️ ATENÇÃO:** Os domínios principais já estão registrados. Alternativas sugeridas:

| Domínio Alternativo | Disponibilidade | Preço Anual | Prioridade |
| ------------------- | --------------- | ----------- | ---------- |
| getservio.ai        | ❓ Verificar    | ~$30-60     | ⭐⭐⭐     |
| getservio.app       | ❓ Verificar    | ~$20-30     | ⭐⭐⭐     |
| servio.tech         | ❓ Verificar    | ~$30-50     | ⭐⭐       |
| servio.io           | ❓ Verificar    | ~$40-60     | ⭐⭐       |
| myservio.com        | ❓ Verificar    | ~$12-15     | ⭐         |
| servioplatform.com  | ❓ Verificar    | ~$12-15     | ⭐         |

### Como Verificar Disponibilidade

**Opção 1: Google Domains (Recomendado)**

1. Acesse: https://domains.google.com
2. Pesquise os domínios acima
3. Adicione ao carrinho se disponível

**Opção 2: Cloudflare Registrar (Mais Barato)**

1. Acesse: https://dash.cloudflare.com
2. Vá em "Domain Registration"
3. Pesquise e registre

**Opção 3: Comando (se tiver whois instalado)**

```bash
whois servio.ai
whois servio.app
whois servioai.com
```

### Decisão

- [ ] Domínio escolhido: **\*\***\_\_\_\_**\*\***
- [ ] Registrado em: **\*\***\_\_\_\_**\*\***
- [ ] Data de registro: **\*\***\_\_\_\_**\*\***
- [ ] Data de expiração: **\*\***\_\_\_\_**\*\***

---

## 🎯 FASE 2: Configurar DNS para Cloud Run

### 2.1 Mapear Domínio para Cloud Run Services

**Para cada serviço, você precisa:**

1. **Criar mapeamento de domínio no Cloud Run**
2. **Obter registros DNS do Google**
3. **Adicionar registros no seu registrador**

### 2.2 Comandos para Mapear Domínios

#### Frontend (Firebase Hosting)

```bash
# Firebase Hosting tem processo próprio via console
# Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/hosting/main
# Clique em "Add custom domain"
# Siga o wizard (ele fornece os registros DNS)
```

#### AI Service (api.servio.ai)

```bash
# Mapear domínio
gcloud run domain-mappings create \
  --service=servio-ai \
  --domain=api.servio.ai \
  --region=us-west1 \
  --project=gen-lang-client-0737507616

# O comando acima retornará os registros DNS necessários
# Exemplo de output:
# Waiting for certificate provisioning. You must configure your DNS records for certificate issuance to begin.
# CNAME: api.servio.ai -> ghs.googlehosted.com
# A: api.servio.ai -> 216.239.32.21 (e outros IPs)
```

#### Backend API (backend.servio.ai)

```bash
# Mapear domínio
gcloud run domain-mappings create \
  --service=servio-backend \
  --domain=backend.servio.ai \
  --region=us-west1 \
  --project=gen-lang-client-0737507616
```

### 2.3 Registros DNS a Adicionar

**Após executar os comandos acima, você receberá instruções similares a:**

```dns
# Exemplo (os valores exatos virão dos comandos acima)

# Para api.servio.ai
Type: CNAME
Name: api
Value: ghs.googlehosted.com
TTL: 3600

# Para backend.servio.ai
Type: CNAME
Name: backend
Value: ghs.googlehosted.com
TTL: 3600

# Para domínio raiz (servio.ai) - Firebase Hosting
Type: A
Name: @
Value: 151.101.1.195 (exemplo - verificar no console Firebase)
Value: 151.101.65.195
TTL: 3600

# Para www.servio.ai - Firebase Hosting
Type: CNAME
Name: www
Value: gen-lang-client-0737507616.web.app
TTL: 3600
```

---

## 🎯 FASE 3: Adicionar Registros no Registrador

### Se usar Google Domains

1. Acesse: https://domains.google.com/registrar
2. Selecione seu domínio
3. Vá em "DNS" → "Manage custom records"
4. Clique em "Create new record"
5. Adicione cada registro DNS fornecido pelos comandos

### Se usar Cloudflare

1. Acesse: https://dash.cloudflare.com
2. Selecione seu domínio
3. Vá em "DNS" → "Records"
4. Clique em "Add record"
5. Adicione cada registro DNS fornecido

**⚠️ IMPORTANTE:**

- Mantenha **Proxy status: OFF** (nuvem cinza) em registros CNAME para Cloud Run
- O Cloudflare pode interferir no provisionamento de certificados SSL

---

## 🎯 FASE 4: Aguardar Provisionamento SSL

### Tempo Esperado

- **Propagação DNS:** 5 minutos a 48 horas (geralmente 15-30 minutos)
- **Provisionamento SSL:** 15 minutos a 24 horas após DNS propagar

### Verificar Propagação DNS

```bash
# Verificar se DNS propagou (substitua pelos seus domínios)
nslookup api.servio.ai
nslookup backend.servio.ai
nslookup servio.ai
nslookup www.servio.ai

# Ou use ferramenta online
# https://dnschecker.org
```

### Verificar Status do Mapeamento

```bash
# AI Service
gcloud run domain-mappings describe api.servio.ai \
  --region=us-west1 \
  --project=gen-lang-client-0737507616

# Backend
gcloud run domain-mappings describe backend.servio.ai \
  --region=us-west1 \
  --project=gen-lang-client-0737507616
```

**Status esperado:**

- `ACTIVE` - Tudo funcionando ✅
- `PENDING_CERTIFICATE` - Aguardando SSL (normal nas primeiras horas) ⏳
- `FAILED` - Problema com DNS ❌

---

## 🎯 FASE 5: Atualizar Firebase Auth

Após domínios estarem ativos, adicione-os aos domínios autorizados:

### 5.1 Console Firebase

1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/settings
2. Vá em "Authorized domains"
3. Clique em "Add domain"
4. Adicione:
   - `servio.ai`
   - `www.servio.ai`
   - `api.servio.ai`
   - `backend.servio.ai`

### 5.2 Comando gcloud (alternativa)

```bash
# Listar domínios autorizados atuais
gcloud firebase hosting:sites list --project=gen-lang-client-0737507616

# Não há comando direto para auth domains, use o console
```

---

## 🎯 FASE 6: Atualizar Configurações da Aplicação

### 6.1 Variáveis de Ambiente

Atualize os seguintes arquivos:

**Frontend (.env.production)**

```env
VITE_BACKEND_API_URL=https://backend.servio.ai
VITE_AI_API_URL=https://api.servio.ai
VITE_FRONTEND_URL=https://www.servio.ai
```

**Backend (Cloud Run)**

```bash
# Atualizar variável FRONTEND_URL
gcloud run services update servio-backend \
  --region=us-west1 \
  --project=gen-lang-client-0737507616 \
  --set-env-vars="FRONTEND_URL=https://www.servio.ai"
```

**AI Service (Cloud Run)**

```bash
# Atualizar variável FRONTEND_URL
gcloud run services update servio-ai \
  --region=us-west1 \
  --project=gen-lang-client-0737507616 \
  --set-env-vars="FRONTEND_URL=https://www.servio.ai"
```

### 6.2 Stripe Webhooks

Atualize a URL do webhook no Stripe Dashboard:

1. Acesse: https://dashboard.stripe.com/webhooks
2. Edite o webhook existente ou crie novo
3. **Endpoint URL:** `https://backend.servio.ai/webhook/stripe`
4. **Events to send:** (mesmos eventos configurados)

### 6.3 GitHub Secrets

Atualize secrets no repositório:

```bash
# Via GitHub Web UI:
# Settings → Secrets and variables → Actions → Update secrets

FRONTEND_URL=https://www.servio.ai
BACKEND_API_URL=https://backend.servio.ai
AI_API_URL=https://api.servio.ai
```

---

## 🎯 FASE 7: Testar Tudo

### 7.1 Testar URLs Públicas

```bash
# Frontend
curl -I https://servio.ai
curl -I https://www.servio.ai

# AI Service
curl https://api.servio.ai/

# Backend
curl https://backend.servio.ai/
curl https://backend.servio.ai/health
```

### 7.2 Testar Login Google

1. Abra https://www.servio.ai
2. Clique em "Entrar com Google"
3. Verifique que não há erro de domínio não autorizado
4. Complete o login

### 7.3 Testar Fluxo Completo

1. Criar job
2. Enviar proposta
3. Aceitar proposta
4. Verificar webhook Stripe (se aplicável)

---

## 📋 Checklist Final

- [ ] Domínio registrado e pago
- [ ] DNS configurado no registrador
- [ ] Mapeamentos Cloud Run criados (`api.` e `backend.`)
- [ ] Domínio custom Firebase configurado (apex e `www.`)
- [ ] DNS propagado (verificado com nslookup)
- [ ] Certificados SSL provisionados (status: ACTIVE)
- [ ] Firebase Auth domínios autorizados atualizados
- [ ] Variáveis de ambiente atualizadas (frontend + backend + AI)
- [ ] Stripe webhook URL atualizada
- [ ] GitHub secrets atualizados
- [ ] Testes de acesso público funcionando
- [ ] Login Google funcionando com domínio custom
- [ ] Fluxo end-to-end testado

---

## 🚨 Troubleshooting

### Problema: "Certificate provisioning failed"

**Causa:** DNS não propagou ou registros incorretos

**Solução:**

```bash
# Verificar DNS
nslookup api.servio.ai

# Deletar mapeamento e recriar
gcloud run domain-mappings delete api.servio.ai --region=us-west1 --project=gen-lang-client-0737507616
gcloud run domain-mappings create --service=servio-ai --domain=api.servio.ai --region=us-west1 --project=gen-lang-client-0737507616
```

### Problema: "Domain already mapped to another service"

**Causa:** Domínio já está mapeado em outra região ou projeto

**Solução:**

```bash
# Listar todos os mapeamentos
gcloud run domain-mappings list --project=gen-lang-client-0737507616

# Deletar mapeamento antigo se necessário
gcloud run domain-mappings delete <domain> --region=<region> --project=gen-lang-client-0737507616
```

### Problema: Login Google retorna erro "unauthorized_domain"

**Causa:** Domínio não está nos domínios autorizados do Firebase Auth

**Solução:**

1. Vá em Firebase Console → Authentication → Settings
2. Adicione o domínio à lista "Authorized domains"

---

## 📚 Referências

- [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Firebase Hosting Custom Domain](https://firebase.google.com/docs/hosting/custom-domain)
- [Firebase Auth Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#auth-domain)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Última atualização:** 19/11/2025 22:40
