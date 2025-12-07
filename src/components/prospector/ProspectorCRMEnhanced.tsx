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

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { db } from '../../../firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import AIMessageGenerator from './AIMessageGenerator';
import type { ProspectLead } from '../ProspectorCRM';
import type { Activity } from '../ProspectorCRM';
import KanbanHorizontalContainer from './KanbanHorizontalContainer';
import ProspectCardV2 from './ProspectCardV2';
import { SelectionProvider, useSelection } from '../../contexts/SelectionContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import SavedViewsBar from './SavedViewsBar';
import { type FilterCondition } from '../../hooks/useAdvancedFilters';
import { useAdvancedFiltersHook } from '../../hooks/useAdvancedFilters';
import { templates, render } from '../../prospector/templates';
import { getAnalyticsIfSupported } from '../../../firebaseConfig';
import { logEvent } from 'firebase/analytics';
import BulkActionsBar from './BulkActionsBar';
import SmartFiltersBar from './SmartFiltersBar';
import AIActionCard from './AIActionCard';
import ConversionFunnelDashboard from './ConversionFunnelDashboard';
import FollowUpSequences from './FollowUpSequences';
import LeadEnrichmentModal from './LeadEnrichmentModal';
import GamificationPanel from './GamificationPanel';
import { scoreProspect, getPriority } from '../../prospector/leadScoring';
import { trackStageChange, trackChannelAction } from '../../prospector/analytics';
import { planNextAction, generateDefaultSequence } from '../../prospector/sequencer';
import { filterDuplicates } from '../../prospector/dedupe';

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
  { id: 'lost', title: '❌ Perdidos', color: 'bg-red-50 border-red-300' },
];

export default function ProspectorCRMEnhanced({
  prospectorId,
  prospectorName,
  referralLink,
}: ProspectorCRMEnhancedProps) {
  const [leads, setLeads] = useState<ProspectLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<ProspectLead | null>(null);
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState<'none' | 'today' | 'overdue' | 'upcoming'>(
    'none'
  );
  const [priorityFilter, setPriorityFilter] = useState<'none' | 'A_B'>('none');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddStage, setQuickAddStage] = useState<ProspectLead['stage']>('new');
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'activities' | 'ai'>(
    'overview'
  );
  const [sortByScore, setSortByScore] = useState<boolean>(false);
  // @ts-expect-error - import.meta.env is a special Vite API not fully typed
  const CRM_V2_ENABLED =
    (import.meta as unknown as Record<string, unknown>).env?.VITE_CRM_V2_ENABLED === 'true';
  // @ts-expect-error - import.meta.env is a special Vite API not fully typed
  const CRM_VIEWS_ENABLED =
    (import.meta as unknown as Record<string, unknown>).env?.VITE_CRM_VIEWS_ENABLED === 'true';
  const [density, setDensity] = useState<'compact' | 'detailed'>('compact');
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const { runMemoized } = useAdvancedFiltersHook(120);
  const [smartFilter, setSmartFilter] = useState<((lead: ProspectLead) => boolean) | null>(null);
  const [showFunnelDashboard, setShowFunnelDashboard] = useState(false);
  const [showFollowUpSequences, setShowFollowUpSequences] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

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
          activities: (data.activities || []).map(
            (a: { type: string; description: string; timestamp?: { toDate(): Date } }) => ({
              ...a,
              timestamp: a.timestamp?.toDate() || new Date(),
            })
          ),
        } as ProspectLead;
      });

      // Auto-calcular lead score com utilitário determinístico
      const leadsWithScores = loadedLeads.map(lead => {
        const breakdown = scoreProspect({
          id: lead.id,
          email: lead.email,
          phone: lead.phone,
          name: lead.name,
          company: lead.company,
          title: lead.title,
          location: lead.location,
          website: (lead as ProspectLead & { website?: string }).website,
          linkedin: (lead as ProspectLead & { linkedin?: string }).linkedin,
          instagram: (lead as ProspectLead & { instagram?: string }).instagram,
          facebook: (lead as ProspectLead & { facebook?: string }).facebook,
          source: lead.source,
          tags: (lead as ProspectLead & { tags?: string[] }).tags,
          stage: lead.stage,
          lastInteractionTs: lead.lastActivity ? lead.lastActivity.getTime() : undefined,
          opens: (lead as any).opens,
          clicks: (lead as any).clicks,
          replies: (lead as any).replies,
          sentiment: (lead as any).sentiment,
        });
        const score = breakdown.total;
        const temperature: 'hot' | 'warm' | 'cold' =
          score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
        const priorityMap = { A: 'high', B: 'medium', C: 'low', D: 'low' } as const;
        const priority = priorityMap[getPriority(score)];
        return { ...lead, score, temperature, priority };
      });

      setLeads(leadsWithScores);

      // Auto-notificar leads inativos
      autoNotifyInactiveLeads(leadsWithScores);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao carregar leads';
      console.error('[CRM] Erro ao carregar leads:', error);
      setLastError(msg);
    } finally {
      setLoading(false);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, [loadLeads]);

  // Lembrete de follow-ups ao carregar
  useEffect(() => {
    if (leads.length === 0) return;

    const today = new Date().toDateString();
    const overdueLeads = leads.filter(
      l =>
        l.followUpDate &&
        new Date(l.followUpDate) < new Date() &&
        new Date(l.followUpDate).toDateString() !== today
    );
    const todayLeads = leads.filter(
      l => l.followUpDate && new Date(l.followUpDate).toDateString() === today
    );

    if (overdueLeads.length > 0) {
      setTimeout(() => {
        const toast = document.createElement('div');
        toast.className =
          'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce';
        toast.innerHTML = `<div class="flex items-center gap-3"><span class="text-2xl">⚠️</span><div><div class="font-bold">Follow-ups atrasados!</div><div class="text-sm">${overdueLeads.length} lead(s) aguardando contato</div></div></div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
      }, 1000);
    }

    if (todayLeads.length > 0) {
      setTimeout(() => {
        const toast = document.createElement('div');
        toast.className =
          'fixed bottom-4 right-4 bg-yellow-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50';
        toast.innerHTML = `<div class="flex items-center gap-3"><span class="text-2xl">🔔</span><div><div class="font-bold">Follow-ups para hoje!</div><div class="text-sm">${todayLeads.length} lead(s) aguardando contato</div></div></div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
      }, 2000);
    }
  }, [leads]);

  // (calculateAILeadScore removido: substituído por scoreProspect utilitário determinístico)

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
        icon: '/icon-192.png',
      });
    }
  }

  async function handleLeadUpdate(leadId: string, updates: Partial<ProspectLead>) {
    try {
      await updateDoc(doc(db, 'prospector_prospects', leadId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, ...updates } : l)));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar lead';
      console.error('Erro ao atualizar lead:', error);
      setLastError(msg);
      // Toast simples de erro
      showToast(`❌ ${msg}`, 'error');
    }
  }

  function applyFilters(lead: ProspectLead): boolean {
    // Smart filter (priority)
    if (smartFilter && !smartFilter(lead)) return false;
    // Filtro temperatura
    if (filter !== 'all' && lead.temperature !== filter) return false;
    // Filtro prioridade (A/B)
    if (priorityFilter === 'A_B') {
      const pr = lead.priority || 'low';
      const isAB = pr === 'high' || pr === 'medium';
      if (!isAB) return false;
    }
    // Filtro busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = [lead.name, lead.email, lead.phone, lead.category].some(field =>
        field?.toLowerCase().includes(term)
      );
      if (!match) return false;
    }
    // Filtro follow-up
    if (followUpFilter !== 'none') {
      if (!lead.followUpDate) return false;
      const d = new Date(lead.followUpDate);
      const today = new Date();
      if (followUpFilter === 'today' && d.toDateString() !== today.toDateString()) return false;
      if (followUpFilter === 'overdue' && (d >= today || d.toDateString() === today.toDateString()))
        return false;
      if (followUpFilter === 'upcoming' && d <= today) return false;
    }
    return true;
  }

  // Render V2: container horizontal + cartões novos
  if (CRM_V2_ENABLED) {
    return (
      <SelectionProvider>
        <SmartFiltersBar
          leads={leads}
          onFilterApply={filter => setSmartFilter(() => filter)}
          onClear={() => setSmartFilter(null)}
        />
        {CRM_VIEWS_ENABLED && (
          <SavedViewsBar
            prospectorId={prospectorId}
            density={density}
            setDensity={setDensity}
            conditions={conditions}
            setConditions={next => {
              // Debounce aplicação para evitar re-renders em digitação
              setConditions(next);
            }}
          />
        )}

        {/* Analytics & Automation Toolbar */}
        <div className="flex gap-2 mb-3 px-2 flex-wrap">
          <button
            onClick={async () => {
              const next = !showFunnelDashboard;
              setShowFunnelDashboard(next);
              if (next) {
                try {
                  const analytics = await getAnalyticsIfSupported();
                  if (analytics)
                    logEvent(analytics, 'funnel_dashboard_opened', { lead_count: leads.length });
                } catch (error) {
                  console.debug('Funnel dashboard tracking failed', error);
                }
              }
            }}
            data-testid="btn-funnel-dashboard"
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            📊 {showFunnelDashboard ? 'Ocultar' : 'Dashboard de Conversão'}
          </button>
          <button
            onClick={() => setShowFollowUpSequences(true)}
            data-testid="btn-followup-sequences"
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            🔄 Sequências Automáticas
          </button>
          <button
            onClick={async () => {
              setShowEnrichment(true);
              try {
                const analytics = await getAnalyticsIfSupported();
                if (analytics) logEvent(analytics, 'enrichment_opened', {});
              } catch (error) {
                console.debug('Analytics tracking failed', error);
              }
            }}
            data-testid="btn-enrichment"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            🔍 Enriquecer Lead
          </button>
          <button
            onClick={async () => {
              setShowGamification(true);
              try {
                const analytics = await getAnalyticsIfSupported();
                if (analytics)
                  logEvent(analytics, 'gamification_opened', { lead_count: leads.length });
              } catch (error) {
                console.debug('Gamification tracking failed', error);
              }
            }}
            data-testid="btn-gamification"
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            🏆 Gamificação
          </button>
        </div>

        {showFunnelDashboard && (
          <div className="mb-4 px-2">
            <ConversionFunnelDashboard leads={leads} />
          </div>
        )}

        <ProspectorCRMV2Inner
          leads={leads}
          setLeads={setLeads}
          density={density}
          setDensity={setDensity}
          applyFilters={lead => {
            if (!applyFilters(lead)) return false;
            if (!CRM_VIEWS_ENABLED || conditions.length === 0) return true;
            // Usa versão memoizada para performance
            const res = runMemoized([lead], conditions);
            return res.length > 0;
          }}
          handleLeadUpdate={handleLeadUpdate}
          setSelectedLead={setSelectedLead}
          selectedLead={selectedLead}
          smartFilterActive={!!smartFilter}
        />

        {showFollowUpSequences && (
          <FollowUpSequences
            prospectorId={prospectorId}
            selectedLeads={leads}
            onClose={() => setShowFollowUpSequences(false)}
            onActivated={async (sequenceId, count) => {
              try {
                const analytics = await getAnalyticsIfSupported();
                if (analytics)
                  logEvent(analytics, 'sequence_activated_callback', {
                    sequence_id: sequenceId,
                    lead_count: count,
                  });
              } catch (error) {
                console.debug('Sequence activated tracking failed', error);
              }
            }}
          />
        )}
        {showEnrichment && (
          <LeadEnrichmentModal
            lead={selectedLead || leads[0] || null}
            onClose={() => setShowEnrichment(false)}
            onUpdate={handleLeadUpdate}
          />
        )}
        {showGamification && (
          <GamificationPanel leads={leads} onClose={() => setShowGamification(false)} />
        )}
      </SelectionProvider>
    );
  }

  async function addNote(leadId: string, note: string) {
    if (!note.trim()) return;

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const newActivity = {
        type: 'note' as const,
        description: note,
        timestamp: Timestamp.now(),
      };

      const updatedActivities = [...(lead.activities || []), newActivity];

      await updateDoc(doc(db, 'prospector_prospects', leadId), {
        activities: updatedActivities,
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setLeads(prev =>
        prev.map(l =>
          l.id === leadId
            ? {
                ...l,
                activities: [...(l.activities || []), { ...newActivity, timestamp: new Date() }],
                lastActivity: new Date(),
              }
            : l
        )
      );

      setNewNote('');

      // Toast
      const toast = document.createElement('div');
      toast.className =
        'fixed top-4 right-4 bg-indigo-500 text-white px-4 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = '✏️ Nota adicionada!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
    }
  }

  async function setFollowUp(leadId: string, date: string) {
    if (!date) return;

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const newActivity = {
        type: 'follow_up' as const,
        description: `Follow-up agendado para ${new Date(date).toLocaleDateString('pt-BR')}`,
        timestamp: Timestamp.now(),
      };

      const updatedActivities = [...(lead.activities || []), newActivity];

      await updateDoc(doc(db, 'prospector_prospects', leadId), {
        activities: updatedActivities,
        followUpDate: Timestamp.fromDate(new Date(date)),
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setLeads(prev =>
        prev.map(l =>
          l.id === leadId
            ? {
                ...l,
                activities: [...(l.activities || []), { ...newActivity, timestamp: new Date() }],
                lastActivity: new Date(),
              }
            : l
        )
      );

      setFollowUpDate('');

      // Toast
      const toast = document.createElement('div');
      toast.className =
        'fixed top-4 right-4 bg-purple-500 text-white px-4 py-3 rounded-lg shadow-lg z-50';
      toast.innerHTML = `<span class="text-lg">📅</span> Follow-up agendado!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) {
      console.error('Erro ao agendar follow-up:', error);
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
    setLeads(prev =>
      prev.map(l =>
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
                  timestamp: new Date(),
                },
              ],
            }
          : l
      )
    );

    // Celebração ao converter
    if (newStage === 'won') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      const toast = document.createElement('div');
      toast.className =
        'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce';
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
          timestamp: Timestamp.now(),
        },
      ];

      await updateDoc(doc(db, 'prospector_prospects', draggableId), {
        stage: newStage,
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now(),
        activities: updatedActivities,
      });
      try {
        await trackStageChange((lead as any).campaignId || null, lead.stage, newStage);
      } catch (error) {
        console.debug('Stage change tracking failed', error);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao mover lead';
      console.error('[CRM] Erro ao atualizar lead:', error);
      setLastError(msg);
      showToast(`❌ ${msg}`, 'error');
      loadLeads(); // Revert on error
    }
  }

  const getFilteredLeads = () => {
    let filtered = leads;

    // Filtro por temperatura
    if (filter !== 'all') {
      filtered = filtered.filter(l => l.temperature === filter);
    }

    // Busca por texto (nome, telefone, email, categoria)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        l =>
          l.name.toLowerCase().includes(term) ||
          l.phone.includes(term) ||
          l.email?.toLowerCase().includes(term) ||
          l.category?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredLeads = getFilteredLeads();
  const leadsByStage = STAGES.reduce(
    (acc, stage) => {
      let stageLeads = filteredLeads.filter(l => l.stage === stage.id);
      if (sortByScore) {
        stageLeads = stageLeads.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
      }
      // Aplicar filtro de follow-up
      if (followUpFilter && followUpFilter !== 'none') {
        stageLeads = stageLeads.filter(l => {
          if (!l.followUpDate) return false;
          const d = new Date(l.followUpDate);
          const today = new Date();
          if (followUpFilter === 'today') return d.toDateString() === today.toDateString();
          if (followUpFilter === 'overdue')
            return d < today && d.toDateString() !== today.toDateString();
          if (followUpFilter === 'upcoming') return d > today;
          return true;
        });
      }
      acc[stage.id] = stageLeads;
      return acc;
    },
    {} as Record<string, ProspectLead[]>
  );

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
      {/* Toolbar seleção: aplicar sequência padrão */}
      {document &&
        (document as any) &&
        // Placeholder to ensure client-side only
        null}
      {/* Banner de erro (visível até próxima ação) */}
      {lastError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 flex items-center justify-between">
          <div>⚠️ {lastError}</div>
          <button
            className="text-red-600 font-medium hover:underline"
            onClick={() => setLastError(null)}
          >
            dispensar
          </button>
        </div>
      )}
      {/* Header com Filtros e Busca */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* Título e Filtros */}
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
            <select
              value={followUpFilter}
              onChange={e => setFollowUpFilter(e.target.value as any)}
              className="ml-2 px-3 py-1 rounded-lg border border-gray-300 text-sm"
              title="Filtro de Follow-up"
            >
              <option value="none">Sem filtro de follow-up</option>
              <option value="today">Follow-up hoje</option>
              <option value="overdue">Follow-up atrasado</option>
              <option value="upcoming">Follow-up próximos</option>
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="ml-2 px-3 py-1 rounded-lg border border-gray-300 text-sm"
              title="Filtro de Prioridade"
            >
              <option value="none">Todas prioridades</option>
              <option value="A_B">Somente A/B</option>
            </select>
            <label className="ml-3 text-sm text-gray-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={sortByScore}
                onChange={() => setSortByScore(s => !s)}
              />
              Ordenar por score
            </label>
          </div>
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar por nome, telefone, email ou categoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
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
                                <div className="flex items-center gap-2">
                                  <span className={`text-lg`} title={`Score: ${lead.score}/100`}>
                                    {lead.temperature === 'hot'
                                      ? '🔥'
                                      : lead.temperature === 'warm'
                                        ? '⚡'
                                        : '❄️'}
                                  </span>
                                  {/* Priority Badge A/B/C/D */}
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      lead.priority === 'high'
                                        ? 'bg-green-100 text-green-700 border-green-300'
                                        : lead.priority === 'medium'
                                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                          : 'bg-gray-100 text-gray-600 border-gray-300'
                                    }`}
                                  >
                                    {lead.priority === 'high'
                                      ? 'A'
                                      : lead.priority === 'medium'
                                        ? 'B'
                                        : 'C/D'}
                                  </span>
                                </div>
                              </div>

                              {/* Score Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    (lead.score || 0) >= 70
                                      ? 'bg-green-500'
                                      : (lead.score || 0) >= 40
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${lead.score || 0}%` }}
                                />
                              </div>

                              {/* Metadata */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span>📱 {lead.phone}</span>
                                </div>
                                {lead.email && (
                                  <div className="text-xs text-gray-500 truncate">
                                    📧 {lead.email}
                                  </div>
                                )}
                              </div>

                              {/* Recent Activities */}
                              {lead.activities && lead.activities.length > 0 && (
                                <div className="text-xs text-gray-500 space-y-0.5 pt-1 border-t border-gray-100">
                                  <div className="font-medium text-gray-600">
                                    Últimas atividades:
                                  </div>
                                  {lead.activities
                                    .slice(-2)
                                    .reverse()
                                    .map((activity, idx) => (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-[10px]">•</span>
                                        <span className="text-[10px] leading-tight">
                                          {activity.description}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}

                              {/* Last Activity */}
                              {/* Follow-up Badge */}
                              {lead.followUpDate && (
                                <div
                                  className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                                    new Date(lead.followUpDate) < new Date()
                                      ? 'bg-red-100 text-red-700'
                                      : new Date(lead.followUpDate).toDateString() ===
                                          new Date().toDateString()
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  <span>🔔</span>
                                  {new Date(lead.followUpDate) < new Date()
                                    ? 'Atrasado'
                                    : new Date(lead.followUpDate).toDateString() ===
                                        new Date().toDateString()
                                      ? 'Hoje'
                                      : new Date(lead.followUpDate).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {/* Próxima Ação */}
                              {(() => {
                                const plan = planNextAction(
                                  lead.lastActivity ? lead.lastActivity.getTime() : undefined,
                                  undefined
                                );
                                const mins = Math.max(
                                  0,
                                  Math.floor((plan.nextActionAt - Date.now()) / (1000 * 60))
                                );
                                const soon = mins <= 0 ? 'agora' : `${mins} min`;
                                return (
                                  <div className="text-[10px] text-gray-500">
                                    ➡️ Próx. ação em {soon}
                                  </div>
                                );
                              })()}

                              {/* Last Activity */}
                              {lead.lastActivity && (
                                <div className="text-xs text-gray-400">
                                  ⏱️ {formatRelativeTime(lead.lastActivity)}
                                </div>
                              )}

                              {/* Quick Actions */}
                              <div className="flex gap-1 pt-2 border-t border-gray-100">
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    const message = render(templates.whatsapp.intro_value, {
                                      nome: lead.name,
                                      categoria: lead.category,
                                      empresa: (lead as any).company || 'sua empresa',
                                      percent: 32,
                                      dias: 14,
                                    });
                                    window.open(
                                      `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
                                      '_blank'
                                    );
                                    try {
                                      const leadRef = doc(db, 'prospector_prospects', lead.id);
                                      const newActivity: Activity = {
                                        timestamp: new Date(),
                                        type: 'message',
                                        description: `Contato via WhatsApp iniciado`,
                                      };
                                      await updateDoc(leadRef, {
                                        activities: [...(lead.activities || []), newActivity],
                                        lastActivity: Timestamp.fromDate(new Date()),
                                      });
                                      setLeads(prev =>
                                        prev.map(l =>
                                          l.id === lead.id
                                            ? {
                                                ...l,
                                                activities: [...(l.activities || []), newActivity],
                                                lastActivity: new Date(),
                                              }
                                            : l
                                        )
                                      );
                                      try {
                                        await trackChannelAction('whatsapp', true);
                                      } catch (error) {
                                        console.debug('WhatsApp tracking failed', error);
                                      }
                                    } catch (error) {
                                      console.debug('WhatsApp action failed', error);
                                    }
                                  }}
                                  className="flex-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 py-1 rounded transition-colors"
                                  title="WhatsApp"
                                >
                                  💬
                                </button>
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    if (lead.email) {
                                      const body = render(templates.email.intro_value, {
                                        nome: lead.name,
                                        categoria: lead.category,
                                        empresa: (lead as any).company || 'sua empresa',
                                        dias: 14,
                                        percent: 32,
                                      });
                                      window.open(
                                        `mailto:${lead.email}?subject=Oportunidade Servio.AI&body=${encodeURIComponent(body)}`,
                                        '_blank'
                                      );
                                      try {
                                        const leadRef = doc(db, 'prospector_prospects', lead.id);
                                        const newActivity: Activity = {
                                          timestamp: new Date(),
                                          type: 'email',
                                          description: `Email enviado para ${lead.email}`,
                                        };
                                        await updateDoc(leadRef, {
                                          activities: [...(lead.activities || []), newActivity],
                                          lastActivity: Timestamp.fromDate(new Date()),
                                          lastEmailSentAt: Timestamp.fromDate(new Date()),
                                        });
                                        setLeads(prev =>
                                          prev.map(l =>
                                            l.id === lead.id
                                              ? {
                                                  ...l,
                                                  activities: [
                                                    ...(l.activities || []),
                                                    newActivity,
                                                  ],
                                                  lastActivity: new Date(),
                                                  lastEmailSentAt: new Date(),
                                                }
                                              : l
                                          )
                                        );
                                        try {
                                          await trackChannelAction('email', true);
                                        } catch (error) {
                                          console.debug('Email tracking failed', error);
                                        }
                                      } catch (error) {
                                        console.debug('Email action failed', error);
                                      }
                                    }
                                  }}
                                  disabled={!lead.email}
                                  className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={lead.email ? 'Email' : 'Email não cadastrado'}
                                >
                                  📧
                                </button>
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    window.open(`tel:${lead.phone}`, '_blank');
                                    try {
                                      const leadRef = doc(db, 'prospector_prospects', lead.id);
                                      const newActivity: Activity = {
                                        timestamp: new Date(),
                                        type: 'call',
                                        description: `Ligação iniciada para ${lead.phone}`,
                                      };
                                      await updateDoc(leadRef, {
                                        activities: [...(lead.activities || []), newActivity],
                                        lastActivity: Timestamp.fromDate(new Date()),
                                      });
                                      setLeads(prev =>
                                        prev.map(l =>
                                          l.id === lead.id
                                            ? {
                                                ...l,
                                                activities: [...(l.activities || []), newActivity],
                                                lastActivity: new Date(),
                                              }
                                            : l
                                        )
                                      );
                                      try {
                                        await trackChannelAction('call', true);
                                      } catch (error) {
                                        console.debug('Call tracking failed', error);
                                      }
                                    } catch (error) {
                                      console.debug('Call action failed', error);
                                    }
                                  }}
                                  className="flex-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 py-1 rounded transition-colors"
                                  title="Ligar"
                                >
                                  📱
                                </button>
                                <button
                                  onClick={e => {
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
                    <div className="text-center py-8 space-y-3">
                      <div className="text-gray-400 text-sm">Nenhum lead aqui ainda</div>
                      {stage.id === 'new' ? (
                        <button
                          onClick={() => {
                            setQuickAddStage(stage.id as ProspectLead['stage']);
                            setShowQuickAddModal(true);
                          }}
                          className="mx-auto block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          + Adicionar primeiro Lead
                        </button>
                      ) : (
                        <div className="text-xs text-gray-400">Arraste um lead para cá</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Modal de Detalhes Expandido com Abas */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">
                    {selectedLead.temperature === 'hot'
                      ? '🔥'
                      : selectedLead.temperature === 'warm'
                        ? '⚡'
                        : '❄️'}
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedLead.name}</h3>
                    <p className="text-indigo-100 text-sm">
                      {selectedLead.category || 'Sem categoria'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Score IA</div>
                  <div className="text-2xl font-bold">{selectedLead.score || 0}/100</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Atividades</div>
                  <div className="text-2xl font-bold">{selectedLead.activities?.length || 0}</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Última interação</div>
                  <div className="text-sm font-medium">
                    {selectedLead.lastActivity
                      ? formatRelativeTime(selectedLead.lastActivity)
                      : 'Nunca'}
                  </div>
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    const message = render(templates.whatsapp.intro_value, {
                      nome: selectedLead.name,
                      categoria: selectedLead.category,
                      empresa: (selectedLead as any).company || 'sua empresa',
                      percent: 32,
                      dias: 14,
                    });
                    window.open(
                      `https://wa.me/${selectedLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
                      '_blank'
                    );
                    try {
                      const leadRef = doc(db, 'prospector_prospects', selectedLead.id);
                      const newActivity: Activity = {
                        timestamp: new Date(),
                        type: 'message',
                        description: `Contato via WhatsApp do modal`,
                      };
                      await updateDoc(leadRef, {
                        activities: [...(selectedLead.activities || []), newActivity],
                        lastActivity: Timestamp.fromDate(new Date()),
                      });
                      setLeads(prev =>
                        prev.map(l =>
                          l.id === selectedLead.id
                            ? {
                                ...l,
                                activities: [...(l.activities || []), newActivity],
                                lastActivity: new Date(),
                              }
                            : l
                        )
                      );
                      setSelectedLead({
                        ...selectedLead,
                        activities: [...(selectedLead.activities || []), newActivity],
                        lastActivity: new Date(),
                      });
                    } catch (error) {
                      console.debug('Modal WhatsApp action failed', error);
                    }
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>💬</span> WhatsApp
                </button>
                <button
                  onClick={async () => {
                    if (!selectedLead.email) return;
                    const body = render(templates.email.intro_value, {
                      nome: selectedLead.name,
                      categoria: selectedLead.category,
                      empresa: (selectedLead as any).company || 'sua empresa',
                      dias: 14,
                      percent: 32,
                    });
                    window.open(
                      `mailto:${selectedLead.email}?subject=Oportunidade Servio.AI&body=${encodeURIComponent(body)}`,
                      '_blank'
                    );
                    try {
                      const leadRef = doc(db, 'prospector_prospects', selectedLead.id);
                      const newActivity: Activity = {
                        timestamp: new Date(),
                        type: 'email',
                        description: `Email enviado do modal para ${selectedLead.email}`,
                      };
                      await updateDoc(leadRef, {
                        activities: [...(selectedLead.activities || []), newActivity],
                        lastActivity: Timestamp.fromDate(new Date()),
                        lastEmailSentAt: Timestamp.fromDate(new Date()),
                      });
                      setLeads(prev =>
                        prev.map(l =>
                          l.id === selectedLead.id
                            ? {
                                ...l,
                                activities: [...(l.activities || []), newActivity],
                                lastActivity: new Date(),
                                lastEmailSentAt: new Date(),
                              }
                            : l
                        )
                      );
                      setSelectedLead({
                        ...selectedLead,
                        activities: [...(selectedLead.activities || []), newActivity],
                        lastActivity: new Date(),
                        lastEmailSentAt: new Date(),
                      });
                    } catch (error) {
                      console.debug('Modal Email action failed', error);
                    }
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={!selectedLead.email}
                >
                  <span>📧</span> Email
                </button>
                <button
                  onClick={async () => {
                    window.open(`tel:${selectedLead.phone}`, '_blank');
                    try {
                      const leadRef = doc(db, 'prospector_prospects', selectedLead.id);
                      const newActivity: Activity = {
                        timestamp: new Date(),
                        type: 'call',
                        description: `Ligação iniciada do modal para ${selectedLead.phone}`,
                      };
                      await updateDoc(leadRef, {
                        activities: [...(selectedLead.activities || []), newActivity],
                        lastActivity: Timestamp.fromDate(new Date()),
                      });
                      setLeads(prev =>
                        prev.map(l =>
                          l.id === selectedLead.id
                            ? {
                                ...l,
                                activities: [...(l.activities || []), newActivity],
                                lastActivity: new Date(),
                              }
                            : l
                        )
                      );
                      setSelectedLead({
                        ...selectedLead,
                        activities: [...(selectedLead.activities || []), newActivity],
                        lastActivity: new Date(),
                      });
                    } catch (error) {
                      console.debug('Modal Call action failed', error);
                    }
                  }}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>📱</span> Ligar
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                {(['overview', 'notes', 'activities', 'ai'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'overview' && '📊 Visão Geral'}
                    {tab === 'notes' && '📝 Notas'}
                    {tab === 'activities' && '📅 Histórico'}
                    {tab === 'ai' && '🤖 IA Mensagens'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Telefone</div>
                      <div className="font-medium">{selectedLead.phone}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Email</div>
                      <div className="font-medium">{selectedLead.email || 'Não informado'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Fonte</div>
                      <div className="font-medium capitalize">{selectedLead.source}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Criado em</div>
                      <div className="font-medium">
                        {selectedLead.createdAt?.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Section */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>📅</span> Agendar Follow-up
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={followUpDate}
                        onChange={e => setFollowUpDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => {
                          setFollowUp(selectedLead.id, followUpDate);
                        }}
                        disabled={!followUpDate}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">✏️ Adicionar Nota</h4>
                    <textarea
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Digite sua anotação sobre este lead..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <button
                      onClick={() => {
                        addNote(selectedLead.id, newNote);
                      }}
                      disabled={!newNote.trim()}
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Salvar Nota
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">📋 Notas Anteriores</h4>
                    {selectedLead.activities
                      ?.filter(a => a.type === 'note')
                      .reverse()
                      .map((activity, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="text-sm text-gray-800">{activity.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.timestamp instanceof Date
                              ? activity.timestamp.toLocaleString('pt-BR')
                              : new Date(activity.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      )) || <p className="text-gray-500 text-sm">Nenhuma nota ainda</p>}
                  </div>
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">
                    📜 Histórico Completo de Interações
                  </h4>
                  {selectedLead.activities && selectedLead.activities.length > 0 ? (
                    <div className="space-y-2">
                      {selectedLead.activities
                        .slice()
                        .reverse()
                        .map((activity, idx) => (
                          <div
                            key={idx}
                            className="bg-white border-l-4 border-indigo-500 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">
                                    {activity.type === 'stage_change' && '🔄'}
                                    {activity.type === 'note' && '📝'}
                                    {activity.type === 'follow_up' && '📅'}
                                    {activity.type === 'message' && '💬'}
                                    {activity.type === 'email' && '📧'}
                                  </span>
                                  <span className="text-xs font-medium text-gray-500 uppercase">
                                    {activity.type.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800">{activity.description}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                {activity.timestamp instanceof Date
                                  ? activity.timestamp.toLocaleString('pt-BR')
                                  : new Date(activity.timestamp).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-4xl mb-2">📭</p>
                      <p>Nenhuma atividade registrada ainda</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Tab */}
              {activeTab === 'ai' && (
                <AIMessageGenerator
                  lead={selectedLead}
                  prospectorName={prospectorName}
                  referralLink={referralLink}
                  onSendSuccess={() => {
                    loadLeads();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Add Lead */}
      {showQuickAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQuickAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">➕ Adicionar Lead Rápido</h3>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                try {
                  const newLead = {
                    prospectorId,
                    name: formData.get('name') as string,
                    phone: formData.get('phone') as string,
                    email: (formData.get('email') as string) || null,
                    category: (formData.get('category') as string) || null,
                    source: 'direct' as const,
                    stage: quickAddStage,
                    notes: null,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    activities: [],
                  };
                  // Dedupe antes de adicionar
                  const existing = leads.map(l => ({
                    id: l.id,
                    name: l.name,
                    email: l.email,
                    phone: l.phone,
                    company: (l as any).company || null,
                  }));
                  const { dupes } = filterDuplicates(existing, [newLead]);
                  if (dupes.length > 0) {
                    const toast = document.createElement('div');
                    toast.className =
                      'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    toast.textContent = '⚠️ Lead duplicado detectado. Operação cancelada.';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                    return;
                  }

                  await addDoc(collection(db, 'prospector_prospects'), newLead);
                  setShowQuickAddModal(false);
                  loadLeads();

                  // Toast sucesso
                  const toast = document.createElement('div');
                  toast.className =
                    'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                  toast.textContent = '✅ Lead adicionado com sucesso!';
                  document.body.appendChild(toast);
                  setTimeout(() => toast.remove(), 3000);
                } catch (error) {
                  console.error('Erro ao adicionar lead:', error);
                  alert('❌ Erro ao adicionar lead');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  name="phone"
                  required
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="(11) 98765-4321"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="joao@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  name="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Eletricista"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Adicionar
                </button>
              </div>
            </form>
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

// Toast util simples (não intrusivo)
function showToast(message: string, type: 'error' | 'success' | 'info' = 'info') {
  const el = document.createElement('div');
  el.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${
    type === 'error'
      ? 'bg-red-600 text-white'
      : type === 'success'
        ? 'bg-green-600 text-white'
        : 'bg-gray-900 text-white'
  }`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// V2 Inner Component with Selection
function ProspectorCRMV2Inner({
  leads,
  setLeads,
  density,
  setDensity,
  applyFilters,
  handleLeadUpdate,
  setSelectedLead,
  selectedLead,
  smartFilterActive,
}: {
  leads: ProspectLead[];
  setLeads: React.Dispatch<React.SetStateAction<ProspectLead[]>>;
  density: 'compact' | 'detailed';
  setDensity: (d: 'compact' | 'detailed') => void;
  applyFilters: (lead: ProspectLead) => boolean;
  handleLeadUpdate: (id: string, updates: Partial<ProspectLead>) => void;
  setSelectedLead: (lead: ProspectLead | null) => void;
  selectedLead: ProspectLead | null;
  smartFilterActive: boolean;
}) {
  const { selectedIds, toggleSelection, clearSelection, selectAll } = useSelection();

  const handleWhatsApp = useCallback(
    async (lead: ProspectLead) => {
      if (!lead.phone) return;
      const message = render(templates.whatsapp.intro_value, {
        nome: lead.name,
        categoria: lead.category,
        empresa: (lead as any).company || 'sua empresa',
        percent: 32,
        dias: 14,
      });
      const phoneClean = lead.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`, '_blank');

      try {
        const analytics = await getAnalyticsIfSupported();
        if (analytics)
          logEvent(analytics, 'prospector_card_whatsapp', {
            lead_id: lead.id,
            temperature: lead.temperature,
          });

        const leadRef = doc(db, 'prospector_prospects', lead.id);
        const newActivity: Activity = {
          timestamp: new Date(),
          type: 'message',
          description: `WhatsApp enviado`,
        };
        await updateDoc(leadRef, {
          activities: [...(lead.activities || []), newActivity],
          lastActivity: Timestamp.fromDate(new Date()),
        });
        setLeads(prev =>
          prev.map(l =>
            l.id === lead.id
              ? {
                  ...l,
                  activities: [...(l.activities || []), newActivity],
                  lastActivity: new Date(),
                }
              : l
          )
        );
      } catch (err) {
        // Erro silencioso: WhatsApp já foi aberto
      }
    },
    [setLeads]
  );

  const handleEmail = useCallback(
    async (lead: ProspectLead) => {
      if (!lead.email) return;
      const body = render(templates.email.intro_value, {
        nome: lead.name,
        categoria: lead.category,
        empresa: (lead as any).company || 'sua empresa',
        dias: 14,
        percent: 32,
      });
      window.open(
        `mailto:${lead.email}?subject=Oportunidade Servio.AI&body=${encodeURIComponent(body)}`,
        '_blank'
      );

      try {
        const analytics = await getAnalyticsIfSupported();
        if (analytics)
          logEvent(analytics, 'prospector_card_email', {
            lead_id: lead.id,
            temperature: lead.temperature,
          });

        const leadRef = doc(db, 'prospector_prospects', lead.id);
        const newActivity: Activity = {
          timestamp: new Date(),
          type: 'email',
          description: `Email enviado`,
        };
        await updateDoc(leadRef, {
          activities: [...(lead.activities || []), newActivity],
          lastActivity: Timestamp.fromDate(new Date()),
          lastEmailSentAt: Timestamp.fromDate(new Date()),
        });
        setLeads(prev =>
          prev.map(l =>
            l.id === lead.id
              ? {
                  ...l,
                  activities: [...(l.activities || []), newActivity],
                  lastActivity: new Date(),
                  lastEmailSentAt: new Date(),
                }
              : l
          )
        );
      } catch (err) {
        // Erro silencioso: Email já foi aberto
      }
    },
    [setLeads]
  );

  const handleToggleAutomation = useCallback(
    async (lead: ProspectLead) => {
      const isActive = !!lead.followUpScheduleId;
      const newStatus = !isActive;

      try {
        const analytics = await getAnalyticsIfSupported();
        if (analytics)
          logEvent(analytics, 'prospector_card_automation_toggle', {
            lead_id: lead.id,
            enabled: newStatus,
          });

        const leadRef = doc(db, 'prospector_prospects', lead.id);
        await updateDoc(leadRef, {
          followUpScheduleId: newStatus ? `auto_${lead.id}_${Date.now()}` : null,
          nextFollowUpAt: newStatus
            ? Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
            : null,
        });
        setLeads(prev =>
          prev.map(l =>
            l.id === lead.id
              ? {
                  ...l,
                  followUpScheduleId: newStatus ? `auto_${lead.id}_${Date.now()}` : undefined,
                  nextFollowUpAt: newStatus
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    : undefined,
                }
              : l
          )
        );

        alert(
          newStatus
            ? '✅ Automação ativada! Follow-ups serão enviados automaticamente.'
            : '⏸️ Automação pausada.'
        );
      } catch (err) {
        alert(
          '❌ Erro ao atualizar automação: ' + (err instanceof Error ? err.message : String(err))
        );
      }
    },
    [setLeads]
  );

  const handleBulkMove = async (targetStage: ProspectLead['stage']) => {
    if (selectedIds.size === 0) return;
    try {
      const promises = Array.from(selectedIds).map(id =>
        handleLeadUpdate(id, { stage: targetStage })
      );
      await Promise.all(promises);
      clearSelection();
      const toast = document.createElement('div');
      toast.className =
        'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `✅ ${selectedIds.size} lead(s) movido(s) com sucesso!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) {
      console.error('Erro ao mover leads:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} lead(s)?`)) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../../firebaseConfig');
      const promises = Array.from(selectedIds).map(id =>
        deleteDoc(doc(db, 'prospector_prospects', id))
      );
      await Promise.all(promises);
      clearSelection();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao excluir leads:', error);
    }
  };

  const handleBulkTemperature = async (temperature: 'hot' | 'warm' | 'cold') => {
    if (selectedIds.size === 0) return;
    try {
      const promises = Array.from(selectedIds).map(id => handleLeadUpdate(id, { temperature }));
      await Promise.all(promises);
      clearSelection();
    } catch (error) {
      console.error('Erro ao atualizar temperatura:', error);
    }
  };

  useKeyboardShortcuts(
    [
      {
        key: 'a',
        ctrl: true,
        handler: () => selectAll(leads.filter(applyFilters).map(l => l.id)),
        description: 'Selecionar todos',
      },
      {
        key: 'Escape',
        handler: () => {
          clearSelection();
          setSelectedLead(null);
        },
        description: 'Limpar seleção/fechar modal',
      },
      {
        key: 'd',
        handler: () => setDensity(density === 'compact' ? 'detailed' : 'compact'),
        description: 'Toggle densidade',
      },
      { key: 'Delete', handler: () => handleBulkDelete(), description: 'Excluir selecionados' },
    ],
    true
  );

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId as ProspectLead['stage'];
    const lead = leads.find(l => l.id === draggableId);
    if (!lead || lead.stage === newStage) return;

    try {
      const { updateDoc, doc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('../../../firebaseConfig');
      const newActivity = {
        type: 'stage_change' as const,
        description: `Movido de ${lead.stage} para ${newStage}`,
        timestamp: Timestamp.now(),
      };
      await updateDoc(doc(db, 'prospector_prospects', draggableId), {
        stage: newStage,
        activities: [...(lead.activities || []), newActivity],
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      if (newStage === 'won') {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }
  };

  const byStage: Record<string, ProspectLead[]> = {
    new: [],
    contacted: [],
    negotiating: [],
    won: [],
    lost: [],
  };
  for (const lead of leads) {
    const filtered = applyFilters(lead);
    if (filtered) {
      (byStage[lead.stage] ?? byStage.new).push(lead);
    }
  }

  return (
    <div className="space-y-3 relative">
      {smartFilterActive && (
        <div className="absolute top-2 right-4 z-10 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
          ⚡ Filtro Inteligente Ativo
        </div>
      )}

      <div className="flex items-center justify-between px-4">
        <div className="text-lg font-semibold">Pipeline CRM V2</div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 text-gray-600"
            title="Atalhos: Ctrl+A (selecionar), D (densidade), Delete (excluir), Esc (limpar)"
          >
            ⌨️ Atalhos
          </button>
          <label className="text-sm text-gray-600">Densidade</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={density}
            onChange={e => setDensity(e.target.value as any)}
          >
            <option value="compact">Compacta</option>
            <option value="detailed">Detalhada</option>
          </select>
        </div>
      </div>

      <KanbanHorizontalContainer headers={STAGES}>
        <DragDropContext onDragEnd={handleDragEnd}>
          {STAGES.map(stage => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-w-[280px] shrink-0 space-y-2 rounded p-2 transition ${snapshot.isDraggingOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : ''}`}
                >
                  {byStage[stage.id]?.map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? 'rotate-2 scale-105' : ''}
                        >
                          <ProspectCardV2
                            lead={lead}
                            density={density}
                            selected={selectedIds.has(lead.id)}
                            onClick={async () => {
                              setSelectedLead(lead);
                              try {
                                const analytics = await getAnalyticsIfSupported();
                                if (analytics)
                                  logEvent(analytics, 'prospector_card_view', {
                                    lead_id: lead.id,
                                    density,
                                    temperature: lead.temperature,
                                    priority: lead.priority,
                                  });
                              } catch (error) {
                                console.debug('Prospect card view tracking failed', error);
                              }
                            }}
                            onSelect={e => {
                              e.stopPropagation();
                              toggleSelection(lead.id);
                            }}
                            onUpdate={handleLeadUpdate}
                            onWhatsApp={handleWhatsApp}
                            onEmail={handleEmail}
                            onToggleAutomation={handleToggleAutomation}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </KanbanHorizontalContainer>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        selectedLeads={leads.filter(l => selectedIds.has(l.id))}
        onClearSelection={clearSelection}
        onBulkMove={handleBulkMove}
        onBulkTemperature={handleBulkTemperature}
        onBulkDelete={handleBulkDelete}
      />

      {/* Ação em massa: aplicar sequência padrão */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4">
          <button
            className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
            onClick={async () => {
              const sequence = generateDefaultSequence(true);
              const ids = Array.from(selectedIds);
              for (const id of ids) {
                const lead = leads.find(l => l.id === id);
                if (!lead) continue;
                const plan = planNextAction(
                  lead.lastActivity ? lead.lastActivity.getTime() : undefined,
                  sequence
                );
                try {
                  await updateDoc(doc(db, 'prospector_prospects', id), {
                    followUpScheduleId: `seq_${Date.now()}`,
                    nextFollowUpAt: Timestamp.fromMillis(plan.nextActionAt),
                  });
                  setLeads(prev =>
                    prev.map(l =>
                      l.id === id
                        ? {
                            ...l,
                            followUpScheduleId: `seq_${Date.now()}`,
                            nextFollowUpAt: new Date(plan.nextActionAt),
                          }
                        : l
                    )
                  );
                } catch (err) {
                  console.error('Erro ao aplicar sequência:', err);
                }
              }
              clearSelection();
              showToast('✅ Sequência aplicada aos selecionados', 'success');
            }}
          >
            🔄 Aplicar sequência padrão
          </button>
          <button
            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
            onClick={async () => {
              const ids = Array.from(selectedIds);
              for (const id of ids) {
                try {
                  await updateDoc(doc(db, 'prospector_prospects', id), {
                    followUpScheduleId: null,
                    nextFollowUpAt: null,
                  });
                  setLeads(prev =>
                    prev.map(l =>
                      l.id === id
                        ? { ...l, followUpScheduleId: undefined, nextFollowUpAt: undefined }
                        : l
                    )
                  );
                } catch (err) {
                  console.error('Erro ao cancelar sequência:', err);
                }
              }
              clearSelection();
              showToast('⏸️ Sequência cancelada para selecionados', 'success');
            }}
          >
            ⏸️ Cancelar sequência
          </button>
          <button
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            onClick={async () => {
              const ids = Array.from(selectedIds);
              for (const id of ids) {
                const lead = leads.find(l => l.id === id);
                const base = lead?.lastActivity ? lead.lastActivity.getTime() : Date.now();
                const next = base + 24 * 60 * 60 * 1000; // reagendar +24h
                try {
                  await updateDoc(doc(db, 'prospector_prospects', id), {
                    nextFollowUpAt: Timestamp.fromMillis(next),
                  });
                  setLeads(prev =>
                    prev.map(l => (l.id === id ? { ...l, nextFollowUpAt: new Date(next) } : l))
                  );
                } catch (err) {
                  console.error('Erro ao reagendar próxima ação:', err);
                }
              }
              clearSelection();
              showToast('📅 Próxima ação reagendada (+24h)', 'success');
            }}
          >
            📅 Reagendar próxima ação
          </button>
        </div>
      )}

      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/40 grid place-items-center z-40"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-[680px] max-w-[90vw] max-h-[85vh] overflow-auto p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-xl text-gray-900">{selectedLead.name}</div>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => setSelectedLead(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <AIActionCard
                lead={selectedLead}
                onAction={action => {
                  console.log('Action triggered:', action, selectedLead);
                  // Action handlers already connected via quick action buttons
                }}
              />

              <div className="text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Email:</strong> {selectedLead.email || '—'}
                  </div>
                  <div>
                    <strong>Telefone:</strong> {selectedLead.phone || '—'}
                  </div>
                  <div>
                    <strong>Categoria:</strong> {selectedLead.category || '—'}
                  </div>
                  <div>
                    <strong>Score:</strong> {selectedLead.score || 0}
                  </div>
                  <div>
                    <strong>Temperatura:</strong> {selectedLead.temperature || '—'}
                  </div>
                  <div>
                    <strong>Prioridade:</strong> {selectedLead.priority || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
