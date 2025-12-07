import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the module under test
import * as gemini from '../services/geminiService';

// Helper to set Vite-like env and support returning/awaiting a value
function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const origImportMeta: any = (globalThis as any).importMeta;
  const origProcessEnv: any = (process as any).env ? { ...(process as any).env } : undefined;
  (globalThis as any).importMeta = { env: { ...((import.meta as any).env || {}), ...vars } };
  // Also set process.env fallbacks so getEnvVar can read it in Node/Vitest
  (process as any).env = { ...(origProcessEnv || {}), ...vars };
  try {
    return fn();
  } finally {
    (globalThis as any).importMeta = origImportMeta;
    if (origProcessEnv) (process as any).env = origProcessEnv;
  }
}

describe('resolveEndpoint (browser vs node, AI endpoints)', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    // Simulate browser environment
    (globalThis as any).window = { location: { origin: 'http://localhost:3000' } } as any;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it('returns relative path in browser so Vite proxy/same-origin handles it', () => {
    const _ep = (gemini as any).resolveEndpoint?.('/api/generate-faq') ?? null; // underscore to mark intentionally unused
    // resolveEndpoint is not exported; use fetchFromBackend to infer behavior
    // We test by calling a small internal: use the fact that fetchFromBackend builds the URL via resolveEndpoint
    // Here we'll monkey-patch fetch to capture the URL
    const spy = vi
      .spyOn(globalThis, 'fetch' as any)
      .mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    return (gemini as any)
      .generateJobFAQ({} as any)
      .catch(() => {})
      .finally(() => {
        expect(spy).toHaveBeenCalled();
        const url = spy.mock.calls[0][0] as string;
        expect(url.startsWith('/api/')).toBe(true);
        spy.mockRestore();
      });
  });

  it('uses VITE_AI_API_URL for AI endpoints when set', () => {
    return withEnv({ VITE_AI_API_URL: 'https://ai.example.com' }, () => {
      const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: true,
        json: async () => ({ suggestedHeadline: 'h', suggestedBio: 'b' }),
      } as any);
      // enhanceProviderProfile hits /api/enhance-profile (AI)
      return (gemini as any)
        .enhanceProviderProfile({ name: 'u', headline: 'h', bio: 'b' } as any)
        .finally(() => {
          const url = spy.mock.calls[0][0] as string;
          expect(url.startsWith('https://ai.example.com/api/')).toBe(true);
          spy.mockRestore();
        });
    });
  });
});
