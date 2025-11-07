# 🔐 Guia de Resolução: Erro de Login dos Usuários de Teste

## ✅ Problema Resolvido

Os 3 usuários de teste agora estão sincronizados entre Firebase Auth e Firestore:

| Email               | Senha  | Tipo      | UID                          |
| ------------------- | ------ | --------- | ---------------------------- |
| cliente@servio.ai   | 123456 | cliente   | JwuW9IIu3mdHpvDEDX7J4bVUA1Y2 |
| prestador@servio.ai | 123456 | prestador | PtacTUypotN1uI42ssvrmkYXrFq2 |
| admin@servio.ai     | 123456 | admin     | H56KC0i8OVap4ALW7JGE4Fbhy2i2 |

## 🔍 Checklist de Validação (Execute na Ordem)

### 1. Verificar Provedor Email/Senha no Firebase Console

**URL:** https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/providers

**Passos:**

1. Abra o link acima
2. Procure por "Email/senha" na lista de provedores
3. Status deve estar: **✅ Ativado**
4. Se estiver desativado:
   - Clique em "Email/senha"
   - Toggle "Ativar" para ON
   - Clique em "Salvar"

### 2. Verificar Domínios Autorizados

**URL:** https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/settings

**Domínios que DEVEM estar na lista:**

- ✅ `localhost`
- ✅ `servioai.web.app`
- ✅ `servioai.firebaseapp.com`

**Como adicionar:**

1. Role até "Authorized domains"
2. Clique em "Add domain"
3. Digite o domínio e clique em "Add"

### 3. Verificar Firestore Rules

**URL:** https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore/rules

**Regra crítica para leitura de usuários:**

```javascript
match /users/{email} {
  allow read: if isSignedIn() || isAdmin();
  allow write: if isOwner(email) || isAdmin();
}
```

**Confirme que:**

- `isSignedIn()` está definido como: `request.auth != null`
- Não há regra mais restritiva bloqueando leitura

### 4. Testar Login Localmente

**Antes de testar em produção, valide local:**

```powershell
# 1. Build e preview
npm run build
npm run preview

# 2. Abra: http://localhost:4173/login
# 3. Clique em "Cliente" para preencher email/senha
# 4. Clique em "Entrar"
```

**Resultado esperado:**

- ✅ Login bem-sucedido
- ✅ Redirecionamento para `/dashboard`
- ✅ Console sem erros 404

**Se houver erro:**

- Abra DevTools (F12) → Console
- Copie a mensagem de erro exata
- Verifique a aba Network para ver qual requisição falhou

### 5. Testar Login em Produção

**URL:** https://servioai.web.app/login

**Passos:**

1. Abra em aba anônima (Ctrl+Shift+N)
2. Clique em "Cliente"
3. Clique em "Entrar"
4. Observe o comportamento

**Erros comuns e soluções:**

| Erro                         | Causa                  | Solução                                      |
| ---------------------------- | ---------------------- | -------------------------------------------- |
| `auth/operation-not-allowed` | Provedor desabilitado  | Ativar Email/senha no Console                |
| `auth/unauthorized-domain`   | Domínio não autorizado | Adicionar domínio em Authorized domains      |
| `auth/user-not-found`        | Usuário não existe     | Rodar `node scripts/create_test_users.mjs`   |
| `404 Not Found (firestore)`  | Documento não existe   | Script já criou, verificar Firestore Console |
| `auth/wrong-password`        | Senha incorreta        | Senha correta: `123456`                      |

## 🛠️ Ferramentas de Diagnóstico

### Verificar usuário no Firestore Console

**URL:** https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore/data/~2Fusers~2Fcliente@servio.ai

**O que verificar:**

- ✅ Documento existe
- ✅ Campos: `email`, `name`, `type`, `status`
- ✅ `type` = "cliente" (para cliente@servio.ai)

### Verificar usuário no Authentication Console

**URL:** https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/users

**O que verificar:**

- ✅ 3 usuários listados
- ✅ Coluna "User UID" preenchida
- ✅ Coluna "Sign-in method" = "Email/Password"

## 🚨 Se Ainda Não Funcionar

Execute o diagnóstico completo:

```powershell
# 1. Recriar usuários (força recriação)
node scripts/create_test_users.mjs

# 2. Verificar conectividade Firestore
node scripts/backend_smoke_test.mjs

# 3. Logs detalhados no preview local
npm run preview
# Abra DevTools → Console → preserve log
# Tente login e copie TODA a saída
```

**Envie para o desenvolvedor:**

- Screenshot do erro no navegador
- Output completo do Console (F12)
- Output do script `create_test_users.mjs`
- Confirmação de que provedor Email/senha está ativado

## ✅ Status Esperado Após Seguir Este Guia

- [x] Provedor Email/senha habilitado no Firebase
- [x] Domínios autorizados configurados
- [x] 3 usuários existem no Auth e Firestore
- [x] Login local funcionando (localhost:4173)
- [x] Login produção funcionando (servioai.web.app)

**Data desta verificação:** 2025-11-06  
**Última execução do script:** 2025-11-06 13:11
