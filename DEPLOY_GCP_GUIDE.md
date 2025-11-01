# 🔧 Guia: Configurar Variáveis de Ambiente no Cloud Run

## 📍 Você está aqui

Console do Cloud Run → servio-ai → Editar e implementar nova revisão

## ✅ Passos para Adicionar as Variáveis

### 1. Na aba atual do Cloud Run

Você já está na página correta! Vejo que está em **"Detalhes do serviço"**.

### 2. Clique em "Editar e implantar uma nova revisão"

(Botão azul no topo da página)

### 3. Role até "Variáveis de ambiente"

Você verá **"Variáveis de ambiente (1)"** - clique para expandir.

### 4. Adicione TODAS estas variáveis

Clique em **"Adicionar variável"** para cada uma:

```
Nome: API_KEY
Valor: AIzaSyBkmw_vLXnjWhHfi2dAjud-BjruOO-RUPY
```

```
Nome: GCP_STORAGE_BUCKET
Valor: servioai.firebasestorage.app
```

```
Nome: FRONTEND_URL
Valor: https://servio-ai-100025070228.us-west1.run.app
```

```
Nome: STRIPE_SECRET_KEY
Valor: sk_test_51OmPLvJEyu4utlB89Ut4+ri4ru04UX0Y90mIY3tXWnGu9guG1A2KYY1bEg6QKtRhQBgYjQvCnRtNvl_HdAQzXL96o0LontFKgu
```

```
Nome: PORT
Valor: 8080
```

### 5. Role até o final e clique em "Implantar"

Aguarde 2-3 minutos enquanto o Cloud Run:

- Cria um novo container com as variáveis
- Faz o deploy da nova revisão
- Redireciona o tráfego

### 6. Teste o Serviço

Depois do deploy:

1. **Teste a saúde do servidor:**

   ```
   https://servio-ai-100025070228.us-west1.run.app/health
   ```

   Deve retornar: `{"ok": true}`

2. **Teste o assistente de IA:**
   - Volte ao frontend: https://servio-ai-100025070228.us-west1.run.app
   - Clique em "Encontrar Profissionais" ou "Seja um Prestador"
   - Abra o assistente de criação de job
   - O erro "A comunicação com o servidor falhou" deve sumir!

---

## 🔒 Segurança das Chaves

✅ **Chaves públicas (OK compartilhar):**

- `VITE_FIREBASE_API_KEY` - Chave pública do Firebase
- `VITE_STRIPE_PUBLISHABLE_KEY` - Chave pública do Stripe

⚠️ **Chaves privadas (NUNCA commitar):**

- `API_KEY` - Gemini (já configurada)
- `STRIPE_SECRET_KEY` - Stripe (já configurada)

Estas chaves privadas devem estar APENAS:

- No Cloud Run (variáveis de ambiente)
- No `.env.local` (seu ambiente local, já no .gitignore)

---

## 📊 Status Atual

✅ Código corrigido (server.cjs funcionando)
✅ Dependências instaladas
✅ Testes passando
✅ Documentação completa
⏳ **Aguardando:** Você configurar as variáveis no Console do GCP

---

## 🆘 Se der erro

1. **Verifique os logs:**
   Cloud Run → servio-ai → Registros

2. **Verifique as variáveis:**
   Cloud Run → servio-ai → Revisões → servio-ai-00003-fic → Variáveis de ambiente

3. **Consulte o troubleshooting:**
   Ver arquivo `TROUBLESHOOTING.md` no repositório
