import { useMemo } from 'react';
import type { ProspectLead } from '../ProspectorCRM';

interface FunnelStage {
  id: string;
  title: string;
  icon: string;
  color: string;
  leads: ProspectLead[];
  count: number;
  percentage: number;
  conversionRate: number;
  avgDaysInStage: number;
  bottleneck: boolean;
}

interface ConversionFunnelDashboardProps {
  leads: ProspectLead[];
}

export default function ConversionFunnelDashboard({ leads }: ConversionFunnelDashboardProps) {
  const funnelData = useMemo(() => {
    const stages = [
      { id: 'new', title: 'Novos', icon: '🆕', color: 'blue' },
      { id: 'contacted', title: 'Contatados', icon: '📞', color: 'yellow' },
      { id: 'negotiating', title: 'Negociando', icon: '🤝', color: 'purple' },
      { id: 'won', title: 'Convertidos', icon: '✅', color: 'green' }
    ];

    const totalLeads = leads.filter(l => l.stage !== 'lost').length;
    let previousCount = totalLeads;

    return stages.map((stage, index) => {
      const stageLeads = leads.filter(l => l.stage === stage.id);
      const count = stageLeads.length;
      const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0;

      // Calculate average days in stage
      const now = Date.now();
      const daysInStage = stageLeads
        .filter(l => l.updatedAt)
        .map(l => Math.floor((now - new Date(l.updatedAt).getTime()) / (24 * 60 * 60 * 1000)));
      const avgDaysInStage = daysInStage.length > 0 
        ? Math.round(daysInStage.reduce((sum, d) => sum + d, 0) / daysInStage.length)
        : 0;

      // Detect bottleneck (conversion < 50% or avg > 14 days)
      const bottleneck = index > 0 && (conversionRate < 50 || avgDaysInStage > 14);

      const result: FunnelStage = {
        id: stage.id,
        title: stage.title,
        icon: stage.icon,
        color: stage.color,
        leads: stageLeads,
        count,
        percentage,
        conversionRate: index === 0 ? 100 : conversionRate,
        avgDaysInStage,
        bottleneck
      };

      previousCount = count;
      return result;
    });
  }, [leads]);

  const totalWon = funnelData.find(s => s.id === 'won')?.count || 0;
  const totalActive = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost').length;
  const overallConversionRate = totalActive > 0 ? (totalWon / (totalActive + totalWon)) * 100 : 0;
  const lostCount = leads.filter(l => l.stage === 'lost').length;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-6">
      {/* Header with KPIs */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">📊 Funil de Conversão</h3>
          <p className="text-sm text-gray-600">Análise de performance e gargalos</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{overallConversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Taxa Geral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalActive}</div>
            <div className="text-xs text-gray-600">Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{lostCount}</div>
            <div className="text-xs text-gray-600">Perdidos</div>
          </div>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="space-y-2">
        {funnelData.map((stage, index) => {
          // const maxWidth = 100; // Removed - width calculated as percentage
          const width = stage.percentage;
          const colorMap = {
            blue: 'bg-blue-500',
            yellow: 'bg-yellow-500',
            purple: 'bg-purple-500',
            green: 'bg-green-500'
          };
          const bgColor = colorMap[stage.color as keyof typeof colorMap] || 'bg-gray-500';

          return (
            <div key={stage.id} className="relative">
              {/* Stage bar */}
              <div
                className={`h-16 ${bgColor} rounded-lg shadow-md transition-all duration-500 flex items-center justify-between px-4 relative overflow-hidden`}
                style={{ width: `${Math.max(width, 15)}%` }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                
                {/* Content */}
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-3xl">{stage.icon}</span>
                  <div>
                    <div className="font-bold text-white text-lg">{stage.title}</div>
                    <div className="text-white/90 text-sm font-semibold">{stage.count} leads</div>
                  </div>
                </div>

                <div className="relative z-10 text-right">
                  <div className="text-white font-bold text-xl">{stage.percentage.toFixed(1)}%</div>
                  {index > 0 && (
                    <div className={`text-sm font-semibold ${stage.conversionRate < 50 ? 'text-red-200' : 'text-white/80'}`}>
                      ↓ {stage.conversionRate.toFixed(0)}% conversão
                    </div>
                  )}
                </div>

                {/* Bottleneck indicator */}
                {stage.bottleneck && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                    ⚠️ Gargalo
                  </div>
                )}
              </div>

              {/* Stage metrics */}
              <div className="flex gap-2 mt-1 ml-4 text-xs text-gray-600">
                <span className="font-semibold">⏱️ Tempo médio: {stage.avgDaysInStage}d</span>
                {stage.bottleneck && (
                  <span className="text-red-600 font-bold">
                    {stage.conversionRate < 50 && '• Conversão baixa'}
                    {stage.avgDaysInStage > 14 && '• Estagnado'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action recommendations */}
      {funnelData.some(s => s.bottleneck) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-red-900 mb-2">Gargalos Detectados</div>
              <ul className="space-y-1 text-sm text-red-800">
                {funnelData.filter(s => s.bottleneck).map(stage => (
                  <li key={stage.id} className="flex items-center gap-2">
                    <span className="font-semibold">{stage.icon} {stage.title}:</span>
                    <span>
                      {stage.conversionRate < 50 && `Taxa de conversão baixa (${stage.conversionRate.toFixed(0)}%)`}
                      {stage.conversionRate < 50 && stage.avgDaysInStage > 14 && ' • '}
                      {stage.avgDaysInStage > 14 && `Leads estagnados (${stage.avgDaysInStage}d)`}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                  🎯 Ver Leads Afetados
                </button>
                <button className="px-3 py-1 bg-white text-red-700 border-2 border-red-300 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors">
                  💡 Sugestões IA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temperature distribution */}
      <div className="grid grid-cols-3 gap-3">
        {['hot', 'warm', 'cold'].map(temp => {
          const count = leads.filter(l => l.temperature === temp && l.stage !== 'lost').length;
          const icon = temp === 'hot' ? '🔥' : temp === 'warm' ? '⚡' : '❄️';
          const color = temp === 'hot' ? 'red' : temp === 'warm' ? 'amber' : 'blue';
          return (
            <div key={temp} className={`bg-${color}-50 border-2 border-${color}-200 rounded-lg p-3 text-center`}>
              <div className="text-3xl mb-1">{icon}</div>
              <div className={`text-2xl font-bold text-${color}-700`}>{count}</div>
              <div className="text-xs text-gray-600 capitalize">{temp}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
