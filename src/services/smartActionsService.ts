/**
 * Serviço de Ações Inteligentes com IA
 * 
 * Usa Gemini AI para analisar comportamento do prospector e sugerir próximas ações
 * 
 * Análise inclui:
 * - Padrões de atividade recente
 * - Níveis de engajamento de leads
 * - Progresso de metas e riscos
 * - Timing ideal para follow-up
 */

import type { ProspectorStats } from '../../services/api';
import type { ProspectLead } from '../components/ProspectorCRM';

export interface RecentActivity {
  type: string;
  description?: string;
  timestamp: Date | string;
}

export interface SmartAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionType: 'follow_up' | 'share' | 'engage' | 'goal' | 'badge';
  metadata?: Record<string, unknown>;
}

/**
 * Analisa comportamento do prospector e gera ações inteligentes
 * Usa API backend para geração de IA (seguro - chaves API no servidor)
 */
export async function generateSmartActions(
  _prospectorId: string,
  stats: ProspectorStats,
  leads: ProspectLead[] = [],
  recentActivity: RecentActivity[] = []
): Promise<SmartAction[]> {
  try {
    // Call backend endpoint for AI-powered or rule-based actions
    const response = await fetch('/api/prospector/smart-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stats: {
          totalRecruits: stats.totalRecruits || 0,
          activeRecruits: stats.activeRecruits || 0,
          totalCommissionsEarned: stats.totalCommissionsEarned || 0,
          currentBadge: stats.currentBadge,
          nextBadge: stats.nextBadge,
          progressToNextBadge: stats.progressToNextBadge
        },
        leads: leads.map(l => ({
          id: l.id,
          stage: l.stage,
          lastActivity: l.lastActivity?.toISOString()
        })),
        recentActivity: recentActivity.map(a => ({
          type: a.type,
          description: a.description,
          timestamp: a.timestamp instanceof Date ? a.timestamp.toISOString() : a.timestamp
        }))
      })
    });

    if (!response.ok) {
      console.warn('[AçõesInteligentes] Erro na API backend, usando regras locais');
      return generateRuleBasedActions(stats, leads, recentActivity);
    }

    const data = await response.json();
    return data.actions || [];
  } catch (error) {
    console.error('[AçõesInteligentes] Erro ao chamar backend:', error);
    return generateRuleBasedActions(stats, leads, recentActivity);
  }
}

/**
 * Fallback: Ações inteligentes baseadas em regras
 */
function generateRuleBasedActions(
  stats: ProspectorStats,
  leads: ProspectLead[],
  recentActivity: RecentActivity[]
): SmartAction[] {
  const actions: SmartAction[] = [];

  // Rule 1: Inactive leads follow-up
  const inactiveLeads = leads.filter(l => 
    l.stage !== 'won' && l.stage !== 'lost' && 
    l.lastActivity && (Date.now() - l.lastActivity.getTime()) > 7 * 24 * 60 * 60 * 1000
  );
  
  if (inactiveLeads.length > 0) {
    actions.push({
      id: 'rule-inactive',
      icon: '👥',
      title: 'Contatar recrutados inativos',
      description: `${inactiveLeads.length} ${inactiveLeads.length === 1 ? 'lead inativo' : 'leads inativos'} há 7+ dias`,
      priority: 'high',
      actionType: 'follow_up',
      metadata: { leads: inactiveLeads.map(l => l.id) }
    });
  }

  // Rule 2: Share referral link
  const lastShare = recentActivity.find(a => a.type === 'referral_share');
  const lastShareTime = lastShare ? (lastShare.timestamp instanceof Date ? lastShare.timestamp : new Date(lastShare.timestamp)) : null;
  const daysSinceShare = lastShareTime ? Math.floor((Date.now() - lastShareTime.getTime()) / (24 * 60 * 60 * 1000)) : 999;
  
  if (daysSinceShare >= 3) {
    actions.push({
      id: 'rule-share',
      icon: '📢',
      title: 'Compartilhar no WhatsApp',
      description: `Seu último compartilhamento foi há ${daysSinceShare} dias`,
      priority: daysSinceShare >= 7 ? 'high' : 'medium',
      actionType: 'share'
    });
  }

  // Rule 3: Badge progress
  if (stats.progressToNextBadge !== undefined && stats.progressToNextBadge > 70) {
    const remaining = 100 - stats.progressToNextBadge;
    actions.push({
      id: 'rule-badge',
      icon: '🏆',
      title: `Próximo ao badge ${stats.nextBadge}`,
      description: `Apenas ${remaining}% restantes para desbloquear`,
      priority: remaining < 20 ? 'high' : 'medium',
      actionType: 'badge'
    });
  }

  // Rule 4: Hot leads (negotiating)
  const hotLeads = leads.filter(l => l.stage === 'negotiating');
  if (hotLeads.length > 0) {
    actions.push({
      id: 'rule-hot',
      icon: '🔥',
      title: 'Fechar negociações pendentes',
      description: `${hotLeads.length} ${hotLeads.length === 1 ? 'lead' : 'leads'} em negociação`,
      priority: 'high',
      actionType: 'follow_up',
      metadata: { leads: hotLeads.map(l => l.id) }
    });
  }

  // Rule 5: Goal tracking (if recruits < average)
  const weeklyGoal = 5; // Could be dynamic
  const weeklyRecruits = 2; // Mock - would come from analytics
  if (weeklyRecruits < weeklyGoal) {
    actions.push({
      id: 'rule-goal',
      icon: '🎯',
      title: 'Meta semanal em risco',
      description: `Faltam ${weeklyGoal - weeklyRecruits} recrutas para bater a meta`,
      priority: 'medium',
      actionType: 'goal'
    });
  }

  // Sort by priority and return top 3
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return [...actions]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}
