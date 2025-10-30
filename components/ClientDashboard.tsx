import React, { useState } from 'react';
import { Job, User, Proposal, Message, Dispute, MaintainedItem, JobData, Escrow, Notification, ScheduledDateTime, DisputeMessage, Bid } from '../types';
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
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user, allJobs, allUsers, allProposals, allMessages, maintainedItems, allDisputes, allBids,
  setAllJobs, setAllProposals, setAllMessages, setAllNotifications, setAllEscrows, setAllDisputes, setMaintainedItems,
  onViewProfile, onNewJobFromItem
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'items'>('jobs');
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

  return (
    <div className="space-y-8">
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
    </div>
  );
};

export default ClientDashboard;