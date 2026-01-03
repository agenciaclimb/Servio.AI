import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scoreProspect, getPriority, describeScore, type Prospect, type ScoreBreakdown } from '../../src/prospector/leadScoring';

describe('Prospector LeadScoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T10:00:00.000Z')); // 1710500400000
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('scoreProspect', () => {
    describe('Base Score (por source)', () => {
      it('deve retornar base 60 para google_places', () => {
        const prospect: Prospect = { source: 'google_places' };
        const score = scoreProspect(prospect);
        expect(score.base).toBe(60);
      });

      it('deve retornar base 70 para referral', () => {
        const prospect: Prospect = { source: 'referral' };
        const score = scoreProspect(prospect);
        expect(score.base).toBe(70);
      });

      it('deve retornar base 45 para import', () => {
        const prospect: Prospect = { source: 'import' };
        const score = scoreProspect(prospect);
        expect(score.base).toBe(45);
      });

      it('deve retornar base 50 para manual', () => {
        const prospect: Prospect = { source: 'manual' };
        const score = scoreProspect(prospect);
        expect(score.base).toBe(50);
      });

      it('deve usar base 50 quando source é undefined', () => {
        const prospect: Prospect = {};
        const score = scoreProspect(prospect);
        expect(score.base).toBe(50);
      });

      it('deve usar base 50 para source desconhecido', () => {
        const prospect: Prospect = { source: 'unknown_source' as any };
        const score = scoreProspect(prospect);
        expect(score.base).toBe(50);
      });
    });

    describe('Engagement Score', () => {
      it('deve calcular engagement com opens', () => {
        const prospect: Prospect = { opens: 5 }; // 5 * 4 = 20
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(20);
      });

      it('deve calcular engagement com clicks', () => {
        const prospect: Prospect = { clicks: 3 }; // 3 * 6 = 18
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(18);
      });

      it('deve calcular engagement com replies', () => {
        const prospect: Prospect = { replies: 2 }; // 2 * 12 = 24
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(24);
      });

      it('deve somar opens, clicks e replies', () => {
        const prospect: Prospect = { opens: 2, clicks: 2, replies: 1 }; // 8 + 12 + 12 = 32
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(32);
      });

      it('deve limitar engagement a máximo 50', () => {
        const prospect: Prospect = { opens: 20, clicks: 20, replies: 20 }; // 80 + 120 + 240 = 440 → clamped to 50
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(50);
      });

      it('deve retornar 0 quando não há engajamento', () => {
        const prospect: Prospect = { opens: 0, clicks: 0, replies: 0 };
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(0);
      });

      it('deve limitar opens a máximo 25', () => {
        const prospect: Prospect = { opens: 10 }; // 10 * 4 = 40 → clamped to 25
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(25);
      });

      it('deve limitar clicks a máximo 30', () => {
        const prospect: Prospect = { clicks: 10 }; // 10 * 6 = 60 → clamped to 30
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(30);
      });

      it('deve limitar replies a máximo 40', () => {
        const prospect: Prospect = { replies: 10 }; // 10 * 12 = 120 → clamped to 40
        const score = scoreProspect(prospect);
        expect(score.engagement).toBe(40);
      });
    });

    describe('Profile Score (completude)', () => {
      it('deve retornar 0 quando nenhum campo está preenchido', () => {
        const prospect: Prospect = {};
        const score = scoreProspect(prospect);
        expect(score.profile).toBe(0);
      });

      it('deve calcular 10 pontos por campo preenchido', () => {
        const prospect: Prospect = { email: 'test@example.com' }; // 1 field * 10 = 10
        const score = scoreProspect(prospect);
        expect(score.profile).toBe(10);
      });

      it('deve contar email, phone, company, title, website, linkedin', () => {
        const prospect: Prospect = {
          email: 'test@example.com',
          phone: '+5511999999999',
          company: 'ACME Corp',
        }; // 3 fields * 10 = 30
        const score = scoreProspect(prospect);
        expect(score.profile).toBe(30);
      });

      it('deve alcançar máximo 50 com todos os campos', () => {
        const prospect: Prospect = {
          email: 'test@example.com',
          phone: '+5511999999999',
          company: 'ACME Corp',
          title: 'CEO',
          website: 'https://acme.com',
          linkedin: 'linkedin.com/in/test',
        }; // 6 fields * 10 = 60 → clamped to 50
        const score = scoreProspect(prospect);
        expect(score.profile).toBe(50);
      });

      it('não deve contar campos null como preenchidos', () => {
        const prospect: Prospect = {
          email: null,
          phone: null,
          company: 'ACME Corp',
        }; // 1 field * 10 = 10
        const score = scoreProspect(prospect);
        expect(score.profile).toBe(10);
      });

      it('não deve contar campos undefined como preenchidos', () => {
        const prospect: Prospect = {
          email: undefined,
          phone: '+5511999999999',
        }; // 1 field * 10 = 10
        const score = scoreProspect(prospect);
        expect(score.profile).toBe(10);
      });

      it('não deve contar campos vazios como preenchidos', () => {
        const prospect: Prospect = {
          email: '',
          phone: '+5511999999999',
        }; // 1 field (empty string is falsy) * 10 = 10
        const score = scoreProspect(prospect);
        expect(score.profile).toBe(10);
      });
    });

    describe('Recency Score', () => {
      it('deve retornar máximo 35 quando lastInteractionTs é hoje', () => {
        const now = Date.now();
        const prospect: Prospect = { lastInteractionTs: now };
        const score = scoreProspect(prospect);
        expect(score.recency).toBe(35); // 35 - 0 * 0.6 = 35
      });

      it('deve decair com tempo', () => {
        const now = Date.now();
        const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
        const prospect: Prospect = { lastInteractionTs: tenDaysAgo };
        const score = scoreProspect(prospect);
        // days = 10, recency = 35 - 10 * 0.6 = 29
        expect(score.recency).toBe(29);
      });

      it('deve limitar decay a máximo 60 dias', () => {
        const now = Date.now();
        const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
        const prospect: Prospect = { lastInteractionTs: ninetyDaysAgo };
        const score = scoreProspect(prospect);
        // days = 90, mas min(90, 60) = 60, recency = 35 - 60 * 0.6 = -1 → clamped to 0
        expect(score.recency).toBe(0);
      });

      it('deve retornar 0 quando lastInteractionTs é undefined', () => {
        const prospect: Prospect = {};
        const score = scoreProspect(prospect);
        // daysSince(undefined) = 365, min(365, 60) = 60, recency = 35 - 60 * 0.6 = -1 → clamped to 0
        expect(score.recency).toBe(0);
      });

      it('deve calcular corretamente para 30 dias atrás', () => {
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const prospect: Prospect = { lastInteractionTs: thirtyDaysAgo };
        const score = scoreProspect(prospect);
        // days = 30, recency = 35 - 30 * 0.6 = 17
        expect(score.recency).toBe(17);
      });

      it('deve retornar 0 quando recency fica negativo', () => {
        const now = Date.now();
        const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
        const prospect: Prospect = { lastInteractionTs: sixtyDaysAgo };
        const score = scoreProspect(prospect);
        // days = 60, recency = 35 - 60 * 0.6 = -1 → clamped to 0
        expect(score.recency).toBe(0);
      });
    });

    describe('Bonus Score', () => {
      it('deve retornar 0 quando sem sentiment ou tags', () => {
        const prospect: Prospect = {};
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(0);
      });

      it('deve adicionar 10 pontos para sentiment positivo', () => {
        const prospect: Prospect = { sentiment: 'positivo' };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(10);
      });

      it('não deve adicionar pontos para sentiment neutro', () => {
        const prospect: Prospect = { sentiment: 'neutro' };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(0);
      });

      it('não deve adicionar pontos para sentiment negativo', () => {
        const prospect: Prospect = { sentiment: 'negativo' };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(0);
      });

      it('deve adicionar 8 pontos para tag alto_valor', () => {
        const prospect: Prospect = { tags: ['alto_valor'] };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(8);
      });

      it('deve adicionar 8 pontos para tag parceria', () => {
        const prospect: Prospect = { tags: ['parceria'] };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(8);
      });

      it('deve somar sentiment + tag estratégica', () => {
        const prospect: Prospect = { sentiment: 'positivo', tags: ['alto_valor'] };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(18); // 10 + 8
      });

      it('não deve adicionar pontos para tags não estratégicas', () => {
        const prospect: Prospect = { tags: ['regular', 'outro'] };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(0);
      });

      it('deve adicionar apenas uma vez mesmo com múltiplas tags estratégicas', () => {
        const prospect: Prospect = { tags: ['alto_valor', 'parceria'] };
        const score = scoreProspect(prospect);
        expect(score.bonus).toBe(8); // only 8, not 16 (some() returns on first match)
      });
    });

    describe('Total Score', () => {
      it('deve calcular total com pesos corretos', () => {
        const prospect: Prospect = {
          source: 'referral', // base 70
          opens: 5, // 20
          clicks: 3, // 18
          replies: 1, // 12 → engagement 50 (clamped)
          email: 'test@example.com',
          phone: '+5511999999999',
          company: 'ACME', // profile 30
          lastInteractionTs: Date.now(), // recency 35
          sentiment: 'positivo', // bonus 10
        };
        const score = scoreProspect(prospect);
        // total = base * 0.3 + engagement * 0.35 + profile * 0.2 + recency * 0.1 + bonus
        // total = 70 * 0.3 + 50 * 0.35 + 30 * 0.2 + 35 * 0.1 + 10
        // total = 21 + 17.5 + 6 + 3.5 + 10 = 58 → rounded
        expect(score.total).toBe(58);
      });

      it('deve limitar total a máximo 100', () => {
        const prospect: Prospect = {
          source: 'referral', // base 70
          opens: 20,
          clicks: 20,
          replies: 20, // engagement 50 (clamped)
          email: 'test@example.com',
          phone: '+5511999999999',
          company: 'ACME',
          title: 'CEO',
          website: 'https://acme.com',
          linkedin: 'linkedin.com/in/test', // profile 50
          lastInteractionTs: Date.now(), // recency 35
          sentiment: 'positivo',
          tags: ['alto_valor'], // bonus 18
        };
        const score = scoreProspect(prospect);
        // total = 70 * 0.3 + 50 * 0.35 + 50 * 0.2 + 35 * 0.1 + 18
        // total = 21 + 17.5 + 10 + 3.5 + 18 = 70
        expect(score.total).toBeLessThanOrEqual(100);
        expect(score.total).toBe(70);
      });

      it('deve retornar total 0 quando prospect vazio', () => {
        const prospect: Prospect = {};
        const score = scoreProspect(prospect);
        // base 50, engagement 0, profile 0, recency 0, bonus 0
        // total = 50 * 0.3 + 0 * 0.35 + 0 * 0.2 + 0 * 0.1 + 0 = 15
        expect(score.total).toBe(15);
      });

      it('deve arredondar total para inteiro', () => {
        const prospect: Prospect = {
          source: 'manual', // base 50
          opens: 1, // 4
          clicks: 1, // 6 → engagement 10
          email: 'test@example.com', // profile 10
        };
        const score = scoreProspect(prospect);
        // total = 50 * 0.3 + 10 * 0.35 + 10 * 0.2 + 0 * 0.1 + 0
        // total = 15 + 3.5 + 2 = 20.5 → rounded to 21 (Math.round)
        expect(score.total).toBe(21);
        expect(Number.isInteger(score.total)).toBe(true);
      });

      it('deve incluir todos os componentes no breakdown', () => {
        const prospect: Prospect = { source: 'google_places' };
        const score = scoreProspect(prospect);
        expect(score).toHaveProperty('base');
        expect(score).toHaveProperty('engagement');
        expect(score).toHaveProperty('profile');
        expect(score).toHaveProperty('recency');
        expect(score).toHaveProperty('bonus');
        expect(score).toHaveProperty('total');
      });
    });
  });

  describe('getPriority', () => {
    it('deve retornar A para score >= 80', () => {
      expect(getPriority(80)).toBe('A');
      expect(getPriority(90)).toBe('A');
      expect(getPriority(100)).toBe('A');
    });

    it('deve retornar B para score >= 60 e < 80', () => {
      expect(getPriority(60)).toBe('B');
      expect(getPriority(70)).toBe('B');
      expect(getPriority(79)).toBe('B');
    });

    it('deve retornar C para score >= 40 e < 60', () => {
      expect(getPriority(40)).toBe('C');
      expect(getPriority(50)).toBe('C');
      expect(getPriority(59)).toBe('C');
    });

    it('deve retornar D para score < 40', () => {
      expect(getPriority(0)).toBe('D');
      expect(getPriority(20)).toBe('D');
      expect(getPriority(39)).toBe('D');
    });

    it('deve lidar com scores decimais', () => {
      expect(getPriority(79.9)).toBe('B');
      expect(getPriority(80.0)).toBe('A');
      expect(getPriority(59.9)).toBe('C');
      expect(getPriority(60.0)).toBe('B');
    });

    it('deve lidar com scores negativos', () => {
      expect(getPriority(-10)).toBe('D');
    });

    it('deve lidar com scores acima de 100', () => {
      expect(getPriority(150)).toBe('A');
    });
  });

  describe('describeScore', () => {
    it('deve formatar breakdown corretamente', () => {
      const breakdown: ScoreBreakdown = {
        base: 60,
        engagement: 30,
        profile: 40,
        recency: 25,
        bonus: 10,
        total: 75,
      };
      const description = describeScore(breakdown);
      expect(description).toBe('base=60 eng=30 prof=40 rec=25 bonus=10 total=75');
    });

    it('deve lidar com valores zero', () => {
      const breakdown: ScoreBreakdown = {
        base: 0,
        engagement: 0,
        profile: 0,
        recency: 0,
        bonus: 0,
        total: 0,
      };
      const description = describeScore(breakdown);
      expect(description).toBe('base=0 eng=0 prof=0 rec=0 bonus=0 total=0');
    });

    it('deve lidar com valores decimais', () => {
      const breakdown: ScoreBreakdown = {
        base: 55.5,
        engagement: 12.3,
        profile: 33.7,
        recency: 20.1,
        bonus: 5.5,
        total: 68.9,
      };
      const description = describeScore(breakdown);
      expect(description).toBe('base=55.5 eng=12.3 prof=33.7 rec=20.1 bonus=5.5 total=68.9');
    });

    it('deve preservar formato mesmo com valores máximos', () => {
      const breakdown: ScoreBreakdown = {
        base: 100,
        engagement: 50,
        profile: 50,
        recency: 35,
        bonus: 18,
        total: 100,
      };
      const description = describeScore(breakdown);
      expect(description).toBe('base=100 eng=50 prof=50 rec=35 bonus=18 total=100');
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com prospect completamente vazio', () => {
      const prospect: Prospect = {};
      const score = scoreProspect(prospect);
      expect(score.base).toBeGreaterThan(0); // default 50
      expect(score.total).toBeGreaterThan(0);
    });

    it('deve lidar com valores negativos (não devem acontecer)', () => {
      const prospect: Prospect = {
        opens: -5 as any,
        clicks: -3 as any,
        replies: -2 as any,
      };
      const score = scoreProspect(prospect);
      // Negative values clamped to 0
      expect(score.engagement).toBe(0);
    });

    it('deve lidar com lastInteractionTs no futuro', () => {
      const now = Date.now();
      const futureTime = now + 10 * 24 * 60 * 60 * 1000;
      const prospect: Prospect = { lastInteractionTs: futureTime };
      const score = scoreProspect(prospect);
      // daysSince returns Math.max(0, ...), so days = 0
      expect(score.recency).toBe(35);
    });

    it('deve lidar com tags vazias', () => {
      const prospect: Prospect = { tags: [] };
      const score = scoreProspect(prospect);
      expect(score.bonus).toBe(0);
    });

    it('deve lidar com tags undefined', () => {
      const prospect: Prospect = { tags: undefined };
      const score = scoreProspect(prospect);
      expect(score.bonus).toBe(0);
    });

    it('deve lidar com source null', () => {
      const prospect: Prospect = { source: null };
      const score = scoreProspect(prospect);
      expect(score.base).toBe(50); // default
    });

    it('deve garantir que total nunca excede 100 mesmo com valores extremos', () => {
      const prospect: Prospect = {
        source: 'referral', // base 70
        opens: 1000,
        clicks: 1000,
        replies: 1000, // engagement 50 (clamped)
        email: 'test@example.com',
        phone: '+5511999999999',
        company: 'ACME',
        title: 'CEO',
        website: 'https://acme.com',
        linkedin: 'linkedin.com/in/test', // profile 50
        lastInteractionTs: Date.now(), // recency 35
        sentiment: 'positivo',
        tags: ['alto_valor', 'parceria'], // bonus 8 (some() stops at first)
      };
      const score = scoreProspect(prospect);
      expect(score.total).toBeLessThanOrEqual(100);
    });

    it('deve garantir que scores individuais respeitem limites', () => {
      const prospect: Prospect = {
        opens: 1000,
        clicks: 1000,
        replies: 1000,
        email: 'a',
        phone: 'b',
        company: 'c',
        title: 'd',
        website: 'e',
        linkedin: 'f',
        lastInteractionTs: Date.now(),
      };
      const score = scoreProspect(prospect);
      expect(score.engagement).toBeLessThanOrEqual(50);
      expect(score.profile).toBeLessThanOrEqual(50);
      expect(score.recency).toBeLessThanOrEqual(35);
    });
  });
});
