# 🔧 Guia de Troubleshooting - Servio.AI

## Erro: "A comunicação com o servidor falhou"

### Sintomas

- Modal do assistente de IA mostra erro vermelho
- Console do navegador mostra falha na conexão
- URL: `servio-ai-*.us-west1.run.app`

### Causa Raiz

O serviço no **Cloud Run** não tem as variáveis de ambiente configuradas, especialmente a `API_KEY` necessária para o Gemini.

### Solução

1. **Acesse o Console do GCP**

   ```
   https://console.cloud.google.com/run
   ```

2. **Selecione seu serviço** (ex: `servio-ai`)

3. **Clique em "Edit & Deploy New Revision"**

4. **Vá para "Variables & Secrets"**

5. **Adicione as variáveis obrigatórias:**

   ```
   API_KEY = sua_chave_gemini_aqui
   STRIPE_SECRET_KEY = sk_test_ou_sk_live_...
   GCP_STORAGE_BUCKET = seu-projeto.appspot.com
   FRONTEND_URL = https://seu-frontend.web.app
   ```

6. **Deploy** → Aguarde a nova revisão ficar ativa

7. **Teste novamente**

### Verificação Local

Para testar localmente antes de fazer deploy:

```bash
# 1. Configure as variáveis no .env.local (copie de .env.example)
cp .env.example .env.local

# 2. Edite .env.local com suas chaves reais

# 3. Inicie o servidor de IA
npm run start:ai

# 4. Em outro terminal, inicie o backend
cd backend
npm start

# 5. Em outro terminal, inicie o frontend
npm run dev
```

Acesse: http://localhost:5173

---

## Erro: Cloud Build Falhando (3-16 segundos)

### Sintomas

- Builds no Cloud Build falham rapidamente (< 20s)
- Console do GCP mostra histórico de builds vermelhos
- Erro: "require is not defined in ES module scope"

### Causa Raiz

O `package.json` tinha `"type": "module"` (necessário para Vite/frontend), mas o servidor (`server.js`) usava CommonJS (`require`). O Cloud Build não conseguia executar o servidor.

### Solução Implementada

✅ **Já resolvido!** O servidor foi renomeado para `server.cjs` para forçar CommonJS.

Mudanças aplicadas:

- `server.js` → `server.cjs`
- Adicionadas dependências do servidor no `package.json` raiz
- Script `start` aponta para `node server.cjs`

### Próximo Deploy

O próximo deploy manual via GitHub Actions deve funcionar corretamente. Lembre-se de configurar as variáveis de ambiente no Cloud Run antes de testar.

---

## Erro: "Cannot find module" no CI/CD

### Causa

Dependências não instaladas ou `package.json` desatualizado.

### Solução

```bash
npm install
npm run test:all
```

---

## Erro: TypeScript "Cannot find name 'cy'"

### Causa

Arquivos Cypress em `doc/` sem tipos instalados.

### Solução

Já resolvido! Os tipos Cypress foram instalados e `doc/tsconfig.json` criado.

---

## Erro: Deploy falhando (IAM/Concurrent Changes)

### Causa

Múltiplos deploys simultâneos ou permissões IAM incorretas.

### Solução

1. Workflow já configurado com `concurrency` control
2. Aguarde o deploy anterior terminar antes de disparar novo
3. Verifique permissões da Service Account no IAM

---

## Erro: Testes falhando localmente

### Verificação

```bash
# Testes do frontend
npm test

# Testes do backend
npm run test:backend

# Todos os testes
npm run test:all
```

### Causa Comum

Mock do Firebase ausente ou configuração incorreta.

### Solução

Já implementado em `tests/firebaseConfig.test.ts` com mocks.

---

## 📞 Precisa de Ajuda?

1. Verifique o [Documento Mestre](doc/DOCUMENTO_MESTRE_SERVIO_AI.md)
2. Consulte os logs do Cloud Run: `gcloud run services logs read servio-ai`
3. Revise o README.md para configuração completa
