/**
 * ProspectorCRMEnhanced - CRM Kanban com Drag-and-Drop + IA
 * 
 * Melhorias sobre versão original:
 * - Drag-and-drop fluido entre stages
 * - Lead scoring automático por IA em tempo real
 * - Ações rápidas inline
 * - Filtros inteligentes
 * - Notificações automáticas de follow-up
 */

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { db } from '../../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import AIMessageGenerator from './AIMessageGenerator';
import type { ProspectLead } from '../ProspectorCRM';

interface ProspectorCRMEnhancedProps {
  prospectorId: string;
  prospectorName: string;
  referralLink: string;
}

const STAGES = [
  { id: 'new', title: '🆕 Novos', color: 'bg-blue-50 border-blue-300' },
  { id: 'contacted', title: '📞 Contatados', color: 'bg-yellow-50 border-yellow-300' },
  { id: 'negotiating', title: '🤝 Negociando', color: 'bg-purple-50 border-purple-300' },
  { id: 'won', title: '✅ Convertidos', color: 'bg-green-50 border-green-300' },
  { id: 'lost', title: '❌ Perdidos', color: 'bg-red-50 border-red-300' }
];

export default function ProspectorCRMEnhanced({
  prospectorId,
  prospectorName,
  referralLink
}: ProspectorCRMEnhancedProps) {
  const [leads, setLeads] = useState<ProspectLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<ProspectLead | null>(null);
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  const loadLeads = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'prospector_prospects'),
        where('prospectorId', '==', prospectorId)
      );
      const snapshot = await getDocs(q);
      const loadedLeads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate(),
          activities: (data.activities || []).map((a: { type: string; description: string; timestamp?: { toDate(): Date } }) => ({
            ...a,
            timestamp: a.timestamp?.toDate() || new Date()
          }))
        } as ProspectLead;
      });
      
      // Auto-calcular lead score com IA
      const leadsWithScores = loadedLeads.map(lead => ({
        ...lead,
        ...calculateAILeadScore(lead)
      }));
      
      setLeads(leadsWithScores);
      
      // Auto-notificar leads inativos
      autoNotifyInactiveLeads(leadsWithScores);
    } catch (error) {
      console.error('[CRM] Erro ao carregar leads:', error);
    } finally {
      setLoading(false);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, [loadLeads]);

  function calculateAILeadScore(lead: ProspectLead): Pick<ProspectLead, 'score' | 'temperature' | 'priority'> {
    let score = 50; // Base score

    // Fator 1: Recência da atividade (peso 30%)
    if (lead.lastActivity) {
      const daysSinceActivity = Math.floor((Date.now() - lead.lastActivity.getTime()) / (24 * 60 * 60 * 1000));
      if (daysSinceActivity === 0) score += 20;
      else if (daysSinceActivity <= 3) score += 15;
      else if (daysSinceActivity <= 7) score += 5;
      else if (daysSinceActivity > 14) score -= 15;
    }

    // Fator 2: Stage do funil (peso 25%)
    const stageScores = {
      new: 5,
      contacted: 10,
      negotiating: 25,
      won: 0,
      lost: -50
    };
    score += stageScores[lead.stage];

    // Fator 3: Fonte do lead (peso 15%)
    const sourceScores = {
      referral: 15,
      event: 10,
      direct: 8,
      social: 5,
      other: 0
    };
    score += sourceScores[lead.source] || 0;

    // Fator 4: Completude dos dados (peso 15%)
    if (lead.email) score += 5;
    if (lead.category) score += 5;
    if (lead.location) score += 5;

    // Fator 5: Número de atividades (peso 15%)
    const activityCount = lead.activities?.length || 0;
    if (activityCount >= 5) score += 15;
    else if (activityCount >= 3) score += 10;
    else if (activityCount >= 1) score += 5;

    // Normalizar score (0-100)
    score = Math.max(0, Math.min(100, score));

    // Determinar temperatura
    let temperature: 'hot' | 'warm' | 'cold';
    if (score >= 70) temperature = 'hot';
    else if (score >= 40) temperature = 'warm';
    else temperature = 'cold';

    // Determinar prioridade
    let priority: 'high' | 'medium' | 'low';
    if (temperature === 'hot' && lead.stage === 'negotiating') priority = 'high';
    else if (temperature === 'hot' || lead.stage === 'negotiating') priority = 'medium';
    else priority = 'low';

    return { score, temperature, priority };
  }

  function autoNotifyInactiveLeads(leads: ProspectLead[]) {
    const inactiveLeads = leads.filter(l => {
      if (l.stage === 'won' || l.stage === 'lost') return false;
      if (!l.lastActivity) return true;
      const daysSince = Math.floor((Date.now() - l.lastActivity.getTime()) / (24 * 60 * 60 * 1000));
      return daysSince >= 7;
    });

    if (inactiveLeads.length > 0 && Notification.permission === 'granted') {
      new Notification('⏰ Leads precisam de atenção!', {
        body: `${inactiveLeads.length} lead(s) sem atividade há 7+ dias`,
        icon: '/icon-192.png'
      });
    }
  }

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    const newStage = destination.droppableId as ProspectLead['stage'];

    // Optimistic update
    setLeads(prev => prev.map(l => 
      l.id === draggableId 
        ? { 
            ...l, 
            stage: newStage,
            lastActivity: new Date(),
            activities: [
              ...(l.activities || []),
              {
                type: 'stage_change' as const,
                description: `Movido para ${STAGES.find(s => s.id === newStage)?.title}`,
                timestamp: new Date()
              }
            ]
          }
        : l
    ));

    // Celebração ao converter
    if (newStage === 'won') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-3xl">🎉</span>
          <div>
            <div class="font-bold text-lg">Lead Convertido!</div>
            <div class="text-sm">${lead.name} agora é um recrutado!</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }

    // Update Firestore
    try {
      const updatedActivities = [
        ...(lead.activities || []),
        {
          type: 'stage_change' as const,
          description: `Movido para ${STAGES.find(s => s.id === newStage)?.title}`,
          timestamp: Timestamp.now()
        }
      ];

      await updateDoc(doc(db, 'prospector_prospects', draggableId), {
        stage: newStage,
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now(),
        activities: updatedActivities
      });
    } catch (error) {
      console.error('[CRM] Erro ao atualizar lead:', error);
      loadLeads(); // Revert on error
    }
  }

  const getFilteredLeads = () => {
    if (filter === 'all') return leads;
    return leads.filter(l => l.temperature === filter);
  };

  const filteredLeads = getFilteredLeads();
  const leadsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredLeads.filter(l => l.stage === stage.id);
    return acc;
  }, {} as Record<string, ProspectLead[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Pipeline de Prospecção
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtrar:</span>
            {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' && '🔎 Todos'}
                {f === 'hot' && '🔥 Quentes'}
                {f === 'warm' && '⚡ Mornos'}
                {f === 'cold' && '❄️ Frios'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {STAGES.map(stage => (
            <div key={stage.id} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-800">
                {leadsByStage[stage.id]?.length || 0}
              </div>
              <div className="text-xs text-gray-600">{stage.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map(stage => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-lg border-2 p-3 min-h-[500px] transition-all ${
                    stage.color
                  } ${snapshot.isDraggingOver ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}
                >
                  <h3 className="font-semibold text-sm mb-3 sticky top-0 bg-white/90 backdrop-blur py-2 rounded">
                    {stage.title} ({leadsByStage[stage.id]?.length || 0})
                  </h3>
                  
                  <div className="space-y-2">
                    {leadsByStage[stage.id]?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-3 border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                              snapshot.isDragging ? 'shadow-2xl rotate-2' : ''
                            }`}
                            onClick={() => setSelectedLead(lead)}
                          >
                            {/* Lead Card */}
                            <div className="space-y-2">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {lead.name}
                                  </div>
                                  {lead.category && (
                                    <div className="text-xs text-gray-500">{lead.category}</div>
                                  )}
                                </div>
                                <span className={`text-lg ${
                                  lead.temperature === 'hot' ? '🔥' :
                                  lead.temperature === 'warm' ? '⚡' : '❄️'
                                }`} title={`Score: ${lead.score}/100`}>
                                  {lead.temperature === 'hot' ? '🔥' :
                                   lead.temperature === 'warm' ? '⚡' : '❄️'}
                                </span>
                              </div>

                              {/* Score Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    (lead.score || 0) >= 70 ? 'bg-green-500' :
                                    (lead.score || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${lead.score || 0}%` }}
                                />
                              </div>

                              {/* Metadata */}
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>📱 {lead.phone}</span>
                              </div>

                              {/* Last Activity */}
                              {lead.lastActivity && (
                                <div className="text-xs text-gray-500">
                                  Última atividade: {formatRelativeTime(lead.lastActivity)}
                                </div>
                              )}

                              {/* Quick Actions */}
                              <div className="flex gap-1 pt-2 border-t border-gray-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
                                  }}
                                  className="flex-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 py-1 rounded transition-colors"
                                  title="WhatsApp"
                                >
                                  💬
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLead(lead);
                                  }}
                                  className="flex-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1 rounded transition-colors"
                                  title="IA Message"
                                >
                                  🤖
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>

                  {leadsByStage[stage.id]?.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Arraste leads para cá
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Modal de Detalhes + IA Message Generator */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">
                  {selectedLead.temperature === 'hot' ? '🔥' :
                   selectedLead.temperature === 'warm' ? '⚡' : '❄️'}
                </span>
                {selectedLead.name}
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <AIMessageGenerator
                lead={selectedLead}
                prospectorName={prospectorName}
                referralLink={referralLink}
                onSendSuccess={() => {
                  setSelectedLead(null);
                  loadLeads();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'agora mesmo';
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `há ${Math.floor(seconds / 86400)}d`;
  return `há ${Math.floor(seconds / 604800)} semanas`;
}
