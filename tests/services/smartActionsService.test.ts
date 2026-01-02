import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSmartActions, type RecentActivity } from '../../src/services/smartActionsService';
import type { ProspectorStats } from '../../services/api';
import type { ProspectLead } from '../../src/components/ProspectorCRM';

describe('smartActionsService', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockStats: ProspectorStats = {
    totalRecruits: 10,
    activeRecruits: 8,
    totalCommissionsEarned: 500,
    currentBadge: 'bronze',
    nextBadge: 'silver',
    progressToNextBadge: 50,
  };

  const mockLeads: ProspectLead[] = [
    {
      id: 'lead-1',
      name: 'João Silva',
      email: 'joao@example.com',
      stage: 'new',
      temperature: 'hot',
      priority: 'high',
      lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdAt: new Date(),
      prospectorId: 'prospector-1',
    },
    {
      id: 'lead-2',
      name: 'Maria Santos',
      email: 'maria@example.com',
      stage: 'negotiating',
      temperature: 'hot',
      priority: 'high',
      lastActivity: new Date(),
      createdAt: new Date(),
      prospectorId: 'prospector-1',
    },
  ];

  const mockRecentActivity: RecentActivity[] = [
    {
      type: 'referral_share',
      description: 'Compartilhou link no WhatsApp',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  ];

  describe('generateSmartActions - API Success', () => {
    it('deve chamar API backend com dados corretos', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: [] }),
      } as Response);

      await generateSmartActions('prospector-1', mockStats, mockLeads, mockRecentActivity);

      expect(fetchSpy).toHaveBeenCalledWith('/api/prospector/smart-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"totalRecruits":10'),
      });
    });

    it('deve retornar ações da API quando bem-sucedido', async () => {
      const mockActions = [
        {
          id: 'api-action',
          icon: '🤖',
          title: 'Ação da IA',
          description: 'Gerada por IA',
          priority: 'high' as const,
          actionType: 'follow_up' as const,
        },
      ];

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: mockActions }),
      } as Response);

      const actions = await generateSmartActions('prospector-1', mockStats, mockLeads, mockRecentActivity);

      expect(actions).toEqual(mockActions);
    });

    it('deve incluir todos os campos de stats na chamada', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: [] }),
      } as Response);

      await generateSmartActions('prospector-1', mockStats, mockLeads, mockRecentActivity);

      const callBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(callBody.stats).toEqual({
        totalRecruits: 10,
        activeRecruits: 8,
        totalCommissionsEarned: 500,
        currentBadge: 'bronze',
        nextBadge: 'silver',
        progressToNextBadge: 50,
      });
    });

    it('deve serializar leads corretamente', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: [] }),
      } as Response);

      await generateSmartActions('prospector-1', mockStats, mockLeads, mockRecentActivity);

      const callBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(callBody.leads).toHaveLength(2);
      expect(callBody.leads[0]).toHaveProperty('id', 'lead-1');
      expect(callBody.leads[0]).toHaveProperty('stage', 'new');
      expect(callBody.leads[0].lastActivity).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('generateSmartActions - API Failure Fallback', () => {
    it('deve usar regras locais quando API retorna erro', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const actions = await generateSmartActions('prospector-1', mockStats, mockLeads, mockRecentActivity);

      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('deve usar regras locais quando fetch lança erro', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      const actions = await generateSmartActions('prospector-1', mockStats, mockLeads, mockRecentActivity);

      expect(actions).toBeInstanceOf(Array);
    });
  });

  describe('generateRuleBasedActions - Inactive Leads', () => {
    it('deve detectar leads inativos há 7+ dias', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const inactiveLeads: ProspectLead[] = [
        {
          ...mockLeads[0],
          stage: 'contacted',
          lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, inactiveLeads, []);

      const inactiveAction = actions.find(a => a.id === 'rule-inactive');
      expect(inactiveAction).toBeDefined();
      expect(inactiveAction?.title).toContain('inativos');
      expect(inactiveAction?.priority).toBe('high');
      expect(inactiveAction?.actionType).toBe('follow_up');
    });

    it('deve contar múltiplos leads inativos', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const inactiveLeads: ProspectLead[] = [
        {
          ...mockLeads[0],
          id: 'lead-1',
          stage: 'contacted',
          lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          ...mockLeads[0],
          id: 'lead-2',
          stage: 'negotiating',
          lastActivity: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, inactiveLeads, []);

      const inactiveAction = actions.find(a => a.id === 'rule-inactive');
      expect(inactiveAction?.description).toContain('2 leads inativos');
      expect(inactiveAction?.metadata?.leads).toEqual(['lead-1', 'lead-2']);
    });

    it('não deve incluir leads won/lost como inativos', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const leads: ProspectLead[] = [
        {
          ...mockLeads[0],
          stage: 'won',
          lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
        },
        {
          ...mockLeads[0],
          stage: 'lost',
          lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, leads, []);

      const inactiveAction = actions.find(a => a.id === 'rule-inactive');
      expect(inactiveAction).toBeUndefined();
    });
  });

  describe('generateRuleBasedActions - Share Referral', () => {
    it('deve sugerir compartilhamento após 3 dias', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const activity: RecentActivity[] = [
        {
          type: 'referral_share',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // exactly 3 days
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, [], activity);

      const shareAction = actions.find(a => a.id === 'rule-share');
      expect(shareAction).toBeDefined();
      expect(shareAction?.title).toContain('Compartilhar');
      expect(shareAction?.actionType).toBe('share');
    });

    it('deve aumentar prioridade após 7 dias sem compartilhar', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const activity: RecentActivity[] = [
        {
          type: 'referral_share',
          timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, [], activity);

      const shareAction = actions.find(a => a.id === 'rule-share');
      expect(shareAction?.priority).toBe('high');
    });

    it('deve usar prioridade medium entre 3-6 dias', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const activity: RecentActivity[] = [
        {
          type: 'referral_share',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, [], activity);

      const shareAction = actions.find(a => a.id === 'rule-share');
      expect(shareAction?.priority).toBe('medium');
    });

    it('deve sugerir compartilhamento se nunca compartilhou', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const actions = await generateSmartActions('prospector-1', mockStats, [], []);

      const shareAction = actions.find(a => a.id === 'rule-share');
      expect(shareAction).toBeDefined();
      expect(shareAction?.description).toContain('999 dias');
    });
  });

  describe('generateRuleBasedActions - Badge Progress', () => {
    it('deve sugerir ação quando progresso > 70%', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const statsWithProgress = {
        ...mockStats,
        progressToNextBadge: 75,
        nextBadge: 'gold',
      };

      const actions = await generateSmartActions('prospector-1', statsWithProgress, [], []);

      const badgeAction = actions.find(a => a.id === 'rule-badge');
      expect(badgeAction).toBeDefined();
      expect(badgeAction?.title).toContain('gold');
      expect(badgeAction?.description).toContain('25%');
      expect(badgeAction?.actionType).toBe('badge');
    });

    it('deve aumentar prioridade quando restam < 20%', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const statsWithHighProgress = {
        ...mockStats,
        progressToNextBadge: 85, // 15% remaining
      };

      const actions = await generateSmartActions('prospector-1', statsWithHighProgress, [], []);

      const badgeAction = actions.find(a => a.id === 'rule-badge');
      expect(badgeAction?.priority).toBe('high');
    });

    it('não deve sugerir badge se progresso <= 70%', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const statsLowProgress = {
        ...mockStats,
        progressToNextBadge: 50,
      };

      const actions = await generateSmartActions('prospector-1', statsLowProgress, [], []);

      const badgeAction = actions.find(a => a.id === 'rule-badge');
      expect(badgeAction).toBeUndefined();
    });
  });

  describe('generateRuleBasedActions - Hot Leads', () => {
    it('deve detectar leads em negociação', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const hotLeads: ProspectLead[] = [
        {
          ...mockLeads[0],
          stage: 'negotiating',
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, hotLeads, []);

      const hotAction = actions.find(a => a.id === 'rule-hot');
      expect(hotAction).toBeDefined();
      expect(hotAction?.title).toContain('negociações');
      expect(hotAction?.priority).toBe('high');
      expect(hotAction?.actionType).toBe('follow_up');
    });

    it('deve contar múltiplos leads em negociação', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const hotLeads: ProspectLead[] = [
        {
          ...mockLeads[0],
          id: 'lead-1',
          stage: 'negotiating',
        },
        {
          ...mockLeads[0],
          id: 'lead-2',
          stage: 'negotiating',
        },
        {
          ...mockLeads[0],
          id: 'lead-3',
          stage: 'negotiating',
        },
      ];

      const actions = await generateSmartActions('prospector-1', mockStats, hotLeads, []);

      const hotAction = actions.find(a => a.id === 'rule-hot');
      expect(hotAction?.description).toContain('3 leads');
      expect(hotAction?.metadata?.leads).toEqual(['lead-1', 'lead-2', 'lead-3']);
    });
  });

  describe('generateRuleBasedActions - Goal Tracking', () => {
    it('deve incluir ação de meta semanal', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const actions = await generateSmartActions('prospector-1', mockStats, [], []);

      const goalAction = actions.find(a => a.id === 'rule-goal');
      expect(goalAction).toBeDefined();
      expect(goalAction?.title).toContain('Meta semanal');
      expect(goalAction?.priority).toBe('medium');
      expect(goalAction?.actionType).toBe('goal');
    });
  });

  describe('generateRuleBasedActions - Priority Sorting', () => {
    it('deve retornar no máximo 3 ações', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const manyInactiveLeads: ProspectLead[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockLeads[0],
        id: `lead-${i}`,
        stage: 'contacted' as const,
        lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      }));

      const statsWithBadge = {
        ...mockStats,
        progressToNextBadge: 85,
      };

      const oldActivity: RecentActivity[] = [
        {
          type: 'referral_share',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ];

      const actions = await generateSmartActions('prospector-1', statsWithBadge, manyInactiveLeads, oldActivity);

      expect(actions).toHaveLength(3);
    });

    it('deve ordenar por prioridade (high > medium > low)', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const inactiveLeads: ProspectLead[] = [
        {
          ...mockLeads[0],
          stage: 'contacted',
          lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ];

      const statsWithBadge = {
        ...mockStats,
        progressToNextBadge: 60, // medium priority
      };

      const recentShare: RecentActivity[] = [
        {
          type: 'referral_share',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // medium priority
        },
      ];

      const actions = await generateSmartActions('prospector-1', statsWithBadge, inactiveLeads, recentShare);

      const priorities = actions.map(a => a.priority);
      expect(priorities[0]).toBe('high'); // inactive leads should come first
      expect(priorities.filter(p => p === 'medium').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('deve funcionar com arrays vazios', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const actions = await generateSmartActions('prospector-1', mockStats, [], []);

      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('deve funcionar sem progressToNextBadge', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

      const statsWithoutProgress = {
        ...mockStats,
        progressToNextBadge: undefined,
      };

      const actions = await generateSmartActions('prospector-1', statsWithoutProgress, [], []);

      expect(actions).toBeInstanceOf(Array);
    });

    it('deve lidar com lastActivity como string ISO', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: [] }),
      } as Response);

      const activity: RecentActivity[] = [
        {
          type: 'referral_share',
          timestamp: '2025-12-25T00:00:00Z',
        },
      ];

      await expect(
        generateSmartActions('prospector-1', mockStats, [], activity)
      ).resolves.toBeDefined();
    });
  });
});
