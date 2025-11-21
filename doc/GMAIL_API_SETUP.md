# Gmail API Integration - Guia Completo

## 📧 Visão Geral

Usar **Gmail API** (Google Cloud) para envio de emails transacionais e marketing no Servio.AI.

**Vantagens:**
- ✅ 100% Google (já temos GCP configurado)
- ✅ Limite generoso: **500 emails/dia** por conta Gmail gratuita
- ✅ **2.000 emails/dia** com Google Workspace
- ✅ Integração nativa com OAuth2
- ✅ Sem custos adicionais (dentro do Free Tier)
- ✅ SMTP autenticado e confiável (alta deliverability)

**Alternativa:** Usar **Nodemailer + Gmail SMTP** (mais simples, mesma infraestrutura Google)

## 🎯 Estratégia Recomendada

### Opção 1: Gmail API (Mais Robusto) ⭐ RECOMENDADO
- Melhor para: Alto volume, controle fino, analytics
- Limite: 500/dia (Gmail) ou 2.000/dia (Workspace)
- Setup: OAuth2 + Service Account

### Opção 2: Nodemailer + Gmail SMTP (Mais Simples)
- Melhor para: Setup rápido, menos configuração
- Limite: 500/dia (Gmail) ou 2.000/dia (Workspace)
- Setup: App Password do Gmail

## 🚀 Implementação: Gmail API

### Passo 1: Habilitar Gmail API no GCP

```bash
# Habilitar Gmail API no projeto
gcloud services enable gmail.googleapis.com --project=gen-lang-client-0737507616

# Verificar se foi habilitada
gcloud services list --enabled --project=gen-lang-client-0737507616 | grep gmail
```

Ou via Console:
1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=gen-lang-client-0737507616)
2. Clique em **ENABLE**

### Passo 2: Criar Service Account

```bash
# Criar Service Account para envio de emails
gcloud iam service-accounts create gmail-sender \
  --display-name="Servio AI Gmail Sender" \
  --project=gen-lang-client-0737507616

# Obter email da Service Account
gcloud iam service-accounts list --project=gen-lang-client-0737507616 | grep gmail-sender
# Resultado: gmail-sender@gen-lang-client-0737507616.iam.gserviceaccount.com

# Criar chave JSON
gcloud iam service-accounts keys create gmail-sender-key.json \
  --iam-account=gmail-sender@gen-lang-client-0737507616.iam.gserviceaccount.com \
  --project=gen-lang-client-0737507616
```

### Passo 3: Configurar Domain-Wide Delegation (Workspace)

**⚠️ Requer Google Workspace** (não funciona com Gmail gratuito para Service Accounts)

Se você tem Google Workspace:

1. Acesse [Admin Console](https://admin.google.com)
2. Vá em **Security** → **API Controls** → **Domain-wide Delegation**
3. Clique em **Add New**
4. Cole o Client ID da Service Account (encontre em: Cloud Console → IAM → Service Accounts → gmail-sender)
5. OAuth Scopes:
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.compose
   ```
6. Authorize

### Passo 4: Implementar Backend Service (Gmail API)

Instalar dependências:
```bash
cd backend
npm install googleapis nodemailer
```

Criar `backend/src/emailService.js`:

```javascript
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const path = require('path');

// Option 1: Using Gmail API with Service Account + Domain-Wide Delegation
class GmailAPIService {
  constructor() {
    this.serviceAccountPath = path.join(__dirname, '../gmail-sender-key.json');
    this.senderEmail = 'noreply@servio-ai.com'; // Must be a Workspace email
  }

  async getGmailClient() {
    const auth = new google.auth.GoogleAuth({
      keyFile: this.serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      subject: this.senderEmail, // Impersonate this email
    });

    const gmail = google.gmail({ version: 'v1', auth });
    return gmail;
  }

  async sendEmail(to, subject, htmlBody, textBody) {
    try {
      const gmail = await this.getGmailClient();

      // Create email message
      const message = [
        `To: ${to}`,
        `From: Servio.AI <${this.senderEmail}>`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlBody || textBody,
      ].join('\n');

      // Encode to base64url
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send email
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log('[Gmail API] Email sent:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('[Gmail API] Error sending email:', error);
      throw error;
    }
  }
}

// Option 2: Using Nodemailer + Gmail SMTP (SIMPLER - NO WORKSPACE REQUIRED)
class GmailSMTPService {
  constructor() {
    // Create transporter using Gmail SMTP
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail: exemplo@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD, // App Password (not regular password)
      },
    });
  }

  async sendEmail(to, subject, htmlBody, textBody) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Servio.AI" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log('[Gmail SMTP] Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('[Gmail SMTP] Error sending email:', error);
      throw error;
    }
  }

  async verify() {
    try {
      await this.transporter.verify();
      console.log('[Gmail SMTP] Server is ready to send emails');
      return true;
    } catch (error) {
      console.error('[Gmail SMTP] Server verification failed:', error);
      return false;
    }
  }
}

// Choose which service to use based on environment
const emailService = process.env.USE_GMAIL_API === 'true' 
  ? new GmailAPIService() 
  : new GmailSMTPService();

module.exports = emailService;
```

### Passo 5: Templates de Email

Criar `backend/src/emailTemplates.js`:

```javascript
/**
 * Email Templates for Servio.AI
 */

function prospectorInviteEmail(prospectorName, referralLink) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Convite Especial da Servio.AI</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${prospectorName}</strong>,</p>
          
          <p>Você foi convidado para se tornar um <strong>Prospector Premium</strong> da Servio.AI!</p>
          
          <p><strong>O que você ganha:</strong></p>
          <ul>
            <li>💰 Comissão de 10% nos primeiros 3 meses de cada prestador que indicar</li>
            <li>📊 Dashboard exclusivo com analytics em tempo real</li>
            <li>🎯 Links personalizados com rastreamento de conversões</li>
            <li>🔔 Notificações push sobre cada conversão</li>
            <li>🏆 Sistema de badges e ranking</li>
          </ul>

          <p><strong>Seu link exclusivo de indicação:</strong></p>
          <p style="background: #e0e0e0; padding: 10px; border-radius: 5px; font-family: monospace;">${referralLink}</p>

          <p style="text-align: center;">
            <a href="${referralLink}" class="button">Ativar Minha Conta</a>
          </p>

          <p>Comece a indicar prestadores hoje e construa uma renda passiva!</p>

          <p>Atenciosamente,<br><strong>Equipe Servio.AI</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 Servio.AI - Marketplace Inteligente de Serviços</p>
          <p><a href="https://servio-ai.com">servio-ai.com</a> | <a href="mailto:contato@servio-ai.com">contato@servio-ai.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Olá ${prospectorName},

Você foi convidado para se tornar um Prospector Premium da Servio.AI!

O que você ganha:
- Comissão de 10% nos primeiros 3 meses de cada prestador que indicar
- Dashboard exclusivo com analytics em tempo real
- Links personalizados com rastreamento de conversões
- Notificações push sobre cada conversão
- Sistema de badges e ranking

Seu link exclusivo de indicação:
${referralLink}

Ative sua conta: ${referralLink}

Atenciosamente,
Equipe Servio.AI
  `;

  return { html, text };
}

function followUpEmail(prospectName, prospectorName, daysAgo) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; }
        .content { background: white; padding: 30px; }
        .cta { text-align: center; margin: 30px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📞 Lembrete de Follow-up</h2>
        </div>
        <div class="content">
          <p>Olá <strong>${prospectorName}</strong>,</p>
          
          <p>Você contatou <strong>${prospectName}</strong> há ${daysAgo} dias.</p>
          
          <p>É um bom momento para fazer um follow-up! Prospects que recebem follow-up têm <strong>3x mais chances</strong> de converter.</p>

          <p><strong>Sugestões de mensagem:</strong></p>
          <ul>
            <li>"Oi ${prospectName}! Conseguiu dar uma olhada na plataforma?"</li>
            <li>"Alguma dúvida que eu possa esclarecer?"</li>
            <li>"Vi que você trabalha com [serviço]. A Servio.AI pode te ajudar a conseguir mais clientes!"</li>
          </ul>

          <div class="cta">
            <a href="https://servio-ai.com/prospector-dashboard?tab=templates" class="button">Ver Templates de Mensagem</a>
          </div>

          <p>Continue assim! 🚀</p>

          <p>Equipe Servio.AI</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Olá ${prospectorName},

Você contatou ${prospectName} há ${daysAgo} dias.

É um bom momento para fazer um follow-up! Prospects que recebem follow-up têm 3x mais chances de converter.

Sugestões de mensagem:
- "Oi ${prospectName}! Conseguiu dar uma olhada na plataforma?"
- "Alguma dúvida que eu possa esclarecer?"
- "Vi que você trabalha com [serviço]. A Servio.AI pode te ajudar a conseguir mais clientes!"

Acesse templates prontos: https://servio-ai.com/prospector-dashboard?tab=templates

Continue assim!
Equipe Servio.AI
  `;

  return { html, text };
}

function conversionNotificationEmail(prospectorName, providerName, category, commissionAmount) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .commission { font-size: 32px; color: #11998e; font-weight: bold; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Conversão Confirmada!</h1>
        </div>
        <div class="content">
          <p>Parabéns, <strong>${prospectorName}</strong>!</p>
          
          <div class="highlight">
            <p><strong>${providerName}</strong> acaba de se cadastrar como <strong>${category}</strong> através do seu link de indicação!</p>
          </div>

          <p class="commission">R$ ${commissionAmount.toFixed(2)}</p>
          <p style="text-align: center; color: #666;">Comissão estimada nos próximos 3 meses</p>

          <p><strong>Próximos passos:</strong></p>
          <ol>
            <li>Sua comissão será calculada automaticamente a cada job completado pelo ${providerName}</li>
            <li>Você receberá 10% do valor que a Servio.AI ganhar nos primeiros 3 meses</li>
            <li>Acompanhe tudo em tempo real no seu dashboard</li>
          </ol>

          <p>Continue indicando e aumente seus ganhos! 💰</p>

          <p>Equipe Servio.AI</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Parabéns, ${prospectorName}!

${providerName} acaba de se cadastrar como ${category} através do seu link de indicação!

Comissão estimada: R$ ${commissionAmount.toFixed(2)} (próximos 3 meses)

Próximos passos:
1. Sua comissão será calculada automaticamente a cada job completado
2. Você receberá 10% do valor que a Servio.AI ganhar nos primeiros 3 meses
3. Acompanhe tudo em tempo real no seu dashboard

Continue indicando e aumente seus ganhos!

Equipe Servio.AI
  `;

  return { html, text };
}

module.exports = {
  prospectorInviteEmail,
  followUpEmail,
  conversionNotificationEmail,
};
```

### Passo 6: Configurar Gmail App Password

**Se usar Gmail SMTP (Opção mais simples):**

1. Acesse [Google Account](https://myaccount.google.com/)
2. Vá em **Security** → **2-Step Verification** (ative se não tiver)
3. Role até **App passwords**
4. Clique em **Select app** → **Mail**
5. Clique em **Select device** → **Other** → Digite "Servio.AI Backend"
6. Clique em **Generate**
7. Copie a senha de 16 caracteres (formato: `xxxx xxxx xxxx xxxx`)

Adicione ao `.env`:
```bash
# Backend .env
GMAIL_USER=seu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # Sem espaços: xxxxxxxxxxxxxxxx
USE_GMAIL_API=false  # Use SMTP (mais simples)
```

### Passo 7: Testar Envio

Criar `backend/scripts/test_email.js`:

```javascript
const emailService = require('../src/emailService');
const { prospectorInviteEmail } = require('../src/emailTemplates');

async function testEmail() {
  try {
    // Verify connection (SMTP only)
    if (emailService.verify) {
      const isReady = await emailService.verify();
      if (!isReady) {
        console.error('❌ Email service not ready');
        return;
      }
    }

    // Send test email
    const { html, text } = prospectorInviteEmail(
      'João Silva',
      'https://servio-ai.com/register?ref=ABC123'
    );

    await emailService.sendEmail(
      'seu-email@gmail.com', // Trocar pelo seu email de teste
      '🚀 Convite Servio.AI - Teste',
      html,
      text
    );

    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
```

Executar:
```bash
node backend/scripts/test_email.js
```

## 📊 Limites e Boas Práticas

### Limites do Gmail

| Conta | Limite Diário | Limite por Email |
|-------|---------------|------------------|
| Gmail Gratuito | 500 emails/dia | 100 destinatários |
| Google Workspace | 2.000 emails/dia | 2.000 destinatários |

### Boas Práticas

1. **Rate Limiting**: Não envie mais de 50 emails/hora
2. **SPF/DKIM**: Configure no Cloud DNS para melhor deliverability
3. **Unsubscribe**: Adicione link de descadastramento em emails marketing
4. **Bounce Handling**: Monitore emails que falham (invalid email, etc.)
5. **Warm-up**: Comece com 50 emails/dia e aumente gradualmente

### Evitar Spam

```javascript
// Rate limiter example
const rateLimit = require('express-rate-limit');

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 emails per hour
  message: 'Too many emails sent. Try again later.',
});

app.post('/api/send-email', emailLimiter, async (req, res) => {
  // Send email logic
});
```

## 🔄 Integração com Follow-up Service

Atualizar `src/services/followUpService.ts`:

```typescript
// Adicionar no início do arquivo
import emailService from '../../backend/src/emailService';
import { followUpEmail } from '../../backend/src/emailTemplates';

// Na função sendFollowUp(), adicionar:
async function sendFollowUp(schedule: FollowUpSchedule) {
  if (schedule.channel === 'email') {
    const { html, text } = followUpEmail(
      schedule.prospectName,
      schedule.prospectorName,
      schedule.daysSinceContact
    );

    await emailService.sendEmail(
      schedule.prospectEmail,
      `Follow-up: ${schedule.prospectorName} da Servio.AI`,
      html,
      text
    );
  }
}
```

## 🎯 Próximos Passos

- [ ] Configurar SPF/DKIM no Cloud DNS
- [ ] Implementar template engine (Handlebars/EJS)
- [ ] Criar dashboard de email analytics
- [ ] Adicionar A/B testing de subject lines
- [ ] Implementar bounce/complaint handling
- [ ] Migrar para Google Workspace se precisar de mais volume

## 📚 Referências

- [Gmail API Docs](https://developers.google.com/gmail/api)
- [Nodemailer Gmail](https://nodemailer.com/usage/using-gmail/)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)
