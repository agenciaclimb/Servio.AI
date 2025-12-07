import React, { useState, useEffect, useCallback } from 'react';
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

interface Lead {
  id: string;
  prospectorId: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  stage: 'novo' | 'contato' | 'proposta' | 'ganhado' | 'perdido';
  source?: string;
  value?: number;
  nextAction?: string;
  nextActionDate?: Date;
  activities?: Array<{ type: string; date: Date; note: string }>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PipelineColumn {
  id: string;
  title: string;
  stage: Lead['stage'];
  color: string;
  count: number;
}

export default function ProspectorCRMProfessional({ prospectorId }: { prospectorId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('');

  const columns: PipelineColumn[] = [
    { id: 'novo', title: 'Novo', stage: 'novo', color: 'bg-blue-500', count: 0 },
    { id: 'contato', title: '1º Contato', stage: 'contato', color: 'bg-yellow-500', count: 0 },
    { id: 'proposta', title: 'Proposta', stage: 'proposta', color: 'bg-purple-500', count: 0 },
    { id: 'ganhado', title: 'Ganhado', stage: 'ganhado', color: 'bg-green-500', count: 0 },
  ];

  const loadLeads = useCallback(async () => {
    try {
      const leadsSnapshot = await getDocs(
        query(collection(db, 'prospector_prospects'), where('prospectorId', '==', prospectorId))
      );
      const leadsData = leadsSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.(),
            updatedAt: doc.data().updatedAt?.toDate?.(),
            nextActionDate: doc.data().nextActionDate?.toDate?.(),
          }) as Lead
      );
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadLeads();
    // Refresh a cada 10s
    const interval = setInterval(loadLeads, 10000);
    return () => clearInterval(interval);
  }, [loadLeads]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      !searchTerm ||
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = !filterSource || lead.source === filterSource;

    return matchesSearch && matchesSource;
  });

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (stage: Lead['stage']) => {
    if (!draggedLead) return;

    try {
      const leadRef = doc(db, 'prospector_prospects', draggedLead.id);
      await updateDoc(leadRef, {
        stage,
        updatedAt: Timestamp.now(),
      });

      // Log activity
      await addDoc(collection(db, 'prospector_prospects', draggedLead.id, 'activities'), {
        type: 'status_change',
        fromStage: draggedLead.stage,
        toStage: stage,
        timestamp: Timestamp.now(),
      });

      setDraggedLead(null);
      loadLeads();
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    }
  };

  const handleAddNote = async (note: string) => {
    if (!selectedLead) return;

    try {
      await addDoc(collection(db, 'prospector_prospects', selectedLead.id, 'activities'), {
        type: 'note',
        note,
        timestamp: Timestamp.now(),
      });

      loadLeads();
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: Lead['stage']) => {
    try {
      const leadRef = doc(db, 'prospector_prospects', leadId);
      await updateDoc(leadRef, { stage: newStage, updatedAt: Timestamp.now() });
      loadLeads();
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    }
  };

  // Contar por stage
  columns.forEach(col => {
    col.count = filteredLeads.filter(l => l.stage === col.stage).length;
  });

  // Calcular métricas
  const totalValue = filteredLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const conversionRate =
    leads.length > 0
      ? ((leads.filter(l => l.stage === 'ganhado').length / leads.length) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">🎯 Pipeline CRM</h1>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-gray-300 text-sm">Total de Leads</div>
            <div className="text-3xl font-bold text-white">{leads.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-gray-300 text-sm">Valor em Pipeline</div>
            <div className="text-3xl font-bold text-green-400">
              R$ {totalValue.toLocaleString('pt-BR')}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-gray-300 text-sm">Taxa de Conversão</div>
            <div className="text-3xl font-bold text-blue-400">{conversionRate}%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-gray-300 text-sm">Ganhados (Mês)</div>
            <div className="text-3xl font-bold text-yellow-400">
              {leads.filter(l => l.stage === 'ganhado').length}
            </div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">📊 Todas as fontes</option>
            <option value="bulk_import">Importação em massa</option>
            <option value="manual">Manual</option>
            <option value="campaign">Campanha</option>
            <option value="website">Website</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-5 gap-4">
          {columns.map(column => {
            const columnLeads = filteredLeads.filter(l => l.stage === column.stage);

            return (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.stage)}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 min-h-screen border border-white/10"
              >
                {/* Column Header */}
                <div
                  className={`${column.color} text-white rounded-lg p-3 mb-4 font-semibold flex items-center justify-between`}
                >
                  <span>{column.title}</span>
                  <span className="bg-white/30 px-2 py-1 rounded text-sm">{column.count}</span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {columnLeads.length === 0 ? (
                    <div className="text-gray-400 text-center py-8 text-sm">Nenhum lead</div>
                  ) : (
                    columnLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailModal(true);
                        }}
                        className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all cursor-grab active:cursor-grabbing hover:scale-105"
                      >
                        <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                        <p className="text-sm text-gray-600 truncate">📱 {lead.phone}</p>
                        {lead.email && (
                          <p className="text-xs text-gray-500 truncate">✉️ {lead.email}</p>
                        )}
                        {lead.category && (
                          <p className="text-xs text-blue-600 mt-2 font-medium">{lead.category}</p>
                        )}
                        {lead.value && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm font-bold text-green-600">
                              R$ {lead.value.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                        {lead.nextAction && (
                          <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 p-1 rounded">
                            ⏰ {lead.nextAction}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          {lead.createdAt && new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Column: Perdido */}
          <div
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('perdido')}
            className="bg-red-900/20 backdrop-blur-sm rounded-lg p-4 min-h-screen border border-red-400/30"
          >
            <div className="bg-red-500 text-white rounded-lg p-3 mb-4 font-semibold flex items-center justify-between">
              <span>Perdido</span>
              <span className="bg-white/30 px-2 py-1 rounded text-sm">
                {filteredLeads.filter(l => l.stage === 'perdido').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredLeads
                .filter(l => l.stage === 'perdido')
                .map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all cursor-grab opacity-70"
                  >
                    <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                    <p className="text-sm text-gray-600 truncate">📱 {lead.phone}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 sticky top-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedLead.name}</h2>
                  <p className="text-indigo-200">📱 {selectedLead.phone}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-2xl hover:bg-white/20 rounded p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedLead.email || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Categoria</label>
                  <p className="text-gray-900">{selectedLead.category || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Estágio</label>
                  <select
                    value={selectedLead.stage}
                    onChange={e =>
                      updateLeadStage(selectedLead.id, e.target.value as Lead['stage'])
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-gray-900"
                  >
                    <option value="novo">Novo</option>
                    <option value="contato">1º Contato</option>
                    <option value="proposta">Proposta</option>
                    <option value="ganhado">Ganhado</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Valor Esperado</label>
                  <p className="text-green-600 font-semibold">
                    R$ {selectedLead.value?.toLocaleString('pt-BR') || '—'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Adicionar Anotação
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="note-input"
                    placeholder="Escreva uma anotação..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('note-input') as HTMLInputElement;
                      if (input.value.trim()) {
                        handleAddNote(input.value);
                        input.value = '';
                      }
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📋 Atividades Recentes</h3>
                <div className="space-y-2 text-sm text-gray-600 max-h-40 overflow-y-auto">
                  {selectedLead.activities && selectedLead.activities.length > 0 ? (
                    selectedLead.activities.map((activity, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span>•</span>
                        <span>{activity.note || `Status alterado para ${activity.type}`}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">Nenhuma atividade registrada</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
