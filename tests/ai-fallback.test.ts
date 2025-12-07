import { describe, it, expect, vi } from 'vitest';
import { enhanceJobRequest, generateProfileTip } from '../../services/geminiService';

// Simplistic mock of underlying fetch / model call to force failure path
function forceGeminiFailure() {
  vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Gemini endpoint unreachable'));
}

describe('[E2E-SMOKE] AI Fallback', () => {
  it('enhanceJobRequest → retorna objeto heurístico quando backend falha', async () => {
    forceGeminiFailure();
    const result = await enhanceJobRequest('Instalar tomadas em 3 cômodos');
    expect(result.enhancedDescription).toMatch(/Instalar tomadas/i);
    expect(result.suggestedCategory).toBeTruthy();
    expect(result.suggestedServiceType).toBeTruthy();
  });

  it('generateProfileTip → retorna tip mock no ambiente de teste', async () => {
    const tip = await generateProfileTip({
      type: 'prestador',
      email: 'prestador@servio.ai',
      name: 'Carlos',
      headline: 'Eletricista Profissional',
      bio: 'Especialista em instalações elétricas residenciais.',
      location: 'São Paulo, SP',
      status: 'ativo',
      memberSince: new Date().toISOString(),
      verificationStatus: 'verificado',
    } as any);
    expect(typeof tip).toBe('string');
    expect(tip).toMatch(/mock-tip/);
  });
});
