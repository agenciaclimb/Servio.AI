# 🔴 Stripe Connect - Configuração Necessária

**Data**: 19/11/2025  
**Status**: ⚠️ **REQUER CONFIGURAÇÃO NO DASHBOARD**

---

## 🚫 Limitação da CLI

**Por que não pode ser feito 100% via CLI:**

O Stripe Connect requer aprovação e aceite de termos de responsabilidade legal que **só podem ser feitos pelo Dashboard web** por questões de:
- Compliance legal
- Segurança
- Verificação de identidade
- Aceite de termos de uso

Link do erro: https://dashboard.stripe.com/settings/connect/platform-profile

---

## ✅ O QUE JÁ FOI FEITO VIA CLI

- ✅ Webhook de produção criado
- ✅ Signing secret configurado
- ✅ 10 eventos críticos habilitados
- ✅ Backend atualizado com variáveis
- ✅ Chaves live em todos ambientes
- ✅ Script de teste criado: `scripts/test-stripe-connect.ps1`

---

## ⚠️ O QUE VOCÊ PRECISA FAZER (5-10 minutos)

### Passo 1: Configurar Platform Profile (5 min)

```
1. Acesse: https://dashboard.stripe.com/settings/connect/platform-profile

2. Preencha as informações:
   • Platform name: Servio.AI
   • Platform type: Marketplace
   • Industry: Professional Services
   • Website: https://servio.ai
   • Support email: seu@email.com

3. Aceite os termos de responsabilidade

4. Submit/Save
```

### Passo 2: Adicionar Redirect URIs (5 min)

```
1. Vá em: https://dashboard.stripe.com/settings/connect

2. Procure "Redirect URIs"

3. Clique "+ Add URI" e adicione:

   PRODUÇÃO:
   https://servio.ai/dashboard?stripe_onboarding_complete=true
   https://servio.ai/onboarding-stripe/refresh

   DESENVOLVIMENTO:
   http://localhost:3000/dashboard?stripe_onboarding_complete=true
   http://localhost:3000/onboarding-stripe/refresh

4. Salve cada URI
```

### Passo 3: Verificar Capabilities (2 min)

```
1. Ainda em Settings → Connect

2. Verifique se estão habilitados:
   ✅ Transfers
   ✅ Card payments

3. Se não estiverem, habilite-os
```

---

## 🧪 DEPOIS DE CONFIGURAR: Teste Automatizado

Execute o script que criei:

```powershell
cd scripts
.\test-stripe-connect.ps1
```

**O que o script faz**:
- ✅ Verifica webhook ativo
- ✅ Lista contas Connect criadas
- ✅ Mostra eventos recentes
- ✅ Gera relatório de status
- ✅ Fornece próximos passos

---

## 📋 Checklist Completo

### Configuração Inicial (Dashboard - 10 min)
- [ ] Platform Profile configurado
- [ ] Termos aceitos
- [ ] Redirect URIs adicionados (4 URIs)
- [ ] Capabilities habilitados (Transfers, Card payments)

### Teste Manual (App - 1 hora)
- [ ] Criar conta como prestador
- [ ] Conectar Stripe via onboarding
- [ ] Verificar stripeAccountId salvo no Firestore
- [ ] Criar job como cliente
- [ ] Enviar proposta como prestador
- [ ] Aceitar proposta e pagar
- [ ] Verificar escrow criado
- [ ] Finalizar job e liberar pagamento
- [ ] Verificar transferência no Dashboard Stripe

### Validação (Script - 2 min)
- [ ] Executar `test-stripe-connect.ps1`
- [ ] Verificar relatório gerado
- [ ] Confirmar 0 erros

---

## 🎯 RESUMO EXECUTIVO

### O que impede lançamento 100%?

**APENAS**: Configuração do Platform Profile no Dashboard Stripe (5-10 minutos de trabalho manual)

### Por que é necessário?

Sem isso, prestadores não conseguem:
- Criar contas Connect
- Receber pagamentos
- Completar onboarding

### Pode testar sem isso?

**SIM**, em modo test. Mas para produção (live mode), é obrigatório.

### Quanto tempo leva?

**5-10 minutos** no Dashboard + **1 hora** de testes

---

## 🚀 APÓS CONFIGURAR

1. **Execute o script**:
   ```powershell
   .\scripts\test-stripe-connect.ps1
   ```

2. **Siga o GUIA_LANCAMENTO_100_PORCENTO.md**
   - Passo 1.5: Testar onboarding (1h)
   - Passo 2: Teste E2E completo (1h)
   - Passo 3: Validação final (15 min)

3. **Deploy e monitoramento**

---

## 📞 Links Importantes

- **Platform Profile**: https://dashboard.stripe.com/settings/connect/platform-profile
- **Connect Settings**: https://dashboard.stripe.com/settings/connect
- **Documentação**: https://stripe.com/docs/connect/enable-payment-acceptance-guide
- **Guia Completo**: `GUIA_LANCAMENTO_100_PORCENTO.md`

---

## 💡 O que automatizei via CLI

Criei o script `scripts/test-stripe-connect.ps1` que:

✅ Verifica automaticamente toda configuração  
✅ Lista contas Connect criadas  
✅ Mostra eventos recentes  
✅ Cria links de onboarding  
✅ Gera relatório completo  
✅ Indica próximos passos  

**Use sempre que precisar verificar o status!**

---

## 🎉 CONCLUSÃO

**95% está pronto**. Apenas 5-10 minutos de configuração manual no Dashboard para 100%.

**Próxima ação**: Acesse o link do Platform Profile e complete a configuração.

---

**Última Atualização**: 19/11/2025 22:54  
**Script Criado**: ✅ `scripts/test-stripe-connect.ps1`  
**Status**: ⚠️ Aguardando configuração Dashboard
