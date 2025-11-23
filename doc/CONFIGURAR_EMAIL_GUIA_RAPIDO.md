# 📧 Guia Rápido: Configurar E-mail para Envios

## ✅ Status Atual

O sistema de e-mail já está **100% implementado** no backend:

- ✅ `backend/src/gmailService.js` - Serviço completo de envio
- ✅ `backend/src/followUpService.js` - Sistema de follow-up automatizado
- ✅ Templates HTML prontos (convite prospector, follow-up, conversão)
- ✅ Script de teste completo: `backend/scripts/test_gmail.js`

**Falta apenas:** Configurar as credenciais do Gmail

---

## 🚀 Configuração Rápida (5 minutos)

### Passo 1: Criar App Password do Gmail

1. **Acesse:** https://myaccount.google.com/apppasswords
   - Se não aparecer a opção, ative primeiro a **Verificação em 2 etapas**
   - Configurações de Segurança → Verificação em duas etapas → Ativar

2. **Criar senha de app:**
   - Nome do app: `Servio.AI Backend`
   - Clique em **Criar**
   - **Copie a senha de 16 caracteres** (ex: `abcd efgh ijkl mnop`)

### Passo 2: Configurar Variáveis de Ambiente

#### Localmente (desenvolvimento):

Crie/edite o arquivo `backend/.env`:

```env
# Gmail Configuration
GMAIL_USER=seu-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**⚠️ IMPORTANTE:**

- Use o email completo (ex: `contato@servio-ai.com` ou `seu@gmail.com`)
- Cole a senha **sem espaços** (remova os espaços entre grupos de 4 letras)

#### Em Produção (Cloud Run):

```bash
# Configurar secrets no Cloud Run
gcloud run services update servio-backend \
  --update-env-vars GMAIL_USER=seu-email@gmail.com \
  --region=us-west1 \
  --project=gen-lang-client-0737507616

gcloud run services update servio-backend \
  --update-secrets=GMAIL_APP_PASSWORD=gmail-app-password:latest \
  --region=us-west1 \
  --project=gen-lang-client-0737507616
```

Ou via Secret Manager:

```bash
# Criar secret
echo -n "sua-senha-app-16-chars" | gcloud secrets create gmail-app-password \
  --data-file=- \
  --project=gen-lang-client-0737507616

# Dar permissão à Service Account do Cloud Run
gcloud secrets add-iam-policy-binding gmail-app-password \
  --member="serviceAccount:110025076228-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=gen-lang-client-0737507616
```

### Passo 3: Testar Configuração

```bash
cd backend
npm install

# Testar envio de e-mails
node scripts/test_gmail.js
```

**O que o teste faz:**

1. ✅ Verifica conexão SMTP com Gmail
2. ✅ Envia email simples de teste
3. ✅ Envia convite de prospector (template HTML)
4. ✅ Envia lembrete de follow-up
5. ✅ Envia notificação de conversão

**Resultado esperado:**

```
🧪 Testing Gmail Service...

✓ Environment variables found
  GMAIL_USER: seu-email@gmail.com
  GMAIL_APP_PASSWORD: abcd****

Test 1: Verifying SMTP connection...
✅ SMTP connection successful

Test 2: Sending simple test email...
✅ Simple email sent successfully

Test 3: Sending prospector invite email...
✅ Prospector invite email sent successfully

Test 4: Sending follow-up reminder email...
✅ Follow-up reminder email sent successfully

Test 5: Sending conversion notification email...
✅ Conversion notification email sent successfully

🎉 All tests passed! Gmail service is ready to use.

📧 Check your inbox: seu-email@gmail.com
   You should have received 4 test emails.
```

---

## 📊 Limites e Recomendações

### Limites do Gmail SMTP

| Tipo de Conta                 | Limite Diário    | Recomendação              |
| ----------------------------- | ---------------- | ------------------------- |
| Gmail Gratuito                | 500 emails/dia   | OK para testes e MVP      |
| Google Workspace              | 2.000 emails/dia | Recomendado para produção |
| Gmail com domínio customizado | 2.000 emails/dia | Ideal para marca          |

### Quando Migrar para SendGrid/Mailgun?

Migre quando precisar de:

- ✅ **> 2.000 emails/dia**
- ✅ **Analytics avançado** (open rate, click rate)
- ✅ **Webhooks** (bounce, spam reports)
- ✅ **Templates dinâmicos** no servidor
- ✅ **Múltiplos remetentes**

**Para MVP:** Gmail SMTP é **perfeito** e gratuito!

---

## 🔧 Troubleshooting

### Erro: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Causa:** Senha incorreta ou 2FA não ativado

**Solução:**

1. Ative Verificação em 2 etapas: https://myaccount.google.com/signinoptions/two-step-verification
2. Crie nova senha de app: https://myaccount.google.com/apppasswords
3. Copie a senha **sem espaços**

### Erro: "ECONNREFUSED" ou "ETIMEDOUT"

**Causa:** Firewall bloqueando porta 587 ou VPN/proxy

**Solução:**

1. Tente porta 465 (SSL):
   ```javascript
   // Em gmailService.js, mude:
   port: 465,
   secure: true,
   ```
2. Desative VPN temporariamente
3. Verifique firewall corporativo

### Erro: "Daily sending quota exceeded"

**Causa:** Atingiu o limite de 500/2.000 emails/dia

**Solução:**

1. Aguarde 24h para reset
2. Considere Google Workspace (2.000/dia)
3. Ou migre para SendGrid (100 emails/dia grátis)

### E-mails caindo em SPAM

**Solução:**

1. Configure SPF record no domínio:
   ```
   TXT @ v=spf1 include:_spf.google.com ~all
   ```
2. Configure DKIM no Gmail/Workspace
3. Use remetente verificado (ex: `noreply@servio-ai.com`)
4. Evite palavras spam no assunto
5. Inclua link de unsubscribe no rodapé

---

## 📝 Próximos Passos

### Após configurar com sucesso:

1. **Testar no backend local:**

   ```bash
   cd backend
   npm start
   # Backend rodando em http://localhost:8080

   # Testar endpoint de follow-up
   curl -X POST http://localhost:8080/api/followups/run
   ```

2. **Deploy em produção:**

   ```bash
   # Backend já está em Cloud Run
   # Adicione as env vars GMAIL_USER e GMAIL_APP_PASSWORD
   gcloud run services update servio-backend \
     --update-env-vars GMAIL_USER=seu-email@gmail.com,GMAIL_APP_PASSWORD=sua-senha \
     --region=us-west1
   ```

3. **Configurar Cloud Scheduler para follow-ups automáticos:**
   ```bash
   # Criar job que roda a cada 30 minutos
   gcloud scheduler jobs create http followup-processor \
     --schedule="*/30 * * * *" \
     --uri="https://servio-backend-h5ogjon7aa-uw.a.run.app/api/followups/run" \
     --http-method=POST \
     --location=us-west1
   ```

---

## 🎯 Resumo Executivo

### O que você precisa fazer:

1. ✅ **Ativar 2FA no Gmail** (1 min)
2. ✅ **Criar App Password** (1 min)
3. ✅ **Adicionar ao backend/.env** (30 seg)
4. ✅ **Rodar teste:** `node scripts/test_gmail.js` (1 min)
5. ✅ **Verificar inbox** - 4 emails de teste (1 min)

### Checklist Final:

- [ ] 2FA ativado no Gmail
- [ ] App Password criado
- [ ] `backend/.env` configurado
- [ ] Teste executado com sucesso
- [ ] 4 emails recebidos na inbox
- [ ] Env vars configuradas no Cloud Run (produção)
- [ ] Cloud Scheduler configurado (opcional)

---

## 📚 Documentação Relacionada

- [GMAIL_API_SETUP.md](./GMAIL_API_SETUP.md) - Guia completo com Gmail API (alternativa avançada)
- [DOCUMENTO_MESTRE_SERVIO_AI.md](./DOCUMENTO_MESTRE_SERVIO_AI.md) - Arquitetura completa
- [Nodemailer Gmail](https://nodemailer.com/usage/using-gmail/) - Documentação oficial

---

## 💡 Dicas Extras

### Para Gmail/Workspace corporativo:

Se você tem um domínio próprio (ex: `@servio-ai.com`):

1. Configure o domínio no Google Workspace
2. Crie uma conta específica: `noreply@servio-ai.com`
3. Use essa conta para o GMAIL_USER
4. Benefícios:
   - ✅ Mais profissional
   - ✅ 2.000 emails/dia
   - ✅ Melhor deliverability
   - ✅ Marca consistente

### Alternativas futuras:

Se precisar escalar além de 2.000 emails/dia:

| Serviço      | Gratuito     | Pago          | Recomendação              |
| ------------ | ------------ | ------------- | ------------------------- |
| **SendGrid** | 100/dia      | $15/mês (50k) | ⭐ Melhor custo-benefício |
| **Mailgun**  | 100/dia      | $35/mês (50k) | Bom para developers       |
| **AWS SES**  | 62k/mês      | $0.10/1k      | Mais barato em volume     |
| **Postmark** | Teste grátis | $15/mês (10k) | Melhor deliverability     |

**Para MVP (< 2.000/dia):** **Gmail SMTP é perfeito!** ✅

---

**Precisa de ajuda?** Consulte o [GMAIL_API_SETUP.md](./GMAIL_API_SETUP.md) para setup avançado com Gmail API.
