import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackStageChange, trackChannelAction, trackConversion } from '../../src/prospector/analytics';

// Mock Firestore
const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn((db, path, id) => ({ path, id }));
const mockIncrement = vi.fn((n) => `increment(${n})`);
const mockServerTimestamp = vi.fn(() => 'server-timestamp');

vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  increment: (n: number) => mockIncrement(n),
  serverTimestamp: () => mockServerTimestamp(),
}));

describe('prospector/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date para garantir consistência nos testes
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('trackStageChange', () => {
    it('deve registrar mudança de stage com campaignId', async () => {
      await trackStageChange('campaign-123', 'lead', 'qualificado');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        'stage_lead_to_qualificado'
      );

      expect(mockSetDoc).toHaveBeenCalledWith(
        { path: 'prospector_metrics/2025-03-15', id: 'stage_lead_to_qualificado' },
        {
          count: 'increment(1)',
          updatedAt: 'server-timestamp',
          campaignId: 'campaign-123',
        },
        { merge: true }
      );
    });

    it('deve registrar mudança sem campaignId (null)', async () => {
      await trackStageChange(null, 'contato', 'proposta');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          count: 'increment(1)',
          updatedAt: 'server-timestamp',
          campaignId: null,
        },
        { merge: true }
      );
    });

    it('deve usar data atual no formato ISO para o path', async () => {
      await trackStageChange('camp-456', 'proposta', 'ganho');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        expect.anything()
      );
    });

    it('deve criar documento com ID baseado nos stages', async () => {
      await trackStageChange('camp-789', 'qualificado', 'perdido');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        expect.anything(),
        'stage_qualificado_to_perdido'
      );
    });

    it('deve usar merge para não sobrescrever dados existentes', async () => {
      await trackStageChange('camp-abc', 'lead', 'qualificado');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { merge: true }
      );
    });

    it('deve incrementar contador em 1', async () => {
      await trackStageChange('camp-def', 'contato', 'ganho');

      expect(mockIncrement).toHaveBeenCalledWith(1);
    });
  });

  describe('trackChannelAction', () => {
    it('deve registrar ação bem-sucedida no WhatsApp', async () => {
      await trackChannelAction('whatsapp', true);

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        'channel_whatsapp_success'
      );

      expect(mockSetDoc).toHaveBeenCalledWith(
        { path: 'prospector_metrics/2025-03-15', id: 'channel_whatsapp_success' },
        {
          count: 'increment(1)',
          updatedAt: 'server-timestamp',
        },
        { merge: true }
      );
    });

    it('deve registrar ação falhada no email', async () => {
      await trackChannelAction('email', false);

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        'channel_email_fail'
      );
    });

    it('deve registrar ação bem-sucedida por padrão', async () => {
      await trackChannelAction('call');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        'channel_call_success'
      );
    });

    it('deve usar data atual no path', async () => {
      await trackChannelAction('whatsapp', true);

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        expect.anything()
      );
    });

    it('deve incrementar contador em 1', async () => {
      await trackChannelAction('email', true);

      expect(mockIncrement).toHaveBeenCalledWith(1);
    });

    it('deve usar merge para preservar dados', async () => {
      await trackChannelAction('whatsapp', false);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { merge: true }
      );
    });

    it('deve adicionar timestamp da atualização', async () => {
      await trackChannelAction('call', true);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          updatedAt: 'server-timestamp',
        }),
        expect.anything()
      );
    });
  });

  describe('trackConversion', () => {
    it('deve registrar conversão com campaignId', async () => {
      await trackConversion('campaign-win-123');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        'conversion_won'
      );

      expect(mockSetDoc).toHaveBeenCalledWith(
        { path: 'prospector_metrics/2025-03-15', id: 'conversion_won' },
        {
          count: 'increment(1)',
          updatedAt: 'server-timestamp',
          campaignId: 'campaign-win-123',
        },
        { merge: true }
      );
    });

    it('deve registrar conversão sem campaignId', async () => {
      await trackConversion(null);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          campaignId: null,
        }),
        expect.anything()
      );
    });

    it('deve usar data atual no path', async () => {
      await trackConversion('camp-win-456');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        expect.anything()
      );
    });

    it('deve usar ID fixo conversion_won', async () => {
      await trackConversion('camp-win-789');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        expect.anything(),
        'conversion_won'
      );
    });

    it('deve incrementar contador em 1', async () => {
      await trackConversion('camp-win-abc');

      expect(mockIncrement).toHaveBeenCalledWith(1);
    });

    it('deve usar merge para não sobrescrever', async () => {
      await trackConversion('camp-win-def');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { merge: true }
      );
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com mudança de stage com campaignId longo', async () => {
      const longCampaignId = 'campaign-' + 'a'.repeat(100);
      await trackStageChange(longCampaignId, 'lead', 'ganho');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          campaignId: longCampaignId,
        }),
        expect.anything()
      );
    });

    it('deve lidar com stages com underscores', async () => {
      await trackStageChange('camp', 'novo_lead', 'em_analise');

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        expect.anything(),
        'stage_novo_lead_to_em_analise'
      );
    });

    it('deve lidar com múltiplas chamadas em sequência', async () => {
      await trackStageChange('c1', 'a', 'b');
      await trackChannelAction('whatsapp', true);
      await trackConversion('c1');

      expect(mockSetDoc).toHaveBeenCalledTimes(3);
      expect(mockDoc).toHaveBeenCalledTimes(3);
    });

    it('deve manter timestamp consistente dentro do mesmo dia', async () => {
      await trackStageChange('c1', 'a', 'b');
      
      // Avança 6 horas (ainda no mesmo dia)
      vi.setSystemTime(new Date('2025-03-15T16:30:00.000Z'));
      
      await trackChannelAction('email', true);

      // Ambos devem usar o mesmo path de data
      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'prospector_metrics/2025-03-15',
        expect.anything()
      );
    });

    it('deve usar path diferente em dia diferente', async () => {
      await trackStageChange('c1', 'a', 'b');

      // Avança 1 dia
      vi.setSystemTime(new Date('2025-03-16T10:30:00.000Z'));

      await trackStageChange('c2', 'b', 'c');

      // Deve ter dois paths diferentes
      expect(mockDoc).toHaveBeenNthCalledWith(
        1,
        {},
        'prospector_metrics/2025-03-15',
        expect.anything()
      );
      expect(mockDoc).toHaveBeenNthCalledWith(
        2,
        {},
        'prospector_metrics/2025-03-16',
        expect.anything()
      );
    });
  });
});
