/**
 * Service para coletar métricas do Protocolo Supremo v4.0 - Task 3.5
 * Monitora tasks, PRs, commits, builds e status geral do protocolo
 */

export interface TaskMetric {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  assignedTo: 'GEMINI' | 'ORCHESTRATOR' | 'COPILOT' | 'MERGE';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // em minutos
  pr?: string;
  auditScore?: number;
}

export interface PRMetric {
  number: number;
  title: string;
  status: 'open' | 'closed' | 'merged';
  auditScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  mergedAt?: Date;
  filesChanged: number;
  additions: number;
  deletions: number;
}

export interface BuildMetric {
  timestamp: Date;
  status: 'success' | 'failure';
  duration: number; // em segundos
  branch: string;
  commit: string;
}

export interface ProtocolStatus {
  version: string;
  currentPhase: 'Day 1' | 'Day 2' | 'Day 3' | 'Day 4' | 'Day 5';
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksBlocked: number;
  avgAuditScore: number;
  avgTaskDuration: number; // em horas
  uptime: number; // em dias
  lastUpdate: Date;
}

export class ProtocolMetricsService {
  private static instance: ProtocolMetricsService;

  private constructor() {}

  static getInstance(): ProtocolMetricsService {
    if (!ProtocolMetricsService.instance) {
      ProtocolMetricsService.instance = new ProtocolMetricsService();
    }
    return ProtocolMetricsService.instance;
  }

  /**
   * Buscar status geral do protocolo
   */
  async getProtocolStatus(): Promise<ProtocolStatus> {
    // Em produção, isso seria buscado do Firestore
    // Por ora, vamos usar dados estáticos baseados no Documento Mestre
    return {
      version: '4.0.0',
      currentPhase: 'Day 3',
      tasksTotal: 18, // 6 tasks x 3 days
      tasksCompleted: 7, // Tasks 3.1, 3.2, 3.3, 3.4 + 3 do Day 1
      tasksInProgress: 1, // Task 3.5
      tasksBlocked: 0,
      avgAuditScore: 75, // Média de PRs (100, 50, etc)
      avgTaskDuration: 8.5, // Média de horas por task
      uptime: 5, // Dias desde início do protocolo
      lastUpdate: new Date(),
    };
  }

  /**
   * Buscar métricas de tasks (últimas 10)
   */
  async getRecentTasks(): Promise<TaskMetric[]> {
    // Dados mockados baseados em tasks reais
    const tasks: TaskMetric[] = [
      {
        id: '3.5',
        title: 'Dashboard de Status do Protocolo v4.0',
        status: 'in-progress',
        assignedTo: 'COPILOT',
        startedAt: new Date('2025-12-16T01:00:00'),
      },
      {
        id: '3.4',
        title: 'Parser de Validação do Documento Mestre',
        status: 'completed',
        assignedTo: 'COPILOT',
        startedAt: new Date('2025-12-15T21:00:00'),
        completedAt: new Date('2025-12-16T00:50:00'),
        duration: 230, // ~3.8 horas
        pr: '#41',
        auditScore: 100,
      },
      {
        id: '3.3',
        title: 'Analytics de Conversão',
        status: 'completed',
        assignedTo: 'COPILOT',
        startedAt: new Date('2025-12-15T18:00:00'),
        completedAt: new Date('2025-12-15T20:30:00'),
        duration: 150, // 2.5 horas
        pr: '#40',
        auditScore: 50,
      },
      {
        id: '3.2',
        title: 'UI Responsiva para Mobile',
        status: 'completed',
        assignedTo: 'COPILOT',
        startedAt: new Date('2025-12-15T14:00:00'),
        completedAt: new Date('2025-12-15T17:45:00'),
        duration: 225, // ~3.75 horas
        pr: '#39',
        auditScore: 100,
      },
      {
        id: '3.1',
        title: 'Performance Optimization',
        status: 'completed',
        assignedTo: 'COPILOT',
        startedAt: new Date('2025-12-15T10:00:00'),
        completedAt: new Date('2025-12-15T13:30:00'),
        duration: 210, // 3.5 horas
        pr: '#38',
        auditScore: 90,
      },
    ];

    return tasks;
  }

  /**
   * Buscar métricas de PRs (últimas 10)
   */
  async getRecentPRs(): Promise<PRMetric[]> {
    const prs: PRMetric[] = [
      {
        number: 41,
        title: 'feat: [task-3.4] Parser de validação do Documento Mestre v4.0',
        status: 'merged',
        auditScore: 100,
        riskLevel: 'LOW',
        createdAt: new Date('2025-12-16T00:49:00'),
        mergedAt: new Date('2025-12-16T00:52:00'),
        filesChanged: 7,
        additions: 966,
        deletions: 0,
      },
      {
        number: 40,
        title: 'feat: [task-3.3] Integrar analytics de conversão',
        status: 'merged',
        auditScore: 50,
        riskLevel: 'MEDIUM',
        createdAt: new Date('2025-12-15T20:15:00'),
        mergedAt: new Date('2025-12-15T20:28:00'),
        filesChanged: 5,
        additions: 750,
        deletions: 12,
      },
      {
        number: 39,
        title: 'feat: [task-3.2] Implementar UI responsiva para mobile',
        status: 'merged',
        auditScore: 100,
        riskLevel: 'LOW',
        createdAt: new Date('2025-12-15T17:30:00'),
        mergedAt: new Date('2025-12-15T17:43:00'),
        filesChanged: 4,
        additions: 380,
        deletions: 45,
      },
      {
        number: 38,
        title: 'feat: [task-3.1] Performance optimization (lazy load + memoization)',
        status: 'merged',
        auditScore: 90,
        riskLevel: 'LOW',
        createdAt: new Date('2025-12-15T13:15:00'),
        mergedAt: new Date('2025-12-15T13:28:00'),
        filesChanged: 6,
        additions: 520,
        deletions: 80,
      },
    ];

    return prs;
  }

  /**
   * Buscar métricas de builds (últimas 10)
   */
  async getRecentBuilds(): Promise<BuildMetric[]> {
    const builds: BuildMetric[] = [
      {
        timestamp: new Date('2025-12-16T00:52:00'),
        status: 'success',
        duration: 145,
        branch: 'main',
        commit: '347e359',
      },
      {
        timestamp: new Date('2025-12-16T00:50:00'),
        status: 'success',
        duration: 138,
        branch: 'feature/task-3.4',
        commit: '6b3d8c3',
      },
      {
        timestamp: new Date('2025-12-15T20:28:00'),
        status: 'success',
        duration: 142,
        branch: 'main',
        commit: '4666da8',
      },
      {
        timestamp: new Date('2025-12-15T17:43:00'),
        status: 'success',
        duration: 136,
        branch: 'main',
        commit: '9d40881',
      },
      {
        timestamp: new Date('2025-12-15T13:28:00'),
        status: 'success',
        duration: 140,
        branch: 'main',
        commit: 'ab8180b',
      },
    ];

    return builds;
  }

  /**
   * Calcular health score do protocolo (0-100)
   */
  calculateHealthScore(status: ProtocolStatus): number {
    const completionRate = (status.tasksCompleted / status.tasksTotal) * 100;
    const blockedPenalty = status.tasksBlocked * 5;
    const auditBonus = (status.avgAuditScore / 100) * 10;

    const score = Math.min(100, Math.max(0, completionRate - blockedPenalty + auditBonus));
    return Math.round(score);
  }

  /**
   * Gerar insights baseados nas métricas
   */
  async generateInsights(): Promise<string[]> {
    const status = await this.getProtocolStatus();
    const prs = await this.getRecentPRs();

    const insights: string[] = [];

    // Insight 1: Completion rate
    const completionRate = (status.tasksCompleted / status.tasksTotal) * 100;
    if (completionRate > 80) {
      insights.push(`🎯 Excelente progresso! ${completionRate.toFixed(0)}% das tasks completas.`);
    } else if (completionRate > 50) {
      insights.push(`⚡ Bom ritmo! ${completionRate.toFixed(0)}% das tasks completas.`);
    } else {
      insights.push(`⏳ Progresso inicial: ${completionRate.toFixed(0)}% das tasks completas.`);
    }

    // Insight 2: Audit scores
    const avgScore = status.avgAuditScore;
    if (avgScore >= 90) {
      insights.push(`✨ Qualidade excepcional! Audit score médio: ${avgScore}/100.`);
    } else if (avgScore >= 70) {
      insights.push(`✅ Qualidade boa! Audit score médio: ${avgScore}/100.`);
    } else {
      insights.push(`⚠️ Atenção à qualidade. Audit score médio: ${avgScore}/100.`);
    }

    // Insight 3: Velocity
    const avgDuration = status.avgTaskDuration;
    if (avgDuration < 6) {
      insights.push(`🚀 Velocidade alta! Média de ${avgDuration.toFixed(1)}h por task.`);
    } else if (avgDuration < 10) {
      insights.push(`⏱️ Velocidade adequada: ${avgDuration.toFixed(1)}h por task.`);
    } else {
      insights.push(`🐢 Tasks complexas: média de ${avgDuration.toFixed(1)}h por task.`);
    }

    // Insight 4: Blocked tasks
    if (status.tasksBlocked > 0) {
      insights.push(`🚧 ${status.tasksBlocked} task(s) bloqueada(s). Requer atenção!`);
    }

    // Insight 5: PR merge rate
    const mergedPRs = prs.filter(pr => pr.status === 'merged').length;
    const prMergeRate = (mergedPRs / prs.length) * 100;
    if (prMergeRate === 100) {
      insights.push(`💯 Todos os PRs foram mergeados com sucesso!`);
    }

    return insights;
  }
}

// Export singleton instance
export const protocolMetrics = ProtocolMetricsService.getInstance();
