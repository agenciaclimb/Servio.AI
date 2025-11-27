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

import { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import type { LeadStage, LeadTemperature, LeadPriority, LeadSource, ActivityType } from '../../types';

export interface Activity {
  type: ActivityType;
  description: string;
  timestamp: Date;
}

export interface ProspectLead {
  id: string;
  prospectorId: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  stage: LeadStage;
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
  temperature?: LeadTemperature;
  priority?: LeadPriority;
  // Selection for bulk actions
  selected?: boolean;
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
  const [editingLead, setEditingLead] = useState<ProspectLead | null>(null);
  const [aiAssistLead, setAiAssistLead] = useState<ProspectLead | null>(null);

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
          prospectorId,
          name: data.name || '',
          phone: data.phone || '',
          email: data.email,
          source: data.source || 'manual',
          stage: data.stage || 'new',
          category: data.category,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastContact: data.lastContact?.toDate(),
          lastActivity: data.lastActivity?.toDate(),
          lastEmailSentAt: data.lastEmailSentAt?.toDate(),
          nextFollowUpAt: data.nextFollowUpAt?.toDate(),
          emailsOpened: data.emailsOpened || 0,
          score: data.score || 50,
          temperature: data.temperature || 'cold',
          priority: data.priority || 'low',
          activities: (data.activities || []).map((a: { type: string; description: string; timestamp?: { toDate(): Date } }) => ({
            ...a,
            timestamp: a.timestamp?.toDate() || new Date()
          })),
          selected: false
        } as ProspectLead;
      });
      setLeads(loadedLeads);
    } catch (error) {
      console.error('[ProspectorCRM] Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  async function createSampleLead() {
    const now = new Date();
    const sampleLead = {
      prospectorId,
      name: 'João Silva (Exemplo)',
      phone: '(11) 98765-4321',
      email: 'joao.silva@email.com',
      source: 'referral' as const,
      stage: 'new' as const,
      category: 'Eletricista',
      location: 'São Paulo, SP',
      notes: 'Lead de exemplo - recomendado por cliente satisfeito. Interessado em trabalhos residenciais.',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      activities: [
        {
          type: 'note' as const,
          description: 'Lead criado como exemplo - você pode editá-lo ou excluí-lo',
          timestamp: Timestamp.fromDate(now)
        }
      ]
    };

    try {
      await addDoc(collection(db, 'prospector_prospects'), sampleLead);
      await loadLeads();
    } catch (error) {
      console.error('[ProspectorCRM] Error creating sample lead:', error);
    }
  }

  async function moveLeadToStage(leadId: string, newStage: ProspectLead['stage']) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    // Optimistic update
    setLeads(prev => prev.map(l => 
      l.id === leadId 
        ? { 
            ...l, 
            stage: newStage,
            lastActivity: new Date(),
            activities: [
              ...l.activities,
              {
                type: 'stage_change',
                description: `Movido para ${STAGES.find(s => s.id === newStage)?.title}`,
                timestamp: new Date()
              }
            ]
          }
        : l
    ));

    // Update Firestore
    try {
      const updatedActivities = [
        ...lead.activities,
        {
          type: 'stage_change' as const,
          description: `Movido para ${STAGES.find(s => s.id === newStage)?.title}`,
          timestamp: Timestamp.now()
        }
      ];

      await updateDoc(doc(db, 'prospector_prospects', leadId), {
        stage: newStage,
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now(),
        activities: updatedActivities
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

  async function updateLead(leadId: string, updates: Partial<ProspectLead>) {
    try {
      await updateDoc(doc(db, 'prospector_prospects', leadId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
      loadLeads();
      setEditingLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  }

  async function addActivity(leadId: string, activity: Activity) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    try {
      const updatedActivities = [...lead.activities, activity];
      await updateDoc(doc(db, 'prospector_prospects', leadId), {
        activities: updatedActivities,
        lastActivity: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      loadLeads();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }

  function handleCallClick(lead: ProspectLead) {
    window.open(`tel:${lead.phone}`);
    addActivity(lead.id, {
      type: 'call',
      description: 'Chamada telefônica realizada',
      timestamp: new Date()
    });
  }

  function handleEmailClick(lead: ProspectLead) {
    if (!lead.email) return;
    const subject = encodeURIComponent(`Oportunidade Servio.AI - ${lead.category || 'Parceria'}`);
    const body = encodeURIComponent(generateEmailTemplate(lead));
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
    addActivity(lead.id, {
      type: 'email',
      description: 'Email enviado',
      timestamp: new Date()
    });
  }

  function handleWhatsAppClick(lead: ProspectLead) {
    const message = generateWhatsAppTemplate(lead);
    const encodedMessage = encodeURIComponent(message);
    const phone = lead.phone.replaceAll(/\D/g, '');
    globalThis.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
    addActivity(lead.id, {
      type: 'message',
      description: 'Mensagem WhatsApp enviada',
      timestamp: new Date()
    });
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

  // Empty State: Tutorial for first-time users
  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">🎯 Pipeline de Prospecção</h2>
          <button
            onClick={() => setShowAddLead(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Novo Lead
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo ao seu Pipeline CRM! 🚀</h3>
            <p className="text-gray-600 mb-6">
              Organize seus prospects em estágios e acompanhe cada conversão. Comece adicionando seu primeiro lead.
            </p>

            {/* Tutorial Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl mb-2">🆕</div>
                <h4 className="font-semibold text-sm mb-1">1. Adicionar Lead</h4>
                <p className="text-xs text-gray-600">Clique em "+ Novo Lead" e cadastre nome, telefone e categoria</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl mb-2">📞</div>
                <h4 className="font-semibold text-sm mb-1">2. Fazer Contato</h4>
                <p className="text-xs text-gray-600">Arraste o card para "Contatados" após ligar ou enviar mensagem</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl mb-2">🤝</div>
                <h4 className="font-semibold text-sm mb-1">3. Negociar</h4>
                <p className="text-xs text-gray-600">Acompanhe a negociação e registre atividades</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl mb-2">✅</div>
                <h4 className="font-semibold text-sm mb-1">4. Converter</h4>
                <p className="text-xs text-gray-600">Mova para "Convertidos" quando virar cliente</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowAddLead(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md"
              >
                🎯 Adicionar Primeiro Lead
              </button>
              <button
                onClick={createSampleLead}
                className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              >
                👀 Ver Exemplo
              </button>
            </div>
          </div>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAGES.map(stage => (
          <div
            key={stage.id}
            className={`rounded-lg border-2 p-3 min-h-[500px] ${stage.color}`}
          >
            {/* Stage Header */}
            <div className="mb-3 pb-2 border-b border-gray-300">
              <h3 className="font-semibold text-sm text-gray-800">{stage.title}</h3>
              <span className="text-xs text-gray-600">{getLeadsByStage(stage.id).length} leads</span>
            </div>

            {/* Lead Cards */}
            <div className="space-y-2">
              {getLeadsByStage(stage.id).map((lead) => (
                <div
                  key={lead.id}
                  className={`bg-white p-3 rounded border shadow-sm hover:shadow-md transition-all ${
                    lead.selected ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {/* Header com checkbox e score */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={lead.selected || false}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
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
                  
                  {/* Move Stage Buttons */}
                  {stage.id !== lead.stage && (
                    <div className="mb-2">
                      <select
                        value={lead.stage}
                        onChange={(e) => moveLeadToStage(lead.id, e.target.value as ProspectLead['stage'])}
                        className="w-full text-xs px-2 py-1 border rounded bg-gray-50 hover:bg-gray-100"
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    <button
                      onClick={() => handleCallClick(lead)}
                      className="text-xs py-1.5 px-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title="Ligar"
                    >
                      📞
                    </button>
                    <button
                      onClick={() => handleWhatsAppClick(lead)}
                      className="text-xs py-1.5 px-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                      title="WhatsApp"
                    >
                      💬
                    </button>
                    {lead.email && (
                      <button
                        onClick={() => handleEmailClick(lead)}
                        className="text-xs py-1.5 px-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="Email"
                      >
                        ✉️
                      </button>
                    )}
                    <button
                      onClick={() => setAiAssistLead(lead)}
                      className="text-xs py-1.5 px-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      title="Assistente IA"
                    >
                      🤖
                    </button>
                  </div>
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingLead(lead)}
                    className="w-full text-xs py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    ✏️ Editar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Lead Modal */}
      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onAdd={addLead}
        />
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={(updates) => updateLead(editingLead.id, updates)}
        />
      )}

      {/* AI Assistant Modal */}
      {aiAssistLead && (
        <AIAssistantModal
          lead={aiAssistLead}
          onClose={() => setAiAssistLead(null)}
          onAddActivity={(activity) => addActivity(aiAssistLead.id, activity)}
        />
      )}
    </div>
  );
}

// Helper: Format relative time
// Helper functions for temperature badges
function getTemperatureBadgeClass(temperature?: LeadTemperature): string {
  if (temperature === 'hot') return 'bg-red-100 text-red-700';
  if (temperature === 'warm') return 'bg-yellow-100 text-yellow-700';
  return 'bg-blue-100 text-blue-700';
}

function getTemperatureEmoji(temperature?: LeadTemperature): string {
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

// Helper: Generate WhatsApp template
function generateWhatsAppTemplate(lead: ProspectLead): string {
  return `Olá ${lead.name}! 👋

Sou prospector da Servio.AI, a plataforma que conecta profissionais qualificados a clientes.

${lead.category ? `Vi que você trabalha com ${lead.category}. ` : ''}Temos uma oportunidade perfeita para você aumentar sua renda! 💰

✅ Sem taxas de cadastro
✅ Pagamento garantido
✅ Flexibilidade total
✅ Suporte dedicado

Quer saber mais sobre como funciona? 🚀`;
}

// Helper: Generate Email template
function generateEmailTemplate(lead: ProspectLead): string {
  return `Olá ${lead.name},

Meu nome é [SEU NOME] e sou prospector da Servio.AI - a plataforma que está revolucionando a forma como profissionais ${lead.category ? `de ${lead.category}` : 'autônomos'} encontram clientes.

${lead.category ? `Percebi sua expertise em ${lead.category} e ` : ''}Gostaria de apresentar uma oportunidade exclusiva:

• Clientes pré-qualificados
• Pagamento garantido pela plataforma
• Sem mensalidades ou taxas ocultas
• Você define sua agenda e valores

Tenho alguns projetos disponíveis na sua região que podem ser interessantes.

Podemos agendar uma conversa de 15 minutos para eu explicar melhor?

Atenciosamente,
Equipe Servio.AI`;
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-lead-title"
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 id="add-lead-title" className="text-xl font-bold text-gray-800 mb-4">Novo Lead</h3>
        
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
              onChange={e => setFormData({...formData, source: e.target.value as 'referral' | 'direct' | 'event' | 'social' | 'other'})}
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

// Edit Lead Modal
interface EditLeadModalProps {
  lead: ProspectLead;
  onClose: () => void;
  onSave: (updates: Partial<ProspectLead>) => void;
}

function EditLeadModal({ lead, onClose, onSave }: Readonly<EditLeadModalProps>) {
  const [formData, setFormData] = useState<Partial<ProspectLead>>({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    category: lead.category,
    location: lead.location,
    notes: lead.notes,
    source: lead.source
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">✏️ Editar Lead</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
            <input
              type="tel"
              required
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input
              type="text"
              value={formData.category || ''}
              onChange={e => setFormData({...formData, category: e.target.value})}
              placeholder="Ex: Encanador, Eletricista..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="Cidade, Estado"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
            <select
              value={formData.source}
              onChange={e => setFormData({...formData, source: e.target.value as 'referral' | 'direct' | 'event' | 'social' | 'other'})}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">📝 Últimas Atividades</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {lead.activities.slice(-5).reverse().map((activity, idx) => (
                <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span>{getActivityEmoji(activity.type)}</span>
                    <span className="font-medium">{activity.description}</span>
                  </div>
                  <div className="text-gray-500 text-[10px] mt-0.5">
                    {new Date(activity.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// AI Assistant Modal
interface AIAssistantModalProps {
  lead: ProspectLead;
  onClose: () => void;
  onAddActivity: (activity: Activity) => void;
}

function AIAssistantModal({ lead, onClose, onAddActivity }: Readonly<AIAssistantModalProps>) {
  const [suggestions] = useState<string[]>(() => {
    const stageSuggestions: Record<string, string[]> = {
      new: [
        `Envie mensagem de boas-vindas via WhatsApp`,
        `Pergunte sobre disponibilidade para conversa`,
        `Compartilhe cases de sucesso da plataforma`
      ],
      contacted: [
        `Agende follow-up para daqui a 2 dias`,
        `Envie materiais sobre pagamento e garantias`,
        `Pergunte sobre objeções ou dúvidas`
      ],
      negotiating: [
        `Ofereça tour guiado pela plataforma`,
        `Apresente depoimentos de profissionais`,
        `Discuta primeiros serviços disponíveis`
      ],
      won: [
        `Envie mensagem de boas-vindas oficial`,
        `Agende treinamento de onboarding`,
        `Solicite documentos para cadastro`
      ],
      lost: [
        `Pergunte motivo da desistência`,
        `Agende follow-up para 1 mês`,
        `Mantenha contato com conteúdo relevante`
      ]
    };
    return stageSuggestions[lead.stage] || stageSuggestions.new;
  });
  
  const [script] = useState<string>(() => generateConversationScript(lead));

  function copyScript() {
    navigator.clipboard.writeText(script);
    alert('✅ Script copiado!');
  }

  function applySuggestion(suggestion: string) {
    onAddActivity({
      type: 'note',
      description: `IA sugeriu: ${suggestion}`,
      timestamp: new Date()
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">🤖 Assistente IA - {lead.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-6">
          {/* Lead Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-sm text-gray-800 mb-2">📊 Análise do Lead</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Estágio:</span>
                <span className="ml-2 font-medium">{getStageLabel(lead.stage)}</span>
              </div>
              <div>
                <span className="text-gray-600">Score:</span>
                <span className="ml-2 font-medium">{lead.score || 50}/100</span>
              </div>
              <div>
                <span className="text-gray-600">Temperatura:</span>
                <span className="ml-2 font-medium">{getTemperatureLabel(lead.temperature)}</span>
              </div>
              <div>
                <span className="text-gray-600">Atividades:</span>
                <span className="ml-2 font-medium">{lead.activities.length}</span>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">💡 Próximas Ações Recomendadas</h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex-1 text-sm text-gray-700">{suggestion}</div>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                  >
                    Aplicar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Script */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">📝 Script de Abordagem</h4>
              <button
                onClick={copyScript}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                📋 Copiar
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-line max-h-64 overflow-y-auto">
              {script}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">⚡ Enviar Agora</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  globalThis.open(`https://wa.me/55${lead.phone.replaceAll(/\D/g, '')}?text=${encodeURIComponent(script)}`, '_blank');
                  onAddActivity({ type: 'message', description: 'Script IA enviado via WhatsApp', timestamp: new Date() });
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => {
                  if (lead.email) {
                    window.open(`mailto:${lead.email}?subject=Oportunidade Servio.AI&body=${encodeURIComponent(script)}`);
                    onAddActivity({ type: 'email', description: 'Script IA enviado via email', timestamp: new Date() });
                    onClose();
                  } else {
                    alert('Lead sem email cadastrado');
                  }
                }}
                disabled={!lead.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                ✉️ Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getActivityEmoji(type: Activity['type']): string {
  const emojis: Record<Activity['type'], string> = {
    call: '📞',
    message: '💬',
    email: '✉️',
    note: '📝',
    stage_change: '🔄'
  };
  return emojis[type] || '•';
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    new: '🆕 Novo',
    contacted: '📞 Contatado',
    negotiating: '🤝 Negociando',
    won: '✅ Convertido',
    lost: '❌ Perdido'
  };
  return labels[stage] || stage;
}

function getTemperatureLabel(temp?: string): string {
  if (temp === 'hot') return '🔥 Quente';
  if (temp === 'warm') return '☀️ Morno';
  return '❄️ Frio';
}

function generateConversationScript(lead: ProspectLead): string {
  const category = lead.category || 'sua área';
  const name = lead.name.split(' ')[0];

  const scripts: Record<string, string> = {
    new: `Olá ${name}! 👋

Descobri seu perfil profissional de ${category}.

Trabalho com a Servio.AI - plataforma que conecta profissionais como você a clientes que precisam dos seus serviços.

Principais benefícios:
• Clientes pré-qualificados
• Pagamento garantido
• Sem mensalidades
• Você define agenda e valores

Podemos conversar 5 minutos?`,

    contacted: `Oi ${name}!

Conseguiu ver a proposta da Servio.AI?

Recapitulando os benefícios:
• Clientes esperando por ${category}
• Pagamento 100% garantido
• Você define preços e agenda
• Zero taxas mensais

Alguma dúvida que posso esclarecer?`,

    negotiating: `${name}, ótimo ter você interessado! 🎉

Próximos passos:
1. Contrato da plataforma
2. Jobs disponíveis na sua região
3. Depoimentos de outros profissionais

Depois do cadastro, já conecto você com 2-3 clientes.

Pronto para começar?`,

    won: `Parabéns ${name}! Bem-vindo! 🚀

Cadastro aprovado!

Próximos passos:
1. Complete perfil com fotos
2. Defina categorias principais
3. Configure raio de atendimento

Já tenho jobs na fila. Quer que eu libere?`,

    lost: `${name}, entendo sua decisão.

Pode me contar o principal motivo? Isso me ajuda a melhorar.

Se mudar de ideia ou conhecer alguém interessado, me chame!

Sucesso! 💪`
  };

  return scripts[lead.stage] || scripts.new;
}
