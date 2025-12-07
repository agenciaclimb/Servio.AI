import type { ProspectLead } from '../ProspectorCRM';

interface AINextActionSuggestion {
  action: string;
  icon: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

export function generateNextActionSuggestions(lead: ProspectLead): AINextActionSuggestion[] {
  const suggestions: AINextActionSuggestion[] = [];
  const now = new Date();
  const lastActivityDays = lead.lastActivity
    ? Math.floor((now.getTime() - lead.lastActivity.getTime()) / (24 * 60 * 60 * 1000))
    : 999;

  // Suggestion 1: Follow-up overdue
  if (lead.followUpDate && new Date(lead.followUpDate) < now) {
    suggestions.push({
      action: 'Entrar em contato imediatamente',
      icon: '🔔',
      reason: `Follow-up atrasado há ${Math.floor((now.getTime() - new Date(lead.followUpDate).getTime()) / (24 * 60 * 60 * 1000))} dias`,
      priority: 'high',
      estimatedImpact: '+35% conversão',
    });
  }

  // Suggestion 2: High score but cold
  if ((lead.score || 0) >= 70 && lead.temperature !== 'hot') {
    suggestions.push({
      action: 'Enviar proposta personalizada',
      icon: '📄',
      reason: 'Score alto indica alto potencial de conversão',
      priority: 'high',
      estimatedImpact: '+40% conversão',
    });
  }

  // Suggestion 3: Inactive for 7+ days
  if (lastActivityDays >= 7 && lead.stage !== 'won' && lead.stage !== 'lost') {
    suggestions.push({
      action: 'Reativar com oferta especial',
      icon: '💎',
      reason: `Sem contato há ${lastActivityDays} dias - risco de perda`,
      priority: 'high',
      estimatedImpact: '+25% reativação',
    });
  }

  // Suggestion 4: Negotiating but no recent activity
  if (lead.stage === 'negotiating' && lastActivityDays >= 3) {
    suggestions.push({
      action: 'Fazer follow-up de fechamento',
      icon: '🎯',
      reason: 'Lead em negociação precisa de atenção constante',
      priority: 'high',
      estimatedImpact: '+50% conversão',
    });
  }

  // Suggestion 5: Multiple activities but no email yet
  const hasEmail = lead.activities?.some(a => a.type === 'email');
  if ((lead.activities?.length || 0) >= 3 && !hasEmail && lead.email) {
    suggestions.push({
      action: 'Enviar email com detalhes',
      icon: '✉️',
      reason: 'Já houve contato, mas falta formalização por email',
      priority: 'medium',
      estimatedImpact: '+20% confiança',
    });
  }

  // Suggestion 6: Hot lead but still in "new"
  if (lead.temperature === 'hot' && lead.stage === 'new') {
    suggestions.push({
      action: 'Fazer primeira abordagem urgente',
      icon: '🔥',
      reason: 'Lead quente precisa ser contatado imediatamente',
      priority: 'high',
      estimatedImpact: '+60% engajamento',
    });
  }

  // Suggestion 7: No phone but has email
  if (!lead.phone && lead.email && !hasEmail) {
    suggestions.push({
      action: 'Solicitar telefone por email',
      icon: '📱',
      reason: 'WhatsApp tem 3x mais taxa de resposta',
      priority: 'medium',
      estimatedImpact: '+30% resposta',
    });
  }

  // Suggestion 8: Contacted but no next step
  if (lead.stage === 'contacted' && lastActivityDays >= 2) {
    suggestions.push({
      action: 'Agendar reunião/demo',
      icon: '📅',
      reason: 'Momento ideal para avançar para próxima etapa',
      priority: 'medium',
      estimatedImpact: '+35% progressão',
    });
  }

  // Suggestion 9: Missing category
  if (!lead.category) {
    suggestions.push({
      action: 'Identificar área de atuação',
      icon: '🏷️',
      reason: 'Categorizar permite ofertas mais precisas',
      priority: 'low',
      estimatedImpact: '+15% relevância',
    });
  }

  // Suggestion 10: Low engagement - try different channel
  const lastActivity = lead.activities?.[lead.activities.length - 1];
  if (lastActivity && lastActivityDays >= 5) {
    const lastChannel = lastActivity.type;
    const suggestedChannel =
      lastChannel === 'email' ? 'WhatsApp' : lastChannel === 'message' ? 'Email' : 'Ligação';
    suggestions.push({
      action: `Tentar contato via ${suggestedChannel}`,
      icon: suggestedChannel === 'WhatsApp' ? '💬' : suggestedChannel === 'Email' ? '✉️' : '📞',
      reason: 'Mudar de canal pode aumentar taxa de resposta',
      priority: 'medium',
      estimatedImpact: '+25% resposta',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}

interface AIActionCardProps {
  lead: ProspectLead;
  onAction: (action: string) => void;
}

export default function AIActionCard({ lead, onAction }: AIActionCardProps) {
  const suggestions = generateNextActionSuggestions(lead);

  if (suggestions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <div className="font-bold text-green-800">Lead está bem encaminhado!</div>
            <div className="text-sm text-green-600">
              Nenhuma ação urgente necessária no momento.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🤖</span>
        <span className="font-bold text-indigo-900">IA Sugere</span>
        <span className="ml-auto px-2 py-0.5 bg-white/80 rounded-full text-xs font-semibold text-indigo-700">
          {suggestions.length} {suggestions.length === 1 ? 'ação' : 'ações'}
        </span>
      </div>

      {suggestions.map((s, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-lg p-3 border-2 ${
            s.priority === 'high'
              ? 'border-red-200'
              : s.priority === 'medium'
                ? 'border-amber-200'
                : 'border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900 text-sm">{s.action}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    s.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : s.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {s.priority === 'high'
                    ? 'URGENTE'
                    : s.priority === 'medium'
                      ? 'IMPORTANTE'
                      : 'SUGESTÃO'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{s.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-600">📈 {s.estimatedImpact}</span>
                <button
                  onClick={() => onAction(s.action)}
                  className="px-3 py-1 text-xs font-bold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Executar →
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
