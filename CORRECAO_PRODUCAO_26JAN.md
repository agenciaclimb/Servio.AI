# Correção Crítica - Produção 26/01/2026

## 🚨 Problemas Identificados

### 1. **Erro CORS - Acessando Staging ao invés de Produção**

```
Access to fetch at 'https://us-central1-servioai-staging.cloudfunctions.net/users'
from origin 'https://gen-lang-client-0737507616.web.app' has been blocked by CORS
```

**Causa**: Variáveis `VITE_FIREBASE_*` não estavam no `.env`, então o Firebase SDK inicializou com `undefined` e caiu em fallback para staging.

### 2. **Erro 404 - Endpoint E-commerce**

```
/api/ecommerce/products?limit=12: 404
```

**Causa**: Backend não tem rota `/api/ecommerce/products` implementada.

### 3. **CSP Violation - Kaspersky Script**

```
Loading 'https://gc.kis.v2.scr.kaspersky-labs.com/...' violates Content Security Policy
```

**Causa**: Extensão do Kaspersky tentando injetar script bloqueado por CSP do site.

---

## ✅ Correções Aplicadas

### 1. Atualizado `.env` com Credenciais de Produção

```env
# Firebase Config - PRODUÇÃO (gen-lang-client-0737507616)
VITE_FIREBASE_API_KEY=[OBTER DO FIREBASE CONSOLE]
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0737507616.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0737507616
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0737507616.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1000250760228
VITE_FIREBASE_APP_ID=1:1000250760228:web:af4350677e8b85f1e29f40
VITE_FIREBASE_MEASUREMENT_ID=G-LJDX0QR8RN
```

---

## 📋 Próximas Ações

### AÇÃO 1: Obter Firebase API Key (URGENTE)

1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/settings/general
2. Role até "Seus apps"
3. Clique no app Web (ícone `</>`)
4. Copie o valor de `apiKey` da `firebaseConfig`
5. Cole no `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   ```

### AÇÃO 2: Rebuild e Redeploy

```powershell
# Rebuild com variáveis corretas
npm run build

# Redeploy
npx firebase-tools deploy --only hosting
```

### AÇÃO 3: Implementar Rota E-commerce (Opcional - Baixa Prioridade)

Se a funcionalidade de e-commerce for necessária:

1. Adicionar rota no backend: `backend/src/routes/ecommerce.js`
2. Implementar endpoint: `GET /api/ecommerce/products`
3. Deploy backend atualizado

**Alternativa**: Remover componente de e-commerce da home page se não for usado.

### AÇÃO 4: CSP - Nenhuma ação necessária

O erro do Kaspersky é esperado - extensões de antivírus não devem modificar nosso site. O CSP está protegendo corretamente contra scripts não autorizados.

---

## 🔍 Verificação Pós-Deploy

Após aplicar AÇÃO 1 e AÇÃO 2, verificar no console do navegador:

✅ **Sucesso esperado**:

```
🔧 API SERVICE INICIADO - VERSÃO 2026-01-26
📋 STAGING_MODE: false
📋 Project ID: gen-lang-client-0737507616
📋 Backend URL: https://servio-backend-h5ogjon7aa-uw.a.run.app
```

✅ **Sem erros CORS** para `servioai-staging`

✅ **Apenas 404 do /api/ecommerce/products** (se não implementado)

---

## 🎯 Status Atual

- [ ] Firebase API Key obtida
- [ ] Rebuild executado
- [ ] Redeploy completo
- [ ] Verificação no navegador
- [ ] Teste de criação de serviço

**Documentado por**: GitHub Copilot  
**Data**: 26/01/2026  
**Prioridade**: CRÍTICA - Sistema em produção com configuração incorreta
