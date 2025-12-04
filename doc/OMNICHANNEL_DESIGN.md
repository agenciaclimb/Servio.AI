# Omnichannel Design Document - Servio.AI

## 1. Visão Geral

O módulo Omnichannel unifica comunicações multi-canal para a plataforma Servio.AI, integrando WhatsApp, Instagram, Facebook Messenger e WebChat em uma única interface gerenciada por IA.

**Objetivos**:
- Centralizar todas as conversas em um único painel (OmniInbox)
- Automatizar respostas contextuais via Gemini AI
- Personalizar comunicação baseada em persona do usuário (cliente | prestador | prospector | admin)
- Automatizar follow-ups estratégicos
- Monitorar saúde e performance dos canais

## 2. Arquitetura

### 2.1 Stack Tecnológica

- **Backend**: Node.js + Express (Cloud Run)
- **IA**: Google Gemini 2.0 Flash Exp
- **Database**: Cloud Firestore
- **Messaging APIs**:
  - WhatsApp Cloud API (Meta)
  - Instagram Messaging (Graph API)
  - Facebook Messenger (Graph API)
  - WebChat (widget React)
- **Cloud Functions**: Firebase Functions (processamento de webhooks)
- **Automação**: Cloud Scheduler + Firestore triggers

### 2.2 Fluxo de Dados

```
[Canal Externo] → [Webhook] → [Cloud Function] → [Normalização] → [Firestore]
                                                         ↓
                                                   [IA Central]
                                                         ↓
                                            [Resposta Personalizada]
                                                         ↓
                                                  [Envio ao Canal]
```

### 2.3 Componentes Principais

#### Backend Service (`backend/src/services/omnichannel/index.js`)
- **Endpoints REST**:
  - `POST /api/omni/webhook/whatsapp` - Recebe mensagens WhatsApp
  - `POST /api/omni/webhook/instagram` - Recebe mensagens Instagram
  - `POST /api/omni/webhook/facebook` - Recebe mensagens Facebook
  - `POST /api/omni/web/send` - Envia mensagem via WebChat
  - `GET /api/omni/conversations` - Lista conversas (filtros: userId, userType, channel)
  - `GET /api/omni/messages` - Lista mensagens de uma conversa

#### Automation Engine (`backend/src/services/omnichannel/automation.js`)
- **5 Triggers**:
  1. `followup_48h` - Cliente sem resposta há 48h
  2. `followup_proposta` - Proposta não respondida em 24h
  3. `followup_pagamento` - Pagamento pendente há 12h
  4. `followup_onboarding` - Novo usuário sem ação em 24h
  5. `followup_prospector_recrutamento` - Lead prospector sem resposta em 72h

#### Cloud Function (`backend/functions/omnichannelWebhook.js`)
- Processa webhooks de todos os canais
- Normaliza payload para formato unificado
- Valida duplicação de mensagens
- Persiste no Firestore
- Dispara processamento da IA

#### Frontend Components
- **OmniInbox** (`src/components/omnichannel/OmniInbox.tsx`):
  - Lista de conversas com real-time (Firestore onSnapshot)
  - Filtros por canal e userType
  - Visualizador de mensagens
  - Envio manual de mensagens
  - Métricas de tempo de resposta
  
- **OmniChannelStatus** (`src/components/omnichannel/OmniChannelStatus.tsx`):
  - Status de conexão de cada canal
  - Taxa de erro
  - Webhook health check
  - Última mensagem recebida

## 3. Firestore Data Models

### Collection: `conversations`
```typescript
{
  id: string, // formato: {channel}_{sender_id}
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'webchat',
  participants: string[], // [userId, 'omni_ia']
  userType: 'cliente' | 'prestador' | 'prospector' | 'admin',
  lastMessage: string,
  lastMessageAt: Timestamp,
  lastMessageSender: string, // userId ou 'omni_ia'
  status: 'active' | 'closed',
  updatedAt: Timestamp
}
```

### Collection: `messages`
```typescript
{
  id: string,
  conversationId: string,
  channel: string,
  sender: string, // userId ou 'omni_ia'
  senderType: 'cliente' | 'prestador' | 'prospector' | 'admin' | 'bot',
  text: string,
  timestamp: Timestamp,
  isAutomation: boolean, // true se enviado por automation engine
  metadata: {
    phone_number_id?: string, // WhatsApp
    recipient_id?: string // Instagram/Facebook
  },
  createdAt: Timestamp
}
```

### Collection: `omni_logs`
```typescript
{
  type: 'message_processed' | 'automation_followup_48h' | 'automation_followup_proposta' | ...,
  conversationId: string,
  channel: string,
  userType: string,
  success: boolean,
  error?: string,
  timestamp: Timestamp
}
```

### Collection: `ia_logs`
```typescript
{
  conversationId: string,
  channel: string,
  userType: string,
  prompt: string,
  response: string,
  timestamp: Timestamp
}
```

## 4. Estratégias de Personas IA

### 4.1 Cliente
**Tom**: Cordial, resolutivo, acessível  
**Função**: Ajudar com dúvidas sobre serviços, orçamentos, pagamentos  
**Exemplo**: "Olá! Como posso ajudá-lo a encontrar o prestador perfeito para seu serviço?"

### 4.2 Prestador
**Tom**: Profissional, direto, motivacional  
**Função**: Ajudar com jobs, propostas, perfil, visibilidade  
**Exemplo**: "Vi que você tem uma nova oportunidade de job. Vamos revisar a proposta para maximizar sua conversão?"

### 4.3 Prospector
**Tom**: Estratégico, motivacional, equipe interna  
**Função**: Ajudar com CRM, leads, metas, ferramentas  
**Exemplo**: "Ótimo trabalho hoje! Você contatou 18 prospects. Faltam apenas 2 para bater a meta diária. 🚀"

### 4.4 Admin
**Tom**: Técnico, objetivo, data-driven  
**Função**: Insights sobre plataforma, usuários, performance  
**Exemplo**: "Sistema operando normalmente. Taxa de conversão hoje: 12.5% (+2.1% vs. ontem). 267 jobs ativos."

## 5. Fluxos por Canal

### 5.1 WhatsApp Cloud API

**Setup**:
1. Criar Meta App no Meta Developers
2. Configurar WhatsApp Business API
3. Obter `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID`
4. Registrar webhook URL: `https://{CLOUD_RUN_URL}/api/omni/webhook/whatsapp`
5. Definir `OMNI_WEBHOOK_SECRET` para validação

**Fluxo de Mensagem Recebida**:
```
Usuário envia mensagem → Meta webhook call → Cloud Function
→ Validação assinatura (X-Hub-Signature-256)
→ Normalização payload → Firestore (messages)
→ IA processa → Resposta gerada
→ POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
```

### 5.2 Instagram Messaging

**Setup**:
1. Configurar Instagram Business Account
2. Conectar ao Meta App
3. Obter `META_ACCESS_TOKEN`
4. Registrar webhook: `https://{CLOUD_RUN_URL}/api/omni/webhook/instagram`
5. Subscrever eventos: `messages`, `messaging_postbacks`

**Fluxo**:
```
DM no Instagram → Meta webhook → Cloud Function
→ Normalização (event.messaging) → Firestore
→ IA processa → POST https://graph.facebook.com/v18.0/me/messages
```

### 5.3 Facebook Messenger

**Setup**: Idêntico ao Instagram (mesmo access token)

**Webhook URL**: `https://{CLOUD_RUN_URL}/api/omni/webhook/facebook`

### 5.4 WebChat

**Implementação**: Widget React embeddable

**Fluxo**:
```
Usuário digita no widget → POST /api/omni/web/send
→ Salva mensagem → IA processa → Retorna resposta JSON
→ Widget exibe resposta em tempo real
```

## 6. Automação Triggers

### Scheduler Setup (Cloud Scheduler)
```bash
gcloud scheduler jobs create http omni-automation \
  --location=us-west1 \
  --schedule="*/15 * * * *" \
  --uri="https://{BACKEND_URL}/api/omni/automation/run" \
  --http-method=POST \
  --headers="Authorization=Bearer {SECRET}"
```

**Frequência**: A cada 15 minutos

**Opt-Out**: Respeitado via campo `users/{email}.optOutAutomations = true`

### Trigger 1: followup_48h
- **Condição**: Cliente inativo há 48h (lastMessageAt < now - 48h, lastMessageSender = 'omni_ia', status = 'active')
- **Mensagem**: "Olá! Vi que você não respondeu há alguns dias. Ainda posso ajudar com algo? 😊"
- **Canal**: Canal preferido da conversa

### Trigger 2: followup_proposta
- **Condição**: Proposta com status 'enviada' há 24h sem resposta
- **Mensagem**: "Olá! Vi que você recebeu uma proposta para \"{job.title}\". Gostaria de revisar? 📋"
- **Canal**: `user.preferredChannel` (default: webchat)

### Trigger 3: followup_pagamento
- **Condição**: Escrow com status 'pending' há 12h
- **Mensagem**: "Olá! Percebi que há um pagamento pendente de R$ {escrow.amount}. Posso ajudar a concluir? 💳"

### Trigger 4: followup_onboarding
- **Condição**: Usuário criado há 24h com `onboardingCompleted = false`
- **Mensagens**: Personalizadas por userType (cliente/prestador/prospector)

### Trigger 5: followup_prospector_recrutamento
- **Condição**: Prospect com status 'contatado' há 72h sem progressão
- **Mensagem**: Email com CTA para adesão à plataforma
- **Canal**: Email (SendGrid)

## 7. Segurança

### 7.1 Validação de Webhooks
- **Meta (WA/IG/FB)**: Validação via HMAC SHA-256 (header `X-Hub-Signature-256`)
- **Implementação**:
```javascript
const signature = 'sha256=' + crypto.createHmac('sha256', META_APP_SECRET)
  .update(rawBody).digest('hex');
crypto.timingSafeEqual(Buffer.from(incomingSignature), Buffer.from(signature));
```

### 7.2 Firestore Security Rules
```javascript
// conversations - só participantes podem ler/escrever
match /conversations/{conversationId} {
  allow read: if isParticipant(conversationId) || isAdmin();
  allow write: if isParticipant(conversationId) || isAdmin();
}

// messages - só participantes podem ler, qualquer auth pode escrever
match /messages/{messageId} {
  allow read: if isConversationParticipant(resource.data.conversationId) || isAdmin();
  allow create: if request.auth != null;
}

// omni_logs - só admins
match /omni_logs/{logId} {
  allow read, write: if isAdmin();
}
```

### 7.3 Rate Limiting
- Cloud Run: 100 req/s por instância
- Firestore: 10k writes/s (documentação)
- Considerar Cloud Armor para DDoS protection

## 8. Monitoramento

### 8.1 Métricas (Cloud Monitoring)
- **Latência**: p50, p95, p99 dos endpoints
- **Taxa de erro**: 4xx e 5xx por canal
- **Volume de mensagens**: Mensagens processadas/hora por canal
- **Webhook failures**: Failed webhook deliveries
- **IA response time**: Tempo de geração de resposta (Gemini)
- **Automation execution**: Triggers executados e taxas de envio

### 8.2 Logs (Cloud Logging)
```
[Omni WA] Mensagem de 5511999999999: "Preciso de ajuda"
[Omni IA] Resposta enviada: wa_5511999999999
[Automação] Trigger followup_48h: 12 mensagens enviadas
```

### 8.3 Alertas
- **Webhook failure rate > 5%** → Notificar admin
- **IA response time > 5s** → Investigar Gemini API
- **Canal offline > 30min** → Incidente crítico

## 9. Plano de Recuperação de Falhas

### 9.1 Webhook Timeout
- **Sintoma**: Meta retenta entrega 3x
- **Ação**: Cloud Function deve responder 200 imediatamente, processar assíncrono
- **Retry**: Meta retenta em 15s, 30s, 1min

### 9.2 Firestore Overload
- **Sintoma**: Write contention ou quota exceeded
- **Ação**: Implementar batch writes (até 500 docs/batch)
- **Fallback**: Queue em Pub/Sub para processamento posterior

### 9.3 Gemini API Quota
- **Sintoma**: 429 Too Many Requests
- **Ação**: Implementar backoff exponencial
- **Fallback**: Mensagem genérica pré-definida: "Desculpe, estou com muitas solicitações no momento. Por favor, tente novamente em instantes."

### 9.4 Canal Offline
- **Detecção**: Health check falha 3x consecutivas
- **Ação**: Marcar canal como 'offline' no status dashboard
- **Notificação**: Webhook para Slack/email do admin
- **Recuperação**: Auto-retry a cada 5min

## 10. Custos Estimados

### 10.1 Cloud Run
- **Instâncias**: 0-10 (scale-to-zero)
- **CPU**: 1 vCPU x 512Mi RAM
- **Requisições**: ~10k/dia
- **Custo**: ~$15/mês

### 10.2 Firestore
- **Leituras**: ~50k/dia (conversas + mensagens)
- **Escritas**: ~15k/dia (mensagens + logs)
- **Armazenamento**: ~10GB
- **Custo**: ~$5/mês

### 10.3 Cloud Functions
- **Invocações**: ~10k/dia (webhooks)
- **Compute**: 512Mi x 60s avg
- **Custo**: ~$2/mês

### 10.4 Gemini AI
- **Modelo**: gemini-2.0-flash-exp (Free Tier: 1500 req/day)
- **Uso estimado**: ~500 req/dia
- **Custo**: $0/mês (dentro do free tier)

### 10.5 Meta APIs (WhatsApp/IG/FB)
- **WhatsApp**: Free para mensagens de resposta (24h window)
- **Instagram/Facebook**: Free
- **Custo**: $0/mês

### 10.6 SendGrid (Email)
- **Envios**: ~100/dia (automações)
- **Plano**: Free tier (100/dia)
- **Custo**: $0/mês

**Total estimado**: ~$22/mês (scale-to-zero, sem picos de tráfego)

## 11. Roadmap Futuro

### Fase 2 (Q2 2025)
- [ ] Integração Telegram
- [ ] SMS via Twilio
- [ ] Suporte a anexos (imagens, PDFs)
- [ ] Templates de mensagens reutilizáveis
- [ ] Analytics dashboard (conversão por canal)

### Fase 3 (Q3 2025)
- [ ] Voice messages (transcrição automática)
- [ ] Chatbot builder visual (no-code)
- [ ] A/B testing de mensagens
- [ ] Sentiment analysis (positivo/negativo/neutro)
- [ ] Multi-idioma (PT/EN/ES)

---

**Versão**: 1.0  
**Data**: 2025-01-24  
**Autor**: GitHub Copilot + Jeferson (jeferson@jccempresas.com.br)  
**Status**: ✅ Implementado e pronto para deploy
