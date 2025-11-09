import React, { useState, useEffect } from 'react';
import { Job, User, Proposal, Message, Dispute, MaintainedItem, JobData, Escrow, Notification, ScheduledDateTime, DisputeMessage, Bid } from '../types';
import { enhanceJobRequest } from '../services/geminiService';
import * as API from '../services/api';
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
import ClientDashboardSkeleton from './skeletons/ClientDashboardSkeleton';

interface ClientDashboardProps {
  user: User;
  allUsers: User[];
  allProposals: Proposal[];
  allMessages: Message[];
  allDisputes: Dispute[];
  allBids: Bid[];
  maintainedItems: MaintainedItem[];
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
  user, allUsers, allProposals, allMessages, maintainedItems, allDisputes, allBids,
  setAllProposals, setAllMessages, setAllNotifications, setAllEscrows, setAllDisputes, setMaintainedItems,
  onViewProfile, onNewJobFromItem, onUpdateUser
}) => {
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  useEffect(() => {
    // Simulate loading for skeleton screen visibility
    const timer = setTimeout(() => {
      setIsLoadingJobs(false);
    }, 1500); // Adjust time as needed
    const loadJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const jobs = await API.fetchJobsForUser(user.email);
        setUserJobs(jobs);
      } catch (error) {
        console.error("Failed to fetch user jobs:", error);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    // loadJobs(); // Temporarily disabled to show skeleton

    return () => clearTimeout(timer);
  }, [user.email]);

  const [currentView, setCurrentView] = useState<'inicio' | 'servicos' | 'itens' | 'ajuda'>('inicio');
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

  // Load messages from Firestore when chat is opened
  useEffect(() => {
    if (chattingWithJob) {
      const loadMessages = async () => {
        try {
          const messages = await API.fetchMessages(chattingWithJob.id);
          setAllMessages(prev => {
            // Merge with existing messages, avoid duplicates
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = messages.filter(m => !existingIds.has(m.id));
            return [...prev, ...newMessages];
          });
        } catch (error) {
          console.error('Failed to load chat messages:', error);
        }
      };
      loadMessages();
    }
  }, [chattingWithJob]);

  if (isLoadingJobs) {
    return <ClientDashboardSkeleton />;
  }


  const activeJobs = userJobs.filter(j => !['concluido', 'cancelado'].includes(j.status));
  const completedJobs = userJobs.filter(j => j.status === 'concluido');
  const profileComplete = Boolean(user.address && user.bio && user.bio.length > 20);
  const onboardingStepsTotal = 4;
  const onboardingStepsDone = [profileComplete, userJobs.length > 0, maintainedItems.length > 0].filter(Boolean).length;
  const handleAcceptProposal = async (proposalId: string) => {
    const proposal = allProposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const job = userJobs.find(j => j.id === proposal.jobId);
    if (!job) {
      alert('Job não encontrado');
      return;
    }

    try {
      // Create Stripe Checkout Session
      const { id: sessionId } = await API.createCheckoutSession(job, proposal.price);
      
      // Redirect to Stripe Checkout
      const stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        alert('Erro ao redirecionar para pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Erro ao criar sessão de pagamento. Tente novamente.');
    }
  };

  const handlePaymentSuccess = async () => {
    if (!payingForProposal) return;
    const { jobId, providerId, price, id: proposalId } = payingForProposal;

    try {
      // Update proposal status via API
      await API.updateProposal(proposalId, { status: 'aceita' });
      
      // Update other proposals for same job to rejected
      const otherProposals = allProposals.filter(p => p.jobId === jobId && p.id !== proposalId);
      for (const prop of otherProposals) {
        await API.updateProposal(prop.id, { status: 'recusada' });
      }
      
      // Update job status
      const newEscrowId = `esc-${Date.now()}`;
      await API.updateJob(jobId, { 
        status: 'proposta_aceita', 
        providerId, 
        escrowId: newEscrowId 
      });

      // Update local state
      setAllProposals(prev => prev.map(p => 
        p.jobId === jobId ? { ...p, status: p.id === proposalId ? 'aceita' : 'recusada' } : p
      ));
      setUserJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'proposta_aceita', providerId, escrowId: newEscrowId } : j
      ));

      // Create Escrow (local for now - would need API endpoint)
      setAllEscrows(prev => [...prev, {
        id: newEscrowId,
        jobId,
        clientId: user.email,
        providerId,
        amount: price,
        status: 'bloqueado',
        createdAt: new Date().toISOString(),
      }]);

      // Notify provider
      await API.createNotification({
        userId: providerId,
        text: `Sua proposta para o job "${userJobs.find(j => j.id === jobId)?.category}" foi aceita!`,
        isRead: false,
      });

      setPayingForProposal(null);
      setViewingProposalsForJob(null);
      console.log('Proposal accepted and payment processed');
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };
  
  const handleFinalizeJob = async (reviewData: { rating: number, comment: string }) => {
    if(!reviewingJob) return;

    try {
      // Update Job with review and set status to 'concluido'
      await API.updateJob(reviewingJob.id, {
        status: 'concluido',
        review: { ...reviewData, authorId: user.email, createdAt: new Date().toISOString() }
      });

      // Release payment from escrow via API
      const releaseResult = await API.releasePayment(reviewingJob.id);
      console.log('Payment release result:', releaseResult);

      setUserJobs(prev => prev.map(j => 
        j.id === reviewingJob.id ? { ...j, status: 'concluido', review: { ...reviewData, authorId: user.email, createdAt: new Date().toISOString() } } : j
      ));

      // Update escrow locally
      setAllEscrows(prev => prev.map(e => 
        e.jobId === reviewingJob.id ? { ...e, status: 'liberado', releasedAt: new Date().toISOString() } : e
      ));
      
      setReviewingJob(null);
      alert('✅ Serviço finalizado e pagamento liberado com sucesso!');
      console.log('Job finalized with review and payment released');
    } catch (error) {
      console.error('Failed to finalize job:', error);
      alert('Erro ao finalizar serviço. Tente novamente.');
    }
  };

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
    setUserJobs(prev => prev.map(j => j.id === job.id ? {...j, status: 'em_disputa', disputeId: newDisputeId} : j));
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
        const job = userJobs.find(j => j.id === dispute?.jobId);
    if (job?.providerId) {
            setAllNotifications(prev => [...prev, {
                id: `notif-dispute-${Date.now()}`,
                userId: job.providerId!,
                text: `Nova mensagem na disputa do job "${job.category}".`,
                isRead: false,
        createdAt: new Date().toISOString(),
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

  const handleSendMessage = async (messageData: Partial<Message> & { chatId: string, text: string }) => {
    try {
      // Save message to backend (Firestore)
      const savedMessage = await API.createMessage({
        chatId: messageData.chatId,
        senderId: user.email,
        text: messageData.text,
        type: messageData.type || 'text',
      });
      
      // Update local state with saved message
      setAllMessages(prev => [...prev, savedMessage]);

      // Send notification to the other party
      const job = userJobs.find(j => j.id === messageData.chatId);
      if (job) {
        const otherPartyId = job.providerId === user.email ? job.clientId : job.providerId;
        if (otherPartyId) {
          await API.createNotification({
            userId: otherPartyId,
            text: `Nova mensagem de ${user.name} sobre o job "${job.category}".`,
            isRead: false,
          });
        }
      }
      
      console.log('Message sent and saved to Firestore');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };
  
  const handleConfirmSchedule = (jobId: string, schedule: ScheduledDateTime, messageId?: string) => {
    const job = userJobs.find(j => j.id === jobId);
    if (!job || !job.providerId) return;

    // 1. Update Job Status
    setUserJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'agendado' } : j)));

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
    createdAt: new Date().toISOString(),
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">👋</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Olá, {user.name.split(' ')[0]}!</p>
              <button onClick={() => setIsProfileModalOpen(true)} className="text-xs text-blue-600 hover:underline">Conta Pessoal</button>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setCurrentView('inicio')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'inicio' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🏠</span>
              Início
            </button>
            <button
              onClick={() => setCurrentView('servicos')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'servicos' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">📋</span>
              Meus Serviços
            </button>
            <button
              onClick={() => setCurrentView('itens')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'itens' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">📦</span>
              Meus Itens
            </button>
            <button
              onClick={() => setCurrentView('ajuda')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'ajuda' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">❓</span>
              Ajuda
            </button>
          </nav>
        </div>
        <div className="p-6 border-t border-gray-200">
          <button className="text-sm text-gray-600 hover:text-blue-600">Sair</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
          {currentView === 'inicio' && (
            <>
              {/* Card de Onboarding */}
              {showOnboarding && !profileComplete && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
                  <button
                    className="absolute top-4 right-4 text-white/70 hover:text-white text-xl"
                    onClick={() => setShowOnboarding(false)}
                  >✕</button>
                  <div className="flex items-start gap-4 mb-6">
                    <span className="text-4xl">✨</span>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Complete seu perfil</h2>
                      <p className="text-blue-100 mb-4">{onboardingStepsDone} de {onboardingStepsTotal} passos concluídos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6">
                      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold mb-3">1</div>
                      <h3 className="font-semibold mb-2">Complete seu perfil</h3>
                      <p className="text-sm text-blue-100 mb-4">Adicione telefone e localização</p>
                      <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-sm px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
                      >Completar</button>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6">
                      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold mb-3">2</div>
                      <h3 className="font-semibold mb-2">Solicite seu primeiro serviço</h3>
                      <p className="text-sm text-blue-100 mb-4">A IA vai te ajudar!</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6">
                      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold mb-3">3</div>
                      <h3 className="font-semibold mb-2">Cadastre um item</h3>
                      <p className="text-sm text-blue-100 mb-4">Para manutenção preventiva</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Serviços Ativos</h3>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{activeJobs.length}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Concluídos</h3>
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <span className="text-xl">💬</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{completedJobs.length}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Itens Cadastrados</h3>
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <span className="text-xl">🧰</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{maintainedItems.length}</p>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => onNewJobFromItem('')}
                    className="flex items-center gap-4 p-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Solicitar Serviço</h3>
                      <p className="text-sm text-blue-100">Com ajuda da IA</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="flex items-center gap-4 p-6 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Cadastrar Item</h3>
                      <p className="text-sm text-purple-100">Para manutenção</p>
                    </div>
                  </button>
                </div>
              </div>

              {maintainedItems.length > 0 && (
                <MaintenanceSuggestions items={maintainedItems} onSuggestJob={onNewJobFromItem} />
              )}
            </>
          )}

          {currentView === 'servicos' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Meus Serviços</h1>
                <button
                  onClick={() => onNewJobFromItem('')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                >
                  + Novo Serviço
                </button>
              </div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Meus Serviços</h1>
                <button
                  onClick={() => onNewJobFromItem('')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                >
                  + Novo Serviço
                </button>
              </div>
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
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <span className="text-6xl mb-4 block">📋</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum serviço ainda</h3>
                  <p className="text-gray-500 mb-6">Solicite seu primeiro serviço com ajuda da IA</p>
                  <button
                    onClick={() => onNewJobFromItem('')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Solicitar Serviço
                  </button>
                </div>
              )}
            </>
          )}

          {currentView === 'itens' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Meus Itens</h1>
                <button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                >
                  + Novo Item
                </button>
              </div>
              {maintainedItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {maintainedItems.map(item => (
                    <ItemCard key={item.id} item={item} onClick={() => setViewingItem(item)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <span className="text-6xl mb-4 block">📦</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum item cadastrado</h3>
                  <p className="text-gray-500 mb-6">Cadastre itens para facilitar manutenções futuras</p>
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Cadastrar Item
                  </button>
                </div>
              )}
            </>
          )}

          {currentView === 'ajuda' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Central de Ajuda</h1>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Como solicitar um serviço?</h3>
                  <p className="text-sm text-gray-600">Use nossa IA assistente para descrever seu problema e receber propostas de profissionais qualificados.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Como funciona o pagamento?</h3>
                  <p className="text-sm text-gray-600">O valor fica retido em segurança e só é liberado após a conclusão do serviço.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Assistant Widget */}
      <AIAssistantWidget userName={user.name.split(' ')[0]} userAddress={user.address} />

      {/* Modals */}

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
            job={userJobs.find(j => j.id === payingForProposal.jobId)!}
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
            setAllMessages={setAllMessages}
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