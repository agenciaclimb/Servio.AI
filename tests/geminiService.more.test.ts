import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Gemini from '../services/geminiService';
import { Job } from '../types';

const originalFetch = global.fetch;
let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetch = vi.fn();
  global.fetch = mockFetch as any;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
});

describe('geminiService – resilience and URL resolution', () => {
  it('generateJobFAQ retries once after network error and succeeds', async () => {
    const faq = [{ q: 'Q', a: 'A' }];
    mockFetch
      .mockRejectedValueOnce(new TypeError('Network down'))
      .mockResolvedValueOnce({ ok: true, json: async () => faq });

    const res = await Gemini.generateJobFAQ({ id: 'j1' } as unknown as Job);
    expect(res).toEqual(faq);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('getMatchingProviders falls back to [] on persistent failure', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'bad' }) });

    const res = await Gemini.getMatchingProviders({ id: 'j1' } as any, [], []);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  it('resolveEndpoint builds absolute URL in Node tests when no VITE vars', async () => {
    // Ensure no vite env vars
    const oldVite = (import.meta as any).env;
    (import.meta as any).env = {};

    // Capture first argument to fetch
    mockFetch.mockImplementation(async (url: string) => {
      expect(url).toMatch(/^http:\/\/localhost:5173\/api\/generate-faq$/);
      return { ok: true, json: async () => [] } as any;
    });

    await Gemini.generateJobFAQ({ id: 'j1' } as unknown as Job);

    // restore
    (import.meta as any).env = oldVite;
  });
});
