# 🚀 Plano de Melhorias - Módulo de Prospecção Servio.AI

**Data:** 03/12/2025  
**Objetivo:** Tornar o módulo de prospecção 100% autônomo e produtivo com IA trabalhando automaticamente

---

## 📊 Análise do Estado Atual

### ✅ O que já funciona bem:

1. **CRM Kanban** (`ProspectorCRMEnhanced.tsx`) - Interface visual moderna com drag-and-drop
2. **Follow-up Sequences** - Sequências pré-programadas de 3 tipos (onboarding, nurture, reactivation)
3. **Smart Actions API** - Backend com regras determinísticas para sugestões (`/api/prospector/smart-actions`)
4. **WhatsApp Integration** - `whatsappService.js` configurado para Meta Business API
5. **Gemini AI** - Integrado no backend (`geminiService.ts`) para geração de conteúdo
6. **Auto-Prospect Endpoint** - `/api/auto-prospect` com estrutura para busca automática (mock atual)

### ❌ Gaps Identificados:

#### 1. **Cadastro Manual de Leads**

- Prospector precisa preencher formulário manualmente
- Não há importação em massa via CSV/Excel
- Sem integração com redes sociais/LinkedIn para captura automática

#### 2. **Envio de Mensagens Manual**

- WhatsApp abre link `wa.me` (requer ação manual do usuário)
- Email não está integrado (apenas `mailto:` links)
- Sem API de envio automático configurada

#### 3. **Follow-ups Não Automáticos**

- Sequências criadas mas **não executadas automaticamente**
- Falta Cloud Scheduler/Cloud Functions para disparo
- Sem tracking de abertura/resposta

#### 4. **Busca de Profissionais Mock**

- `/api/auto-prospect` apenas simula busca no Google
- **Google Places API não integrada**
- Sem scraping/enrichment de dados

#### 5. **IA Reativa (Não Autônoma)**

- IA apenas sugere ações quando o prospector solicita
- Não monitora oportunidades sozinha
- Não cadastra leads automaticamente quando cliente solicita serviço sem profissional

---

## 🎯 Visão da Solução Ideal

### Modo 1️⃣: **Assistente Inteligente** (Prospector com IA)

O prospector cadastra leads facilmente e a IA faz o resto:

```
Prospector → Cadastra lead (1 clique/import CSV)
    ↓
IA Analisa → Enriquece dados (LinkedIn, Google)
    ↓
IA Agenda → Envia WhatsApp + Email + SMS (multi-canal)
    ↓
IA Monitora → Follow-up automático baseado em resposta
    ↓
IA Notifica → Alerta quando lead responde/engaja
```

### Modo 2️⃣: **IA 100% Autônoma** (Quando cliente solicita serviço sem profissional)

A IA trabalha sozinha sem intervenção humana:

```
Cliente → Solicita serviço (ex: "Eletricista em SP")
    ↓
Sistema → Verifica: Sem profissional disponível
    ↓
IA Busca → Google Places API + LinkedIn + Instagram
    ↓
IA Cadastra → Leads automaticamente no Firestore
    ↓
IA Envia → Convites personalizados (WhatsApp + Email)
    ↓
IA Monitora → Follow-ups automáticos D+1, D+3, D+7
    ↓
IA Notifica → Admin quando lead se cadastra
```

---

## 🏗️ Arquitetura da Solução Completa

### **Frontend (React/TypeScript)**

```
ProspectorDashboard
├── QuickImportPanel (NOVO)
│   ├── CSV Upload (nome, telefone, email, categoria)
│   ├── LinkedIn Connector (OAuth)
│   └── Paste List (bulk add via textarea)
│
├── ProspectorCRMEnhanced (MELHORADO)
│   ├── Auto-enrich button (busca dados no LinkedIn/Google)
│   ├── Bulk actions (selecionar N leads → send all)
│   ├── Template customization (editor de mensagens)
│   └── Real-time status (✓ enviado, ✓✓ lido, 💬 respondeu)
│
└── AIAutopilotPanel (NOVO)
    ├── Toggle: IA Autônoma ON/OFF
    ├── Rules config (quando ativar busca automática)
    ├── Budget limits (max N leads/dia)
    └── Activity log (ações da IA em tempo real)
```

### **Backend (Node.js/Express)**

#### **Novos Endpoints:**

```javascript
// 1. Importação em massa
POST /api/prospector/import-leads
Body: { prospectorId, leads: [{ name, phone, email, category }] }
Action: Valida, enriquece (Gemini), salva em batch

// 2. Enriquecimento de lead via IA
POST /api/prospector/enrich-lead
Body: { leadId, phone?, email?, name? }
Action: Busca LinkedIn API, Google Places, retorna dados completos

// 3. Envio automático multi-canal
POST /api/prospector/send-campaign
Body: { leadIds: [], channel: 'whatsapp'|'email'|'sms', template: '...' }
Action: Envia via WhatsApp Business API / SendGrid / Twilio

// 4. Autopilot IA (modo autônomo)
POST /api/ai/autopilot/start
Body: { prospectorId, rules: { maxLeadsPerDay, categories, locations } }
Action: Ativa Cloud Scheduler → executa busca + cadastro + envio

POST /api/ai/autopilot/stop
Action: Pausa automação

GET /api/ai/autopilot/activity
Response: { actions: [{ type, timestamp, leadId, status }] }
```

#### **Cloud Functions (Firebase/Google Cloud)**

```javascript
// functions/scheduled/autoProspectCron.js
exports.autoProspectCron = functions.pubsub.schedule('every 4 hours').onRun(async context => {
  // 1. Busca jobs sem profissional (created há 30min+)
  const jobsWithoutProvider = await getJobsNeedingProspecting();

  for (const job of jobsWithoutProvider) {
    // 2. Busca profissionais no Google Places API
    const prospects = await searchGooglePlaces(job.category, job.location);

    // 3. Enriquece com LinkedIn (se disponível)
    const enriched = await enrichWithLinkedIn(prospects);

    // 4. Salva leads no Firestore
    await saveProspects(enriched, job.id);

    // 5. Envia convites automaticamente
    await sendInvites(enriched, job);

    // 6. Agenda follow-ups
    await scheduleFollowUps(enriched);
  }
});

// functions/scheduled/followUpExecutor.js
exports.followUpExecutor = functions.pubsub.schedule('every 1 hour').onRun(async context => {
  // Busca follow-ups agendados para agora
  const due = await getFollowUpsDueNow();

  for (const followUp of due) {
    const lead = await getLead(followUp.leadId);

    // Personaliza mensagem com Gemini
    const message = await gemini.generate({
      prompt: `Personalize esta mensagem para ${lead.name}, categoria ${lead.category}:
        Template: ${followUp.template}`,
    });

    // Envia via canal configurado
    if (followUp.channel === 'whatsapp') {
      await whatsappService.sendMessage(lead.phone, message);
    } else if (followUp.channel === 'email') {
      await sendGrid.send(lead.email, message);
    }

    // Marca como enviado
    await markFollowUpSent(followUp.id);
  }
});
```

---

## 🔌 Integrações Necessárias

### 1. **Google Places API** (Busca Automática)

```javascript
// services/googlePlacesService.js
const axios = require('axios');

async function searchProfessionals(category, location, radius = 10000) {
  const query = `${category} ${location}`;
  const response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
    params: {
      query,
      location: `${location.lat},${location.lng}`,
      radius,
      key: process.env.GOOGLE_PLACES_API_KEY,
    },
  });

  return response.data.results.map(place => ({
    name: place.name,
    address: place.formatted_address,
    phone: place.formatted_phone_number,
    rating: place.rating,
    website: place.website,
    placeId: place.place_id,
  }));
}

async function getPlaceDetails(placeId) {
  // Busca detalhes completos incluindo horários, fotos, reviews
  const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
    params: {
      place_id: placeId,
      fields: 'name,formatted_phone_number,website,opening_hours,reviews',
      key: process.env.GOOGLE_PLACES_API_KEY,
    },
  });
  return response.data.result;
}
```

**Setup:**

```bash
# Ativar Google Places API no GCP
gcloud services enable places-backend.googleapis.com

# Criar API Key
gcloud alpha services api-keys create --display-name="Servio Prospecting"

# Adicionar ao .env e Cloud Run
GOOGLE_PLACES_API_KEY=AIzaSy...
```

### 2. **WhatsApp Business API** (Envio Automático)

Já temos `whatsappService.js`, mas precisa configurar:

```javascript
// Atualizar para envio em massa
async function sendBulkMessages(recipients) {
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await this.sendMessage(
        recipient.phone,
        recipient.message,
        recipient.messageId
      );
      results.push({ ...result, recipientId: recipient.id });

      // Rate limiting: 80 msg/sec (Meta Business API limit)
      await sleep(15); // 15ms = ~66 msg/sec (safe margin)
    } catch (error) {
      results.push({
        success: false,
        recipientId: recipient.id,
        error: error.message,
      });
    }
  }

  return results;
}
```

**Webhooks para tracking:**

```javascript
// backend/src/routes/whatsapp.js
router.post('/webhook', (req, res) => {
  const { entry } = req.body;

  for (const change of entry[0].changes) {
    const { statuses, messages } = change.value;

    // Tracking de status de entrega
    if (statuses) {
      for (const status of statuses) {
        updateMessageStatus(status.id, status.status); // sent, delivered, read
      }
    }

    // Resposta do lead
    if (messages) {
      for (const message of messages) {
        handleLeadResponse(message.from, message.text.body);
      }
    }
  }

  res.sendStatus(200);
});
```

### 3. **SendGrid/Resend** (Email Automático)

```javascript
// services/emailService.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendProspectEmail(lead, template) {
  const personalizedContent = await gemini.generate({
    prompt: `Crie email de prospecção para ${lead.name}, profissão ${lead.category}.
    Inclua: benefícios Servio.AI, prova social, call-to-action claro.`,
  });

  const msg = {
    to: lead.email,
    from: 'prospeccao@servio.ai',
    subject: `${lead.name}, uma oportunidade exclusiva aguarda você na Servio.AI`,
    html: personalizedContent,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    },
  };

  await sgMail.send(msg);
}

// Webhook para tracking de abertura/clique
router.post('/email-webhook', (req, res) => {
  const { event, email, timestamp } = req.body;

  if (event === 'open') {
    updateLeadActivity(email, 'email_opened', timestamp);
  } else if (event === 'click') {
    updateLeadActivity(email, 'email_clicked', timestamp);
    // Aumentar score do lead automaticamente
    increaseLeadScore(email, 10);
  }

  res.sendStatus(200);
});
```

### 4. **LinkedIn API** (Enriquecimento - Opcional)

```javascript
// services/linkedinService.js
// Requer aprovação do LinkedIn Partner Program
async function enrichLeadFromLinkedIn(name, company) {
  // Search API (requer parceria)
  const profile = await linkedin.search({
    keywords: `${name} ${company}`,
    facets: 'network:F', // First-degree connections
  });

  if (profile) {
    return {
      linkedinUrl: profile.publicProfileUrl,
      headline: profile.headline,
      experience: profile.experience,
      skills: profile.skills,
    };
  }
  return null;
}
```

**Alternativa sem API oficial:**

- Usar serviços de enriquecimento como **Clearbit**, **Hunter.io**, **Apollo.io**
- Implementar scraping ético com rate limiting

---

## 📱 UX Simplificada para o Prospector

### **Cenário 1: Cadastro Rápido de Lead**

**Antes (5 passos):**

```
1. Clicar "Adicionar Lead"
2. Preencher nome
3. Preencher telefone
4. Preencher email
5. Preencher categoria
6. Clicar "Salvar"
```

**Depois (1 passo):**

```
1. Colar "João Silva, (11) 98765-4321, Eletricista"
   OU
   Upload CSV com 100 leads
   ↓
   IA enriquece automaticamente
```

**Implementação:**

```tsx
// src/components/prospector/QuickAddPanel.tsx
function QuickAddPanel() {
  const [text, setText] = useState('');

  const handlePaste = async () => {
    // Parse inteligente com Gemini
    const parsed = await gemini.parseProspectList(text);

    // Enriquece dados
    const enriched = await Promise.all(parsed.map(lead => enrichLeadData(lead)));

    // Salva em batch
    await saveBatch(enriched);

    alert(`✅ ${enriched.length} leads adicionados e enriquecidos!`);
  };

  return (
    <div>
      <textarea
        placeholder="Cole aqui:
        João Silva, (11) 98765-4321, joao@email.com, Eletricista
        Maria Souza, (21) 91234-5678, maria@email.com, Pintora"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button onClick={handlePaste}>🚀 Adicionar e Enriquecer com IA</button>
    </div>
  );
}
```

### **Cenário 2: Campanha Multi-Canal**

**Antes:**

```
1. Selecionar lead
2. Clicar WhatsApp → Abre wa.me
3. Copiar template manualmente
4. Colar e enviar
5. Voltar ao CRM
6. Repetir para próximo lead (muito trabalhoso!)
```

**Depois:**

```
1. Selecionar 50 leads (checkbox)
2. Clicar "Enviar Campanha"
3. Escolher template
4. Clicar "Enviar Tudo"
   ↓
   IA personaliza e envia automaticamente
   ↓
   Dashboard mostra status em tempo real
```

**Implementação:**

```tsx
// src/components/prospector/BulkCampaignModal.tsx
function BulkCampaignModal({ selectedLeads }) {
  const [template, setTemplate] = useState('onboarding');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);

    // Backend envia em batch
    const result = await fetch('/api/prospector/send-campaign', {
      method: 'POST',
      body: JSON.stringify({
        leadIds: selectedLeads.map(l => l.id),
        channel: 'whatsapp',
        template,
      }),
    });

    // Mostra progresso em tempo real via WebSocket
    const progress = await result.json();
    alert(`✅ ${progress.sent} enviados, ${progress.failed} falharam`);
  };

  return (
    <Modal>
      <h2>📤 Enviar para {selectedLeads.length} leads</h2>
      <select value={template} onChange={e => setTemplate(e.target.value)}>
        <option value="onboarding">🎯 Onboarding Rápido</option>
        <option value="nurture">🌱 Nutrição Longa</option>
        <option value="promo">🎁 Promoção Especial</option>
      </select>
      <button onClick={handleSend} disabled={sending}>
        {sending ? '⏳ Enviando...' : '🚀 Enviar Tudo'}
      </button>
    </Modal>
  );
}
```

---

## 🤖 Modo IA 100% Autônoma

### **Ativação:**

```tsx
// src/components/prospector/AIAutopilotPanel.tsx
function AIAutopilotPanel() {
  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState({
    maxLeadsPerDay: 20,
    categories: ['Eletricista', 'Encanador', 'Pintor'],
    locations: ['São Paulo', 'Rio de Janeiro'],
    budgetLimit: 100, // max R$ 100/dia em custos de API
  });

  const toggleAutopilot = async () => {
    if (enabled) {
      await fetch('/api/ai/autopilot/stop', { method: 'POST' });
    } else {
      await fetch('/api/ai/autopilot/start', {
        method: 'POST',
        body: JSON.stringify({ prospectorId: user.email, rules }),
      });
    }
    setEnabled(!enabled);
  };

  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl text-white">
      <h2>🤖 IA Autônoma - Modo Autopilot</h2>

      <div className="flex items-center gap-4">
        <label className="text-lg font-bold">{enabled ? '✅ Ativa' : '❌ Desativada'}</label>
        <button
          onClick={toggleAutopilot}
          className={`px-6 py-3 rounded-lg font-bold ${
            enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {enabled ? 'Pausar IA' : 'Ativar IA'}
        </button>
      </div>

      {enabled && (
        <div className="mt-4 bg-white/10 p-4 rounded">
          <h3>📊 Atividade da IA (Últimas 24h)</h3>
          <ul>
            <li>🔍 23 profissionais encontrados no Google</li>
            <li>📧 18 convites enviados automaticamente</li>
            <li>📲 12 follow-ups via WhatsApp</li>
            <li>✅ 3 leads convertidos em cadastros</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

### **Lógica Backend:**

```javascript
// backend/src/services/aiAutopilot.js
class AIAutopilot {
  async start(prospectorId, rules) {
    // 1. Salva configuração
    await db.collection('ai_autopilot_configs').doc(prospectorId).set({
      enabled: true,
      rules,
      startedAt: new Date(),
    });

    // 2. Agenda execução via Cloud Scheduler
    await scheduler.createJob({
      name: `autopilot-${prospectorId}`,
      schedule: 'every 4 hours',
      httpTarget: {
        uri: `${process.env.BACKEND_URL}/api/ai/autopilot/execute`,
        httpMethod: 'POST',
        body: Buffer.from(JSON.stringify({ prospectorId })).toString('base64'),
      },
    });
  }

  async execute(prospectorId) {
    const config = await this.getConfig(prospectorId);
    if (!config.enabled) return;

    // 1. Busca jobs sem profissional
    const jobsNeedingHelp = await this.findJobsWithoutProvider(config.rules);

    for (const job of jobsNeedingHelp) {
      // 2. Busca profissionais no Google Places
      const prospects = await googlePlaces.search(job.category, job.location);

      // 3. Filtra e enriquece
      const filtered = prospects
        .filter(p => p.rating >= 4.0) // Só profissionais bem avaliados
        .slice(0, config.rules.maxLeadsPerDay);

      // 4. Enriquece com IA (Gemini gera bio, headline)
      const enriched = await Promise.all(filtered.map(p => this.enrichWithAI(p, job)));

      // 5. Salva como leads
      const savedLeads = await this.saveLeads(enriched, prospectorId, job.id);

      // 6. Envia convites automaticamente
      await this.sendInvites(savedLeads, job);

      // 7. Agenda follow-ups
      await this.scheduleFollowUps(savedLeads);

      // 8. Log atividade
      await this.logActivity(prospectorId, {
        type: 'auto_prospect',
        jobId: job.id,
        leadsFound: enriched.length,
        invitesSent: savedLeads.length,
      });
    }
  }

  async enrichWithAI(prospect, job) {
    const prompt = `
    Profissional: ${prospect.name}
    Categoria: ${job.category}
    Avaliação: ${prospect.rating}⭐
    
    Gere uma bio profissional atraente e um headline para cadastro na Servio.AI.
    Seja persuasivo e destaque experiência e confiabilidade.
    `;

    const aiGenerated = await gemini.generate(prompt);

    return {
      ...prospect,
      bio: aiGenerated.bio,
      headline: aiGenerated.headline,
      aiGenerated: true,
      source: 'google_auto',
      relatedJobId: job.id,
    };
  }
}
```

---

## 📋 Checklist de Implementação

### **Fase 1: Fundação (Semana 1-2)**

- [ ] Adicionar Google Places API ao backend
- [ ] Configurar SendGrid/Resend para envio de emails
- [ ] Atualizar `whatsappService.js` para envio em massa
- [ ] Criar endpoint `/api/prospector/import-leads` (CSV upload)
- [ ] Criar endpoint `/api/prospector/enrich-lead` (enriquecimento)
- [ ] Implementar `QuickAddPanel.tsx` (cadastro rápido)

### **Fase 2: Automação de Envio (Semana 3-4)**

- [ ] Criar endpoint `/api/prospector/send-campaign` (bulk send)
- [ ] Implementar `BulkCampaignModal.tsx` (interface de campanha)
- [ ] Configurar webhooks WhatsApp para tracking
- [ ] Configurar webhooks SendGrid para tracking
- [ ] Atualizar UI com status em tempo real (enviado, lido, respondeu)
- [ ] Criar dashboard de métricas de campanha

### **Fase 3: Cloud Functions (Semana 5-6)**

- [ ] Criar `functions/autoProspectCron.js` (busca automática)
- [ ] Criar `functions/followUpExecutor.js` (execução de sequências)
- [ ] Configurar Cloud Scheduler (execução a cada 4h)
- [ ] Implementar rate limiting e retry logic
- [ ] Adicionar logs estruturados (Cloud Logging)
- [ ] Criar alertas de falha (Cloud Monitoring)

### **Fase 4: IA Autônoma (Semana 7-8)**

- [ ] Criar `AIAutopilotPanel.tsx` (interface de controle)
- [ ] Implementar `aiAutopilot.js` (lógica de automação)
- [ ] Criar endpoints `/api/ai/autopilot/{start,stop,activity}`
- [ ] Integrar Gemini para personalização de mensagens
- [ ] Implementar budget control (limitar custos de API)
- [ ] Criar relatório diário de atividade da IA

### **Fase 5: Testes e Ajustes (Semana 9-10)**

- [ ] Testar busca Google Places com categorias reais
- [ ] Validar envio WhatsApp em massa (rate limits)
- [ ] Testar follow-ups automáticos end-to-end
- [ ] Ajustar prompts da IA com base em resultados
- [ ] Criar documentação para prospectors
- [ ] Treinar equipe no novo fluxo

---

## 💰 Custos Estimados

### **APIs Externas:**

- **Google Places API:** $17 por 1000 requests (Text Search) + $17 por 1000 (Place Details)
  - Estimativa: 500 buscas/dia = ~$17/dia = **$510/mês**
- **WhatsApp Business API:** Grátis até 1000 conversas/mês, depois $0.005-0.08 por mensagem
  - Estimativa: 5000 msgs/mês = **$250-400/mês**
- **SendGrid:** Grátis até 100/dia, plano Pro $19.95/mês (até 50k emails)
  - **$20/mês**
- **Gemini API:** $0.35 por 1M tokens input, $1.05 por 1M output
  - Estimativa: 100k gerações/mês = **$50/mês**
- **Cloud Functions:** Grátis até 2M invocações/mês
  - Estimativa: 10M invocações = **$40/mês**

**Total Estimado:** **$870-1020/mês** para operação 100% autônoma

### **ROI Esperado:**

- 1 prospector consegue gerenciar **10x mais leads** com automação
- Taxa de conversão aumenta **30-50%** com follow-ups automáticos
- Reduz **80% do tempo** gasto em tarefas manuais

---

## 🎯 Métricas de Sucesso

### **KPIs a Monitorar:**

1. **Tempo médio de cadastro de lead:** < 10 segundos (vs 2min atual)
2. **Taxa de resposta a convites:** > 15% (benchmark: 8-12%)
3. **Leads processados por dia por prospector:** > 50 (vs 5-10 atual)
4. **Taxa de conversão lead → cadastro:** > 10% (vs 3-5% atual)
5. **Tempo até primeiro contato:** < 1 hora (vs 24h+ atual)
6. **Custo por lead convertido:** < R$ 20 (incluindo custos de API)

---

## 🚨 Riscos e Mitigações

### **Risco 1: Rate Limits de APIs**

**Mitigação:** Implementar queue system com exponential backoff, distribuir carga ao longo do dia

### **Risco 2: Spam/Blacklist**

**Mitigação:** Respeitar opt-out, limitar envios por dia, validar números antes de enviar

### **Risco 3: Custos Fora de Controle**

**Mitigação:** Budget alerts no GCP, hard limits por prospector, dashboard de custos

### **Risco 4: Baixa Qualidade dos Leads da IA**

**Mitigação:** Filtros de rating mínimo, revisão humana semanal, A/B testing de prompts

### **Risco 5: LGPD/Privacidade**

**Mitigação:** Opt-out claro, armazenar consentimento, criptografar dados sensíveis

---

## 📞 Próximos Passos

1. **Validar prioridades** com stakeholders
2. **Aprovar budget** de APIs externas
3. **Definir MVP** (quais features da Fase 1-2 primeiro)
4. **Iniciar desenvolvimento** com sprint de 2 semanas
5. **Beta test** com 3-5 prospectors selecionados

---

**Dúvidas ou sugestões? Estou à disposição para detalhar qualquer parte deste plano! 🚀**
