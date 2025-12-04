import { memo, useState, KeyboardEvent, MouseEvent } from 'react';
import type { ProspectLead } from '../ProspectorCRM';
import { formatRelativeTime } from '../../utils/prospectorHelpers';

interface ProspectCardV2Props {
  lead: ProspectLead;
  density?: 'compact' | 'detailed';
  selected?: boolean;
  onClick?: () => void;
  onSelect?: (e: MouseEvent) => void;
  onUpdate?: (leadId: string, updates: Partial<ProspectLead>) => void;
  onWhatsApp?: (lead: ProspectLead) => void;
  onEmail?: (lead: ProspectLead) => void;
  onToggleAutomation?: (lead: ProspectLead) => void;
}

function scoreColor(score: number) {
  if (score >= 70) return 'from-green-500 to-green-300';
  if (score >= 40) return 'from-amber-500 to-amber-300';
  return 'from-red-500 to-red-300';
}

function ProspectCardV2({ lead, density = 'compact', selected = false, onClick, onSelect, onUpdate, onWhatsApp, onEmail, onToggleAutomation }: ProspectCardV2Props) {
  const gradient = scoreColor(lead.score ?? 0);
  const [editingName, setEditingName] = useState(false);
  const [editingSource, setEditingSource] = useState(false);
  const [tempName, setTempName] = useState(lead.name || '');
  const [tempSource, setTempSource] = useState<string>(lead.source || '');

  const handleNameSave = () => {
    if (tempName.trim() && tempName !== lead.name && onUpdate) {
      onUpdate(lead.id, { name: tempName.trim() });
    }
    setEditingName(false);
  };

  const handleSourceSave = () => {
    if (tempSource.trim() && tempSource !== lead.source && onUpdate) {
      onUpdate(lead.id, { source: tempSource.trim() as ProspectLead['source'] });
    }
    setEditingSource(false);
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
      setTempName(lead.name || '');
      setEditingName(false);
    }
  };

  const handleSourceKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSourceSave();
    if (e.key === 'Escape') {
      setTempSource(lead.source || '');
      setEditingSource(false);
    }
  };

  const tempIcon = lead.temperature === 'hot' ? '🔥' : lead.temperature === 'warm' ? '⚡' : '❄️';
  const priorityColor = lead.priority === 'high' ? 'bg-red-100 text-red-700' : lead.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';

  return (
    <div
      className={`group rounded-xl border-2 bg-white shadow-sm hover:shadow-lg transition-all duration-200 relative overflow-hidden ${
        selected ? 'ring-2 ring-indigo-500 border-indigo-300 shadow-md' : 'border-gray-200 hover:border-indigo-200'
      } ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={editingName || editingSource ? undefined : onClick}
      role="button"
      tabIndex={0}
    >
      {/* Barra de temperatura no topo */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            onClick={onSelect}
            className="w-5 h-5 cursor-pointer accent-indigo-600 rounded"
          />
        </div>
      )}
      
      <div className={`p-4 ${density === 'compact' ? 'space-y-2' : 'space-y-3'} ${onSelect ? 'pl-10' : ''}`}>
        {/* Nome e score bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                className="font-bold text-base border-2 border-indigo-300 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div
                className="font-bold text-base truncate cursor-text hover:text-indigo-600 px-1 rounded transition-colors"
                onDoubleClick={e => {
                  e.stopPropagation();
                  setEditingName(true);
                }}
                title={lead.name}
              >
                {lead.name || 'Sem nome'}
              </div>
            )}
            {/* Score visual */}
            {lead.score !== undefined && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                      style={{ width: `${lead.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 min-w-[2rem] text-right">{lead.score}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <span className="text-2xl" title={`Temperatura: ${lead.temperature}`}>
              {tempIcon}
            </span>
            {lead.temperature && (
              <span className="text-xs font-semibold text-gray-500 capitalize">{lead.temperature}</span>
            )}
          </div>
        </div>

        {/* Badges de metadados */}
        <div className="flex flex-wrap items-center gap-1.5">
          {lead.priority && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${priorityColor}`}>
              {lead.priority === 'high' ? '🔴' : lead.priority === 'medium' ? '🟡' : '⚪'}
              {lead.priority}
            </span>
          )}
          {lead.followUpDate && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              📅 {new Date(lead.followUpDate).toLocaleDateString('pt-BR')}
            </span>
          )}
          {lead.lastActivity && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              💬 {new Date(lead.lastActivity).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        {/* Detalhes de contato e fonte */}
        {density === 'detailed' && (
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            {lead.email && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>✉️</span>
                <span className="truncate" title={lead.email}>{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>📱</span>
                <span>{lead.phone}</span>
              </div>
            )}
            {editingSource ? (
              <input
                type="text"
                value={tempSource}
                onChange={e => setTempSource(e.target.value)}
                onBlur={handleSourceSave}
                onKeyDown={handleSourceKeyDown}
                className="text-xs border-2 border-indigo-300 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 transition-all"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div
                className="flex items-center gap-2 text-xs text-gray-600 cursor-text hover:bg-gray-50 px-1 py-0.5 rounded transition-colors"
                onDoubleClick={e => {
                  e.stopPropagation();
                  setEditingSource(true);
                }}
              >
                <span>🔗</span>
                <span className="font-medium">Fonte:</span>
                <span className="truncate">{lead.source || '—'}</span>
              </div>
            )}
          </div>
        )}

        {/* Histórico de interações (últimas 3) */}
        {density !== 'compact' && Array.isArray(lead.activities) && lead.activities.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs font-semibold text-gray-700">Histórico recente</div>
            <ul className="space-y-1">
              {lead.activities.slice(-3).reverse().map((a, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                  <span>
                    {a.type === 'call' ? '📞' : a.type === 'email' ? '✉️' : a.type === 'message' ? '💬' : a.type === 'stage_change' ? '🔀' : '📝'}
                  </span>
                  <span className="truncate flex-1">{a.description}</span>
                  {a.timestamp && (
                    <span className="text-gray-400" title={new Date(a.timestamp).toLocaleString()}>
                      {formatRelativeTime(new Date(a.timestamp))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
            onClick={e => { e.stopPropagation(); onWhatsApp?.(lead); }}
            disabled={!lead.phone}
            title={lead.phone ? `WhatsApp para ${lead.phone}` : 'Sem telefone'}
          >
            📲 WhatsApp
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
            onClick={e => { e.stopPropagation(); onEmail?.(lead); }}
            disabled={!lead.email}
            title={lead.email ? `Email para ${lead.email}` : 'Sem email'}
          >
            ✉️ Email
          </button>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
            onClick={e => { e.stopPropagation(); onToggleAutomation?.(lead); }}
            title="Ativar/Desativar automação"
          >
            ⚙️ Automação
          </button>
        </div>
      </div>
    </div>
  );
}

// Comparação personalizada para evitar re-renders desnecessários
function arePropsEqual(prev: ProspectCardV2Props, next: ProspectCardV2Props): boolean {
  // Early exit se diferentes referências e objetos
  if (prev.lead !== next.lead) {
    // Comparar campos críticos apenas
    const criticalFields: Array<keyof ProspectLead> = ['id', 'name', 'score', 'temperature', 'priority', 'stage', 'followUpDate', 'source', 'email', 'phone'];
    for (const field of criticalFields) {
      if (prev.lead[field] !== next.lead[field]) return false;
    }
  }
  // Densidade, seleção e callbacks
  return (
    prev.density === next.density &&
    prev.selected === next.selected &&
    prev.onClick === next.onClick &&
    prev.onSelect === next.onSelect &&
    prev.onUpdate === next.onUpdate &&
    prev.onWhatsApp === next.onWhatsApp &&
    prev.onEmail === next.onEmail &&
    prev.onToggleAutomation === next.onToggleAutomation
  );
}

export default memo(ProspectCardV2, arePropsEqual);
