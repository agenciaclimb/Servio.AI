import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as geminiService from '../../services/geminiService';
import { Job, User } from '../../types';

// Mock the global fetch
global.fetch = vi.fn();

// The base URL used by resolveEndpoint in a VITEST environment
const BASE_URL = 'http://localhost:5173';

describe('Gemini Service', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    // Reset mocks before each test
    (fetch as vi.Mock).mockClear();
    consoleWarnSpy.mockClear();
  });

  afterEach(() => {
    (fetch as vi.Mock).mockReset();
  });

  describe('enhanceJobRequest', () => {
    it('should return enhanced job data from AI backend on success', async () => {
      const mockEnhancedRequest = {
        enhancedDescription: 'Enhanced description for electrical work.',
        suggestedCategory: 'eletricista',
        suggestedServiceType: 'tabelado',
      };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnhancedRequest,
      });

      const result = await geminiService.enhanceJobRequest('Preciso de um eletricista');

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/enhance-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Preciso de um eletricista',
          address: undefined,
          fileCount: undefined,
        }),
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual(mockEnhancedRequest);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should use fallback heuristic when the first API call fails', async () => {
      // Mock primary call failure and retry failure
      (fetch as vi.Mock).mockRejectedValue(new Error('Network Error'));

      const prompt = 'Meu chuveiro não esquenta, acho que a resistência queimou. É um vazamento.';
      const result = await geminiService.enhanceJobRequest(prompt);

      // Verify that a warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[enhanceJobRequest] Fallback heuristic used due to AI backend error:',
        expect.any(Error)
      );

      // Check if the fallback logic produced a reasonable result
      // "vazamento" appears last, so "encanador" should be the category.
      // The prompt has no keywords for 'tabelado' or 'diagnostico', so it should be the default 'personalizado'.
      expect(result).toEqual({
        enhancedDescription: prompt,
        suggestedCategory: 'encanador',
        suggestedServiceType: 'personalizado',
      });
    });

    it("should use fallback and infer 'pintura' category", async () => {
      (fetch as vi.Mock).mockRejectedValue(new Error('Network Error'));
      const prompt = 'Quero pintar a parede da sala.';
      const result = await geminiService.enhanceJobRequest(prompt);
      expect(result.suggestedCategory).toBe('pintura');
      expect(result.suggestedServiceType).toBe('tabelado'); // "pintar" is a keyword for "tabelado"
    });

    it("should use fallback and infer 'diagnostico' service type", async () => {
      (fetch as vi.Mock).mockRejectedValue(new Error('Network Error'));
      const prompt = 'Preciso que um técnico venha avaliar meu computador.';
      const result = await geminiService.enhanceJobRequest(prompt);
      expect(result.suggestedCategory).toBe('ti');
      expect(result.suggestedServiceType).toBe('diagnostico'); // "avaliar" is a keyword for "diagnostico"
    });
  });

  describe('getMatchingProviders', () => {
    const mockJob = { id: 'job-1' } as Job;
    const mockUsers = [{ id: 'user-1' }] as User[];

    it('should return matching providers from the backend', async () => {
      const mockMatches = [{ provider: mockUsers[0], matchScore: 0.9 }];
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatches,
      });

      const result = await geminiService.getMatchingProviders(mockJob, mockUsers, []);

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/match-providers`, expect.any(Object));
      expect(result).toEqual(mockMatches);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return an empty array on API failure', async () => {
      (fetch as vi.Mock).mockRejectedValue(new Error('API Down'));
      const result = await geminiService.getMatchingProviders(mockJob, mockUsers, []);
      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[match-providers] Fallback to empty list due to backend error:',
        expect.any(Error)
      );
    });
  });

  describe('generateProfileTip', () => {
    it('should return a mock tip in a Vitest environment without calling fetch', async () => {
      const tip = await geminiService.generateProfileTip({} as User);
      expect(fetch).not.toHaveBeenCalled();
      expect(tip).toBe('[mock-tip] Complete seu perfil adicionando uma boa foto profissional.');
    });
  });

  describe('generateProposalMessage', () => {
    const job = { id: 'job-123', description: 'Fix my sink' } as Job;
    const provider = { id: 'user-456', name: 'Bob the Builder' } as User;

    it('should return a proposal message on success', async () => {
      const mockResponse = { message: 'Hello, I can fix your sink.' };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      const result = await geminiService.generateProposalMessage(job, provider);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/generate-proposal`, expect.any(Object));
      expect(result).toBe(mockResponse.message);
    });

    it('should throw an error on API failure', async () => {
      const apiError = new Error('Failed to generate');
      // Mock both attempts to fail
      (fetch as vi.Mock).mockRejectedValue(apiError);
      await expect(geminiService.generateProposalMessage(job, provider)).rejects.toThrow(
        apiError.message
      );
    });
  });

  describe('generateJobFAQ', () => {
    const job = { id: 'job-123', description: 'Install a new ceiling fan' } as Job;

    it('should return FAQ items on success', async () => {
      const mockFaq = [{ question: 'How long will it take?', answer: 'About 2 hours.' }];
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFaq,
      });
      const result = await geminiService.generateJobFAQ(job);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/generate-faq`, expect.any(Object));
      expect(result).toEqual(mockFaq);
    });
  });

  describe('identifyItemFromImage', () => {
    it('should return identified item data on success', async () => {
      const mockResponse = { itemName: 'Hammer', confidence: 0.98 };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      const result = await geminiService.identifyItemFromImage('base64data', 'image/png');
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/identify-item`, expect.any(Object));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Functions with specific AI endpoint', () => {
    const AI_BASE_URL = 'https://ai.servio.com';

    beforeEach(() => {
      // Set the env var for these tests
      process.env.VITE_AI_API_URL = AI_BASE_URL;
    });

    afterEach(() => {
      // Clean up the env var
      delete process.env.VITE_AI_API_URL;
    });

    it('enhanceProviderProfile should call the specific AI endpoint', async () => {
      const profile = { name: 'Test', headline: 'Test', bio: 'Test' };
      const mockResponse = { suggestedHeadline: 'New Headline', suggestedBio: 'New Bio' };
      (fetch as vi.Mock).mockResolvedValue({ ok: true, json: async () => mockResponse });

      const result = await geminiService.enhanceProviderProfile(profile);

      expect(fetch).toHaveBeenCalledWith(`${AI_BASE_URL}/api/enhance-profile`, expect.any(Object));
      expect(result).toEqual(mockResponse);
    });

    it('generateReferralEmail should call the specific AI endpoint', async () => {
      const mockResponse = { subject: 'Join me!', body: 'Check this out.' };
      (fetch as vi.Mock).mockResolvedValue({ ok: true, json: async () => mockResponse });

      const result = await geminiService.generateReferralEmail('John', 'friend@email.com');

      expect(fetch).toHaveBeenCalledWith(
        `${AI_BASE_URL}/api/generate-referral`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('parseSearchQuery', () => {
    it('should return parsed query data on success', async () => {
      const mockResponse = { category: 'plumbing', location: 'downtown' };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      const result = await geminiService.parseSearchQuery('plumbers downtown');
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/parse-search`, expect.any(Object));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('proposeScheduleFromChat', () => {
    it('should return a schedule object or null', async () => {
      const mockResponse = { date: '2025-12-25', time: '14:00' };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      const result = await geminiService.proposeScheduleFromChat([]);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/propose-schedule`, expect.any(Object));
      expect(result).toEqual(mockResponse);
    });
  });
});
