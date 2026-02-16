# 🔧 Configuração do Ambiente Staging - Servio.AI

## ✅ Status: Projeto Staging Configurado

**Projeto criado:** `servioai-staging`  
**Data:** 07/01/2026  
**Alias configurado:** ✅ Staging

Os seguintes arquivos foram atualizados para suportar ambientes staging e production:

### 📁 Arquivos Atualizados

1. **`.firebaserc`** - Agora contém aliases para ambientes:
   - `default` → gen-lang-client-0737507616
   - `production` → gen-lang-client-0737507616
   - `staging` → **servioai-staging** ✅

2. **`package.json`** - Novos scripts adicionados:
   - `npm run deploy:staging` - Deploy completo para staging
   - `npm run deploy:production` - Deploy completo para produção (com validação)
   - `npm run deploy:staging:hosting` - Deploy apenas hosting (frontend) staging
   - `npm run deploy:staging:functions` - Deploy apenas functions staging
   - `npm run deploy:production:hosting` - Deploy apenas hosting produção
   - `npm run deploy:production:functions` - Deploy apenas functions produção

3. **`.env.staging`** - Arquivo de configuração criado ✅
   - ⚠️ **PREENCHER** as credenciais do Firebase
   - ⚠️ **CONFIGURAR** Stripe test keys
   - ⚠️ **ADICIONAR** Gemini API key

4. **`STAGING_CHECKLIST_servioai-staging.md`** - Guia completo de setup ✅

---

## 🚀 Como Usar os Novos Scripts

### Deploy para Staging

```powershell
# Deploy completo (hosting + functions + rules)
npm run deploy:staging

# Deploy apenas frontend
npm run deploy:staging:hosting

# Deploy apenas Cloud Functions
npm run deploy:staging:functions
```

### Deploy para Produção

```powershell
# Deploy completo (com validação automática)
npm run deploy:production

# Deploy apenas frontend
npm run deploy:production:hosting

# Deploy apenas Cloud Functions
npm run deploy:production:functions
```

---

## 🔐 Próximos Passos: Criar Projeto Staging Dedicado

**Atualmente, staging e production apontam para o mesmo projeto.** Para criar um ambiente staging verdadeiramente isolado:

### Opção 1: Criar Novo Projeto Firebase (Recomendado)

1. **Criar projeto no Firebase Console:**

   ```
   https://console.firebase.google.com/
   ```

   - Clique em "Adicionar projeto"
   - Nome sugerido: "ServioAI Staging"
   - Project ID sugerido: `servioai-staging` ou `gen-lang-client-staging`

2. **Configurar serviços no novo projeto:**
   - Habilitar Authentication (Email/Password + Google)
   - Criar banco Firestore (mesma região do prod)
   - Configurar Storage
   - Copiar regras de segurança do projeto prod

3. **Atualizar `.firebaserc`:**

   ```json
   {
     "projects": {
       "default": "gen-lang-client-0737507616",
       "production": "gen-lang-client-0737507616",
       "staging": "servioai-staging"
     }
   }
   ```

4. **Criar arquivo `.env.staging`:**

   ```bash
   # Copiar .env.example para .env.staging
   # Preencher com credenciais do projeto staging
   VITE_FIREBASE_API_KEY="chave_do_projeto_staging"
   VITE_FIREBASE_PROJECT_ID="servioai-staging"
   # ... outras variáveis
   ```

5. **Configurar Stripe em modo test:**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   ```

### Opção 2: Usar Projeto Existente

Se você preferir usar um dos projetos existentes como staging:

- `hada-prod-3250`
- `vou-ai`

Basta atualizar o `.firebaserc`:

```json
{
  "projects": {
    "default": "gen-lang-client-0737507616",
    "production": "gen-lang-client-0737507616",
    "staging": "hada-prod-3250"
  }
}
```

---

## 📋 Checklist de Configuração Staging

- [x] Adicionar aliases no `.firebaserc`
- [x] Criar scripts de deploy no `package.json`
- [x] Criar projeto Firebase dedicado: **servioai-staging**
- [x] Atualizar alias staging no `.firebaserc` com projeto correto
- [x] Criar arquivo `.env.staging` com template
- [ ] **PRÓXIMO:** Preencher credenciais no `.env.staging`
- [ ] Habilitar Authentication no Firebase Console
- [ ] Criar banco Firestore
- [ ] Habilitar Cloud Storage
- [ ] Deploy das regras de segurança
- [ ] Configurar Stripe em modo test
- [ ] Obter service account JSON
- [ ] Deploy inicial: `npm run deploy:staging`
- [ ] Testar fluxos críticos no ambiente staging
- [ ] Documentar URLs de staging (hosting, functions, etc.)

**📖 Guia detalhado:** `STAGING_CHECKLIST_servioai-staging.md`

---

## 🌐 URLs e Endpoints

### Após Deploy, suas URLs serão:

**Production:**

- Hosting: `https://gen-lang-client-0737507616.web.app`
- Functions: `https://us-central1-gen-lang-client-0737507616.cloudfunctions.net`

**Staging:**

- Hosting: `https://servioai-staging.web.app`
- Functions: `https://us-central1-servioai-staging.cloudfunctions.net`
- Console: `https://console.firebase.google.com/project/servioai-staging`

---

## 🔒 Segurança

- ✅ `.env.staging` já está no `.gitignore`
- ✅ Scripts de guardrails validam secrets antes do deploy
- ✅ `predeploy` hook roda validação completa antes de deploy production
- ⚠️ Staging não roda validação completa (deploy mais rápido para testes)

---

## 💡 Dicas

1. **Desenvolvimento local:** Continue usando `npm run dev` (porta 3000)
2. **Testar antes de staging:** Use `npm run preview` (porta 4173)
3. **Validar antes de prod:** `npm run validate:prod` roda todos os testes
4. **Ver logs:** Use `npm run gcp:logs` para ver logs do Cloud Run

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique autenticação: `npx firebase-tools login`
2. Verifique projeto ativo: `npx firebase-tools use`
3. Veja logs: `npm run gcp:logs`
4. Consulte: `DEPLOY_CHECKLIST.md` e `DOCUMENTO_MESTRE_SERVIO_AI.md`

---

**Criado em:** 07/01/2026  
**Última atualização:** 07/01/2026 - Projeto staging configurado  
**Ambiente atual:** Staging = servioai-staging | Production = gen-lang-client-0737507616  
**Status:** ✅ Projeto criado, aguardando configuração de serviços
