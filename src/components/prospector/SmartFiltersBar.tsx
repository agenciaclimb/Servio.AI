import type { ProspectLead } from '../ProspectorCRM';

interface SmartFiltersBarProps {
  leads: ProspectLead[];
  onFilterApply: (filter: (lead: ProspectLead) => boolean) => void;
  onClear: () => void;
}

export default function SmartFiltersBar({ leads, onFilterApply, onClear }: SmartFiltersBarProps) {
  // Calculate smart filter counts
  const counts = {
    hotPriority: leads.filter(l => l.temperature === 'hot' && l.priority === 'high').length,
    followupToday: leads.filter(l => {
      if (!l.followUpDate) return false;
      return new Date(l.followUpDate).toDateString() === new Date().toDateString();
    }).length,
    overdue: leads.filter(l => {
      if (!l.followUpDate) return false;
      return new Date(l.followUpDate) < new Date() && new Date(l.followUpDate).toDateString() !== new Date().toDateString();
    }).length,
    inactive7days: leads.filter(l => {
      if (l.stage === 'won' || l.stage === 'lost') return false;
      if (!l.lastActivity) return true;
      const daysSince = Math.floor((Date.now() - l.lastActivity.getTime()) / (24 * 60 * 60 * 1000));
      return daysSince >= 7;
    }).length,
    negotiating: leads.filter(l => l.stage === 'negotiating').length,
    highScore: leads.filter(l => (l.score || 0) >= 80).length
  };

  const filters = [
    {
      id: 'hotPriority',
      label: '🔥 Alta Prioridade',
      count: counts.hotPriority,
      color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      filter: (l: ProspectLead) => l.temperature === 'hot' && l.priority === 'high'
    },
    {
      id: 'followupToday',
      label: '📅 Follow-up Hoje',
      count: counts.followupToday,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      filter: (l: ProspectLead) => {
        if (!l.followUpDate) return false;
        return new Date(l.followUpDate).toDateString() === new Date().toDateString();
      }
    },
    {
      id: 'overdue',
      label: '⏰ Atrasados',
      count: counts.overdue,
      color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      filter: (l: ProspectLead) => {
        if (!l.followUpDate) return false;
        return new Date(l.followUpDate) < new Date() && new Date(l.followUpDate).toDateString() !== new Date().toDateString();
      }
    },
    {
      id: 'inactive7days',
      label: '😴 Inativos 7+ dias',
      count: counts.inactive7days,
      color: 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100',
      filter: (l: ProspectLead) => {
        if (l.stage === 'won' || l.stage === 'lost') return false;
        if (!l.lastActivity) return true;
        const daysSince = Math.floor((Date.now() - l.lastActivity.getTime()) / (24 * 60 * 60 * 1000));
        return daysSince >= 7;
      }
    },
    {
      id: 'negotiating',
      label: '🤝 Negociando',
      count: counts.negotiating,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      filter: (l: ProspectLead) => l.stage === 'negotiating'
    },
    {
      id: 'highScore',
      label: '⭐ Score Alto (80+)',
      count: counts.highScore,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      filter: (l: ProspectLead) => (l.score || 0) >= 80
    }
  ];

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-700">⚡ Filtros Rápidos:</span>
        
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => onFilterApply(f.filter)}
            disabled={f.count === 0}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${f.color} disabled:opacity-40 disabled:cursor-not-allowed`}
            title={f.count === 0 ? 'Nenhum lead corresponde' : `Filtrar ${f.count} leads`}
          >
            <span>{f.label}</span>
            <span className="px-1.5 py-0.5 bg-white/80 rounded-full text-xs font-bold">{f.count}</span>
          </button>
        ))}

        <button
          onClick={onClear}
          className="ml-auto px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
        >
          ✕ Limpar Filtros
        </button>
      </div>
    </div>
  );
}
