/**
 * Testes para ProtocolMetricsService - Task 3.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProtocolMetricsService } from '../../src/services/protocolMetricsService';

describe('ProtocolMetricsService', () => {
  let service: ProtocolMetricsService;

  beforeEach(() => {
    service = ProtocolMetricsService.getInstance();
  });

  describe('getInstance', () => {
    it('deve retornar sempre a mesma instância (singleton)', () => {
      const instance1 = ProtocolMetricsService.getInstance();
      const instance2 = ProtocolMetricsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getProtocolStatus', () => {
    it('deve retornar status do protocolo com campos obrigatórios', async () => {
      const status = await service.getProtocolStatus();

      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('currentPhase');
      expect(status).toHaveProperty('tasksTotal');
      expect(status).toHaveProperty('tasksCompleted');
      expect(status).toHaveProperty('tasksInProgress');
      expect(status).toHaveProperty('tasksBlocked');
      expect(status).toHaveProperty('avgAuditScore');
      expect(status).toHaveProperty('avgTaskDuration');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('lastUpdate');
    });

    it('deve retornar version como string no formato x.y.z', async () => {
      const status = await service.getProtocolStatus();
      expect(status.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('deve retornar currentPhase válida', async () => {
      const status = await service.getProtocolStatus();
      expect(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']).toContain(status.currentPhase);
    });

    it('deve ter tasksCompleted <= tasksTotal', async () => {
      const status = await service.getProtocolStatus();
      expect(status.tasksCompleted).toBeLessThanOrEqual(status.tasksTotal);
    });

    it('deve ter avgAuditScore entre 0 e 100', async () => {
      const status = await service.getProtocolStatus();
      expect(status.avgAuditScore).toBeGreaterThanOrEqual(0);
      expect(status.avgAuditScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecentTasks', () => {
    it('deve retornar array de tasks', async () => {
      const tasks = await service.getRecentTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('deve retornar tasks com campos obrigatórios', async () => {
      const tasks = await service.getRecentTasks();
      expect(tasks.length).toBeGreaterThan(0);

      const task = tasks[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('assignedTo');
    });

    it('deve ter status válido em todas as tasks', async () => {
      const tasks = await service.getRecentTasks();
      const validStatuses = ['not-started', 'in-progress', 'completed', 'blocked'];

      tasks.forEach(task => {
        expect(validStatuses).toContain(task.status);
      });
    });

    it('deve ter assignedTo válido em todas as tasks', async () => {
      const tasks = await service.getRecentTasks();
      const validAgents = ['GEMINI', 'ORCHESTRATOR', 'COPILOT', 'MERGE'];

      tasks.forEach(task => {
        expect(validAgents).toContain(task.assignedTo);
      });
    });

    it('tasks completas devem ter completedAt', async () => {
      const tasks = await service.getRecentTasks();
      const completedTasks = tasks.filter(t => t.status === 'completed');

      completedTasks.forEach(task => {
        expect(task.completedAt).toBeDefined();
      });
    });
  });

  describe('getRecentPRs', () => {
    it('deve retornar array de PRs', async () => {
      const prs = await service.getRecentPRs();
      expect(Array.isArray(prs)).toBe(true);
    });

    it('deve retornar PRs com campos obrigatórios', async () => {
      const prs = await service.getRecentPRs();
      expect(prs.length).toBeGreaterThan(0);

      const pr = prs[0];
      expect(pr).toHaveProperty('number');
      expect(pr).toHaveProperty('title');
      expect(pr).toHaveProperty('status');
      expect(pr).toHaveProperty('createdAt');
      expect(pr).toHaveProperty('filesChanged');
      expect(pr).toHaveProperty('additions');
      expect(pr).toHaveProperty('deletions');
    });

    it('deve ter status válido em todos os PRs', async () => {
      const prs = await service.getRecentPRs();
      const validStatuses = ['open', 'closed', 'merged'];

      prs.forEach(pr => {
        expect(validStatuses).toContain(pr.status);
      });
    });

    it('PRs com auditScore devem ter valor entre 0 e 100', async () => {
      const prs = await service.getRecentPRs();
      const audited = prs.filter(pr => pr.auditScore !== undefined);

      audited.forEach(pr => {
        expect(pr.auditScore!).toBeGreaterThanOrEqual(0);
        expect(pr.auditScore!).toBeLessThanOrEqual(100);
      });
    });

    it('PRs com riskLevel devem ter valor válido', async () => {
      const prs = await service.getRecentPRs();
      const risked = prs.filter(pr => pr.riskLevel !== undefined);
      const validLevels = ['LOW', 'MEDIUM', 'HIGH'];

      risked.forEach(pr => {
        expect(validLevels).toContain(pr.riskLevel!);
      });
    });
  });

  describe('getRecentBuilds', () => {
    it('deve retornar array de builds', async () => {
      const builds = await service.getRecentBuilds();
      expect(Array.isArray(builds)).toBe(true);
    });

    it('deve retornar builds com campos obrigatórios', async () => {
      const builds = await service.getRecentBuilds();
      expect(builds.length).toBeGreaterThan(0);

      const build = builds[0];
      expect(build).toHaveProperty('timestamp');
      expect(build).toHaveProperty('status');
      expect(build).toHaveProperty('duration');
      expect(build).toHaveProperty('branch');
      expect(build).toHaveProperty('commit');
    });

    it('deve ter status válido em todos os builds', async () => {
      const builds = await service.getRecentBuilds();
      const validStatuses = ['success', 'failure'];

      builds.forEach(build => {
        expect(validStatuses).toContain(build.status);
      });
    });

    it('deve ter duration > 0 em todos os builds', async () => {
      const builds = await service.getRecentBuilds();

      builds.forEach(build => {
        expect(build.duration).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateHealthScore', () => {
    it('deve retornar score entre 0 e 100', async () => {
      const status = await service.getProtocolStatus();
      const score = service.calculateHealthScore(status);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('deve penalizar tasks bloqueadas', async () => {
      const baseStatus = await service.getProtocolStatus();
      const scoreWithoutBlocked = service.calculateHealthScore({ ...baseStatus, tasksBlocked: 0 });
      const scoreWithBlocked = service.calculateHealthScore({ ...baseStatus, tasksBlocked: 3 });

      expect(scoreWithBlocked).toBeLessThan(scoreWithoutBlocked);
    });

    it('deve bonificar audit score alto', async () => {
      const baseStatus = await service.getProtocolStatus();
      const scoreLowAudit = service.calculateHealthScore({ ...baseStatus, avgAuditScore: 50 });
      const scoreHighAudit = service.calculateHealthScore({ ...baseStatus, avgAuditScore: 95 });

      expect(scoreHighAudit).toBeGreaterThan(scoreLowAudit);
    });

    it('deve refletir completion rate', async () => {
      const baseStatus = await service.getProtocolStatus();
      const scoreLowCompletion = service.calculateHealthScore({
        ...baseStatus,
        tasksCompleted: 2,
        tasksTotal: 10,
      });
      const scoreHighCompletion = service.calculateHealthScore({
        ...baseStatus,
        tasksCompleted: 9,
        tasksTotal: 10,
      });

      expect(scoreHighCompletion).toBeGreaterThan(scoreLowCompletion);
    });
  });

  describe('generateInsights', () => {
    it('deve retornar array de insights', async () => {
      const insights = await service.generateInsights();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('deve retornar pelo menos 3 insights', async () => {
      const insights = await service.generateInsights();
      expect(insights.length).toBeGreaterThanOrEqual(3);
    });

    it('insights devem ser strings não-vazias', async () => {
      const insights = await service.generateInsights();

      insights.forEach(insight => {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      });
    });

    it('deve incluir insight sobre completion rate', async () => {
      const insights = await service.generateInsights();
      const hasCompletionInsight = insights.some(i => i.includes('completas'));
      expect(hasCompletionInsight).toBe(true);
    });

    it('deve incluir insight sobre audit score', async () => {
      const insights = await service.generateInsights();
      const hasScoreInsight = insights.some(i => i.includes('Audit score'));
      expect(hasScoreInsight).toBe(true);
    });
  });
});
