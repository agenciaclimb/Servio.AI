# Configuração Firebase Auth - Domínios Autorizados

## Ação Necessária (Manual)

Adicione os seguintes domínios aos **Authorized domains** no Firebase Authentication:

### Link Direto:

https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/settings

### Domínios para Adicionar:

1. **servio-ai.com** ✅ (domínio principal)
2. **www.servio-ai.com** ✅ (com www)
3. **api.servio-ai.com** ✅ (backend API)

### Passo a Passo:

1. Acesse o link acima
2. Role até a seção "Authorized domains"
3. Clique em "Add domain"
4. Digite: `servio-ai.com`
5. Clique em "Add"
6. Repita para `www.servio-ai.com`
7. Repita para `api.servio-ai.com`

### Domínios Atuais (já autorizados):

- localhost
- gen-lang-client-0737507616.firebaseapp.com
- gen-lang-client-0737507616.web.app

### Resultado Esperado:

Após adicionar, você poderá fazer login com Google usando o domínio `servio-ai.com` sem erros de domínio não autorizado.

---

**Status:** ⏳ AGUARDANDO AÇÃO MANUAL
**Estimativa:** 2-3 minutos
