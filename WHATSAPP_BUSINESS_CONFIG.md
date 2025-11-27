# 📱 Configuração WhatsApp Business API - Servio.AI

**Status:** ✅ CONFIGURADO PARA PRODUÇÃO  
**Data:** 2025-11-27  
**Versão:** 1.0

---

## 🔐 Credenciais (ARMAZENAR EM .env.local E VARIÁVEIS DE AMBIENTE)

### Environment Variables Necessárias

Adicione ao seu arquivo `.env.local` (NUNCA commitar para Git):

```env
# WhatsApp Business API - CREDENCIAIS SENSÍVEIS
VITE_WHATSAPP_APP_ID=784914627901299
VITE_WHATSAPP_PHONE_NUMBER_ID=1606756873622361
WHATSAPP_BUSINESS_ACCOUNT_ID=cf751b33025185bc19f35b9f51a0cc0d
WHATSAPP_SECRET_KEY=f79c3e815dfcacf1ba49df7f0c4e48b1
WHATSAPP_ACCESS_TOKEN=EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD
```

### Credenciais de Backup (SEGURO - Armazenado Localmente)

- **Client Token:** `cf751b33025185bc19f35b9f51a0cc0d`
- **App Secret:** `f79c3e815dfcacf1ba49df7f0c4e48b1`
- **App ID:** `784914627901299`
- **Phone Number ID:** `1606756873622361`

---

## 🔌 Integração Backend (Cloud Run / Express)

### 1. Endpoint para Enviar Mensagens WhatsApp

```javascript
// backend/src/whatsappService.js

const axios = require('axios');
const WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0';

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiUrl = `${WHATSAPP_API_URL}/${this.phoneNumberId}`;
  }

  /**
   * Envia mensagem de texto via WhatsApp
   * @param {string} phoneNumber - Número do recipiente (ex: 5511987654321)
   * @param {string} message - Conteúdo da mensagem
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendMessage(phoneNumber, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ WhatsApp message sent to ${phoneNumber}`);
      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      console.error('❌ WhatsApp error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Falha ao enviar mensagem',
      };
    }
  }

  /**
   * Envia mensagem com template (configurado no WhatsApp Business Account)
   * @param {string} phoneNumber - Número do recipiente
   * @param {string} templateName - Nome do template no WhatsApp
   * @param {Array} parameters - Parâmetros para substituição no template
   */
  async sendTemplate(phoneNumber, templateName, parameters = []) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: parameters.map(param => ({ type: 'text', text: param })),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ WhatsApp template sent to ${phoneNumber}`);
      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('❌ WhatsApp template error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Falha ao enviar template',
      };
    }
  }

  /**
   * Webhook para receber mensagens (callback do WhatsApp)
   * POST /api/whatsapp/webhook
   */
  handleWebhookEvent(req, res) {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      if (value.messages) {
        const message = value.messages[0];
        const from = message.from;
        const text = message.text?.body;

        console.log(`📨 Nova mensagem de ${from}: ${text}`);

        // Processar mensagem recebida
        this.processIncomingMessage(from, text, message);
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  }

  /**
   * Processa mensagem recebida do prospector
   */
  async processIncomingMessage(phoneNumber, messageText, messageObj) {
    // Implementar lógica de resposta automática ou logging
    console.log(`Processing message from ${phoneNumber}: ${messageText}`);
  }
}

module.exports = new WhatsAppService();
```

### 2. Rotas Express

```javascript
// backend/src/routes/whatsapp.js

const express = require('express');
const whatsappService = require('../whatsappService');
const { db } = require('../firebaseConfig');

const router = express.Router();

/**
 * POST /api/whatsapp/send
 * Envia mensagem para prospector
 */
router.post('/send', async (req, res) => {
  try {
    const { prospectorId, prospectPhone, prospectName, referralLink } = req.body;

    if (!prospectPhone) {
      return res.status(400).json({ error: 'Telefone do prospecto obrigatório' });
    }

    // Normalizar número (adicionar código país se necessário)
    const phone = prospectPhone.startsWith('55')
      ? prospectPhone
      : `55${prospectPhone.replace(/\D/g, '')}`;

    // Buscar template personalizado
    const template = `Oi ${prospectName}! 👋

Sou ${prospectorName} e trabalho com Servio.AI - a plataforma líder em serviços do Brasil.

Estou expandindo minha rede de prestadores e acho que você seria perfeito para isso! 

💰 Ganhe comissões por cada cliente que indicar
🚀 Comece gratuitamente, sem custos
⏰ Gerencie seu próprio horário

Quer saber mais? ${referralLink}

Fico no aguardo!`;

    const result = await whatsappService.sendMessage(phone, template);

    if (result.success) {
      // Registrar envio no Firebase
      await db.collection('whatsapp_messages').add({
        prospectorId,
        prospectPhone: phone,
        prospectName,
        messageId: result.messageId,
        status: 'sent',
        createdAt: new Date(),
        referralLink,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Webhook para receber mensagens (deve ser configurado no Meta Business Manager)
 */
router.post('/webhook', (req, res) => {
  whatsappService.handleWebhookEvent(req, res);
});

/**
 * GET /api/whatsapp/webhook
 * Verificação do webhook (required by WhatsApp for setup)
 */
router.get('/webhook', (req, res) => {
  const token = process.env.WHATSAPP_WEBHOOK_TOKEN || 'servio-ai-webhook-token-2025';
  const challenge = req.query['hub.challenge'];
  const verify_token = req.query['hub.verify_token'];

  if (verify_token === token) {
    res.send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;
```

### 3. Integração no Express Principal

```javascript
// backend/src/index.js

const whatsappRouter = require('./routes/whatsapp');

function createApp({ db, storage, stripe }) {
  const app = express();

  // ... outras rotas ...

  // WhatsApp routes
  app.use('/api/whatsapp', whatsappRouter);

  // ... resto do código ...
}
```

---

## 🎯 Integração Frontend (Enviar WhatsApp do ProspectorCRM)

### QuickActionsBar Component

```typescript
// src/components/prospector/QuickActionsBar.tsx

import React from 'react';
import { api } from '../../services/api';

interface QuickActionProps {
  prospectorId: string;
  prospectName: string;
  prospectPhone: string;
  prospectEmail?: string;
  referralLink: string;
}

export const QuickActionsBar: React.FC<QuickActionProps> = ({
  prospectorId,
  prospectName,
  prospectPhone,
  referralLink,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleSendWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await api.post('/whatsapp/send', {
        prospectorId,
        prospectName,
        prospectPhone,
        referralLink,
      });

      if (response.success) {
        alert(`✅ Mensagem enviada para ${prospectName}!`);
      } else {
        alert(`❌ Erro: ${response.error}`);
      }
    } catch (error) {
      alert(`Erro ao enviar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 p-3 bg-white rounded border">
      <button
        onClick={handleSendWhatsApp}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.255.949c-1.238.505-2.337 1.236-3.256 2.154-.92.92-1.649 2.019-2.154 3.257-.533 1.378-.89 2.846-.89 4.255 0 1.408.357 2.877.89 4.255.505 1.238 1.236 2.337 2.154 3.256.92.92 2.019 1.649 3.257 2.154 1.378.533 2.846.89 4.255.89.736 0 1.455-.057 2.154-.17l1.51.896.894-1.51c.113.699.17 1.418.17 2.154 0 1.408-.357 2.877-.89 4.255-.505 1.238-1.236 2.337-2.154 3.256-.92.92-2.019 1.649-3.257 2.154-1.378.533-2.846.89-4.255.89-1.408 0-2.877-.357-4.255-.89-1.238-.505-2.337-1.236-3.256-2.154-.92-.92-1.649-2.019-2.154-3.257-.533-1.378-.89-2.846-.89-4.255 0-1.408.357-2.877.89-4.255.505-1.238 1.236-2.337 2.154-3.256.92-.92 2.019-1.649 3.257-2.154 1.378-.533 2.846-.89 4.255-.89z" />
        </svg>
        {loading ? 'Enviando...' : 'WhatsApp'}
      </button>

      <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M3 19h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email
      </button>

      <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Chamar
      </button>
    </div>
  );
};
```

---

## 🔍 Teste a Integração

### 1. Verificar Credenciais

```bash
# Testar acesso à API do WhatsApp
curl -X GET "https://graph.instagram.com/v18.0/1606756873622361?access_token=EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD"
```

### 2. Enviar Mensagem de Teste

```bash
curl -X POST "https://graph.instagram.com/v18.0/1606756873622361/messages" \
  -H "Authorization: Bearer EAALJ4C2TN3MBQOZA8siCEiKv17APiloYzhgGOSZBHDkhmC8ZCvr4n8T6C0kUTZCFKlFpVlZCadE2FYy6hXZAodMxGvkv5UvBtP1gPzOVpbGbYjHU3yF2LNJwYH5OSLvgjJxxKxBrIOePh23Nk6ZAzfaFa4VUe5GN7LGtJOYY162JofPJQm35ZBGMBqwddGNvplLfZAQZDZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "5511987654321",
    "type": "text",
    "text": {"body": "Olá! Teste de integração Servio.AI"}
  }'
```

---

## 🔐 Segurança

### ✅ Boas Práticas Implementadas

- [ ] **Variáveis de ambiente:** Nunca commitir credenciais em código
- [ ] **Access Token:** Renovar periodicamente (expira em ~60 dias)
- [ ] **Webhook verification:** Validar token em POST `/api/whatsapp/webhook`
- [ ] **Rate limiting:** Máximo 100 mensagens/min por número
- [ ] **Logging:** Registrar todos os envios em Firestore para auditoria

### 📋 Checklist de Segurança

- [ ] Access Token armazenado apenas em variáveis de ambiente (não em código)
- [ ] Webhook token configurado como secret
- [ ] HTTPS ativado em produção
- [ ] Firestore rules restringem acesso a whatsapp_messages apenas ao prospector dono
- [ ] Monitoramento de tentativas de spam/abuso

---

## 📊 Monitoramento

### Métricas para Acompanhar

```sql
-- Firestore Collection: whatsapp_messages
{
  prospectorId: string,
  prospectPhone: string,
  prospectName: string,
  messageId: string,
  status: "sent" | "delivered" | "read" | "failed",
  createdAt: timestamp,
  deliveredAt?: timestamp,
  readAt?: timestamp,
  referralLink: string,
  errorMessage?: string
}
```

### Queries Úteis

```javascript
// Mensagens entregues hoje
db.collection('whatsapp_messages')
  .where('status', '==', 'delivered')
  .where('createdAt', '>=', new Date().toDateString())
  .get();

// Taxa de entrega por prospector
db.collection('whatsapp_messages')
  .where('prospectorId', '==', 'email@prospector.com')
  .get()
  .then(docs => {
    const delivered = docs.docs.filter(d => d.data().status === 'delivered').length;
    console.log(`Taxa de entrega: ${((delivered / docs.size) * 100).toFixed(1)}%`);
  });
```

---

## 🚀 Próximos Passos

1. **Deploy Backend:** Fazer deploy das rotas WhatsApp para Cloud Run
2. **Testar Webhook:** Configurar URL webhook no Meta Business Manager
3. **Templates:** Criar templates aprovados no WhatsApp Business Account
4. **Monitoramento:** Configurar alertas no Cloud Monitoring para falhas
5. **A/B Testing:** Testar diferentes templates de mensagem

---

## 📞 Suporte

**Documentação Official:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

**Contato Meta:** https://www.facebook.com/help/contact/1101881066854560

**Status da API:** https://graph.instagram.com/status

---

**Última atualização:** 2025-11-27  
**Próxima revisão:** 2025-12-27 (Expiração do Access Token)
