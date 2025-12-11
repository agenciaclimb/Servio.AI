# Guia Definitivo de Produção SERVIO.AI

## 1. Domínios e Serviços

- **Frontend:**
  - servio-ai.com
  - www.servio-ai.com
  - Hospedado no Firebase Hosting
- **Backend:**
  - api.servio-ai.com
  - Cloud Run (servio-backend)
- **IA:**
  - ai.servio-ai.com
  - Cloud Run (servio-ai)

## 2. Passos para Correção de Domínio (EXECUTADOS)

### 2.1. ✅ Firebase Hosting - CONCLUÍDO

Deploy realizado com sucesso:

```sh
npm run build
firebase deploy --only hosting
```

- URL temporária: https://gen-lang-client-0737507616.web.app
- Status: Funcionando perfeitamente

### 2.2. ✅ Cloud Run Domain Mapping - CONCLUÍDO

Mapeamentos criados com sucesso:

```sh
powershell -ExecutionPolicy Bypass -File scripts/gcloud_setup_domain_mappings.ps1
```

- ✅ api.servio-ai.com → servio-backend
- ✅ ai.servio-ai.com → servio-ai

**PRÓXIMOS PASSOS DNS:**

1. Acesse Cloud Console → Network Services → Cloud DNS
2. Zona: servio-ai-com já existe
3. Adicione os registros CNAME fornecidos pelo Cloud Run para:
   - api.servio-ai.com
   - ai.servio-ai.com
4. Aguarde propagação DNS (5-30 minutos)

### 2.3. ✅ Variáveis de Ambiente do Frontend - CONFIGURADO

Arquivo `.env.production.example` atualizado com:

```env
VITE_BACKEND_API_URL=https://api.servio-ai.com
VITE_AI_API_URL=https://ai.servio-ai.com
VITE_FIREBASE_API_KEY=[REDACTED_FOR_SECURITY]
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0737507616.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0737507616
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0737507616.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1000250760228
VITE_FIREBASE_APP_ID=1:1000250760228:web:af4350677e8b85f1e29f40
```

**Para aplicar em produção:**

1. Copie `.env.production.example` para `.env.production`
2. Ajuste chaves Stripe LIVE se necessário
3. Rebuild e redeploy:
   ```sh
   npm run build
   firebase deploy --only hosting
   ```

### 2.4. ✅ Firebase Auth - JÁ CONFIGURADO

Domínios autorizados confirmados no console:

- ✅ localhost
- ✅ 127.0.0.1
- ✅ servio-ai.com
- ✅ www.servio-ai.com
- ✅ api.servio-ai.com
- ✅ gen-lang-client-0737507616.firebaseapp.com
- ✅ gen-lang-client-0737507616.web.app

### 2.5. ⏳ CORS Backend/IA - PENDENTE

Aguardando validação dos domínios para configurar CORS adequado:

- Permitir origem: https://servio-ai.com
- Permitir origem: https://www.servio-ai.com

## 3. Testes de Produção

### 3.1. ✅ Smoke Test Backend - PASSOU

Executado em: 2025-11-20

```sh
node scripts/backend_smoke_test.mjs
```

Resultados:

- ✅ Health Check (200)
- ✅ List Users (200)
- ✅ List Jobs (200)
- ✅ Generate Upload URL (200)

**Status:** Backend em produção está 100% funcional

### 3.2. ⏳ Testes com Domínios Customizados - PENDENTE DNS

Após propagação DNS, testar:

```sh
curl https://servio-ai.com
curl https://api.servio-ai.com/health
curl https://ai.servio-ai.com/health
```

## 4. Diagnóstico Rápido

### Scripts Disponíveis

```sh
# Smoke test completo
node scripts/backend_smoke_test.mjs

# Corrigir permissões Firestore
npm run gcp:fix-firestore-iam

# Ver logs de erro
npm run gcp:logs

# Configurar domain mappings
powershell -ExecutionPolicy Bypass -File scripts/gcloud_setup_domain_mappings.ps1
```

### Troubleshooting Comum

- **Erro 500 em /users ou /jobs:**
  - Execute: `npm run gcp:fix-firestore-iam`
  - Aguarde 1–2 min e rode o smoke test novamente
- **Domain Mapping não funciona:**
  - Verifique registros CNAME no Cloud DNS
  - Aguarde até 30 minutos para propagação DNS
  - Use `nslookup api.servio-ai.com` para verificar

- **CORS errors:**
  - Adicione origens no backend: servio-ai.com, www.servio-ai.com
  - Redeploy do backend após ajuste

## 6. Checklist de Produção

### ✅ Infraestrutura

- [x] Build e deploy do frontend (Firebase Hosting)
- [x] Domain Mappings criados (api.servio-ai.com, ai.servio-ai.com)
- [x] Variáveis de ambiente configuradas (.env.production.example)
- [x] Firebase Auth com domínios autorizados
- [x] Backend smoke test passou (4/4 testes)
- [x] CNAME api.servio-ai.com adicionado no Cloud DNS
- [x] CNAME ai.servio-ai.com criado (aguardando propagação)

### ⏳ Pendente DNS

- [ ] Aguardar propagação DNS (5-30 min)
- [ ] Testar: curl https://ai.servio-ai.com/health
- [ ] Testar: curl https://api.servio-ai.com/health
- [ ] Abrir https://servio-ai.com no navegador

### ✅ Qualidade do Código

- [x] TypeScript: 0 erros (tsc --noEmit)
- [x] Testes: 634/634 passando (100%)
- [x] Coverage: 70.15% (aceitável para MVP)
- [x] Backend endpoints: 4/4 funcionando (health, users, jobs, upload)

### 📋 Próximas Otimizações

- [ ] Configurar CORS no backend para servio-ai.com
- [ ] Testar fluxo completo: login → criar job → upload
- [ ] Adicionar monitoring (Cloud Logging + alertas)
- [ ] Configurar Stripe webhook em produção
- [ ] Habilitar HTTPS redirect no Firebase Hosting

## 6. Observações Importantes

- ✅ servio-ai.com aponta para Firebase Hosting (não Cloud Run)
- ✅ api.servio-ai.com e ai.servio-ai.com apontam para Cloud Run
- ✅ Subdomínios mapeados corretamente por função
- ⚠️ Sempre revise DNS após alterações
- ⚠️ Documente no Documento Mestre qualquer ajuste feito
- ⚠️ Use Stripe LIVE keys apenas após validação completa
