import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import LeadScoreCard from './LeadScoreCard';

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
  score?: number; // Pontuação do lead
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
  const [filterSource, setFilterSource] = useState('');

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
      const leadsData = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Mock score for demonstration
        score: Math.floor(Math.random() * 100) + 1,
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
        nextActionDate: doc.data().nextActionDate?.toDate?.(),
      } as Lead));
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, [loadLeads]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = !filterSource || lead.source === filterSource;
    
    return matchesSearch && matchesSource;
  });

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

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

  columns.forEach(col => {
    col.count = filteredLeads.filter(l => l.stage === col.stage).length;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">🎯 Pipeline CRM</h1>
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
                <div className={`${column.color} text-white rounded-lg p-3 mb-4 font-semibold flex items-center justify-between`}>
                  <span>{column.title}</span>
                  <span className="bg-white/30 px-2 py-1 rounded text-sm">{column.count}</span>
                </div>
                <div className="space-y-3">
                  {columnLeads.length === 0 ? (
                    <div className="text-gray-400 text-center py-8 text-sm">Nenhum lead</div>
                  ) : (
                    columnLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all cursor-grab active:cursor-grabbing hover:scale-105"
                      >
                        <div onClick={() => handleLeadClick(lead)}>
                            <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                            <p className="text-sm text-gray-600 truncate">📱 {lead.phone}</p>
                            {lead.email && <p className="text-xs text-gray-500 truncate">✉️ {lead.email}</p>}
                            {lead.category && <p className="text-xs text-blue-600 mt-2 font-medium">{lead.category}</p>}
                        </div>
                        {lead.score && (
                          <div className="mt-4">
                            <LeadScoreCard score={lead.score} onDetailsClick={() => handleLeadClick(lead)} />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          <div
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('perdido')}
            className="bg-red-900/20 backdrop-blur-sm rounded-lg p-4 min-h-screen border border-red-400/30"
          >
            <div className="bg-red-500 text-white rounded-lg p-3 mb-4 font-semibold flex items-center justify-between">
              <span>Perdido</span>
              <span className="bg-white/30 px-2 py-1 rounded text-sm">{filteredLeads.filter(l => l.stage === 'perdido').length}</span>
            </div>
             <div className="space-y-3">
              {filteredLeads.filter(l => l.stage === 'perdido').map(lead => (
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

      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        </div>
      )}
    </div>
  );
}
