# 🔐 GUIA: Configuração Firebase Authentication

## 🎯 Objetivo

Habilitar Google Sign-In e configurar domínios autorizados para o Servio.AI.

---

## 📋 Passo 1: Habilitar Google Provider

### Via Firebase Console (Recomendado)

1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/providers

2. Na seção **"Provedores de login nativos"**, clique em **"Google"**

3. **Habilitar** o provedor:
   - Toggle: **Ativado** ✅
   - Nome do projeto público: `Servio.AI`
   - E-mail de suporte: `jeferson@jccempresas.com.br`

4. Clique em **"Salvar"**

---

## 🌐 Passo 2: Autorizar Domínios

### Adicionar Domínios de Desenvolvimento e Produção

1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/settings

2. Na aba **"Authorized domains"**, clique em **"Add domain"**

3. Adicione os seguintes domínios (um por vez):

```
localhost
127.0.0.1
gen-lang-client-0737507616.web.app
gen-lang-client-0737507616.firebaseapp.com
```

**Se você tem domínio customizado (servio.ai):**

```
servio.ai
www.servio.ai
```

4. Clique em **"Adicionar"** para cada domínio

---

## 🔑 Passo 3: Validar Variáveis de Ambiente

### Verificar `.env.local`

Abra o arquivo `c:\Users\JE\servio.ai\.env.local` e confirme que contém:

```env
# Firebase Configuration (Gen Lang Client)
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0737507616.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0737507616
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0737507616.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1000250760228
VITE_FIREBASE_APP_ID=1:1000250760228:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-...

# Backend API
VITE_BACKEND_API_URL=https://servio-backend-h5ogjon7aa-uw.a.run.app
VITE_AI_API_URL=https://servio-ai-1000250760228.us-west1.run.app
```

### Obter Configuração Correta (se necessário)

```powershell
# Via Firebase CLI
firebase apps:sdkconfig web --project gen-lang-client-0737507616
```

Ou via Console:

1. https://console.firebase.google.com/project/gen-lang-client-0737507616/settings/general
2. Rolar até **"Seus aplicativos"**
3. Selecionar o app Web
4. Copiar snippet de configuração

---

## ✅ Passo 4: Testar Google Login

### Teste Local (Development)

```powershell
# Iniciar servidor de desenvolvimento
npm run dev
```

1. Abrir: http://localhost:3000
2. Clicar em **"Login com Google"**
3. Verificar popup do Google OAuth
4. Selecionar conta e autorizar
5. Confirmar redirecionamento para dashboard

### Teste em Produção

```powershell
# Build e preview local
npm run build
npm run preview
```

1. Abrir: http://localhost:4173
2. Repetir fluxo de login
3. Verificar sem erros no console

---

## 🐛 Troubleshooting

### Erro: "operation-not-allowed"

**Causa:** Google provider não está habilitado.

**Solução:** Voltar ao Passo 1 e habilitar o provedor.

---

### Erro: "unauthorized-domain"

**Causa:** Domínio atual não está na lista de autorizados.

**Solução:**

1. Verificar URL atual no navegador
2. Adicionar domínio exato no Passo 2
3. Aguardar 2-3 minutos para propagação

---

### Erro: "invalid-api-key"

**Causa:** `VITE_FIREBASE_API_KEY` incorreta ou ausente.

**Solução:**

1. Verificar `.env.local` (Passo 3)
2. Obter key correta do Firebase Console
3. Reiniciar servidor de desenvolvimento (`npm run dev`)

---

### Erro: "popup-blocked"

**Causa:** Navegador bloqueou popup do Google OAuth.

**Solução:**

1. Permitir popups para o domínio
2. Ou usar `signInWithRedirect` (já implementado como fallback)

---

### Login funciona mas não salva usuário no Firestore

**Causa:** Firestore rules restritivas.

**Solução:**
Verificar rules em `firestore.rules`:

```javascript
match /users/{userId} {
  // Permite criar próprio documento no primeiro login
  allow create: if request.auth != null && request.auth.uid == userId;

  // Permite ler/atualizar próprio perfil
  allow read, update: if request.auth != null && request.auth.uid == userId;
}
```

Deploy das rules:

```powershell
firebase deploy --only firestore:rules --project gen-lang-client-0737507616
```

---

## 🎯 CHECKLIST DE VALIDAÇÃO

- [ ] Google provider habilitado no Firebase Console
- [ ] Domínios autorizados adicionados:
  - [ ] `localhost`
  - [ ] `127.0.0.1`
  - [ ] `gen-lang-client-0737507616.web.app`
  - [ ] `gen-lang-client-0737507616.firebaseapp.com`
  - [ ] `servio.ai` (se aplicável)
  - [ ] `www.servio.ai` (se aplicável)
- [ ] `.env.local` com todas as variáveis `VITE_FIREBASE_*`
- [ ] Teste local funcionando (popup + redirecionamento)
- [ ] Teste em preview funcionando (http://localhost:4173)
- [ ] Console do navegador sem erros Firebase
- [ ] Usuário criado no Firestore collection `users`

---

## 📝 Configurações Adicionais (Opcional)

### Email/Password Provider

Se quiser habilitar também login com e-mail:

1. Firebase Console → Authentication → Provedores
2. Clicar em **"E-mail/senha"**
3. Habilitar **"E-mail/senha"** ✅
4. (Opcional) Habilitar **"Link de e-mail (login sem senha)"**
5. Salvar

### Configurar Email Templates

1. Firebase Console → Authentication → Templates
2. Personalizar templates:
   - Verificação de e-mail
   - Redefinição de senha
   - Alteração de e-mail

---

## 🔗 Links Úteis

- **Firebase Console - Auth:** https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication
- **Firebase Docs - Google Sign-In:** https://firebase.google.com/docs/auth/web/google-signin
- **Troubleshooting Auth:** https://firebase.google.com/docs/auth/web/troubleshooting

---

**Tempo estimado:** 10-15 minutos
**Complexidade:** Baixa (configuração via interface)
