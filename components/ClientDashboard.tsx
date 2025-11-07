import React, { useState, useEffect } from 'react';
import { Job, User, Proposal, Message, Dispute, MaintainedItem, JobData, Escrow, Notification, ScheduledDateTime, DisputeMessage, Bid } from '../types';
import { enhanceJobRequest } from '../services/geminiService';
import ClientJobCard from './ClientJobCard';
import ProposalListModal from './ProposalListModal';
import PaymentModal from './PaymentModal';
import ReviewModal from './ReviewModal';
import DisputeModal from './DisputeModal';
import AddItemModal from './AddItemModal';
import ItemCard from './ItemCard';
import ItemDetailModal from './ItemDetailModal';
import JobLocationModal from './JobLocationModal';
import ChatModal from './ChatModal';
import AuctionRoomModal from './AuctionRoomModal';
import MaintenanceSuggestions from './MaintenanceSuggestions';

interface ClientDashboardProps {
  user: User;
  allJobs: Job[];
  allUsers: User[];
  allProposals: Proposal[];
  allMessages: Message[];
  allDisputes: Dispute[];
  allBids: Bid[];
  maintainedItems: MaintainedItem[];
  setAllJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  setAllProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  setAllMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setAllNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onViewProfile: (userId: string) => void;
  setAllEscrows: React.Dispatch<React.SetStateAction<Escrow[]>>;
  setAllDisputes: React.Dispatch<React.SetStateAction<Dispute[]>>;
  setMaintainedItems: React.Dispatch<React.SetStateAction<MaintainedItem[]>>;
  onNewJobFromItem: (prompt: string) => void;
  onUpdateUser: (userEmail: string, partial: Partial<User>) => void; // novo para edição de perfil do cliente
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user, allJobs, allUsers, allProposals, allMessages, maintainedItems, allDisputes, allBids,
  setAllJobs, setAllProposals, setAllMessages, setAllNotifications, setAllEscrows, setAllDisputes, setMaintainedItems,
  onViewProfile, onNewJobFromItem, onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'items'>('jobs');
  // Onboarding & perfil
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingProposalsForJob, setViewingProposalsForJob] = useState<Job | null>(null);
  const [viewingAuctionForJob, setViewingAuctionForJob] = useState<Job | null>(null);
  const [payingForProposal, setPayingForProposal] = useState<Proposal | null>(null);
  const [reviewingJob, setReviewingJob] = useState<Job | null>(null);
  const [viewingDisputeForJob, setViewingDisputeForJob] = useState<Job | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<MaintainedItem | null>(null);
  const [viewingJobOnMap, setViewingJobOnMap] = useState<Job | null>(null);
  const [chattingWithJob, setChattingWithJob] = useState<Job | null>(null);


  const userJobs = allJobs.filter(job => job.clientId === user.email);
  const firstServiceDone = userJobs.length > 0;
  const firstItemDone = maintainedItems.length > 0;
  const profileComplete = Boolean(user.address && user.bio && user.bio.length > 20);
  const onboardingStepsTotal = 3;
  const onboardingStepsDone = [profileComplete, firstServiceDone, firstItemDone].filter(Boolean).length;

  const handleAcceptProposal = (proposalId: string) => {
    const proposal = allProposals.find(p => p.id === proposalId);
    if (proposal) {
      setPayingForProposal(proposal);
    }
  };

  const handlePaymentSuccess = () => {
    if (!payingForProposal) return;
    const { jobId, providerId, price } = payingForProposal;

    // Update proposal status
    setAllProposals(prev => prev.map(p => p.jobId === jobId ? { ...p, status: p.id === payingForProposal.id ? 'aceita' : 'recusada' } : p));
    
    // Update job status
    const newEscrowId = `esc-${Date.now()}`;
    setAllJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'proposta_aceita', providerId, escrowId: newEscrowId } : j));

    // Create Escrow
    setAllEscrows(prev => [...prev, {
      id: newEscrowId,
      jobId,
      clientId: user.email,
      providerId,
      amount: price,
      status: 'bloqueado',
      createdAt: new Date(),
    }]);

    setAllNotifications(prev => [...prev, {
      id: `notif-${Date.now()}`,
      userId: providerId,
      text: `Sua proposta para o job "${allJobs.find(j => j.id === jobId)?.category}" foi aceita!`,
      isRead: false,
      createdAt: new Date(),
    }]);

    setPayingForProposal(null);
    setViewingProposalsForJob(null);
  };
  
  const handleFinalizeJob = (reviewData: { rating: number, comment: string }) => {
    if(!reviewingJob) return;

    // Update Job with review and set status to 'concluido'
    setAllJobs(prev => prev.map(j => j.id === reviewingJob.id ? { ...j, status: 'concluido', review: { ...reviewData, authorId: user.email, createdAt: new Date().toISOString() } } : j));

    // Release payment from escrow
    setAllEscrows(prev => prev.map(e => e.jobId === reviewingJob.id ? { ...e, status: 'liberado', releasedAt: new Date() } : e));
    
    setReviewingJob(null);
  }

  const handleReportIssue = (job: Job) => {
    const newDisputeId = `disp-${Date.now()}`;
    const newDispute: Dispute = {
        id: newDisputeId,
        jobId: job.id,
        initiatorId: user.email,
        reason: "Cliente insatisfeito com o serviço prestado.",
        status: 'aberta',
        messages: [{
            id: `msg-${Date.now()}`,
            senderId: user.email,
            text: `Estou abrindo uma disputa para o serviço "${job.description}" pois não estou satisfeito com o resultado.`,
            createdAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
    };
    setAllDisputes(prev => [...prev, newDispute]);
    setAllJobs(prev => prev.map(j => j.id === job.id ? {...j, status: 'em_disputa', disputeId: newDisputeId} : j));
    setAllEscrows(prev => prev.map(e => e.jobId === job.id ? {...e, status: 'em_disputa'} : e));
    setViewingDisputeForJob(job);
  };

    const handleSendDisputeMessage = (disputeId: string, text: string) => {
        const newMessage: DisputeMessage = {
            id: `d-msg-${Date.now()}`,
            senderId: user.email,
            createdAt: new Date().toISOString(),
            text,
        };

        setAllDisputes(prevDisputes =>
            prevDisputes.map(d =>
                d.id === disputeId
                    ? { ...d, messages: [...d.messages, newMessage] }
                    : d
            )
        );

        const dispute = allDisputes.find(d => d.id === disputeId);
        const job = allJobs.find(j => j.id === dispute?.jobId);
        if (job?.providerId) {
            setAllNotifications(prev => [...prev, {
                id: `notif-dispute-${Date.now()}`,
                userId: job.providerId!,
                text: `Nova mensagem na disputa do job "${job.category}".`,
                isRead: false,
                createdAt: new Date(),
            }]);
        }
    };

  const handleSaveItem = (newItemData: Omit<MaintainedItem, 'id' | 'clientId' | 'maintenanceHistory' | 'createdAt'>) => {
      const newItem: MaintainedItem = {
          ...newItemData,
          id: `item-${Date.now()}`,
          clientId: user.email,
          createdAt: new Date().toISOString(),
          maintenanceHistory: [],
      };
      setMaintainedItems(prev => [newItem, ...prev]);
      setIsAddItemModalOpen(false);
  };

  const handleSendMessage = (messageData: Partial<Message> & { chatId: string, text: string }) => {
    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: user.email,
        createdAt: new Date().toISOString(),
        type: 'text',
        ...messageData,
    };
    setAllMessages(prev => [...prev, newMessage]);

    const job = allJobs.find(j => j.id === messageData.chatId);
    if (job) {
        const otherPartyId = job.providerId === user.email ? job.clientId : job.providerId;
        if (otherPartyId) {
            setAllNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                userId: otherPartyId,
                text: `Nova mensagem de ${user.name} sobre o job "${job.category}".`,
                isRead: false,
                createdAt: new Date(),
            }]);
        }
    }
  };
  
  const handleConfirmSchedule = (jobId: string, schedule: ScheduledDateTime, messageId?: string) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job || !job.providerId) return;

    // 1. Update Job Status
    setAllJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'agendado' } : j)));

    const formattedDate = new Date(`${schedule.date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const confirmationText = `✅ Agendamento confirmado para ${formattedDate} às ${schedule.time}.`;

    // 2. Add System Message to Chat
    const systemMessage: Message = {
        id: `msg-system-${Date.now()}`,
        chatId: jobId,
        senderId: 'system', // Special ID for system messages
        text: confirmationText,
        createdAt: new Date().toISOString(),
        type: 'system_notification',
    };
    setAllMessages(prev => [...prev, systemMessage]);

    // 3. Notify the Provider
    setAllNotifications(prev => [...prev, {
        id: `notif-${Date.now()}`,
        userId: job.providerId!,
        text: `Agendamento confirmado para o job "${job.category}"!`,
        isRead: false,
        createdAt: new Date(),
    }]);

    // 4. Mark the proposal message as confirmed
    if (messageId) {
        setAllMessages(prev => prev.map(m => m.id === messageId ? { ...m, isScheduleConfirmed: true } : m));
    }
  };

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated: Partial<User> = {
      name: String(formData.get('name') || user.name),
      address: String(formData.get('address') || user.address || ''),
      bio: String(formData.get('bio') || user.bio),
      location: String(formData.get('location') || user.location),
    };
    if ((updated.bio || '').trim().length < 30) {
      alert('Sua bio está muito curta. Escreva pelo menos 30 caracteres para ajudar os prestadores a te conhecer melhor.');
      return;
    }
    onUpdateUser(user.email, updated);
    setIsProfileModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Card de Onboarding */}
      {showOnboarding && onboardingStepsDone < onboardingStepsTotal && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg">
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setShowOnboarding(false)}
            aria-label="Fechar onboarding"
          >✕</button>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span>🚀 Bem-vindo! Seu progresso inicial</span>
          </h2>
          <p className="text-sm mb-4">
            {onboardingStepsDone} de {onboardingStepsTotal} passos concluídos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!profileComplete && (
              <div className="bg-white/15 rounded-lg p-4 backdrop-blur-sm">
                <p className="font-semibold text-sm">1. Complete seu perfil</p>
                <p className="text-xs text-blue-100 mb-2">Adicione endereço e uma bio mais completa.</p>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-xs font-medium px-3 py-1 rounded bg-white/25 hover:bg-white/35 transition"
                >Editar Perfil</button>
              </div>
            )}
            {!firstServiceDone && (
              <div className="bg-white/15 rounded-lg p-4 backdrop-blur-sm">
                <p className="font-semibold text-sm">2. Solicite seu primeiro serviço</p>
                <p className="text-xs text-blue-100 mb-2">A IA pode ajudar a descrever o problema.</p>
                <button
                  onClick={() => onNewJobFromItem('')}
                  className="text-xs font-medium px-3 py-1 rounded bg-white/25 hover:bg-white/35 transition"
                >Solicitar Serviço</button>
              </div>
            )}
            {!firstItemDone && (
              <div className="bg-white/15 rounded-lg p-4 backdrop-blur-sm">
                <p className="font-semibold text-sm">3. Cadastre um item</p>
                <p className="text-xs text-blue-100 mb-2">Facilita futuras manutenções.</p>
                <button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="text-xs font-medium px-3 py-1 rounded bg-white/25 hover:bg-white/35 transition"
                >Adicionar Item</button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meu Painel</h1>
        <button 
          onClick={() => onNewJobFromItem('')} 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
        >
          <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Novo Serviço
        </button>
      </div>

      {maintainedItems.length > 0 && (
        <MaintenanceSuggestions items={maintainedItems} onSuggestJob={onNewJobFromItem} />
      )}

      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Serviços Ativos
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Meus Itens
            </button>
          </nav>
        </div>
        
        <div className="mt-6">
          {activeTab === 'jobs' && (
            <div>
              {userJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userJobs.map(job => (
                    <ClientJobCard
                      key={job.id}
                      job={job}
                      proposals={allProposals.filter(p => p.jobId === job.id)}
                      onViewProposals={() => job.jobMode === 'leilao' ? setViewingAuctionForJob(job) : setViewingProposalsForJob(job)}
                      onChat={() => setChattingWithJob(job)}
                      onFinalize={() => setReviewingJob(job)}
                      onReportIssue={() => handleReportIssue(job)}
                      onViewOnMap={setViewingJobOnMap}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum pedido de serviço ativo</h3>
                    <p className="mt-1 text-sm text-gray-500">Clique em "Novo Serviço" para encontrar o profissional ideal.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'items' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsAddItemModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    + Adicionar Item
                </button>
              </div>
              {maintainedItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {maintainedItems.map(item => <ItemCard key={item.id} item={item} onClick={() => setViewingItem(item)} />)}
                </div>
              ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5v2.25m0-2.25l2.25 1.313M4.5 9.75l.75-2.25M4.5 9.75l2.25-1.313M4.5 9.75L2.25 8.438m2.25 1.312l-2.25 1.313M19.5 9.75l-.75-2.25M19.5 9.75l-2.25-1.313M19.5 9.75L21.75 8.438m-2.25 1.312l2.25 1.313m-6.75 0l2.25-1.313m0 0l-2.25-1.313m2.25 1.313l.75 2.25m-2.25-1.313l-2.25 1.313m0 0l-2.25-1.313m2.25 1.313l-.75 2.25m2.25 0l.75-2.25M12 15l-2.25-1.313M12 15l2.25-1.313M12 15v2.25m0-2.25l-2.25 1.313m2.25-1.313l2.25 1.313" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Organize seus itens</h3>
                    <p className="mt-1 text-sm text-gray-500">Adicione itens como ar condicionado ou geladeira para facilitar futuras manutenções.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewingProposalsForJob && (
        <ProposalListModal
          job={viewingProposalsForJob}
          proposals={allProposals.filter(p => p.jobId === viewingProposalsForJob.id)}
          users={allUsers}
          onClose={() => setViewingProposalsForJob(null)}
          onAcceptProposal={handleAcceptProposal}
          onViewProfile={onViewProfile}
        />
      )}
      {viewingAuctionForJob && (
          <AuctionRoomModal
              job={viewingAuctionForJob}
              currentUser={user}
              bids={allBids.filter(b => b.jobId === viewingAuctionForJob.id)}
              onClose={() => setViewingAuctionForJob(null)}
              onPlaceBid={() => {}} // Client cannot place bids
          />
      )}
      {payingForProposal && (
        <PaymentModal 
            job={allJobs.find(j => j.id === payingForProposal.jobId)!}
            proposal={payingForProposal}
            provider={allUsers.find(u => u.email === payingForProposal.providerId)!}
            onClose={() => setPayingForProposal(null)}
            onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {reviewingJob && (
        <ReviewModal
            job={reviewingJob}
            onClose={() => setReviewingJob(null)}
            onSubmit={handleFinalizeJob}
        />
      )}
      {viewingDisputeForJob && (
        <DisputeModal
            user={user}
            job={viewingDisputeForJob}
            dispute={allDisputes.find(d => d.id === viewingDisputeForJob.id)!}
            otherParty={allUsers.find(u => u.email === viewingDisputeForJob.providerId)}
            onClose={() => setViewingDisputeForJob(null)}
            onSendMessage={(text) => handleSendDisputeMessage(viewingDisputeForJob.disputeId!, text)}
        />
      )}
      {isAddItemModalOpen && (
        <AddItemModal 
            onClose={() => setIsAddItemModalOpen(false)}
            onSave={handleSaveItem}
        />
      )}
      {viewingItem && (
        <ItemDetailModal
            item={viewingItem}
            onClose={() => setViewingItem(null)}
            onServiceRequest={(item) => {
                onNewJobFromItem(`Preciso de manutenção para meu ${item.name} (${item.brand} ${item.model}).`);
                setViewingItem(null);
            }}
        />
      )}
      {viewingJobOnMap && (
        <JobLocationModal
            job={viewingJobOnMap}
            client={user}
            provider={allUsers.find(u => u.email === viewingJobOnMap.providerId)!}
            onClose={() => setViewingJobOnMap(null)}
        />
      )}
      {chattingWithJob && (
        <ChatModal
            job={chattingWithJob}
            currentUser={user}
            otherParty={allUsers.find(u => u.email === chattingWithJob.providerId)}
            messages={allMessages.filter(m => m.chatId === chattingWithJob.id)}
            onClose={() => setChattingWithJob(null)}
            onSendMessage={handleSendMessage}
            onConfirmSchedule={handleConfirmSchedule}
        />
      )}

      {/* AI Assistant Widget */}
      <AIAssistantWidget userName={user.name.split(' ')[0]} userAddress={user.address} />
      {/* Modal simples de edição de perfil */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Fechar"
            >✕</button>
            <h3 className="text-lg font-bold mb-4">Completar Perfil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input name="name" defaultValue={user.name} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input name="address" defaultValue={user.address} placeholder="Rua, nº, bairro" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização (cidade)</label>
                <input name="location" defaultValue={user.location} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea name="bio" defaultValue={user.bio} rows={4} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" />
                <p className="text-xs text-gray-500 mt-1">Dica: escreva ao menos 30 caracteres.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// AI Assistant Widget Component
interface AIAssistantWidgetProps {
  userName: string;
  userAddress?: string;
}

const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ userName, userAddress }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `Olá ${userName}! Descreva brevemente o problema e vou montar um pedido de serviço para você.` }
  ]);
  const [isBuildingJob, setIsBuildingJob] = useState(false);
  const [isConsultingAI, setIsConsultingAI] = useState(false);
  const [draftJobData, setDraftJobData] = useState<Partial<JobData>>(userAddress ? { address: userAddress } : {});

  const tips = [
    "💡 Dica: Adicione fotos detalhadas ao solicitar um serviço para receber propostas mais precisas.",
    "🎯 Você sabia? Prestadores verificados têm maior taxa de conclusão de serviços.",
    "⏰ Programe manutenções preventivas e economize até 30% em reparos emergenciais.",
    "📱 Use o chat integrado para tirar dúvidas antes de aceitar uma proposta."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-16'}`}>
      {isExpanded ? (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-4 text-white">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">✨</span>
              <span className="font-semibold">IA Assistente</span>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-white/80 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3 min-h-[60px]">
            <p className="text-sm leading-relaxed">{tips[currentTip]}</p>
          </div>
          
          {/* Chips de urgência rápida */}
          {isChatOpen && draftJobData.description && (
            <div className="flex flex-wrap gap-1 mb-2">
              {['hoje', 'amanha', '3dias', '1semana'].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setDraftJobData(prev => ({ ...prev, urgency: u as any }));
                    setChatMessages(prev => [...prev, { role: 'ai', text: `Urgência atualizada para: ${u}.` }]);
                  }}
                  className={`px-2 py-1 text-xs rounded ${draftJobData.urgency === u ? 'bg-white text-purple-700 font-semibold' : 'bg-white/30 text-white'}`}
                >
                  {u}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-xs font-medium transition"
            >
              Novo Serviço
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-xs font-medium transition"
            >
              Preciso de Ajuda
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className="text-4xl animate-pulse">✨</span>
        </button>
      )}
      {isChatOpen && (
        <div className="fixed bottom-24 right-4 w-80 bg-white rounded-xl shadow-xl border border-blue-200 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 flex justify-between items-center">
            <span className="text-sm font-semibold">Assistente IA</span>
            <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white text-xs">✕</button>
          </div>
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto text-sm">
            {chatMessages.map((m, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg whitespace-pre-line ${m.role === 'ai' ? 'bg-blue-50 text-blue-900' : 'bg-purple-50 text-purple-900 ml-auto'} max-w-[85%]`}>{m.text}</div>
            ))}
            {isConsultingAI && (<div className="text-xs text-blue-600 animate-pulse flex items-center gap-1"><span>🤖</span> Consultando IA...</div>)}
            {isBuildingJob && (<div className="text-xs text-gray-500 animate-pulse">Gerando sugestão...</div>)}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const text = String(formData.get('msg') || '').trim();
              if (!text) return;
              e.currentTarget.reset();
              setChatMessages(prev => [...prev, { role: 'user', text }]);
              const lower = text.toLowerCase();
              const next: Partial<JobData> = { ...draftJobData };
              // Tentativa: usar backend de IA para enriquecer a descrição
              setIsConsultingAI(true);
              try {
                const ai = await enhanceJobRequest(text);
                if (ai?.enhancedDescription) next.description = ai.enhancedDescription;
                if (ai?.suggestedCategory) next.category = ai.suggestedCategory as any;
                if (ai?.suggestedServiceType) next.serviceType = ai.suggestedServiceType;
              } catch (_) {
                setChatMessages(prev => [...prev, { role: 'ai', text: 'Não consegui consultar a IA agora, vou tentar entender sua mensagem localmente.' }]);
              } finally {
                setIsConsultingAI(false);
              }
              if (!next.category) {
                if (lower.includes('eletric') || lower.includes('tomada')) next.category = 'reparos';
                if (lower.includes('pint') || lower.includes('parede')) next.category = 'reparos';
                if (lower.includes('comput') || lower.includes('notebook')) next.category = 'ti';
              }
              if (!next.description) next.description = text;
              if (!next.serviceType) next.serviceType = 'personalizado';
              if (!next.urgency) {
                if (lower.includes('urg') || lower.includes('hoje')) next.urgency = 'hoje';
                else if (lower.includes('amanha')) next.urgency = 'amanha';
                else next.urgency = '3dias';
              }
              setDraftJobData(next);
              if (lower === 'publicar') {
                const jobData: JobData = {
                  description: next.description || 'Serviço solicitado',
                  category: next.category || 'reparos',
                  serviceType: next.serviceType || 'personalizado',
                  urgency: next.urgency || '3dias'
                };
                window.dispatchEvent(new CustomEvent('open-wizard-from-chat', { detail: jobData }));
                setChatMessages(prev => [...prev, { role: 'ai', text: 'Abrindo assistente de criação de serviço...' }]);
                return;
              }
              setIsBuildingJob(true);
              setTimeout(() => {
                setIsBuildingJob(false);
                const missing: string[] = [];
                if (!next.address) missing.push('endereço');
                if (!next.fixedPrice && !next.visitFee) missing.push('preço estimado');
                if (missing.length === 0) {
                  setChatMessages(prev => [...prev, { role: 'ai', text: 'Pronto! Digite "publicar" para abrir o formulário e revisar antes de enviar.' }]);
                } else {
                  setChatMessages(prev => [...prev, { role: 'ai', text: `Resumo:\nCategoria: ${next.category}\nUrgência: ${next.urgency}\nFalta(m): ${missing.join(', ')}.\nVocê pode complementar ou digitar "publicar" para avançar mesmo assim.` }]);
                }
              }, 900);
            }}
            className="border-t border-gray-200 p-2 flex gap-2"
          >
            <input name="msg" placeholder="Digite sua mensagem..." className="flex-1 rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500" />
            <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700">Enviar</button>
            <button
              type="button"
              onClick={() => {
                const next = draftJobData;
                const jobData: JobData = {
                  description: next.description || 'Serviço solicitado',
                  category: next.category || 'reparos',
                  serviceType: next.serviceType || 'personalizado',
                  urgency: next.urgency || '3dias'
                };
                window.dispatchEvent(new CustomEvent('open-wizard-from-chat', { detail: jobData }));
                setChatMessages(prev => [...prev, { role: 'ai', text: 'Abrindo assistente de criação de serviço...' }]);
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700"
            >
              Gerar Pedido
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;