# 🚀 GUIA RÁPIDO: LANÇAMENTO 100%

**Tempo Total**: 3-4 horas  
**Data**: 19/11/2025

---

## ✅ STATUS ATUAL: 95% PRONTO

### O que já está configurado

✅ **Webhook Servio.AI está ATIVO**

- ID: `we_1SVJo4JEyu4utIB8YxuJEX4H`
- URL: https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook
- Status: Enabled
- 10 eventos configurados
- Endpoint testado e respondendo

✅ **Infraestrutura completa**

- Chaves live configuradas
- Backend deployado
- Signing secret configurado
- Monitoramento ativo

---

## 🎯 O QUE FALTA: 3 PASSOS PARA 100%

### PASSO 1: STRIPE CONNECT (2 horas) - CRÍTICO

**Por que é necessário**: Sem isso, prestadores não conseguem receber pagamentos.

#### 1.1 Acessar Stripe Connect (5 min)

```
1. Acesse: https://dashboard.stripe.com/connect/accounts/overview
2. Se aparecer "Get started", clique
3. Se já estiver ativo, pule para 1.2
```

#### 1.2 Configurar Conta (15 min)

**Opção A - Se pedir configuração inicial**:

```
1. Escolha: "Platform" (para marketplace)
2. Business Type: "Company" ou "Individual"
3. Preencha informações básicas:
   - Nome da empresa: Servio.AI
   - País: Brasil
   - Email de suporte: seu@email.com
4. Submit
```

**Opção B - Se já estiver configurado**:

```
✅ Pule para o passo 1.3
```

#### 1.3 Adicionar Redirect URIs (10 min)

```
1. No Dashboard → Connect → Settings → Redirect URIs
2. Clique "+ Add URI"
3. Adicione estas URLs (uma por vez):

   PRODUÇÃO:
   https://servio.ai/dashboard?stripe_onboarding_complete=true
   https://servio.ai/onboarding-stripe/refresh

   DESENVOLVIMENTO (opcional):
   http://localhost:3000/dashboard?stripe_onboarding_complete=true
   http://localhost:3000/onboarding-stripe/refresh

4. Salve cada URI
```

#### 1.4 Verificar Capabilities (5 min)

```
1. Dashboard → Connect → Settings → Capabilities
2. Verificar se estão habilitados:
   ✅ Transfers
   ✅ Card payments

Se não estiverem, habilite-os.
```

#### 1.5 Testar Onboarding (1 hora)

**IMPORTANTE**: Este é o teste mais crítico

```bash
# Teste via aplicação local
npm run dev
```

**Fluxo de teste**:

```
1. Acesse http://localhost:3000
2. Crie uma conta como PRESTADOR
3. No dashboard do prestador, procure por "Conectar Stripe" ou similar
4. Clique e complete o onboarding Stripe:
   - Preencha informações pessoais (pode usar dados teste)
   - Adicione conta bancária (use conta teste)
   - Complete verificação
5. Verifique se voltou para o dashboard
6. Abra Firestore Console
7. Verifique se o campo `stripeAccountId` foi salvo no perfil do usuário
```

**Resultado esperado**:

```
✅ stripeAccountId: acct_XXXXXXXXXXXXX (salvo no Firestore)
✅ Redirecionamento funcionou
✅ Usuário vê status "Conta Stripe conectada"
```

---

### PASSO 2: TESTE E2E COMPLETO (1 hora) - CRÍTICO

**Objetivo**: Validar fluxo completo job → pagamento → transferência

#### 2.1 Setup (10 min)

```bash
# Garantir que app está rodando
npm run dev

# Em outro terminal, iniciar backend local (se necessário)
cd backend
npm run dev
```

#### 2.2 Fluxo Cliente (15 min)

```
1. Acesse http://localhost:3000
2. Login como CLIENTE (ou crie conta nova)
3. Criar novo job:
   - Use o wizard de IA
   - Categoria: qualquer
   - Descrição: "Teste E2E pagamento"
   - Valor: R$ 100,00
   - Publicar job
4. Verifique job no dashboard
```

#### 2.3 Fluxo Prestador (15 min)

```
1. Abra janela anônima/incógnita
2. Acesse http://localhost:3000
3. Login como PRESTADOR (ou crie conta)
4. IMPORTANTE: Conecte Stripe (se não fez no Passo 1.5)
5. Procure o job criado pelo cliente
6. Enviar proposta:
   - Valor: R$ 100,00
   - Descrição: "Proposta teste"
   - Submeter
```

#### 2.4 Fluxo Pagamento (20 min)

```
1. Volte para janela do CLIENTE
2. Refresh dashboard
3. Veja a proposta do prestador
4. Clique "Aceitar Proposta"
5. Será redirecionado para Stripe Checkout
6. Preencha com cartão TESTE:
   - Número: 4242 4242 4242 4242
   - Validade: 12/30 (qualquer futura)
   - CVV: 123
   - Nome: Teste E2E
7. Completar pagamento
8. Aguarde redirecionamento de volta
9. Verifique se job mudou para "Em Progresso"
```

#### 2.5 Verificar Webhook (10 min)

```bash
# Ver logs do Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend AND textPayload=~'webhook'" --limit 10 --format="table(timestamp, textPayload)"

# Verificar Firestore
# Abra: https://console.firebase.google.com
# Vá em: Firestore → escrows
# Procure pelo escrow do job
# Verifique: status deve ser "pago"
```

#### 2.6 Finalizar Job e Liberar Pagamento (10 min)

```
1. Na janela do CLIENTE
2. Marque job como "Concluído"
3. Submeta review/rating (5 estrelas)
4. Confirme finalização
5. Verifique mensagem de sucesso
```

#### 2.7 Verificar Transferência (10 min)

```
1. Abra: https://dashboard.stripe.com/test/transfers
2. Procure pela transferência mais recente
3. Verifique:
   ✅ Amount: R$ 100,00
   ✅ Destination: acct_XXX (do prestador)
   ✅ Status: Paid

4. No Firestore:
   - Verifique escrow.status: "liberado"
   - Verifique job.status: "concluido"
```

**Se tudo funcionou**: ✅ SISTEMA 100% FUNCIONAL!

---

### PASSO 3: TESTE WEBHOOK VIA DASHBOARD (15 min) - VALIDAÇÃO

```
1. Acesse: https://dashboard.stripe.com/webhooks

2. Encontre o webhook do Servio.AI:
   ID: we_1SVJo4JEyu4utIB8YxuJEX4H

3. Clique no webhook

4. Clique em "Send test webhook"

5. Selecione evento: "checkout.session.completed"

6. Clique "Send test event"

7. Aguarde resposta

8. Resultado esperado:
   ✅ Status: 200 OK
   ✅ Response time: < 1s
   ✅ No errors
```

**Se retornar 200 OK**: ✅ WEBHOOK VALIDADO!

---

## 📋 CHECKLIST FINAL ANTES DO LANÇAMENTO

### Stripe

- [ ] Connect configurado
- [ ] Redirect URIs adicionados
- [ ] Teste de onboarding prestador OK
- [ ] Teste E2E completo passou
- [ ] Webhook testado via Dashboard (200 OK)
- [ ] Transferência funcionando

### Código

- [ ] Build produção sem erros: `npm run build`
- [ ] Testes passando: `npm test`
- [ ] Variáveis de ambiente atualizadas

### Deploy

- [ ] Backup Firestore realizado
- [ ] Deploy para produção
- [ ] Smoke tests executados
- [ ] Monitoramento verificado

---

## 🚀 DEPLOY PARA PRODUÇÃO (30 min)

Quando tudo estiver OK nos testes:

```bash
# 1. Build final
npm run build

# 2. Deploy frontend
firebase deploy --only hosting

# 3. Verificar
# Acesse: https://servio.ai
# Execute smoke tests básicos

# 4. Monitorar primeira hora
# Ver métricas no Google Cloud Console
# Responder feedback de usuários
```

---

## 🎉 RESULTADO ESPERADO

Após completar todos os passos:

✅ Sistema 100% funcional
✅ Prestadores podem receber pagamentos
✅ Fluxo completo validado
✅ Webhook processando corretamente
✅ Transferências automáticas funcionando
✅ Pronto para lançamento público

---

## 🆘 TROUBLESHOOTING

### Webhook não processa

```bash
# Verificar secret
gcloud run services describe servio-backend --region=us-west1 | grep STRIPE_WEBHOOK_SECRET

# Se não estiver, configurar
gcloud run services update servio-backend --region=us-west1 --set-env-vars="STRIPE_WEBHOOK_SECRET=whsec_FIZOs8ismaBk0sgTUVyAUiPg2Cg28bpW"
```

### Transferência falha

```
Causa: Prestador não completou onboarding
Solução: Prestador precisa conectar conta Stripe no dashboard
```

### Onboarding não redireciona

```
Causa: Redirect URI não configurado
Solução: Adicionar URI no Dashboard → Connect → Settings
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique logs do Cloud Run
2. Consulte `LANCAMENTO_CHECKLIST.md`
3. Revise `STRIPE_SETUP_GUIDE.md`
4. Veja documentação do Stripe

---

**Boa sorte com o lançamento! 🚀**

**Tempo total estimado**: 3-4 horas para 100% funcional
**Prioridade**: Começar AGORA pelo Stripe Connect (Passo 1)
