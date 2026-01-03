import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateDefaultSequence, planNextAction, type SequenceStep } from '../../src/prospector/sequencer';

describe('Prospector Sequencer', () => {
  describe('generateDefaultSequence', () => {
    it('deve gerar sequência com 4 steps', () => {
      const seq = generateDefaultSequence(true);
      expect(seq).toHaveLength(4);
    });

    it('deve começar com WhatsApp delay 0h', () => {
      const seq = generateDefaultSequence(true);
      expect(seq[0]).toEqual({
        id: 's1',
        channel: 'whatsapp',
        templateKey: 'intro_value',
        delayHours: 0,
      });
    });

    it('deve usar email no step 2 quando hasEmail=true', () => {
      const seq = generateDefaultSequence(true);
      expect(seq[1]).toEqual({
        id: 's2',
        channel: 'email',
        templateKey: 'case_study',
        delayHours: 24,
      });
    });

    it('deve usar whatsapp no step 2 quando hasEmail=false', () => {
      const seq = generateDefaultSequence(false);
      expect(seq[1]).toEqual({
        id: 's2',
        channel: 'whatsapp',
        templateKey: 'case_study',
        delayHours: 24,
      });
    });

    it('deve ter delays progressivos: 0h, 24h, 48h, 72h', () => {
      const seq = generateDefaultSequence(true);
      expect(seq[0].delayHours).toBe(0);
      expect(seq[1].delayHours).toBe(24);
      expect(seq[2].delayHours).toBe(48);
      expect(seq[3].delayHours).toBe(72);
    });

    it('deve usar templates corretos', () => {
      const seq = generateDefaultSequence(true);
      expect(seq[0].templateKey).toBe('intro_value');
      expect(seq[1].templateKey).toBe('case_study');
      expect(seq[2].templateKey).toBe('question_nudge');
      expect(seq[3].templateKey).toBe('call_script_short');
    });

    it('deve ter call como último step', () => {
      const seq = generateDefaultSequence(true);
      expect(seq[3]).toEqual({
        id: 's4',
        channel: 'call',
        templateKey: 'call_script_short',
        delayHours: 72,
      });
    });

    it('deve gerar sequências diferentes para hasEmail true/false', () => {
      const seqWithEmail = generateDefaultSequence(true);
      const seqWithoutEmail = generateDefaultSequence(false);
      expect(seqWithEmail[1].channel).toBe('email');
      expect(seqWithoutEmail[1].channel).toBe('whatsapp');
      // Outros steps devem ser iguais
      expect(seqWithEmail[0]).toEqual(seqWithoutEmail[0]);
      expect(seqWithEmail[2]).toEqual(seqWithoutEmail[2]);
      expect(seqWithEmail[3]).toEqual(seqWithoutEmail[3]);
    });
  });

  describe('planNextAction', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-03-15T10:00:00.000Z')); // 1741172400000
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve retornar now quando lastExecutedAt é undefined', () => {
      const now = Date.now();
      const plan = planNextAction();
      expect(plan.nextActionAt).toBe(now);
      expect(plan.steps).toHaveLength(4);
    });

    it('deve gerar sequência default se sequence não fornecido', () => {
      const plan = planNextAction();
      expect(plan.steps[0].templateKey).toBe('intro_value');
      expect(plan.steps[1].templateKey).toBe('case_study');
      expect(plan.steps[2].templateKey).toBe('question_nudge');
      expect(plan.steps[3].templateKey).toBe('call_script_short');
    });

    it('deve calcular nextActionAt baseado em delays cumulativos', () => {
      const now = Date.now();
      const oneHourAgo = now - 1 * 60 * 60 * 1000;
      const plan = planNextAction(oneHourAgo);
      // Elapsed: 1h, próximo step é s2 (delay 24h)
      // nextActionAt = oneHourAgo + 24h
      const expected = oneHourAgo + 24 * 60 * 60 * 1000;
      expect(plan.nextActionAt).toBe(Math.floor(expected));
    });

    it('deve avançar para próximo step após delay anterior', () => {
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
      const plan = planNextAction(twentyFourHoursAgo);
      // Elapsed: 24h, atingiu s2 (24h), próximo é s3 (cumulative 72h total)
      expect(plan.nextActionAt).toBeGreaterThan(now);
    });

    it('deve propor re-engagement após 7 dias quando sequência completa', () => {
      const now = Date.now();
      const oneHundredFiftyHoursAgo = now - 150 * 60 * 60 * 1000; // 150h > 144h (cumulative total)
      const plan = planNextAction(oneHundredFiftyHoursAgo);
      // Sequência completa (cumulativos: 0h, 24h, 72h, 144h): propõe +7 dias
      const expected = oneHundredFiftyHoursAgo + 7 * 24 * 60 * 60 * 1000;
      expect(plan.nextActionAt).toBe(Math.floor(expected));
    });

    it('deve usar sequência customizada quando fornecida', () => {
      const customSeq: SequenceStep[] = [
        { id: 'custom1', channel: 'email', templateKey: 'custom_intro', delayHours: 0 },
        { id: 'custom2', channel: 'call', templateKey: 'custom_followup', delayHours: 12 },
      ];
      const plan = planNextAction(undefined, customSeq);
      expect(plan.steps).toEqual(customSeq);
      expect(plan.steps).toHaveLength(2);
    });

    it('deve calcular nextActionAt com sequência customizada', () => {
      const now = Date.now();
      const fiveHoursAgo = now - 5 * 60 * 60 * 1000;
      const customSeq: SequenceStep[] = [
        { id: 'c1', channel: 'whatsapp', templateKey: 't1', delayHours: 0 },
        { id: 'c2', channel: 'email', templateKey: 't2', delayHours: 10 },
      ];
      const plan = planNextAction(fiveHoursAgo, customSeq);
      // Elapsed: 5h < 10h, próximo é c2 (10h)
      const expected = fiveHoursAgo + 10 * 60 * 60 * 1000;
      expect(plan.nextActionAt).toBe(Math.floor(expected));
    });

    it('deve lidar com delay 0h no primeiro step', () => {
      const plan = planNextAction();
      const firstStep = plan.steps[0];
      expect(firstStep.delayHours).toBe(0);
    });

    it('deve retornar agora quando elapsed=0 e lastExecutedAt fornecido', () => {
      const now = Date.now();
      const plan = planNextAction(now);
      // Elapsed: 0h, próximo é s2 (24h)
      const expected = now + 24 * 60 * 60 * 1000;
      expect(plan.nextActionAt).toBe(Math.floor(expected));
    });

    it('deve calcular corretamente com multiple steps já executados', () => {
      const now = Date.now();
      const fortyHoursAgo = now - 40 * 60 * 60 * 1000;
      const plan = planNextAction(fortyHoursAgo);
      // Elapsed: 40h
      // s1: 0h, s2: 24h (cumulative 24h), s3: 48h (cumulative 72h), s4: 72h (cumulative 144h)
      // 40h < 72h, então próximo é s3 (72h total)
      expect(plan.nextActionAt).toBeGreaterThan(now);
    });

    it('deve retornar inteiro para nextActionAt (Math.floor)', () => {
      const now = Date.now();
      const plan = planNextAction(now - 0.5); // meio ms atrás
      expect(Number.isInteger(plan.nextActionAt)).toBe(true);
    });

    it('deve lidar com sequência vazia (fallback para default)', () => {
      const emptySeq: SequenceStep[] = [];
      const plan = planNextAction(undefined, emptySeq);
      // Deve usar default sequence (length 4)
      expect(plan.steps).toHaveLength(4);
      expect(plan.steps[0].templateKey).toBe('intro_value');
    });

    it('deve calcular re-engagement mesmo com sequência customizada completa', () => {
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const shortSeq: SequenceStep[] = [
        { id: 's1', channel: 'whatsapp', templateKey: 't1', delayHours: 0 },
      ];
      const plan = planNextAction(oneWeekAgo, shortSeq);
      // Elapsed: 7 days = 168h > 0h, completa
      const expected = oneWeekAgo + 7 * 24 * 60 * 60 * 1000;
      expect(plan.nextActionAt).toBe(Math.floor(expected));
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-03-15T10:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve lidar com lastExecutedAt no futuro', () => {
      const now = Date.now();
      const futureTime = now + 10 * 60 * 60 * 1000; // 10h no futuro
      const plan = planNextAction(futureTime);
      // Elapsed negativo, mas a função usa cumulativos
      // elapsedHours seria negativo, todos os steps parecem futuros
      // Deve retornar primeiro step ainda pendente
      expect(plan.nextActionAt).toBeGreaterThan(now);
    });

    it('deve lidar com delays grandes (>1000h)', () => {
      const largeSeq: SequenceStep[] = [
        { id: 'l1', channel: 'whatsapp', templateKey: 't1', delayHours: 0 },
        { id: 'l2', channel: 'email', templateKey: 't2', delayHours: 5000 },
      ];
      const now = Date.now();
      const oneHourAgo = now - 1 * 60 * 60 * 1000;
      const plan = planNextAction(oneHourAgo, largeSeq);
      const expected = oneHourAgo + 5000 * 60 * 60 * 1000;
      expect(plan.nextActionAt).toBe(Math.floor(expected));
    });

    it('deve lidar com sequência com todos steps delay 0', () => {
      const instantSeq: SequenceStep[] = [
        { id: 'i1', channel: 'whatsapp', templateKey: 't1', delayHours: 0 },
        { id: 'i2', channel: 'email', templateKey: 't2', delayHours: 0 },
        { id: 'i3', channel: 'call', templateKey: 't3', delayHours: 0 },
      ];
      const now = Date.now();
      const oneSecondAgo = now - 1000;
      const plan = planNextAction(oneSecondAgo, instantSeq);
      // Todos delays são 0, cumulative sempre 0
      // elapsedHours > 0, todos steps já passados
      // Deve propor re-engagement +7 dias
      const expected = oneSecondAgo + 7 * 24 * 60 * 60 * 1000;
      expect(plan.nextActionAt).toBe(Math.floor(expected));
    });

    it('deve preservar estrutura de sequência original no plan', () => {
      const customSeq: SequenceStep[] = [
        { id: 'unique1', channel: 'email', templateKey: 'special', delayHours: 5 },
        { id: 'unique2', channel: 'call', templateKey: 'urgent', delayHours: 10 },
      ];
      const plan = planNextAction(undefined, customSeq);
      expect(plan.steps).toEqual(customSeq);
      expect(plan.steps[0].id).toBe('unique1');
      expect(plan.steps[1].templateKey).toBe('urgent');
    });
  });
});
