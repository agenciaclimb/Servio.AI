/**
 * Social Media Message Templates for Prospectors
 * 
 * Ready-to-use templates for different platforms and service categories.
 * Prospectors can copy-paste these with their personalized referral link.
 */

export interface MessageTemplate {
  id: string;
  title: string;
  platform: 'whatsapp' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'all';
  category?: string; // Service category (optional filter)
  message: string;
  hashtags?: string[];
  emoji?: string;
  bestTime?: string; // Best time to post
}

export const messageTemplates: MessageTemplate[] = [
  // Generic Templates
  {
    id: 'generic_1',
    title: 'Convite Geral - Simples',
    platform: 'all',
    message: `🚀 Quer receber oportunidades de trabalho qualificadas todo dia?

Cadastre-se na Servio.AI - a plataforma que conecta você com clientes que precisam dos seus serviços!

✅ Grátis para começar
✅ Pagamento garantido via escrow
✅ Avaliações reais de clientes

[LINK]`,
    hashtags: ['#ServioAI', '#Oportunidades', '#Trabalho'],
    emoji: '🚀',
    bestTime: '9h-11h ou 18h-20h',
  },

  {
    id: 'generic_2',
    title: 'Testemunho - Credibilidade',
    platform: 'all',
    message: `💼 Já temos +500 prestadores ganhando bem com a Servio.AI!

A plataforma usa IA para conectar você com os melhores clientes da sua região.

👉 Cadastre-se agora e receba sua primeira oportunidade em até 7 dias!

[LINK]`,
    hashtags: ['#ServioAI', '#Sucesso', '#Prestador'],
    emoji: '💼',
    bestTime: '14h-16h',
  },

  {
    id: 'generic_3',
    title: 'Urgência - Vagas Limitadas',
    platform: 'all',
    message: `⚡ ÚLTIMAS VAGAS!

Estamos selecionando prestadores de serviços para nossa plataforma Servio.AI

🎯 O que você ganha:
• Jobs qualificados via IA
• Pagamento 100% seguro
• Avaliações que constroem sua reputação

Não perca! Cadastre-se hoje: [LINK]`,
    hashtags: ['#Vagas', '#Oportunidade', '#ServioAI'],
    emoji: '⚡',
    bestTime: '10h-12h',
  },

  // Category-Specific Templates

  // Eletricista
  {
    id: 'eletricista_1',
    title: 'Eletricista - Problema Comum',
    platform: 'facebook',
    category: 'Eletricista',
    message: `💡 Eletricistas, cansados de ficar sem jobs?

A Servio.AI usa IA para conectar você com clientes que realmente precisam de um eletricista agora!

✅ Jobs na sua região
✅ Preço justo negociado
✅ Pagamento garantido

Cadastre-se: [LINK]`,
    hashtags: ['#Eletricista', '#Jobs', '#ServioAI'],
    emoji: '💡',
  },

  {
    id: 'eletricista_2',
    title: 'Eletricista - WhatsApp Status',
    platform: 'whatsapp',
    category: 'Eletricista',
    message: `⚡ Eletricista disponível?

Cadastre-se na Servio.AI e receba pedidos de instalação, manutenção e emergências elétricas todo dia!

Rápido e grátis: [LINK]`,
    emoji: '⚡',
  },

  // Encanador
  {
    id: 'encanador_1',
    title: 'Encanador - Problema Comum',
    platform: 'facebook',
    category: 'Encanador',
    message: `🚰 Encanadores, quer agenda sempre cheia?

A Servio.AI conecta você com clientes que têm emergências e manutenções hidráulicas!

✅ Pagamento via escrow (seguro)
✅ Jobs próximos de você
✅ Sem intermediários cobrando muito

Cadastre-se: [LINK]`,
    hashtags: ['#Encanador', '#Hidráulica', '#ServioAI'],
    emoji: '🚰',
  },

  // Pintor
  {
    id: 'pintor_1',
    title: 'Pintor - Convite Profissional',
    platform: 'linkedin',
    category: 'Pintor',
    message: `🎨 Pintores Profissionais:

A Servio.AI está revolucionando como prestadores encontram clientes.

Nossa plataforma usa IA para matchmaking perfeito entre você e projetos de pintura residencial/comercial.

Junte-se a +100 pintores já cadastrados: [LINK]`,
    hashtags: ['#Pintura', '#Profissional', '#ServioAI'],
    emoji: '🎨',
  },

  // Limpeza
  {
    id: 'limpeza_1',
    title: 'Limpeza - Benefícios Claros',
    platform: 'facebook',
    category: 'Limpeza',
    message: `🧹 Profissionais de Limpeza!

Quer trabalhar com clientes sérios e pagamento garantido?

Na Servio.AI você:
✅ Recebe pedidos qualificados
✅ Define seu preço
✅ Pagamento via plataforma (sem risco)

Cadastre-se grátis: [LINK]`,
    hashtags: ['#Limpeza', '#Diarista', '#ServioAI'],
    emoji: '🧹',
  },

  // Marceneiro
  {
    id: 'marceneiro_1',
    title: 'Marceneiro - Projetos sob Medida',
    platform: 'instagram',
    category: 'Marceneiro',
    message: `🪵 Marceneiros de qualidade!

Cansado de projetos mal pagos?

A Servio.AI conecta você com clientes que valorizam trabalho artesanal:

• Móveis sob medida
• Reformas de madeira
• Projetos personalizados

Cadastro rápido: [LINK]

#Marcenaria #ServioAI #MóveisPlanejados`,
    emoji: '🪵',
    bestTime: '19h-21h (Instagram prime time)',
  },

  // Técnico de Informática
  {
    id: 'informatica_1',
    title: 'Técnico TI - Chamados Urgentes',
    platform: 'linkedin',
    category: 'Técnico de Informática',
    message: `💻 Técnicos de TI e Suporte:

A Servio.AI tem chamados de:
• Formatação e instalação de sistemas
• Recuperação de dados
• Configuração de redes
• Suporte remoto/presencial

Plataforma séria, pagamento garantido.

Cadastre-se: [LINK]`,
    hashtags: ['#TI', '#Suporte', '#ServioAI'],
    emoji: '💻',
  },

  // Jardineiro
  {
    id: 'jardineiro_1',
    title: 'Jardineiro - Serviços Recorrentes',
    platform: 'whatsapp',
    category: 'Jardineiro',
    message: `🌱 Jardineiros!

Quer clientes fixos com manutenção mensal garantida?

Na Servio.AI você encontra:
✅ Clientes que pagam em dia
✅ Contratos mensais
✅ Avaliações que aumentam sua credibilidade

[LINK]`,
    emoji: '🌱',
  },

  // Multi-Platform Templates

  {
    id: 'story_instagram_1',
    title: 'Story Instagram - Contagem Regressiva',
    platform: 'instagram',
    message: `⏰ ÚLTIMAS HORAS!

Cadastro grátis na Servio.AI

Swipe up e garanta sua vaga! 👆

[LINK]`,
    emoji: '⏰',
    bestTime: 'Stories: 12h-13h ou 20h-22h',
  },

  {
    id: 'twitter_thread_1',
    title: 'Twitter Thread - Passo a Passo',
    platform: 'twitter',
    message: `🧵 Como a Servio.AI está mudando a vida de prestadores de serviço:

1/ Você se cadastra grátis e cria seu perfil
2/ Nossa IA encontra jobs perfeitos pra você
3/ Você propõe, negocia e fecha o serviço
4/ Pagamento 100% garantido via escrow
5/ Cliente avalia e você constrói reputação

Simples assim! Cadastre-se: [LINK]`,
    hashtags: ['#ServioAI', '#Freelancer', '#Oportunidades'],
    emoji: '🧵',
  },

  {
    id: 'linkedin_formal_1',
    title: 'LinkedIn - Tom Profissional',
    platform: 'linkedin',
    message: `Profissionais de Serviços: A Transformação Digital Chegou

A Servio.AI está revolucionando a intermediação de serviços com inteligência artificial.

Nossa plataforma oferece:
• Matchmaking inteligente cliente-prestador
• Sistema de escrow para pagamentos seguros
• Avaliações verificadas que constroem reputação
• Suporte dedicado via IA

Se você é prestador de serviços e busca uma plataforma séria e inovadora, convido você a conhecer a Servio.AI.

Cadastro: [LINK]

#Inovação #InteligênciaArtificial #Serviços #Marketplace`,
    emoji: '💼',
    bestTime: '8h-9h ou 12h-13h (horário comercial)',
  },

  {
    id: 'facebook_group_1',
    title: 'Facebook - Grupos de Serviços',
    platform: 'facebook',
    message: `Pessoal, descobri uma plataforma muito boa pra quem trabalha com serviços!

A Servio.AI usa IA pra conectar a gente com clientes que realmente precisam do nosso trabalho.

Eu já recebi 3 propostas em 2 dias! 🚀

O melhor: é grátis e o pagamento é garantido (eles seguram o dinheiro até o serviço ser aprovado).

Se alguém quiser testar: [LINK]

Qualquer dúvida, só chamar!`,
    emoji: '🚀',
    bestTime: '19h-21h (pico de engajamento)',
  },
];

/**
 * Get templates filtered by platform and/or category
 */
export function getTemplates(
  platform?: MessageTemplate['platform'],
  category?: string
): MessageTemplate[] {
    return messageTemplates.filter(template => {
        const platformMatch = !platform || template.platform === 'all' || template.platform === platform;
        const categoryMatch = !category || (template.category === category) || !template.category;
        
        if (category && !getCategories().includes(category)) {
            return false;
        }

        return platformMatch && categoryMatch;
    });
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): MessageTemplate | undefined {
  return messageTemplates.find(t => t.id === id);
}

/**
 * Format template with actual referral link
 */
export function formatTemplate(template: MessageTemplate, referralLink: string): string {
  let formatted = template.message.replace('[LINK]', referralLink);
  
  if (template.hashtags && template.hashtags.length > 0) {
    formatted += '\n\n' + template.hashtags.join(' ');
  }
  
  return formatted;
}

/**
 * Get service categories
 */
export function getCategories(): string[] {
  const categories = new Set(
    messageTemplates
      .filter(t => t.category)
      .map(t => t.category as string)
  );
  return Array.from(categories).sort();
}

/**
 * Get platforms
 */
export function getPlatforms(): Array<MessageTemplate['platform']> {
  return ['all', 'whatsapp', 'facebook', 'instagram', 'linkedin', 'twitter'];
}
