# 🚀 Stripe - Guia Rápido de 5 Minutos

## ✅ O que já está pronto

- ✅ Chaves configuradas (test mode)
- ✅ Webhook endpoint funcionando
- ✅ Código implementado e testado (81/81 testes)
- ✅ Stripe.js carregado

## ⚡ O que falta (5-10 minutos)

### Passo 1: Configurar Stripe Connect (5 min)

**Por que precisa**: Permite que prestadores recebam pagamentos.

**Como fazer**:

1. Abra: https://dashboard.stripe.com/test/connect/accounts/overview

2. Se aparecer "Get started", clique e:
   - Escolha: **Standard** account type
   - Preencha informações básicas da empresa (pode ser dados de teste)

3. Vá em: **Settings** (canto superior direito) → **Redirect URIs**

4. Clique em **+ Add URI** e adicione (um por vez):

   ```
   http://localhost:3000/dashboard?stripe_onboarding_complete=true
   http://localhost:3000/onboarding-stripe/refresh
   ```

5. Salve cada URI

✅ **Pronto!** Agora prestadores podem conectar suas contas.

---

### Passo 2: Verificar Webhook (2 min)

**Por que precisa**: Garante que pagamentos sejam processados corretamente.

**Como fazer**:

1. Abra: https://dashboard.stripe.com/test/webhooks

2. Verifique se existe um webhook com URL:

   ```
   https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook
   ```

3. **Se não existir**, clique em **+ Add endpoint**:
   - Endpoint URL: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`
   - Description: `SERVIO.AI Production Webhook`
   - Events to send: Selecione estes (use o filtro para encontrar):
     - `checkout.session.completed` ⭐ CRÍTICO
     - `payment_intent.succeeded`
     - `payment_intent.created`
     - `charge.updated`
   - Clique em **Add endpoint**

4. **Se já existir**, clique nele e verifique:
   - ✅ Status: **Enabled**
   - ✅ Events: Os 4 eventos acima estão marcados
   - ✅ Signing secret: Se precisar atualizar, copie o `whsec_...` e rode:
     ```powershell
     gcloud run services update servio-backend --region=us-west1 --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_COLE_AQUI"
     ```

✅ **Pronto!** Webhook configurado.

---

### Passo 3: Testar (3 min)

**Por que precisa**: Garantir que tudo funciona antes de ir para produção.

**Como fazer**:

1. **Inicie o app**:

   ```powershell
   npm run dev
   ```

2. **Acesse**: http://localhost:3000

3. **Teste básico**:
   - Crie uma conta (email teste)
   - Crie um job (pode usar o wizard de IA)
   - ✅ Se chegou até aqui sem erros, frontend está OK!

4. **Teste completo** (opcional, precisa de 2 usuários):
   - Janela 1: Cliente cria job
   - Janela 2 (anônima): Prestador conecta Stripe e envia proposta
   - Janela 1: Cliente aceita e paga com cartão teste: `4242 4242 4242 4242`
   - ✅ Se pagamento funcionou, tudo OK!

---

## 🎉 Está pronto!

Após esses 3 passos:

### ✅ Configuração Completa (Test Mode)

- Chaves configuradas
- Webhook funcionando
- Stripe Connect ativo
- Testado localmente

### 📋 Próximos Passos (Quando Pronto para Produção)

1. **Trocar chaves de teste por produção**:

   ```bash
   # .env.local
   VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."

   # Cloud Run
   gcloud run services update servio-backend --set-env-vars="STRIPE_SECRET_KEY=sk_live_..."
   ```

2. **Criar webhook de produção**:
   - https://dashboard.stripe.com/webhooks (sem /test/)
   - Mesmo processo, mas com chaves live

3. **Ativar Stripe Connect em produção**:
   - Verificar conta da empresa
   - Submeter documentos necessários
   - Aguardar aprovação do Stripe

---

## 🆘 Problemas Comuns

### "Webhook signature verification failed"

```powershell
# Copie o signing secret do Dashboard e atualize:
gcloud run services update servio-backend --region=us-west1 --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_COLE_AQUI"
```

### "No such destination" ao liberar pagamento

- Prestador precisa completar onboarding do Stripe Connect
- Verificar se `user.stripeAccountId` existe no Firestore

### Página não carrega após pagamento

- Verificar se URL de redirecionamento está correta no código
- Ver console do navegador (F12) para erros

---

## 📚 Documentação Detalhada

Se precisar de mais detalhes:

- **STRIPE_RESUMO.md** - Status e troubleshooting
- **STRIPE_SETUP_GUIDE.md** - Guia passo a passo completo
- **STRIPE_CONFIG_STATUS.md** - Comandos e verificações
- **DEPLOY_CHECKLIST.md** - Checklist de deploy

---

## ✅ Checklist Rápido

- [ ] Stripe Connect configurado (5 min)
- [ ] Webhook verificado no Dashboard (2 min)
- [ ] App testado localmente (3 min)
- [ ] Documentação revisada ✅

---

**Total**: ~10 minutos para configuração completa

**Status Atual**: 90% pronto | Falta: Stripe Connect + Verificação do Webhook

**Última atualização**: 13/11/2025 17:00
