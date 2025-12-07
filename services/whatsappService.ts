// Phase 1 placeholder for WhatsApp Business integration.
// Real API (Cloud API / On-Premise) will replace this after approval and number verification.
// Design goals:
// 1. Graceful fallback (never blocks prospecting flow)
// 2. Structured template support
// 3. Basic rate limiting hook (to be implemented)

export interface WhatsAppSendResult {
  success: boolean;
  provider: string;
  template: string;
  error?: string;
}

export async function sendWhatsAppInvite(
  providerPhone: string,
  template: string
): Promise<WhatsAppSendResult> {
  if (!providerPhone) {
    return { success: false, provider: providerPhone, template, error: 'missing_phone' };
  }
  // Placeholder: simulate success 80% of the time
  const simulated = Math.random() < 0.8;
  if (simulated) {
    return { success: true, provider: providerPhone, template };
  }
  return { success: false, provider: providerPhone, template, error: 'simulated_failure' };
}

export function buildInviteTemplate(providerName: string, category: string) {
  return `Olá ${providerName}! Somos a Servio.AI – plataforma inteligente para serviços de ${category}. Cadastre-se e receba oportunidades qualificadas. 🚀`; // 150 chars approx
}
