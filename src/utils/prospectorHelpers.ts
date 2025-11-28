/**
 * Pure utility functions extracted from ProspectorCRM
 * These functions have no dependencies and can be tested independently
 */

export type LeadTemperature = 'hot' | 'warm' | 'cold';

export interface ProspectLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category?: string;
  temperature?: LeadTemperature;
  lastContacted?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Get CSS class for temperature badge
 */
export function getTemperatureBadgeClass(temperature?: LeadTemperature): string {
  if (temperature === 'hot') return 'bg-red-100 text-red-700';
  if (temperature === 'warm') return 'bg-yellow-100 text-yellow-700';
  return 'bg-blue-100 text-blue-700';
}

/**
 * Get emoji for temperature badge
 */
export function getTemperatureEmoji(temperature?: LeadTemperature): string {
  if (temperature === 'hot') return '🔥';
  if (temperature === 'warm') return '☀️';
  return '❄️';
}

/**
 * Format relative time (e.g., "5min atrás", "2h atrás")
 */
export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
  return `${Math.floor(seconds / 86400)}d atrás`;
}

/**
 * Generate WhatsApp message template for prospect
 */
export function generateWhatsAppTemplate(lead: ProspectLead): string {
  return `Olá ${lead.name}! 👋

Sou prospector da Servio.AI, a plataforma que conecta profissionais qualificados a clientes.

${lead.category ? `Vi que você trabalha com ${lead.category}. ` : ''}Temos uma oportunidade perfeita para você aumentar sua renda! 💰

✅ Sem taxas de cadastro
✅ Pagamento garantido
✅ Flexibilidade total
✅ Suporte dedicado

Quer saber mais sobre como funciona? 🚀`;
}

/**
 * Generate email message template for prospect
 */
export function generateEmailTemplate(lead: ProspectLead): string {
  return `Olá ${lead.name},

Meu nome é [SEU NOME] e sou prospector da Servio.AI - a plataforma que está revolucionando a forma como profissionais ${lead.category ? `de ${lead.category}` : 'autônomos'} encontram clientes.

${lead.category ? `Percebi sua expertise em ${lead.category} e ` : ''}Gostaria de apresentar uma oportunidade exclusiva:

• Clientes pré-qualificados
• Pagamento garantido pela plataforma
• Sem mensalidades ou taxas ocultas
• Você define sua agenda e valores

Estou à disposição para conversar melhor.

Abraços,
[SEU NOME]`;
}
