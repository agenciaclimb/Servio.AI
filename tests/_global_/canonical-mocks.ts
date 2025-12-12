import { vi } from 'vitest';

export const BACKEND_URL = 'https://servio-ai-1000250760228.us-west1.run.app';

export const prospectingMocks = {
  jobData: {
    id: 'job-123',
    category: 'Limpeza de Sofá',
    description: 'Limpeza a seco de sofá de 3 lugares.',
    address: 'Rua das Flores, 123, São Paulo, SP',
    status: 'pending',
    clientId: 'cliente@teste.com',
  },
  clientEmail: 'cliente@teste.com',
  googleResult: {
    name: 'Prospecto Exemplo',
    email: 'prospect@example.com',
    phone: '11999998888',
    website: 'https://site.com',
    rating: 4.5,
    reviewCount: 120,
    address: 'São Paulo',
  },
  autoResultSuccess: {
    success: true,
    prospectsFound: 3,
    emailsSent: 3,
    adminNotified: true,
    message: 'Prospecção concluída',
    qualityScore: 92,
    topProspects: [
      { name: 'Ana', email: 'ana@test.com', qualityScore: 92, matchScore: 90 },
    ],
  },
  autoResultFailure: {
    success: false,
    prospectsFound: 0,
    emailsSent: 0,
    adminNotified: false,
    message: 'Falha na prospecção automática. Equipe será notificada manualmente.',
  },
  analysisResponse: {
    name: 'Prospecto Exemplo',
    qualityScore: 88,
    matchScore: 85,
    experience: '5 anos',
    specialties: ['Limpeza', 'Higienização'],
    preferredContact: 'email' as const,
    aiAnalysis: 'Perfil adequado para o serviço solicitado.',
  },
  analysisFallback: {
    name: 'Prospecto Exemplo',
    qualityScore: 50,
    matchScore: 50,
    preferredContact: 'email' as const,
    aiAnalysis: 'Fallback básico aplicado.',
  },
  emailResponse: {
    subject: 'Proposta de serviço',
    body: 'Olá, temos um serviço para você.',
  },
};

export const stripeMocks = {
  session: {
    id: 'cs_123456789',
    url: 'https://checkout.stripe.com/pay/cs_123456789',
    client_secret: 'cuss_123456789',
  },
  verificationPaid: {
    id: 'cs_123456789',
    payment_status: 'paid',
    customer_email: 'client@example.com',
    amount_total: 15000,
  },
  verificationFailed: {
    id: 'cs_123456789',
    payment_status: 'unpaid',
    error: 'Payment failed',
  },
  processing: {
    id: 'cs_123456789',
    payment_status: 'processing',
  },
};

export const geminiMocks = {
  enhanceSuccess: {
    enhancedDescription:
      'Descrição aprimorada com SEO, chamadas claras e requisitos técnicos listados.',
    keySkills: ['React', 'TypeScript'],
    suggestedBudget: 'R$ 2.000 - R$ 3.000',
    category: 'eletricista',
    serviceType: 'personalizado',
  },
  enhanceFallback: {
    enhancedDescription: 'Solicitação geral processada em modo offline.',
    keySkills: ['geral'],
    suggestedBudget: 'A combinar',
    category: 'geral',
    serviceType: 'personalizado',
  },
};

export const fcmMocks = {
  token: 'mock-fcm-token',
  messagePayload: {
    notification: { title: 'Ping', body: 'Hello' },
    data: { type: 'conversion' },
  },
  error: 'Messaging not initialized',
};

export type FetchMap = Record<string, { ok: boolean; status?: number; json: () => Promise<any> }>;

export function createJsonResponse(data: any, ok = true, status = 200) {
  return { ok, status, json: async () => data };
}

export function mockFetchFromMap(map: FetchMap, fallback?: { ok: boolean; status?: number; json: () => Promise<any> }) {
  const resolvedFallback = fallback || createJsonResponse({}, true, 200);
  const fn = vi.fn(async (url: string) => {
    const entry = map[url];
    if (entry) return entry;
    return resolvedFallback;
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

export function mockFetchReject(error: Error) {
  const fn = vi.fn(async () => {
    throw error;
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}
