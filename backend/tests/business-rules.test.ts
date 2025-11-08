import { describe, it, expect } from 'vitest';

/**
 * QA 360 - BUSINESS RULES (REGRAS DE NEGÓCIO)
 * 
 * Cobertura:
 * 1. calculateProviderRate - Comissão 15%
 * 2. calculateMatchScore - Algoritmo de scoring
 * 3. Validação de transições de status de job
 * 4. Validação de elegibilidade para disputa
 * 5. Cálculo de rating médio do prestador
 * 6. Validação de upload de arquivos (tamanho/tipo)
 * 7. Validação de horário de agendamento
 * 
 * Critérios de aceite:
 * - Todos os cálculos retornam valores corretos
 * - Validações bloqueiam ações inválidas
 * - Edge cases tratados (divisão por zero, valores negativos)
 */

describe('QA 360 - Business Rules', () => {
  
  describe('1. calculateProviderRate', () => {
    const calculateProviderRate = (amount: number): number => {
      if (amount < 0) throw new Error('Amount cannot be negative');
      return Math.round(amount * 0.85);
    };

    it('Calcula comissão 15% corretamente', () => {
      expect(calculateProviderRate(10000)).toBe(8500);
      expect(calculateProviderRate(15000)).toBe(12750);
      expect(calculateProviderRate(20000)).toBe(17000);
      expect(calculateProviderRate(0)).toBe(0);
    });

    it('Rejeita valores negativos', () => {
      expect(() => calculateProviderRate(-100)).toThrow('Amount cannot be negative');
    });

    it('Arredonda corretamente', () => {
      expect(calculateProviderRate(10001)).toBe(8501); // 8500.85 -> 8501
      expect(calculateProviderRate(9999)).toBe(8499); // 8499.15 -> 8499
    });
  });

  describe('2. calculateMatchScore', () => {
    const calculateMatchScore = (provider: any, job: any): number => {
      let score = 0;

      // Especialidade match (0.4)
      if (provider.specialties.includes(job.category)) {
        score += 0.4;
      }

      // Localização match (0.3)
      if (provider.location === job.location) {
        score += 0.3;
      }

      // Rating (0.2)
      score += (provider.averageRating / 5) * 0.2;

      // Disponibilidade (0.1)
      if (provider.availability === 'available') {
        score += 0.1;
      }

      return Math.round(score * 100) / 100;
    };

    it('Calcula score perfeito (1.0)', () => {
      const provider = {
        specialties: ['eletricista'],
        location: 'São Paulo, SP',
        averageRating: 5.0,
        availability: 'available'
      };
      const job = {
        category: 'eletricista',
        location: 'São Paulo, SP'
      };

      expect(calculateMatchScore(provider, job)).toBe(1.0);
    });

    it('Calcula score parcial', () => {
      const provider = {
        specialties: ['eletricista'],
        location: 'Rio de Janeiro, RJ',
        averageRating: 4.0,
        availability: 'busy'
      };
      const job = {
        category: 'eletricista',
        location: 'São Paulo, SP'
      };

      // 0.4 (specialty) + 0 (location) + 0.16 (rating) + 0 (availability) = 0.56
      expect(calculateMatchScore(provider, job)).toBe(0.56);
    });
  });

  describe('3. Validação de transições de status', () => {
    const isValidTransition = (from: string, to: string): boolean => {
      const validTransitions: Record<string, string[]> = {
        'open': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled', 'disputed'],
        'completed': ['disputed'],
        'disputed': ['disputed_resolved'],
        'cancelled': [],
        'disputed_resolved': []
      };

      return validTransitions[from]?.includes(to) || false;
    };

    it('Permite transições válidas', () => {
      expect(isValidTransition('open', 'in_progress')).toBe(true);
      expect(isValidTransition('in_progress', 'completed')).toBe(true);
      expect(isValidTransition('completed', 'disputed')).toBe(true);
    });

    it('Bloqueia transições inválidas', () => {
      expect(isValidTransition('completed', 'open')).toBe(false);
      expect(isValidTransition('cancelled', 'in_progress')).toBe(false);
      expect(isValidTransition('disputed_resolved', 'open')).toBe(false);
    });
  });

  describe('4. Validação de elegibilidade para disputa', () => {
    const canOpenDispute = (jobStatus: string): boolean => {
      return ['in_progress', 'completed'].includes(jobStatus);
    };

    it('Permite disputa em jobs in_progress ou completed', () => {
      expect(canOpenDispute('in_progress')).toBe(true);
      expect(canOpenDispute('completed')).toBe(true);
    });

    it('Bloqueia disputa em outros status', () => {
      expect(canOpenDispute('open')).toBe(false);
      expect(canOpenDispute('cancelled')).toBe(false);
      expect(canOpenDispute('disputed')).toBe(false);
    });
  });

  describe('5. Cálculo de rating médio', () => {
    const calculateAverageRating = (ratings: number[]): number => {
      if (ratings.length === 0) return 0;
      const sum = ratings.reduce((acc, r) => acc + r, 0);
      return Math.round((sum / ratings.length) * 10) / 10;
    };

    it('Calcula média corretamente', () => {
      expect(calculateAverageRating([5, 5, 5])).toBe(5.0);
      expect(calculateAverageRating([4, 5, 3])).toBe(4.0);
      expect(calculateAverageRating([5, 4, 4, 5])).toBe(4.5);
    });

    it('Retorna 0 para array vazio', () => {
      expect(calculateAverageRating([])).toBe(0);
    });
  });

  describe('6. Validação de upload de arquivos', () => {
    const validateFileUpload = (file: { size: number; type: string }) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

      if (file.size > maxSize) {
        return { valid: false, error: 'File too large (max 10MB)' };
      }

      if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type' };
      }

      return { valid: true };
    };

    it('Aceita arquivos válidos', () => {
      expect(validateFileUpload({ size: 1024, type: 'image/jpeg' })).toEqual({ valid: true });
      expect(validateFileUpload({ size: 5000000, type: 'application/pdf' })).toEqual({ valid: true });
    });

    it('Rejeita arquivos grandes', () => {
      const result = validateFileUpload({ size: 11 * 1024 * 1024, type: 'image/jpeg' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File too large (max 10MB)');
    });

    it('Rejeita tipos inválidos', () => {
      const result = validateFileUpload({ size: 1024, type: 'video/mp4' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid file type');
    });
  });

  describe('7. Validação de horário de agendamento', () => {
    const isValidScheduleTime = (scheduledFor: Date): boolean => {
      const now = new Date();
      const minAdvance = 2 * 60 * 60 * 1000; // 2 horas
      return scheduledFor.getTime() > now.getTime() + minAdvance;
    };

    it('Aceita horários com 2+ horas de antecedência', () => {
      const futureTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
      expect(isValidScheduleTime(futureTime)).toBe(true);
    });

    it('Rejeita horários com menos de 2 horas', () => {
      const nearTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
      expect(isValidScheduleTime(nearTime)).toBe(false);
    });
  });
});
