# 💳 Planos Stripe - Servio.AI

> Criado em: 13/11/2025  
> Ambiente: **Test Mode** (livemode: false)  
> Moeda: BRL (Real Brasileiro)

## 📋 Produtos e Preços Criados

### 🆓 Plano Gratuito

**Produto:**

- **Product ID:** `prod_TPwXKgJHcZoQsP`
- **Nome:** Plano Gratuito Servio.AI
- **Descrição:** Plano inicial para prestadores - 100 propostas/mês com taxa de 25%

**Configuração:**

- **Preço:** R$ 0,00/mês (sem cobrança)
- **Taxa por serviço:** 25%
- **Limite de propostas:** 100/mês
- **Prioridade em buscas:** Baixa
- **IA Assistente:** ❌ Não incluído
- **Badge:** Nenhum

**Metadata:**

```json
{
  "plan_id": "servio_free",
  "service_fee": "0.25",
  "monthly_proposals": "100",
  "priority": "low",
  "ai_assistant": "false"
}
```

---

### 💼 Plano Básico

**Produto:**

- **Product ID:** `prod_TPwYhvjMQ4aYvX`
- **Nome:** Plano Básico Servio.AI
- **Descrição:** Plano para prestadores profissionais - Propostas ilimitadas, taxa de 20%, IA assistente

**Preço:**

- **Price ID:** `price_1ST6fHJEyu4utIB8pRlr4vAy`
- **Valor:** R$ 29,90/mês
- **Tipo:** Recorrente mensal
- **Nickname:** Plano Básico Mensal

**Configuração:**

- **Taxa por serviço:** 20%
- **Limite de propostas:** Ilimitado
- **Prioridade em buscas:** Média
- **IA Assistente:** ✅ Incluído
- **Badge:** "Verificado"
- **Suporte:** Prioritário

**Metadata:**

```json
{
  "plan_id": "servio_basic",
  "service_fee": "0.20",
  "monthly_proposals": "unlimited",
  "priority": "medium",
  "ai_assistant": "true",
  "badge": "Verificado"
}
```

---

### ⭐ Plano Pro

**Produto:**

- **Product ID:** `prod_TPwbRoHQvPIHqD`
- **Nome:** Plano Pro Servio.AI
- **Descrição:** Plano premium - Taxa de 15%, destaque em buscas, analytics avançado, IA assistente

**Preço:**

- **Price ID:** `price_1ST6iGJEyu4utIB8k0UuBCWM`
- **Valor:** R$ 79,90/mês
- **Tipo:** Recorrente mensal
- **Nickname:** Plano Pro Mensal

**Configuração:**

- **Taxa por serviço:** 15%
- **Limite de propostas:** Ilimitado
- **Prioridade em buscas:** Alta (destaque)
- **IA Assistente:** ✅ Incluído
- **Badge:** "Pro"
- **Suporte:** 24/7
- **Analytics:** Avançado

**Metadata:**

```json
{
  "plan_id": "servio_pro",
  "service_fee": "0.15",
  "monthly_proposals": "unlimited",
  "priority": "high",
  "ai_assistant": "true",
  "badge": "Pro",
  "featured": "true"
}
```

---

## 🔧 Como Usar no Código

### Frontend (criar sessão de checkout)

```typescript
// src/services/stripeService.ts

export const STRIPE_PLANS = {
  FREE: {
    productId: 'prod_TPwXKgJHcZoQsP',
    priceId: null, // Plano gratuito não tem preço
    name: 'Gratuito',
    price: 0,
    serviceFee: 0.25,
    features: ['100 propostas/mês', 'Perfil básico', 'Suporte por email'],
  },
  BASIC: {
    productId: 'prod_TPwYhvjMQ4aYvX',
    priceId: 'price_1ST6fHJEyu4utIB8pRlr4vAy',
    name: 'Básico',
    price: 29.9,
    serviceFee: 0.2,
    features: ['Propostas ilimitadas', 'Badge Verificado', 'IA Assistente', 'Suporte prioritário'],
  },
  PRO: {
    productId: 'prod_TPwbRoHQvPIHqD',
    priceId: 'price_1ST6iGJEyu4utIB8k0UuBCWM',
    name: 'Pro',
    price: 79.9,
    serviceFee: 0.15,
    features: [
      'Propostas ilimitadas',
      'Badge Pro',
      'Destaque em buscas',
      'IA Assistente',
      'Analytics avançado',
      'Suporte 24/7',
    ],
  },
};

// Criar sessão de upgrade para plano pago
export async function createSubscriptionCheckout(priceId: string, userId: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/create-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      userId,
      successUrl: `${window.location.origin}/provider/subscription/success`,
      cancelUrl: `${window.location.origin}/provider/subscription`,
    }),
  });

  const { sessionId } = await response.json();
  return sessionId;
}
```

### Backend (criar checkout de assinatura)

```javascript
// backend/src/index.js

const STRIPE_PLANS = {
  FREE: { productId: 'prod_TPwXKgJHcZoQsP', serviceFee: 0.25 },
  BASIC: {
    productId: 'prod_TPwYhvjMQ4aYvX',
    priceId: 'price_1ST6fHJEyu4utIB8pRlr4vAy',
    serviceFee: 0.2,
  },
  PRO: {
    productId: 'prod_TPwbRoHQvPIHqD',
    priceId: 'price_1ST6iGJEyu4utIB8k0UuBCWM',
    serviceFee: 0.15,
  },
};

// Endpoint para criar sessão de assinatura
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: req.body.email, // ou buscar do Firestore
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        type: 'subscription',
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Erro ao criar sessão de assinatura:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler - adicionar tratamento para eventos de assinatura
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        if (session.mode === 'subscription') {
          // Atualizar plano do prestador no Firestore
          await db
            .collection('users')
            .doc(session.client_reference_id)
            .update({
              subscriptionId: session.subscription,
              subscriptionStatus: 'active',
              plan: getPlanFromPriceId(session.line_items.data[0].price.id),
              updatedAt: new Date().toISOString(),
            });
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        // Atualizar status da assinatura
        await updateSubscriptionStatus(subscription);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

function getPlanFromPriceId(priceId) {
  switch (priceId) {
    case 'price_1ST6fHJEyu4utIB8pRlr4vAy':
      return 'basic';
    case 'price_1ST6iGJEyu4utIB8k0UuBCWM':
      return 'pro';
    default:
      return 'free';
  }
}
```

---

## 📊 Comparação de Planos

| Recurso              | Gratuito | Básico      | Pro       |
| -------------------- | -------- | ----------- | --------- |
| **Mensalidade**      | R$ 0     | R$ 29,90    | R$ 79,90  |
| **Taxa por serviço** | 25%      | 20%         | 15%       |
| **Propostas/mês**    | 100      | Ilimitado   | Ilimitado |
| **IA Assistente**    | ❌       | ✅          | ✅        |
| **Badge**            | -        | Verificado  | Pro       |
| **Prioridade busca** | Baixa    | Média       | Alta      |
| **Analytics**        | Básico   | Básico      | Avançado  |
| **Suporte**          | Email    | Prioritário | 24/7      |

---

## 🎯 Estratégia de Adoção

### Fase 1: Aquisição (Primeiros 3 meses)

- **Foco:** Plano Gratuito generoso (100 propostas)
- **Meta:** 200+ prestadores cadastrados
- **Conversão:** 10-15% para planos pagos

### Fase 2: Monetização (Meses 4-6)

- **Foco:** Upgrade para Plano Básico
- **Incentivo:** IA assistente + badge verificado
- **Meta:** 30% dos ativos no Básico

### Fase 3: Premium (Meses 7+)

- **Foco:** Plano Pro para top performers
- **Incentivo:** Destaque em buscas + menor taxa
- **Meta:** 10% no Pro, 40% no Básico, 50% Free

---

## 🔄 Eventos Stripe Importantes

Configure no Dashboard → Webhooks → Endpoint details:

- ✅ `checkout.session.completed` - Nova assinatura
- ✅ `customer.subscription.created` - Assinatura criada
- ✅ `customer.subscription.updated` - Mudança de plano
- ✅ `customer.subscription.deleted` - Cancelamento
- ✅ `invoice.payment_succeeded` - Renovação paga
- ✅ `invoice.payment_failed` - Falha no pagamento

---

## 📝 Próximos Passos

1. ✅ Produtos criados no Stripe (test mode)
2. ⏳ Implementar UI de escolha de planos
3. ⏳ Criar endpoint `/api/create-subscription`
4. ⏳ Adicionar lógica de upgrade/downgrade
5. ⏳ Implementar controle de limite de propostas (Free)
6. ⏳ Adicionar cálculo dinâmico de taxa por plano
7. ⏳ Testar fluxo completo de assinatura
8. ⏳ Migrar para Live Mode quando estiver pronto

---

## 🚨 Importante

- Estes produtos estão em **Test Mode**
- Antes de ir para produção:
  - Recriar os mesmos produtos em Live Mode
  - Atualizar os IDs no código
  - Configurar webhook em Live Mode
  - Testar com cartões reais

---

## 📞 Suporte

- **Documentação Stripe:** https://stripe.com/docs/billing/subscriptions
- **Dashboard:** https://dashboard.stripe.com/test/products
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
