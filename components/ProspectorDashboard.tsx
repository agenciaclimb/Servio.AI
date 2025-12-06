import React, { useState } from 'react';
import ReferralLinkGenerator from '../src/components/ReferralLinkGenerator';
import NotificationSettings from '../src/components/NotificationSettings';
import ProspectorMaterials from '../src/components/ProspectorMaterials';
// Novos componentes IA
import QuickPanel from '../src/components/prospector/QuickPanel';
import QuickActionsBar from '../src/components/prospector/QuickActionsBar';
import QuickAddPanel from '../src/components/prospector/QuickAddPanel';
import ProspectorCRMProfessional from '../src/components/prospector/ProspectorCRMProfessional';
import OnboardingTour from '../src/components/prospector/OnboardingTour';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import BulkCampaignModal from '../src/components/prospector/BulkCampaignModal';
import { useToast } from '../contexts/ToastContext';
import ProspectorStatistics from './ProspectorStatistics';

type TabType = 'dashboard' | 'crm' | 'links' | 'templates' | 'notifications' | 'materials' | 'overview';

interface ProspectorDashboardProps {
  userId: string;
}

const ProspectorDashboard: React.FC<ProspectorDashboardProps> = ({ userId }) => {
  const prospectorId = userId;
  const [activeTab, setActiveTab] = useState<TabType>('crm'); // Padrão: CRM Kanban moderno
  const [referralLink, setReferralLink] = useState<string>('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const { addToast } = useToast();
  
  // Estados do formulário de novo lead
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: '',
    source: 'direct' as 'direct' | 'referral' | 'event' | 'social' | 'other',
    notes: ''
  });
  const [isSavingLead, setIsSavingLead] = useState(false);

  const handleLeadsAdded = () => {
    // Apenas um placeholder, a lógica agora está no QuickAddPanel
    // e o estado global via SWR/Zustand (Sprint 4) cuidará da atualização
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Tour */}
      <OnboardingTour prospectorId={prospectorId} prospectorName={'Prospector'} />

      {/* Quick Actions Bar */}
      <QuickActionsBar
        prospectorId={prospectorId}
        prospectorName={'Prospector'}
        referralLink={referralLink || `${globalThis.location?.origin || ''}/cadastro?ref=${prospectorId}`}
        unreadNotifications={0} // Feature planned for Sprint 2: real-time notifications integration
        onAddLead={() => setShowAddLeadModal(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenCampaign={() => setShowCampaignModal(true)}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Tabs Navigation Simplificada */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ⚡ Dashboard IA
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'crm'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-tour="crm-board"
            >
              🎯 Pipeline CRM
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'links'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-tour="referral-link"
            >
              🔗 Links
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'materials'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-tour="materials"
            >
              📚 Materiais
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📊 Estatísticas
            </button>
          </div>
        </div>
        {/* Tab Content: Dashboard IA (Novo Padrão) */}
        {activeTab === 'dashboard' && (
          <QuickPanel
            prospectorId={prospectorId}
          />
        )}

        {/* Tab Content: CRM Enhanced */}
        {activeTab === 'crm' && (
          <>
            {/* QuickAddPanel - Cadastro rápido de leads */}
            <QuickAddPanel 
              onLeadsAdded={handleLeadsAdded} 
            />
            
            {/* CRM Profissional Kanban */}
            <ProspectorCRMProfessional
              prospectorId={prospectorId}
            />
          </>
        )}

      {/* Tab Content: Overview/Statistics */}
      {activeTab === 'overview' && (
        <ProspectorStatistics prospectorId={prospectorId} />
      )}

      {/* Tab Content: Referral Links */}
      {activeTab === 'links' && (
        <ReferralLinkGenerator 
          prospectorId={prospectorId} 
          onLinkGenerated={setReferralLink}
        />
      )}

      {/* Tab Content: Marketing Materials */}
      {activeTab === 'materials' && (
        <ProspectorMaterials />
      )}
      </div>

      {/* Modals */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddLeadModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">➕ Adicionar Novo Lead</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newLeadForm.name || !newLeadForm.phone) {
                addToast('Nome e telefone são obrigatórios!', 'error');
                return;
              }
              
              setIsSavingLead(true);
              try {
                const leadData = {
                  prospectorId,
                  name: newLeadForm.name,
                  phone: newLeadForm.phone,
                  email: newLeadForm.email || null,
                  category: newLeadForm.category || null,
                  source: newLeadForm.source,
                  stage: 'new',
                  notes: newLeadForm.notes || null,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                  activities: []
                };
                
                await addDoc(collection(db, 'prospector_prospects'), leadData);
                
                // Limpar formulário
                setNewLeadForm({
                  name: '',
                  phone: '',
                  email: '',
                  category: '',
                  source: 'direct',
                  notes: ''
                });
                
                setShowAddLeadModal(false);
                
                // Toast de sucesso
                addToast('🎉 Lead adicionado com sucesso!', 'success');
                
                // Redirecionar para CRM
                setActiveTab('crm');
              } catch (error) {
                console.error('Erro ao salvar lead:', error);
                addToast('❌ Erro ao salvar lead. Tente novamente.', 'error');
              } finally {
                setIsSavingLead(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({...newLeadForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="João Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newLeadForm.phone}
                  onChange={(e) => {
                    // Máscara automática de telefone brasileiro
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                      if (value.length <= 2) {
                        value = value.replace(/^(\d{0,2})/, '($1');
                      } else if (value.length <= 6) {
                        value = value.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
                      } else if (value.length <= 10) {
                        value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                      } else {
                        value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                      }
                    }
                    setNewLeadForm({...newLeadForm, phone: value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({...newLeadForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="joao@exemplo.com"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Leads com email têm 2x mais chance de conversão</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  list="categories"
                  value={newLeadForm.category}
                  onChange={(e) => setNewLeadForm({...newLeadForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Eletricista, Encanador..."
                />
                <datalist id="categories">
                  <option value="Eletricista" />
                  <option value="Encanador" />
                  <option value="Pedreiro" />
                  <option value="Pintor" />
                  <option value="Marceneiro" />
                  <option value="Jardineiro" />
                  <option value="Faxineiro" />
                  <option value="Montador de Móveis" />
                  <option value="Chaveiro" />
                  <option value="Vidraceiro" />
                </datalist>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fonte
                </label>
                <select
                  value={newLeadForm.source}
                  onChange={(e) => setNewLeadForm({...newLeadForm, source: e.target.value as 'direct' | 'referral' | 'event'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="direct">Direto</option>
                  <option value="referral">Indicação</option>
                  <option value="event">Evento</option>
                  <option value="social">Redes Sociais</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({...newLeadForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Anotações sobre o lead..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingLead}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingLead ? 'Salvando...' : 'Salvar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">🔔 Notificações</h3>
              <button onClick={() => setShowNotificationsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>
            <div className="p-6">
              <NotificationSettings prospectorId={prospectorId} />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Envio de Campanha */}
      <BulkCampaignModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        onSent={handleLeadsAdded}
      />
    </div>
  );
};

export default ProspectorDashboard;
