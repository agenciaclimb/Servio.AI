/**
 * Prospector CRM - Kanban Board
 * 
 * Features:
 * - Drag-and-drop leads between stages
 * - Lead stages: New → Contacted → Negotiating → Won/Lost
 * - Lead details: name, contact, source, notes, last activity
 * - Quick actions: call, message, email
 * - Activity timeline per lead
 */

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

export interface ProspectLead {
  id: string;
  prospectorId: string;
  name: string;
  phone: string;
  email?: string;
  source: 'referral' | 'direct' | 'event' | 'social' | 'other';
  stage: 'new' | 'contacted' | 'negotiating' | 'won' | 'lost';
  category?: string;
  location?: string;
  notes?: string;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
  activities: Activity[];
  // Follow-up automation fields
  followUpScheduleId?: string; // Link to prospector_followups
  lastEmailSentAt?: Date;
  nextFollowUpAt?: Date;
  emailsOpened?: number;
  // Lead scoring
  score?: number; // 0-100
  temperature?: 'hot' | 'warm' | 'cold';
  priority?: 'high' | 'medium' | 'low';
  // Selection for bulk actions
  selected?: boolean;
}

interface Activity {
  type: 'call' | 'message' | 'email' | 'note' | 'stage_change';
  description: string;
  timestamp: Date;
}

interface ProspectorCRMProps {
  prospectorId: string;
}

const STAGES = [
  { id: 'new', title: '🆕 Novos Leads', color: 'bg-blue-50 border-blue-200' },
  { id: 'contacted', title: '📞 Contatados', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'negotiating', title: '🤝 Negociando', color: 'bg-purple-50 border-purple-200' },
  { id: 'won', title: '✅ Convertidos', color: 'bg-green-50 border-green-200' },
  { id: 'lost', title: '❌ Perdidos', color: 'bg-red-50 border-red-200' }
];

export default function ProspectorCRM({ prospectorId }: Readonly<ProspectorCRMProps>) {
  const [leads, setLeads] = useState<ProspectLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLead, setShowAddLead] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [prospectorId]);

  async function loadLeads() {
    try {
      const q = query(
        collection(db, 'prospector_prospects'),
        where('prospectorId', '==', prospectorId)
      );
      const snapshot = await getDocs(q);
      const loadedLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate(),
        lastEmailSentAt: doc.data().lastEmailSentAt?.toDate(),
        nextFollowUpAt: doc.data().nextFollowUpAt?.toDate(),
        activities: (doc.data().activities || []).map((a: any) => ({
          ...a,
          timestamp: a.timestamp?.toDate() || new Date()
        }))
      })) as ProspectLead[];
      
      // Calculate scores for all leads
      const leadsWithScores = loadedLeads.map(lead => ({
        ...lead,
        ...calculateLeadScore(lead),
        selected: false
      }));
      
      setLeads(leadsWithScores);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    // Update lead stage
    const leadId = draggableId;
    const newStage = destination.droppableId as ProspectLead['stage'];
    
    // Optimistic update
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { 
            ...lead, 
            stage: newStage,
            lastActivity: new Date(),
            activities: [
              ...lead.activities,
              {
                type: 'stage_change',
                description: `Movido para ${STAGES.find(s => s.id === newStage)?.title}`,
                timestamp: new Date()
              }
            ]
          }
        : lead
    ));

    // Update Firestore
    try {
      await updateDoc(doc(db, 'prospector_prospects', leadId), {
        stage: newStage,
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now(),
        activities: leads.find(l => l.id === leadId)?.activities.concat({
          type: 'stage_change',
          description: `Movido para ${STAGES.find(s => s.id === newStage)?.title}`,
          timestamp: new Date()
        }) || []
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      loadLeads(); // Revert on error
    }
  }

  async function addLead(leadData: Partial<ProspectLead>) {
    try {
      const newLead = {
        prospectorId,
        name: leadData.name || '',
        phone: leadData.phone || '',
        email: leadData.email || '',
        source: leadData.source || 'direct',
        stage: 'new',
        category: leadData.category || '',
        location: leadData.location || '',
        notes: leadData.notes || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        activities: [{
          type: 'note',
          description: 'Lead criado',
          timestamp: Timestamp.now()
        }]
      };

      await addDoc(collection(db, 'prospector_prospects'), newLead);
      loadLeads();
      setShowAddLead(false);
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  }

  const getLeadsByStage = (stage: string) => leads.filter(lead => lead.stage === stage);
  const selectedLeads = leads.filter(lead => lead.selected);
  const hotLeads = leads.filter(lead => lead.temperature === 'hot').length;
  const warmLeads = leads.filter(lead => lead.temperature === 'warm').length;

  const toggleSelectAll = () => {
    const allSelected = leads.every(l => l.selected);
    setLeads(leads.map(l => ({ ...l, selected: !allSelected })));
  };

  const toggleSelectLead = (leadId: string) => {
    setLeads(leads.map(lead => lead.id === leadId ? { ...lead, selected: !lead.selected } : lead));
  };

  const handleBulkAction = async (action: 'export' | 'delete' | 'move', targetStage?: string) => {
    if (selectedLeads.length === 0) return;

    if (action === 'export') {
      exportLeadsToCSV(selectedLeads);
    } else if (action === 'move' && targetStage) {
      for (const lead of selectedLeads) {
        await updateDoc(doc(db, 'prospector_prospects', lead.id), {
          stage: targetStage,
          updatedAt: Timestamp.now()
        });
      }
      loadLeads();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🎯 Pipeline de Prospecção</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-600">
              {leads.length} leads · {getLeadsByStage('won').length} convertidos
            </p>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">🔥 {hotLeads} quentes</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">☀️ {warmLeads} mornos</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddLead(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          + Novo Lead
        </button>
      </div>

      {/* Bulk Actions Toolbar */}
      {leads.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <button
            onClick={toggleSelectAll}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            {leads.every(l => l.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          {selectedLeads.length > 0 && (
            <>
              <span className="text-sm font-medium text-indigo-900">{selectedLeads.length} selecionados</span>
              <button
                onClick={() => handleBulkAction('export')}
                className="text-sm px-3 py-1.5 bg-white border border-indigo-300 rounded hover:bg-indigo-50"
              >
                📥 Exportar CSV
              </button>
              <select
                onChange={(e) => handleBulkAction('move', e.target.value)}
                className="text-sm px-3 py-1.5 bg-white border border-indigo-300 rounded"
                defaultValue=""
              >
                <option value="" disabled>Mover para...</option>
                {STAGES.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.title}</option>
                ))}
              </select>
              <button
                onClick={() => setLeads(leads.map(l => ({ ...l, selected: false })))}
                className="text-sm text-gray-600 hover:text-gray-800 ml-auto"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map(stage => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-lg border-2 p-3 min-h-[500px] transition-colors ${
                    snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : stage.color
                  }`}
                >
                  {/* Stage Header */}
                  <div className="mb-3 pb-2 border-b border-gray-300">
                    <h3 className="font-semibold text-sm text-gray-800">{stage.title}</h3>
                    <span className="text-xs text-gray-600">{getLeadsByStage(stage.id).length} leads</span>
                  </div>

                  {/* Lead Cards */}
                  <div className="space-y-2">
                    {getLeadsByStage(stage.id).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white p-3 rounded border shadow-sm hover:shadow-md transition-all ${
                              snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                            } ${lead.selected ? 'ring-2 ring-indigo-500' : ''}`}
                          >
                            {/* Header com checkbox e score */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1">
                                <input
                                  type="checkbox"
                                  checked={lead.selected || false}
                                  onChange={() => toggleSelectLead(lead.id)}
                                  className="mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div {...provided.dragHandleProps} className="flex-1 cursor-grab">
                                  <div className="font-medium text-sm text-gray-800">{lead.name}</div>
                                </div>
                              </div>
                              {/* Score Badge */}
                              {lead.temperature && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getTemperatureBadgeClass(lead.temperature)}`}>
                                  {getTemperatureEmoji(lead.temperature)}
                                  {lead.score || 0}
                                </span>
                              )}
                            </div>

                            {/* Contact Info */}
                            <div className="text-xs text-gray-600 space-y-0.5 mb-2">
                              {lead.phone && <div>📱 {lead.phone}</div>}
                              {lead.email && <div>✉️ {lead.email}</div>}
                              {lead.category && <div className="text-[10px] text-gray-500">🏷️ {lead.category}</div>}
                            </div>

                            {/* Follow-up Timeline */}
                            {lead.nextFollowUpAt && (
                              <div className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded mb-2">
                                📅 Próximo follow-up: {formatRelativeTime(lead.nextFollowUpAt)}
                              </div>
                            )}
                            {lead.lastEmailSentAt && !lead.nextFollowUpAt && (
                              <div className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded mb-2">
                                ✅ Email enviado {formatRelativeTime(lead.lastEmailSentAt)}
                              </div>
                            )}

                            {/* Last Activity */}
                            {lead.lastActivity && (
                              <div className="text-[10px] text-gray-400 mb-2">
                                Última atividade: {formatRelativeTime(lead.lastActivity)}
                              </div>
                            )}
                            
                            {/* Quick Actions */}
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(`tel:${lead.phone}`); }}
                                className="flex-1 text-xs py-1 px-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                title="Ligar"
                              >
                                📞
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); sendWhatsAppTemplate(lead); }}
                                className="flex-1 text-xs py-1 px-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                                title="WhatsApp com template"
                              >
                                💬
                              </button>
                              {lead.email && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.open(`mailto:${lead.email}`); }}
                                  className="flex-1 text-xs py-1 px-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  title="Email"
                                >
                                  ✉️
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Add Lead Modal */}
      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onAdd={addLead}
        />
      )}
    </div>
  );
}

// Helper: Format relative time
// Helper functions for temperature badges
function getTemperatureBadgeClass(temperature?: 'hot' | 'warm' | 'cold'): string {
  if (temperature === 'hot') return 'bg-red-100 text-red-700';
  if (temperature === 'warm') return 'bg-yellow-100 text-yellow-700';
  return 'bg-blue-100 text-blue-700';
}

function getTemperatureEmoji(temperature?: 'hot' | 'warm' | 'cold'): string {
  if (temperature === 'hot') return '🔥';
  if (temperature === 'warm') return '☀️';
  return '❄️';
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
  return `${Math.floor(seconds / 86400)}d atrás`;
}

// Helper: Calculate recency score
function calculateRecencyScore(lastActivity?: Date): number {
  if (!lastActivity) return 0;
  const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActivity < 1) return 30;
  if (daysSinceActivity < 3) return 20;
  if (daysSinceActivity < 7) return 10;
  if (daysSinceActivity > 14) return -20;
  return 0;
}

// Helper: Calculate stage score
function calculateStageScore(stage: string): number {
  if (stage === 'won') return 50; // Will be capped at 100
  if (stage === 'lost') return -50; // Will be capped at 0
  if (stage === 'negotiating') return 25;
  if (stage === 'contacted') return 15;
  return 0;
}

// Helper: Determine temperature from score
function getTemperatureFromScore(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

// Helper: Determine priority from score
function getPriorityFromScore(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// Helper: Calculate lead score automatically
function calculateLeadScore(lead: ProspectLead): Pick<ProspectLead, 'score' | 'temperature' | 'priority'> {
  let score = 50; // Base score

  // Add recency points
  score += calculateRecencyScore(lead.lastActivity);

  // Add email engagement points
  const emailScore = (lead.emailsOpened || 0) > 2 ? 25 : (lead.emailsOpened || 0) > 0 ? 15 : 0;
  score += emailScore;

  // Add stage progression points
  score += calculateStageScore(lead.stage);

  // Add activity count points
  const activityScore = lead.activities.length > 5 ? 15 : lead.activities.length > 3 ? 10 : 0;
  score += activityScore;

  // Cap score between 0-100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(finalScore),
    temperature: getTemperatureFromScore(finalScore),
    priority: getPriorityFromScore(finalScore)
  };
}

// Helper: Send WhatsApp with template
function sendWhatsAppTemplate(lead: ProspectLead) {
  const template = `Olá ${lead.name}! 👋

Sou prospector da Servio.AI, a plataforma que conecta profissionais qualificados a clientes.

${lead.category ? `Vi que você trabalha com ${lead.category}. ` : ''}Temos uma oportunidade perfeita para você aumentar sua renda! 💰

✅ Sem taxas de cadastro
✅ Pagamento garantido
✅ Flexibilidade total

Quer saber mais? 🚀`;

  const encodedMessage = encodeURIComponent(template);
  const phone = lead.phone.replaceAll(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
}

// Helper: Export leads to CSV
function exportLeadsToCSV(leads: ProspectLead[]) {
  const headers = ['Nome', 'Telefone', 'Email', 'Categoria', 'Estágio', 'Score', 'Temperatura', 'Última Atividade'];
  const rows = leads.map(lead => [
    lead.name,
    lead.phone,
    lead.email || '',
    lead.category || '',
    lead.stage,
    lead.score || 0,
    lead.temperature || '',
    lead.lastActivity ? lead.lastActivity.toLocaleString('pt-BR') : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Add Lead Modal Component
interface AddLeadModalProps {
  onClose: () => void;
  onAdd: (lead: Partial<ProspectLead>) => void;
}

function AddLeadModal({ onClose, onAdd }: Readonly<AddLeadModalProps>) {
  const [formData, setFormData] = useState<Partial<ProspectLead>>({
    source: 'direct'
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Nome e telefone são obrigatórios');
      return;
    }
    onAdd(formData);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Novo Lead</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="lead-name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              id="lead-name"
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lead-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
            <input
              id="lead-phone"
              type="tel"
              required
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lead-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="lead-email"
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lead-category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input
              id="lead-category"
              type="text"
              value={formData.category || ''}
              onChange={e => setFormData({...formData, category: e.target.value})}
              placeholder="Ex: Encanador, Eletricista..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lead-source" className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
            <select
              id="lead-source"
              value={formData.source}
              onChange={e => setFormData({...formData, source: e.target.value as any})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="referral">Indicação</option>
              <option value="direct">Contato Direto</option>
              <option value="event">Evento</option>
              <option value="social">Redes Sociais</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="lead-notes" className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              id="lead-notes"
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
