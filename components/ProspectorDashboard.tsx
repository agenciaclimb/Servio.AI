import React, { useEffect, useState, useCallback } from 'react';
import { fetchProspectorStats, fetchProspectorLeaderboard, ProspectorStats, LeaderboardEntry, computeBadgeProgress } from '../services/api';
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
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import BulkCampaignModal from '../src/components/prospector/BulkCampaignModal';

const loadingClass = 'animate-pulse bg-gray-200 rounded h-6 w-32';

type TabType = 'dashboard' | 'crm' | 'links' | 'templates' | 'notifications' | 'materials' | 'overview';

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <progress
      value={clampedValue}
      max={100}
      className="prospector-progress"
      aria-label={`Progresso do badge: ${clampedValue}%`}
    >
      {clampedValue}%
    </progress>
  );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => (
  <div className="p-4 bg-white rounded border shadow-sm flex flex-col gap-1">
    <div className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    {sub && <div className="text-xs text-gray-500">{sub}</div>}
  </div>
);

interface ProspectorDashboardProps {
  userId: string;
}

const ProspectorDashboard: React.FC<ProspectorDashboardProps> = ({ userId }) => {
  const prospectorId = userId;
  const [stats, setStats] = useState<ProspectorStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('crm'); // Padrão: CRM Kanban moderno
  const [referralLink, setReferralLink] = useState<string>('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  
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

  const loadDashboardData = useCallback(async () => {
    if (!prospectorId) return;
    setLoading(true);
    setError(null);
    try {
      const [s, lb] = await Promise.all([
        fetchProspectorStats(prospectorId),
        fetchProspectorLeaderboard('commissions', 10)
      ]);
      setStats(s);
      setLeaderboard(lb);
      
      // Contar leads
      const leadsSnapshot = await getDocs(
        query(collection(db, 'prospector_prospects'), where('prospectorId', '==', prospectorId))
      );
      setLeadsCount(leadsSnapshot.size);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao carregar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Optimistic badge if stats missing
  const badge = stats ? {
    currentBadge: stats.currentBadge,
    nextBadge: stats.nextBadge,
    progressToNextBadge: stats.progressToNextBadge,
    tiers: stats.badgeTiers
  } : computeBadgeProgress(0);

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
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded mb-4">{error}</div>}
        
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
            stats={stats}
            leadsCount={leadsCount}
          />
        )}

        {/* Tab Content: CRM Enhanced */}
        {activeTab === 'crm' && (
          <>
            {/* QuickAddPanel - Cadastro rápido de leads */}
            <QuickAddPanel 
              onLeadsAdded={(count) => {
                console.log(`✅ ${count} leads adicionados!`);
                loadDashboardData(); // Recarrega contadores
              }} 
            />
            
            {/* CRM Profissional Kanban */}
            <ProspectorCRMProfessional
              prospectorId={prospectorId}
            />
          </>
        )}

      {/* Tab Content: Overview Legado */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Recrutas Ativos" value={loading ? <div className={loadingClass} data-testid="loading-active"/> : stats?.activeRecruits || 0} />
        <StatCard label="Total Recrutas" value={loading ? <div className={loadingClass} data-testid="loading-total"/> : stats?.totalRecruits || 0} />
        <StatCard label="Comissões (R$)" value={loading ? <div className={loadingClass} data-testid="loading-commissions"/> : (stats?.totalCommissionsEarned?.toFixed(2) || '0.00')} />
        <StatCard label="Média Comissão" value={loading ? <div className={loadingClass} data-testid="loading-average"/> : (stats?.averageCommissionPerRecruit?.toFixed(2) || '0.00')} />
      </div>

      <div className="bg-white p-5 rounded border shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Badge Atual</div>
            <div className="text-xl font-semibold text-indigo-600">{badge.currentBadge}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Próximo Badge</div>
            <div className="text-xl font-semibold text-purple-600">{badge.nextBadge || 'Máximo alcançado'}</div>
          </div>
        </div>
        <ProgressBar value={badge.progressToNextBadge} />
        <div className="text-xs text-gray-500">Progresso: {badge.progressToNextBadge}%</div>
        <div className="flex gap-2 flex-wrap text-xs">
          {badge.tiers.map(t => (
            <span key={t.name} className={`px-2 py-1 rounded border ${badge.currentBadge === t.name ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{t.name} ≥ {t.min}</span>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded border shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Leaderboard (Top 10 por Comissões)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2">Rank</th>
              <th className="py-2">Nome</th>
              <th className="py-2">Recrutas</th>
              <th className="py-2">Comissões (R$)</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (loading) {
                return <tr><td colSpan={4} className="py-6 text-center text-gray-500">Carregando...</td></tr>;
              }
              if (leaderboard.length === 0) {
                return <tr><td colSpan={4} className="py-6 text-center text-gray-500">Sem dados ainda</td></tr>;
              }
              return leaderboard.map(row => (
                <tr key={row.prospectorId} className="border-b last:border-0">
                  <td className="py-2 font-medium">{row.rank}</td>
                  <td className="py-2">{row.name}</td>
                  <td className="py-2">{row.totalRecruits}</td>
                  <td className="py-2">{Number(row.totalCommissionsEarned).toFixed(2)}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-5 rounded border shadow-sm flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Dicas Rápidas</h2>
        <ul className="text-sm text-gray-600 list-disc pl-5 flex flex-col gap-1">
          <li>Convide prestadores em categorias com menor cobertura para ganhar posição no ranking mais rápido.</li>
          <li>Use seu link de convite personalizado em grupos locais de serviços.</li>
          <li>Mantenha contato com seus recrutados: atividade deles aumenta suas comissões.</li>
        </ul>
      </div>
        </>
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
                alert('Nome e telefone são obrigatórios!');
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
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
                toast.innerHTML = '<span class="text-xl">✅</span><span class="font-medium">Lead adicionado com sucesso!</span>';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
                
                // Reload dashboard data
                loadDashboardData();
                
                // Redirecionar para CRM
                setActiveTab('crm');
              } catch (error) {
                console.error('Erro ao salvar lead:', error);
                alert('❌ Erro ao salvar lead. Tente novamente.');
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
                  onChange={(e) => setNewLeadForm({...newLeadForm, source: e.target.value as any})}
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
        onSent={() => {
          // Recarrega métricas após envio
          loadDashboardData();
        }}
      />
    </div>
  );
};

export default ProspectorDashboard;