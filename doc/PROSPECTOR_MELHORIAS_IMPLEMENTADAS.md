# 🚀 Sistema de Prospecção - Melhorias Implementadas

## 📊 Visão Geral

Sistema completo de prospecção com **analytics avançado**, **gamificação**, **templates personalizáveis** e **automação de follow-up**.

---

## ✅ O Que Foi Implementado

### 1. Analytics Avançado (`prospectorAnalyticsService.js`)

**Métricas em Tempo Real:**

- ✅ Total de recrutas e recrutas ativos
- ✅ Comissões totais, pagas e pendentes
- ✅ Taxa de conversão (clicks → cadastros)
- ✅ Tempo médio até primeira comissão
- ✅ Top 5 prestadores por comissão gerada
- ✅ Atividade recente (últimos 7 dias)
- ✅ Clicks por fonte (web, mobile, email, WhatsApp, social)

**Endpoints REST:**

```bash
# Obter analytics completo
GET /api/prospector/analytics?prospectorId=EMAIL&timePeriod=90

# Obter leaderboard
GET /api/prospector/leaderboard?sortBy=totalCommissions&limit=10

# Gerar relatório semanal/mensal
POST /api/prospector/report
Body: { "prospectorId": "EMAIL", "period": "week" }
```

**Exemplo de resposta:**

```json
{
  "metrics": {
    "totalRecruits": 15,
    "activeRecruits": 12,
    "totalCommissions": 2450.0,
    "paidCommissions": 1200.0,
    "pendingCommissions": 1250.0,
    "clicks": 250,
    "conversions": 15,
    "conversionRate": "6.00",
    "avgDaysToFirstCommission": 5,
    "topProviders": [
      { "providerId": "joao@email.com", "totalCommissions": 450.0, "providerName": "João Silva" }
    ],
    "recentActivity": {
      "recruits": 3,
      "commissions": 5,
      "earnings": 320.0
    },
    "clicksBySource": {
      "whatsapp": 120,
      "social": 80,
      "email": 50
    }
  },
  "badges": [
    {
      "name": "Pro Recruiter",
      "tier": "silver",
      "icon": "🥈",
      "description": "25+ prestadores recrutados"
    },
    { "name": "Big Earner", "tier": "gold", "icon": "💵", "description": "R$ 5.000+ em comissões" }
  ]
}
```

### 2. Sistema de Badges e Gamificação

**Badges Implementados:**

**Recruiter Badges:**

- ⭐ Rising Star (5+ recrutas)
- 🥉 Recruiter (10+ recrutas)
- 🥈 Pro Recruiter (25+ recrutas)
- 🥇 Master Recruiter (50+ recrutas)
- 👑 Elite Recruiter (100+ recrutas)

**Earnings Badges:**

- 💳 First Earnings (R$ 500+)
- 💸 Earner (R$ 1.000+)
- 💵 Big Earner (R$ 5.000+)
- 💰 Money Maker (R$ 10.000+)

**Conversion Rate Badges:**

- 📊 Converter (5%+)
- 📈 Good Converter (15%+)
- 🎲 Conversion Pro (30%+)
- 🎯 Conversion Master (50%+)

**Quality Badges:**

- 👍 Good Recruiter (60%+ recrutas ativos)
- ✨ Quality Recruiter (80%+ recrutas ativos)

**Speed Badges:**

- 🚀 Fast Starter (primeira comissão ≤7 dias)
- ⚡ Speed Demon (primeira comissão ≤3 dias)

### 3. Templates de Mensagens Personalizáveis (`messageTemplates.js`)

**Canais Suportados:**

- ✅ WhatsApp (casual, profissional, referral, urgência)
- ✅ Email (cold, follow-up 48h, follow-up 7 dias)
- ✅ Redes Sociais (Facebook, Instagram, LinkedIn)
- ✅ SMS

**Tratamento de Objeções:**

- ✅ "É caro" → Explica que é grátis
- ✅ "Não tenho tempo" → Cadastro em 3 minutos
- ✅ "Não preciso" → Complemento de renda
- ✅ "Já uso outra plataforma" → Canal adicional

**Endpoints:**

```bash
# Listar todos os templates
GET /api/prospector/templates

# Obter templates de um canal específico
GET /api/prospector/templates?channel=whatsapp

# Obter template recomendado
GET /api/prospector/templates?stage=followUp&objection=expensive

# Personalizar template com dados do prospecto
POST /api/prospector/personalize-template
Body: {
  "template": "Oi {nome}! ...",
  "data": {
    "prospectName": "João",
    "prospectorName": "Maria",
    "referralLink": "https://servio-ai.com?ref=ABC123",
    "category": "Elétrica"
  }
}
```

**Exemplo de uso:**

```javascript
// Frontend
const response = await fetch('/api/prospector/templates?channel=whatsapp');
const { templates } = await response.json();

const personalizedMsg = await fetch('/api/prospector/personalize-template', {
  method: 'POST',
  body: JSON.stringify({
    template: templates.initial.casual,
    data: {
      prospectName: 'João Silva',
      prospectorName: 'Maria Santos',
      referralLink: 'https://servio-ai.com?ref=MARIA2025',
    },
  }),
});
```

### 4. Follow-up Automático Aprimorado

**Cadência de Emails:**

- ✅ Day 0: Convite inicial (template HTML bonito)
- ✅ Day 2: Follow-up suave ("conseguiu olhar?")
- ✅ Day 5: Follow-up reforçado (benefícios)
- ✅ Day 10: Última chance (urgência)

**Rate Limiting:**

- ✅ Máximo 10 emails/hora por prospector
- ✅ Logs de envio em `prospector_email_logs`

**Controles:**

```bash
# Criar cronograma de follow-up
POST /api/followups
Body: {
  "prospectorId": "maria@email.com",
  "prospectName": "João Silva",
  "prospectEmail": "joao@email.com",
  "referralLink": "https://servio-ai.com?ref=MARIA2025"
}

# Listar cronogramas
GET /api/followups/maria@email.com

# Pausar follow-up
PATCH /api/followups/SCHEDULE_ID
Body: { "action": "pause" }

# Retomar follow-up
PATCH /api/followups/SCHEDULE_ID
Body: { "action": "resume" }

# Opt-out (prospect não quer mais receber)
PATCH /api/followups/SCHEDULE_ID
Body: { "action": "optout" }

# Processar emails pendentes (rodar via Cloud Scheduler a cada 30 min)
POST /api/followups/run
```

### 5. Leaderboard e Ranking

**Critérios de Ordenação:**

- ✅ Total de comissões
- ✅ Número de recrutas
- ✅ Taxa de conversão
- ✅ Recrutas ativos

**Endpoint:**

```bash
GET /api/prospector/leaderboard?sortBy=totalCommissions&limit=10
```

**Exemplo de resposta:**

```json
[
  {
    "rank": 1,
    "prospectorId": "maria@email.com",
    "prospectorName": "Maria Santos",
    "totalRecruits": 45,
    "totalCommissions": 8500.0,
    "conversionRate": 12.5,
    "badges": 8
  },
  {
    "rank": 2,
    "prospectorId": "joao@email.com",
    "prospectorName": "João Silva",
    "totalRecruits": 32,
    "totalCommissions": 6200.0,
    "conversionRate": 10.2,
    "badges": 6
  }
]
```

---

## 🎯 Como Usar (Frontend)

### Exemplo 1: Dashboard do Prospector

```typescript
import { useState, useEffect } from 'react';

function ProspectorDashboard({ prospectorId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      const response = await fetch(
        `/api/prospector/analytics?prospectorId=${prospectorId}&timePeriod=90`
      );
      const data = await response.json();
      setAnalytics(data);
      setLoading(false);
    }
    loadAnalytics();
  }, [prospectorId]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Dashboard do Prospector</h1>

      {/* Badges */}
      <div className="badges">
        {analytics.badges.map(badge => (
          <div key={badge.name} className={`badge ${badge.tier}`}>
            <span>{badge.icon}</span>
            <span>{badge.name}</span>
          </div>
        ))}
      </div>

      {/* Métricas */}
      <div className="metrics">
        <div>Total Recrutas: {analytics.metrics.totalRecruits}</div>
        <div>Comissões: R$ {analytics.metrics.totalCommissions.toFixed(2)}</div>
        <div>Taxa Conversão: {analytics.metrics.conversionRate}%</div>
      </div>

      {/* Top Providers */}
      <h2>Top Prestadores</h2>
      <ul>
        {analytics.metrics.topProviders.map(p => (
          <li key={p.providerId}>
            {p.providerName} - R$ {p.totalCommissions.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Exemplo 2: Selector de Templates

```typescript
function TemplateSelectorfunction TemplateSelector({ onSelect }) {
  const [templates, setTemplates] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');

  useEffect(() => {
    async function loadTemplates() {
      const response = await fetch(
        `/api/prospector/templates?channel=${selectedChannel}`
      );
      const data = await response.json();
      setTemplates(data.templates);
    }
    loadTemplates();
  }, [selectedChannel]);

  async function personalizeAndCopy(template, prospectName) {
    const response = await fetch('/api/prospector/personalize-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template,
        data: {
          prospectName,
          prospectorName: 'Seu Nome',
          referralLink: 'https://servio-ai.com?ref=ABC123'
        }
      })
    });
    const { personalized } = await response.json();
    navigator.clipboard.writeText(personalized);
    alert('Mensagem copiada!');
  }

  return (
    <div>
      <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
        <option value="social">Redes Sociais</option>
      </select>

      {templates && Object.entries(templates.initial || {}).map(([key, template]) => (
        <div key={key}>
          <h3>{key}</h3>
          <pre>{template}</pre>
          <button onClick={() => personalizeAndCopy(template, 'João Silva')}>
            Copiar Personalizado
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Exemplo 3: Leaderboard

```typescript
function Leaderboard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    async function loadLeaderboard() {
      const response = await fetch(
        '/api/prospector/leaderboard?sortBy=totalCommissions&limit=10'
      );
      const data = await response.json();
      setLeaders(data);
    }
    loadLeaderboard();
  }, []);

  return (
    <div>
      <h1>🏆 Top Prospectors</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nome</th>
            <th>Recrutas</th>
            <th>Comissões</th>
            <th>Badges</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map(leader => (
            <tr key={leader.prospectorId}>
              <td>{leader.rank}</td>
              <td>{leader.prospectorName}</td>
              <td>{leader.totalRecruits}</td>
              <td>R$ {leader.totalCommissions.toFixed(2)}</td>
              <td>{leader.badges} 🏅</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔧 Configuração Cloud Scheduler (Follow-ups Automáticos)

```bash
# Criar Cloud Scheduler para processar follow-ups a cada 30 minutos
gcloud scheduler jobs create http followup-processor \
  --schedule="*/30 * * * *" \
  --uri="https://servio-backend-h5ogjon7aa-uw.a.run.app/api/followups/run" \
  --http-method=POST \
  --location=us-west1 \
  --project=gen-lang-client-0737507616

# Verificar job
gcloud scheduler jobs describe followup-processor \
  --location=us-west1 \
  --project=gen-lang-client-0737507616

# Executar manualmente (teste)
gcloud scheduler jobs run followup-processor \
  --location=us-west1 \
  --project=gen-lang-client-0737507616
```

---

## 📊 Exemplo de Fluxo Completo

```javascript
// 1. Prospector gera link de indicação
const linkResponse = await fetch('/api/referral-links', {
  method: 'POST',
  body: JSON.stringify({
    prospectorId: 'maria@email.com',
    prospectorName: 'Maria Santos',
  }),
});
const { fullUrl, shortUrl } = await linkResponse.json();

// 2. Prospector seleciona template
const templateResponse = await fetch('/api/prospector/templates?channel=whatsapp&stage=initial');
const { template } = await templateResponse.json();

// 3. Personaliza mensagem
const personalizeResponse = await fetch('/api/prospector/personalize-template', {
  method: 'POST',
  body: JSON.stringify({
    template,
    data: {
      prospectName: 'João Silva',
      prospectorName: 'Maria Santos',
      referralLink: fullUrl,
      shortLink: shortUrl,
    },
  }),
});
const { personalized } = await personalizeResponse.json();

// 4. Copia e envia no WhatsApp
navigator.clipboard.writeText(personalized);

// 5. Cria cronograma de follow-up automático
await fetch('/api/followups', {
  method: 'POST',
  body: JSON.stringify({
    prospectorId: 'maria@email.com',
    prospectName: 'João Silva',
    prospectEmail: 'joao@email.com',
    referralLink: fullUrl,
  }),
});

// 6. Acompanha analytics em tempo real
const analyticsResponse = await fetch(
  '/api/prospector/analytics?prospectorId=maria@email.com&timePeriod=7'
);
const { metrics, badges } = await analyticsResponse.json();
console.log(`Conversões esta semana: ${metrics.recentActivity.recruits}`);
console.log(`Badges conquistados: ${badges.length}`);
```

---

## 📋 Próximos Passos (Roadmap)

### Fase 2 (Próximas 2 semanas):

- [ ] **Notificações Push via FCM** quando prospect clica no link
- [ ] **Notificações Push** quando há conversão
- [ ] **Notificações Push** quando comissão é gerada
- [ ] **Dashboard visual** com gráficos (Chart.js/Recharts)
- [ ] **Exportar relatório em PDF**
- [ ] **Integração WhatsApp Business API** (envio automático)

### Fase 3 (Mês 2):

- [ ] **A/B Testing de templates** (qual converte mais)
- [ ] **Recomendações de IA** (melhor horário para contato)
- [ ] **Segmentação de prospects** (categoria, região, perfil)
- [ ] **Gamificação avançada** (missões semanais, conquistas)
- [ ] **Programa de afiliados** (prospector indica outro prospector)

### Fase 4 (Mês 3):

- [ ] **Machine Learning** para prever conversão
- [ ] **Análise de sentimento** em respostas de prospects
- [ ] **Chatbot de suporte** para prospects
- [ ] **Integração com CRM** (HubSpot, Pipedrive)

---

## 🎯 KPIs e Métricas

### Métricas Acompanhadas:

- **Taxa de Conversão Global:** clicks → cadastros
- **Tempo Médio até Conversão:** dias entre primeiro contato e cadastro
- **Taxa de Ativação:** recrutas que completam primeiro job
- **ROI do Prospector:** comissões geradas ÷ tempo investido
- **Churn de Recrutas:** % de recrutas que param de usar
- **Lifetime Value (LTV):** comissão média por recrutado (3 meses)

### Benchmarks Esperados:

- Taxa de Conversão: **5-10%** (clicks → cadastros)
- Tempo até Conversão: **3-7 dias**
- Taxa de Ativação: **60-80%** (recrutas fazem primeiro job)
- ROI Prospector: **10x+** (R$ 10 comissão : R$ 1 custo)

---

## 🚀 Deploy

Tudo já está implementado no backend (`backend/src/`):

- ✅ `prospectorAnalyticsService.js` - Analytics e badges
- ✅ `messageTemplates.js` - Templates personalizáveis
- ✅ `followUpService.js` - Follow-up automático
- ✅ `gmailService.js` - Envio de emails
- ✅ `index.js` - Endpoints REST

**Próximo deploy:**

```bash
cd backend
npm test
# Verificar que tudo passa

git add .
git commit -m "feat: prospector analytics, badges, templates"
git push origin main

# Backend será deployado automaticamente no Cloud Run
```

---

## 📚 Documentação Adicional

- [CONFIGURAR_EMAIL_GUIA_RAPIDO.md](./CONFIGURAR_EMAIL_GUIA_RAPIDO.md) - Setup Gmail SMTP
- [GMAIL_API_SETUP.md](./GMAIL_API_SETUP.md) - Gmail API (alternativa)
- [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md) - Notificações Push
- [KIT_PROSPECTOR.md](./KIT_PROSPECTOR.md) - Kit completo de materiais
- [GUIA_RAPIDO_PROSPECTOR.md](./GUIA_RAPIDO_PROSPECTOR.md) - Guia de onboarding

---

**Todas as melhorias estão prontas para uso!** 🎉

Configure o Gmail seguindo o [CONFIGURAR_EMAIL_GUIA_RAPIDO.md](./CONFIGURAR_EMAIL_GUIA_RAPIDO.md) e tudo estará funcional.
