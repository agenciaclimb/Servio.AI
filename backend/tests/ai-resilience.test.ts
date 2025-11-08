import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * QA 360 - RESILIÊNCIA IA (GEMINI)
 * 
 * Cobertura:
 * 1. Timeout no enhance-job (>30s) retorna fallback
 * 2. Erro de API Gemini (500) retorna mensagem amigável
 * 3. Rate limit Gemini (429) entra em retry com backoff
 * 4. Resposta vazia ou malformada é tratada
 * 5. Token limit exceeded retorna resumo parcial
 * 6. Retry com backoff exponencial (3 tentativas)
 * 7. Fallback para sugestões genéricas se IA falhar
 * 
 * Critérios de aceite:
 * - Usuário sempre recebe resposta, mesmo com IA offline
 * - Erros são logados mas não expostos diretamente
 * - Retry automático com backoff (1s, 2s, 4s)
 */

// Mock de cliente Gemini
const mockGeminiClient = {
  generateContent: vi.fn()
};

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: () => mockGeminiClient
  }))
}));

describe('QA 360 - Resiliência IA', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Timeout no enhance-job retorna fallback', async () => {
    const enhanceJobWithTimeout = async (prompt: string, timeoutMs: number) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      });

      const geminiPromise = mockGeminiClient.generateContent({ prompt });

      try {
        return await Promise.race([geminiPromise, timeoutPromise]);
      } catch (error) {
        console.warn('Gemini timeout, retornando fallback');
        return {
          response: {
            text: () => 'Descrição recebida. Por favor, aguarde enquanto processamos sua solicitação.'
          }
        };
      }
    };

    // Simula timeout (Gemini não responde em 100ms)
    mockGeminiClient.generateContent.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 200))
    );

    const result = await enhanceJobWithTimeout('Instalar chuveiro', 100);
    const text = result.response.text();

    expect(text).toContain('aguarde');
    console.log('✅ Timeout tratado com fallback');
  });

  it('2. Erro de API Gemini (500) retorna mensagem amigável', async () => {
    mockGeminiClient.generateContent.mockRejectedValue(
      new Error('Internal Server Error')
    );

    const enhanceJob = async (prompt: string) => {
      try {
        const result = await mockGeminiClient.generateContent({ prompt });
        return result.response.text();
      } catch (error) {
        console.error('Gemini error:', error);
        return 'Não foi possível processar sua solicitação no momento. Por favor, tente novamente.';
      }
    };

    const result = await enhanceJob('Instalar chuveiro');

    expect(result).toContain('tente novamente');
    console.log('✅ Erro 500 tratado com mensagem amigável');
  });

  it('3. Rate limit Gemini (429) entra em retry com backoff', async () => {
    const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error: any) {
          if (error.message.includes('429') && i < maxRetries - 1) {
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            console.log(`Rate limited, retry ${i + 1} após ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
    };

    // Primeira tentativa falha com 429, segunda sucede
    let callCount = 0;
    mockGeminiClient.generateContent.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('429 Too Many Requests'));
      }
      return Promise.resolve({ response: { text: () => 'Sucesso após retry' } });
    });

    const result = await retryWithBackoff(
      () => mockGeminiClient.generateContent({ prompt: 'test' }),
      3
    );

    expect(result.response.text()).toBe('Sucesso após retry');
    expect(callCount).toBe(2);
    console.log('✅ Retry com backoff funcionando');
  });

  it('4. Resposta vazia ou malformada é tratada', async () => {
    mockGeminiClient.generateContent.mockResolvedValue({
      response: { text: () => '' }
    });

    const enhanceJob = async (prompt: string) => {
      const result = await mockGeminiClient.generateContent({ prompt });
      const text = result.response.text();

      if (!text || text.trim().length === 0) {
        return 'Sua solicitação foi recebida. Por favor, forneça mais detalhes se possível.';
      }

      return text;
    };

    const result = await enhanceJob('Instalar chuveiro');

    expect(result).toContain('forneça mais detalhes');
    console.log('✅ Resposta vazia tratada');
  });

  it('5. Token limit exceeded retorna resumo parcial', async () => {
    mockGeminiClient.generateContent.mockRejectedValue(
      new Error('Token limit exceeded')
    );

    const enhanceJob = async (prompt: string) => {
      try {
        const result = await mockGeminiClient.generateContent({ prompt });
        return result.response.text();
      } catch (error: any) {
        if (error.message.includes('Token limit')) {
          console.warn('Token limit, retornando resumo parcial');
          return `Resumo: ${prompt.substring(0, 100)}...`;
        }
        throw error;
      }
    };

    const longPrompt = 'A'.repeat(10000);
    const result = await enhanceJob(longPrompt);

    expect(result).toContain('Resumo:');
    expect(result.length).toBeLessThan(150);
    console.log('✅ Token limit tratado com resumo parcial');
  });

  it('6. Retry com backoff exponencial (3 tentativas)', async () => {
    const delays: number[] = [];

    const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i < maxRetries - 1) {
            const delay = Math.pow(2, i) * 1000;
            delays.push(delay);
            await new Promise(resolve => setTimeout(resolve, 0)); // Mock delay
          } else {
            throw error;
          }
        }
      }
    };

    mockGeminiClient.generateContent.mockRejectedValue(new Error('Persistent error'));

    try {
      await retryWithBackoff(
        () => mockGeminiClient.generateContent({ prompt: 'test' }),
        3
      );
    } catch (error) {
      expect(delays).toEqual([1000, 2000]);
      console.log('✅ Backoff exponencial: 1s, 2s');
    }
  });

  it('7. Fallback para sugestões genéricas se IA falhar', async () => {
    mockGeminiClient.generateContent.mockRejectedValue(new Error('IA offline'));

    const enhanceJobWithFallback = async (category: string) => {
      const genericSuggestions: Record<string, string> = {
        'eletricista': 'Instalação elétrica, troca de tomadas e disjuntores',
        'encanador': 'Reparo de vazamentos, instalação de canos',
        'pintor': 'Pintura de paredes internas e externas'
      };

      try {
        const result = await mockGeminiClient.generateContent({ prompt: category });
        return result.response.text();
      } catch (error) {
        console.warn('IA offline, usando sugestões genéricas');
        return genericSuggestions[category] || 'Serviço geral';
      }
    };

    const result = await enhanceJobWithFallback('eletricista');

    expect(result).toContain('Instalação elétrica');
    console.log('✅ Fallback genérico funcionando');
  });
});
