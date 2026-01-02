/**
 * Message Templates for Prospectors
 *
 * Ready-to-use templates for WhatsApp, Email, and Social Media
 * with personalization placeholders and conversion-optimized content.
 */

const TEMPLATES = {
  whatsapp: {
    initial: {
      casual: `Oi {nome}! 👋

Descobri a *Servio.AI*, uma plataforma que conecta prestadores com clientes de forma inteligente.

Você ganha mais visibilidade, pagamentos seguros e avaliações verificadas! 

Quer saber mais? Te mando o link: {link}`,

      professional: `Olá {nome}, tudo bem?

Sou {prospectorName} e gostaria de apresentar uma oportunidade que pode transformar seu negócio.

A *Servio.AI* é uma plataforma que conecta prestadores de serviços com clientes qualificados. 

*Principais benefícios:*
✅ Novos clientes qualificados
✅ Pagamentos 100% seguros via Stripe
✅ Avaliações verificadas
✅ Zero custo inicial

Cadastro rápido: {link}

Alguma dúvida? Estou aqui para ajudar! 😊`,

      referral: `E aí {nome}! 🚀

Lembra que você mencionou que estava buscando mais clientes?

Achei algo perfeito: a *Servio.AI* é tipo um "Uber" para serviços profissionais. Você se cadastra grátis e recebe pedidos direto de clientes próximos!

Já ajudei vários profissionais a crescerem por lá. Quer dar uma olhada?

Link: {link}`,

      urgency: `{nome}, oportunidade especial! ⏰

A Servio.AI está em fase de crescimento e os *primeiros 100 prestadores* ganham:
🎁 Destaque no topo das buscas (3 meses)
🎁 Zero taxa nos 5 primeiros jobs
🎁 Kit de marketing digital grátis

Vagas limitadas! Cadastre-se: {link}

Não perca essa chance! 💪`,
    },

    followUp: {
      day2: `Oi {nome}! 😊

Conseguiu dar uma olhada na Servio.AI?

Se tiver alguma dúvida sobre como funciona, fico feliz em explicar. É bem simples e sem riscos!

{link}`,

      day5: `{nome}, como vai? 👋

Vi que você ainda não se cadastrou na Servio.AI. Alguma dúvida que eu possa esclarecer?

A plataforma já ajudou centenas de profissionais a conseguirem mais clientes. E é *100% gratuito* para começar!

Link direto: {link}`,

      day10: `Última chance, {nome}! 🚨

Percebi que você pode ter perdido minha mensagem anterior sobre a Servio.AI.

Não quero que você perca essa oportunidade de crescer seu negócio. É literalmente sem custo para testar!

Se não for para você, sem problemas! Mas vale a pena conhecer: {link}

Abraço! 👍`,
    },

    objections: {
      expensive: `Entendo sua preocupação, {nome}! 💰

Na verdade, a Servio.AI é *GRÁTIS* para se cadastrar. Você só paga uma pequena taxa quando *completa* um job (tipo comissão).

Ou seja: zero risco! Você só paga se ganhar dinheiro pela plataforma. Faz sentido?

{link}`,

      noTime: `Tranquilo, {nome}! ⏰

O cadastro leva *menos de 3 minutos* e você não precisa ficar na plataforma o tempo todo.

Você recebe notificações quando aparecem jobs na sua área. Decide se quer aceitar ou não. Simples assim!

Link rápido: {link}`,

      dontNeed: `Entendo, {nome}! 😊

Mas mesmo com clientela, a Servio.AI pode ser um *extra* para preencher horários vagos.

Vários profissionais usam só pra isso: complementar a agenda quando está mais vazia.

Zero compromisso, dá pra testar: {link}`,

      alreadyUseOther: `Legal, {nome}! 👍

A Servio.AI não substitui nada, é só um *canal a mais*. Muitos profissionais usam várias plataformas ao mesmo tempo.

A diferença aqui é:
✅ IA que filtra clientes sérios
✅ Pagamento garantido via escrow
✅ Sem mensalidade

Vale testar como complemento: {link}`,
    },
  },

  email: {
    cold: {
      subject: '🚀 Oportunidade: Mais clientes para seu negócio de {category}',
      body: `Olá {nome},

Meu nome é {prospectorName} e trabalho com a Servio.AI, uma plataforma que conecta prestadores de serviços com clientes qualificados.

**Por que estou te escrevendo?**
Percebi que você trabalha com {category} e acredito que nossa plataforma pode ajudar a expandir seu negócio.

**Como funciona:**
• Você se cadastra gratuitamente (3 minutos)
• Recebe notificações de jobs na sua região
• Escolhe quais aceitar (zero pressão)
• Recebe pagamento seguro via Stripe após conclusão

**Diferenciais:**
✅ Inteligência Artificial filtra clientes sérios
✅ Pagamento garantido com sistema de escrow
✅ Avaliações verificadas para construir reputação
✅ Zero custo inicial - só paga se fizer jobs

**Cadastro rápido:** {link}

Se tiver alguma dúvida, é só responder este email. Estou aqui para ajudar!

Abraço,
{prospectorName}
{prospectorContact}

---
*P.S.: Estamos em fase de crescimento e os primeiros cadastrados ganham destaque na plataforma!*`,
    },

    followUp48h: {
      subject: 'Re: Oportunidade Servio.AI - Alguma dúvida?',
      body: `Oi {nome},

Enviei um email há 2 dias sobre a Servio.AI e queria saber se você teve chance de dar uma olhada.

Se tiver qualquer dúvida sobre como funciona, ficarei feliz em explicar por telefone ou WhatsApp!

**Link direto:** {link}

**Ou prefere que eu ligue?** Me avise o melhor horário: {prospectorPhone}

Abraço,
{prospectorName}`,
    },

    followUp7days: {
      subject: '🎯 Última tentativa - Servio.AI',
      body: `{nome},

Não quero ser insistente, mas não gostaria que você perdesse essa oportunidade.

A Servio.AI já está ajudando centenas de prestadores a crescerem seus negócios. E é totalmente sem risco para experimentar.

**Apenas me diga:**
• Não tenho interesse agora
• Tenho dúvidas (te ligo!)
• Ok, vou dar uma olhada: {link}

Obrigado pelo seu tempo,
{prospectorName}`,
    },
  },

  social: {
    facebook: {
      post: `🚀 *OPORTUNIDADE PARA PRESTADORES DE SERVIÇOS* 🚀

Você trabalha com:
• Elétrica ⚡
• Hidráulica 🚰
• Pintura 🎨
• Marcenaria 🪚
• Reformas 🏠

A *Servio.AI* conecta você com clientes qualificados na sua região!

✅ Cadastro grátis
✅ Pagamento garantido
✅ Sem mensalidade
✅ Escolha os jobs que quer fazer

Cadastre-se: {link}

#PrestarorDeServiços #ServiosAI #NovosCli entes`,

      story: `💼 ATENÇÃO PRESTADORES! 💼

Quer mais clientes? 📈

Cadastre-se na Servio.AI:
👉 {shortLink}

É grátis e leva 2 min! ⏰

#Prestador #Servicos #Clientes`,
    },

    instagram: {
      post: `🔥 OPORTUNIDADE PARA PROFISSIONAIS 🔥

A Servio.AI é a plataforma que conecta prestadores com clientes REAIS.

✨ Zero custo inicial
✨ Pagamento seguro
✨ Você escolhe os jobs

Link na bio: {shortLink}

Ou acesse: servio-ai.com

#PrestarorDeServiços #Eletricista #Encanador #Pintor #Marceneiro #TrabalheComNosco`,

      story: `🎯 Quer mais clientes?

Cadastre-se na Servio.AI!

Link: {shortLink}

[Arraste para cima]`,
    },

    linkedin: {
      post: `*SERVIO.AI: A PLATAFORMA QUE CONECTA PRESTADORES E CLIENTES*

Estou ajudando profissionais a expandirem seus negócios através da Servio.AI, uma plataforma inovadora que usa Inteligência Artificial para conectar prestadores de serviços com clientes qualificados.

**Principais benefícios:**
• Sistema de pagamento seguro (Stripe)
• Avaliações verificadas por IA
• Matching inteligente prestador-cliente
• Dashboard com métricas em tempo real

**Ideal para profissionais de:**
Elétrica, Hidráulica, Pintura, Marcenaria, Limpeza, Jardinagem, Manutenção e mais.

Interessado em conhecer? Cadastro gratuito: {link}

#Tecnologia #Marketplace #Serviços #Inovação #EmpreendedorismoDig ital`,
    },
  },

  sms: {
    initial: `Oi {nome}! Sou {prospectorName}. Te indiquei na Servio.AI, plataforma que conecta prestadores com clientes. Cadastro grátis: {shortLink}`,

    followUp: `{nome}, conseguiu ver a Servio.AI? É grátis e pode te trazer mais clientes! {shortLink}`,

    urgent: `{nome}, últimos dias de cadastro com taxa ZERO nos 5 primeiros jobs! {shortLink}`,
  },
};

/**
 * Personalize template with prospect data
 */
function personalizeTemplate(template, data) {
  let personalized = template;

  // Replace all placeholders
  const replacements = {
    '{nome}': data.prospectName || '[Nome]',
    '{prospectorName}': data.prospectorName || '[Seu Nome]',
    '{prospectorContact}': data.prospectorContact || '[Seu Contato]',
    '{prospectorPhone}': data.prospectorPhone || '[Seu Telefone]',
    '{link}': data.referralLink || 'https://servio-ai.com',
    '{shortLink}': data.shortLink || 'servio.link/abc123',
    '{category}': data.category || 'serviços',
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    personalized = personalized.replaceAll(placeholder, value);
  }

  return personalized;
}

/**
 * Get recommended template based on context
 */
function getRecommendedTemplate(context) {
  const { channel, stage, objection, prospectProfile } = context;

  if (objection) {
    return TEMPLATES.whatsapp.objections[objection] || TEMPLATES.whatsapp.objections.dontNeed;
  }

  if (stage === 'followUp') {
    if (channel === 'whatsapp') {
      return TEMPLATES.whatsapp.followUp.day2;
    }
    return TEMPLATES.email.followUp48h;
  }

  // Initial contact
  if (channel === 'whatsapp') {
    if (prospectProfile === 'casual') {
      return TEMPLATES.whatsapp.initial.casual;
    } else if (prospectProfile === 'professional') {
      return TEMPLATES.whatsapp.initial.professional;
    }
    return TEMPLATES.whatsapp.initial.referral;
  }

  if (channel === 'email') {
    return TEMPLATES.email.cold;
  }

  if (channel === 'social') {
    return TEMPLATES.social.facebook.post;
  }

  return TEMPLATES.whatsapp.initial.casual;
}

/**
 * Get all templates for a specific channel
 */
function getTemplatesByChannel(channel) {
  return TEMPLATES[channel] || {};
}

/**
 * Get objection handling templates
 */
function getObjectionTemplates() {
  return TEMPLATES.whatsapp.objections;
}

module.exports = {
  TEMPLATES,
  personalizeTemplate,
  getRecommendedTemplate,
  getTemplatesByChannel,
  getObjectionTemplates,
};
