/**
 * QuickPanel - Dashboard Inteligente com IA
 * 
 * Features:
 * - Ações priorizadas por IA em tempo real
 * - Métricas contextualizadas com benchmarks
 * - Sugestões personalizadas automáticas
 * - Celebrações visuais ao atingir metas
 */

import { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { generateSmartActions, type SmartAction } from '../../services/smartActionsService';
import type { ProspectorStats } from '../../../services/api';
import type { ProspectLead } from '../ProspectorCRM';

interface QuickPanelProps {
  prospectorId: string;
  stats: ProspectorStats | null;
  leads?: ProspectLead[];
  onActionClick?: (action: SmartAction) => void;
}

export default function QuickPanel({ prospectorId, stats, leads = [], onActionClick }: QuickPanelProps) {
  const [smartActions, setSmartActions] = useState<SmartAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastBadge, setLastBadge] = useState<string | null>(null);

  const celebrateBadge = useCallback((badgeName: string) => {
    // Confetti explosion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce';
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-3xl">🏆</span>
        <div>
          <div class="font-bold text-lg">Badge Desbloqueado!</div>
          <div class="text-sm">${badgeName}</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }, []);

  const loadSmartActions = useCallback(async () => {
    if (!stats) return;
    
    setLoading(true);
    try {
      const actions = await generateSmartActions(prospectorId, stats, leads, []);
      setSmartActions(actions.slice(0, 4)); // Top 4 ações
    } catch (error) {
      console.error('Erro ao carregar ações inteligentes:', error);
    } finally {
      setLoading(false);
    }
  }, [prospectorId, stats, leads]);

  useEffect(() => {
    loadSmartActions();
  }, [loadSmartActions]);

  // Celebração automática ao conquistar novo badge
  useEffect(() => {
    if (stats?.currentBadge && lastBadge && stats.currentBadge !== lastBadge) {
      celebrateBadge(stats.currentBadge);
    }
    if (stats?.currentBadge) {
      setLastBadge(stats.currentBadge);
    }
  }, [stats?.currentBadge, lastBadge, celebrateBadge]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'follow_up': return '📞';
      case 'share': return '📢';
      case 'engage': return '💬';
      case 'goal': return '🎯';
      case 'badge': return '🏆';
      default: return '✨';
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Carregando painel...</div>
      </div>
    );
  }

  type TrendType = 'above' | 'below' | 'neutral';

  const averageRecruitsPerDay = stats.totalRecruits / 30; // Aproximação
  const benchmark = { recruits: 10, conversions: 0.25, daily: 0.5 };
  const performance: { recruits: TrendType; daily: TrendType } = {
    recruits: stats.totalRecruits >= benchmark.recruits ? 'above' : 'below',
    daily: averageRecruitsPerDay >= benchmark.daily ? 'above' : 'below'
  };

  return (
    <div className="space-y-6">
      {/* Header com Saudação Personalizada por IA */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">
          {getGreeting()}, Prospector! 🚀
        </h2>
        <p className="text-indigo-100">
          {getAIMotivationalMessage(stats, performance)}
        </p>
      </div>

      {/* Métricas Principais com Contexto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon="👥"
          label="Recrutas Ativos"
          value={stats.activeRecruits}
          total={stats.totalRecruits}
          benchmark={benchmark.recruits}
          trend={performance.recruits as 'above' | 'below' | 'neutral'}
        />
        <MetricCard
          icon="💰"
          label="Comissões Ganhas"
          value={`R$ ${stats.totalCommissionsEarned.toFixed(2)}`}
          subtitle={`Média: R$ ${stats.averageCommissionPerRecruit.toFixed(2)}/recrutado`}
          trend={stats.averageCommissionPerRecruit >= 10 ? 'above' : 'below'}
        />
        <MetricCard
          icon="🏆"
          label="Badge Atual"
          value={stats.currentBadge}
          subtitle={stats.nextBadge ? `Próximo: ${stats.nextBadge} (${stats.progressToNextBadge}%)` : 'Máximo alcançado!'}
          trend={stats.progressToNextBadge > 70 ? 'above' : 'neutral'}
          progress={stats.progressToNextBadge}
        />
      </div>

      {/* Ações Inteligentes Priorizadas por IA */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            Próximas Ações Sugeridas por IA
          </h3>
          <button
            onClick={loadSmartActions}
            className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            disabled={loading}
          >
            {loading ? '🔄 Atualizando...' : '🔄 Atualizar'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg" />
            ))}
          </div>
        ) : smartActions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">🎉</span>
            <p className="font-medium">Parabéns! Você está em dia!</p>
            <p className="text-sm">Continue assim para manter o ritmo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {smartActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onActionClick?.(action)}
                className={`w-full text-left p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${getPriorityColor(action.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{action.icon || getActionIcon(action.actionType)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{action.title}</span>
                      {action.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          URGENTE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dica do Dia gerada por IA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-indigo-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Dica do Dia (IA)</h4>
            <p className="text-sm text-gray-700">
              {getAIDailyTip(stats, leads)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  total?: number;
  subtitle?: string;
  benchmark?: number;
  trend?: 'above' | 'below' | 'neutral';
  progress?: number;
}

function MetricCard({ icon, label, value, total, subtitle, benchmark, trend, progress }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            trend === 'above' ? 'bg-green-100 text-green-700' :
            trend === 'below' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {trend === 'above' ? '📈 Acima da média' : trend === 'below' ? '📉 Abaixo da média' : '➡️ Na média'}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value}
        {total && <span className="text-lg text-gray-500 ml-1">/ {total}</span>}
      </div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                progress > 70 ? 'bg-green-500' : progress > 40 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {benchmark && (
        <div className="mt-2 text-xs text-gray-500">
          Meta da plataforma: {benchmark}
        </div>
      )}
    </div>
  );
}

// AI Helper Functions
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

interface PerformanceMetrics {
  recruits?: 'above' | 'below' | 'neutral';
  daily?: 'above' | 'below' | 'neutral';
}

function getAIMotivationalMessage(stats: ProspectorStats, performance: PerformanceMetrics): string {
  if (stats.progressToNextBadge > 90) {
    return `Você está a apenas ${100 - stats.progressToNextBadge}% do badge ${stats.nextBadge}! Continue assim! 🔥`;
  }
  if (performance.recruits === 'above' && performance.daily === 'above') {
    return 'Desempenho excepcional! Você está acima da média em todas as métricas! 🌟';
  }
  if (stats.activeRecruits === 0) {
    return 'Hora de começar! Compartilhe seu link hoje e conquiste seu primeiro recrutado! 💪';
  }
  if (stats.totalRecruits < 5) {
    return 'Você está construindo sua base! Cada recrutado é um passo em direção ao próximo badge! 🚀';
  }
  return 'Continue focado! Consistência é a chave para o sucesso na prospecção! ⭐';
}

function getAIDailyTip(stats: ProspectorStats, leads: ProspectLead[]): string {
  const tips = [
    `Leads inativos há 7+ dias têm 40% menos chance de conversão. Priorize follow-ups!`,
    `Compartilhe seu link em grupos de WhatsApp locais - taxa de conversão 3x maior que redes sociais.`,
    `Profissionais de ${getMostCommonCategory(leads) || 'serviços gerais'} têm maior demanda nesta região. Foque neles!`,
    `Envie mensagens entre 10h-12h e 18h-20h para aumentar taxa de resposta em 60%.`,
    `Leads com email têm 2x mais chance de conversão. Sempre peça o contato completo!`,
  ];

  // IA simples: seleciona tip baseado em contexto
  if (leads.filter(l => l.stage === 'new').length > 5) {
    return 'Você tem muitos leads novos! Priorize fazer o primeiro contato nas próximas 24h para aumentar conversão em 50%.';
  }
  if (stats.progressToNextBadge > 80) {
    return `Faltam apenas ${Math.ceil((100 - stats.progressToNextBadge) * stats.totalRecruits / 100)} recrutas para o badge ${stats.nextBadge}! Foque em fechar negociações pendentes hoje.`;
  }
  
  return tips[Math.floor(Math.random() * tips.length)];
}

function getMostCommonCategory(leads: ProspectLead[]): string | null {
  const categories = leads.map(l => l.category).filter(Boolean);
  if (categories.length === 0) return null;
  
  const counts = categories.reduce((acc, cat) => {
    acc[cat!] = (acc[cat!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}
