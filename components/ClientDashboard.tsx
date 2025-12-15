import React, { useState, useEffect } from 'react';
import {
  Job,
  User,
  Proposal,
  Message,
  Dispute,
  MaintainedItem,
  Escrow,
  Notification,
  ScheduledDateTime,
  DisputeMessage,
  Bid,
} from '../types';
import { useToast } from '../contexts/ToastContext'; // 1. Importar o hook
import * as API from '../services/api';
import ClientJobCard from './ClientJobCard';
import ProposalListModal from './ProposalListModal';
import PaymentModal from './PaymentModal';
import ReviewModal from './ReviewModal';
import DisputeModal from './DisputeModal';
import DisputeDetailsModal from './DisputeDetailsModal';
import AddItemModal from './AddItemModal';
import ItemCard from './ItemCard';
import ItemDetailModal from './ItemDetailModal';
import JobLocationModal from './JobLocationModal';
import ChatModal from './ChatModal';
import AuctionRoomModal from './AuctionRoomModal';
import MatchingResultsModal from './MatchingResultsModal';

type ClientJobCardProps = React.ComponentProps<typeof ClientJobCard>;
const ClientJobCardTyped = ClientJobCard as (props: ClientJobCardProps) => JSX.Element;
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
  /**
   * Quando true, desativa a exibição do skeleton inicial. Útil para testes unitários.
   */
  disableSkeleton?: boolean;
  /**
   * Props auxiliares para testes: permitem abrir modais diretamente.
   */
  viewingProposalsForJob?: Job | null;
  proposalToPay?: Proposal | null;
  initialUserJobs?: Job[];
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  allUsers,
  allProposals,
  allMessages,
  maintainedItems,
  allDisputes,
  allBids,
  setAllProposals,
  setAllMessages,
  setAllNotifications,
  setAllEscrows,
  setAllDisputes,
  setMaintainedItems,
  onViewProfile,
  onNewJobFromItem,
  onUpdateUser,
  disableSkeleton = false,
  viewingProposalsForJob: viewingProposalsForJobProp = null,
  proposalToPay: proposalToPayProp = null,
  initialUserJobs = [],
}) => {
  const { addToast } = useToast(); // 2. Inicializar o hook

  const [userJobs, setUserJobs] = useState<Job[]>(initialUserJobs);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Buscar jobs do usuário ao carregar o dashboard
  useEffect(() => {
    const loadUserJobs = async () => {
      if (disableSkeleton) {
        setIsLoadingJobs(false);
        return; // pula lógica de timer e carregamento
      }

      try {
        setIsLoadingJobs(true);
        const jobs = await API.fetchJobsForUser(user.email);
        // Garantir que todos os jobs têm status válido
        const validJobs = jobs.map(job => ({
          ...job,
          status: job.status || 'ativo',
          category: job.category || 'geral',
          description: job.description || 'Serviço solicitado',
        }));
        setUserJobs(validJobs);
      } catch (error) {
        console.error('Erro ao carregar jobs do cliente:', error);
        addToast('Erro ao carregar seus serviços. Tente novamente.', 'error');
        setUserJobs([]); // Define array vazio em caso de erro
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadUserJobs();
  }, [user.email, disableSkeleton, addToast]);

  // Efeito: permitir que testes injetem estados iniciais dos modais
  useEffect(() => {
    if (viewingProposalsForJobProp) {
      setViewingProposalsForJob(viewingProposalsForJobProp);
    }
  }, [viewingProposalsForJobProp]);

  useEffect(() => {
    if (proposalToPayProp) {
      setProposalToPay(proposalToPayProp);
    }
  }, [proposalToPayProp]);

  const [currentView, setCurrentView] = useState<'inicio' | 'servicos' | 'itens' | 'ajuda'>(
    'inicio'
  );
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingProposalsForJob, setViewingProposalsForJob] = useState<Job | null>(null);
  const [viewingAuctionForJob, setViewingAuctionForJob] = useState<Job | null>(null);
  const [proposalToPay, setProposalToPay] = useState<Proposal | null>(null);
  const [payingForProposal, setPayingForProposal] = useState<Proposal | null>(null);
  const [_reviewingJob, _setReviewingJob] = useState<Job | null>(null); // unused (future review feature)
  const [jobInFocus, setJobInFocus] = useState<{
    job: Job;
    action: 'review' | 'dispute' | 'dispute-details';
  } | null>(null);
  const [_viewingDisputeForJob, _setViewingDisputeForJob] = useState<Job | null>(null); // unused (future dispute detail view)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<MaintainedItem | null>(null);
  const [viewingJobOnMap, setViewingJobOnMap] = useState<Job | null>(null);
  const [chattingWithJob, setChattingWithJob] = useState<Job | null>(null);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [matchingResults, setMatchingResults] = useState<API.MatchingProvider[]>([]);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);

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
          /* Intentionally ignored */
        }
      };
      loadMessages();
    }
  }, [chattingWithJob, setAllMessages]);

  if (isLoadingJobs && !disableSkeleton) {
    return <ClientDashboardSkeleton />;
  }

  const activeJobs = userJobs.filter(j => !['concluido', 'cancelado'].includes(j.status));
  const completedJobs = userJobs.filter(j => j.status === 'concluido');
  // Consider profile complete with just an address (bio is optional to simplify onboarding)
  const profileComplete = Boolean(user.address);
  const onboardingStepsDone = [
    profileComplete,
    userJobs.length > 0,
    maintainedItems.length > 0,
  ].filter(Boolean).length;
  const onboardingStepsTotal = 4;
  const handleAcceptProposal = async (proposalId: string) => {
    const proposal = allProposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const job = userJobs.find(j => j.id === proposal.jobId);
    if (!job) {
      addToast('Job não encontrado', 'error');
      return;
    }

    // Em vez de redirecionar imediatamente, abre o modal de confirmação de pagamento
    setProposalToPay(proposal);
  };

  const handleClosePaymentModal = () => {
    setProposalToPay(null);
  };

  const handleViewRecommendations = async (job: Job) => {
    setMatchingJobId(job.id);
    setIsMatchingModalOpen(true);

    try {
      const results = await API.matchProvidersForJob(job.id);
      setMatchingResults(results);
      addToast('Profissionais recomendados carregados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao buscar profissionais recomendados:', error);
      addToast('Erro ao carregar profissionais recomendados. Tente novamente.', 'error');
      setIsMatchingModalOpen(false);
    }
  };

  const handleInviteProvider = async (providerId: string) => {
    if (!matchingJobId) return;

    try {
      // Call the existing submitProposal API with invite intent
      // For now, we'll use a mock/placeholder approach until backend supports direct invites
      console.log(`Inviting provider ${providerId} to job ${matchingJobId}`);
      addToast('Prestador convidado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao convidar prestador:', error);
      addToast('Erro ao enviar convite. Tente novamente.', 'error');
    }
  };

  const handleCloseMatchingModal = () => {
    setIsMatchingModalOpen(false);
    setMatchingResults([]);
    setMatchingJobId(null);
  };

  const handleConfirmPayment = async (proposal: Proposal) => {
    const job = userJobs.find(j => j.id === proposal.jobId);
    if (!job) return;

    try {
      const result = (await API.createCheckoutSession(job, proposal.price)) as {
        url?: string;
        id?: string;
      };
      // Suporte a dois formatos: { url } e { id }
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      const sessionId = result?.id;
      if (!sessionId) {
        throw new Error('Sessão de checkout inválida');
      }

      // Store proposal for later confirmation
      setPayingForProposal(proposal);

      // Redirect to Stripe Checkout
      const StripeConstructor = (
        window as Window & {
          Stripe?: (key: string) => {
            redirectToCheckout: (opts: {
              sessionId: string;
            }) => Promise<{ error?: { message: string } }>;
          };
        }
      ).Stripe;
      if (!StripeConstructor) {
        throw new Error('Stripe não carregado');
      }
      const stripe = StripeConstructor(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        addToast('Erro ao redirecionar para pagamento. Tente novamente.', 'error');
        throw new Error(error.message || 'Falha ao redirecionar para o Stripe');
      }
    } catch (error) {
      addToast('Erro ao criar sessão de pagamento. Tente novamente.', 'error');
      // Repassa o erro para o modal exibir UI de retry (E_TIMEOUT/E_NETWORK)
      throw error;
    }
  };

  // unused legacy code kept for reference
  const _handlePaymentSuccess = async () => {
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
        escrowId: newEscrowId,
      });

      // Update local state
      setAllProposals(prev =>
        prev.map(p =>
          p.jobId === jobId ? { ...p, status: p.id === proposalId ? 'aceita' : 'recusada' } : p
        )
      );
      setUserJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? { ...j, status: 'proposta_aceita', providerId, escrowId: newEscrowId }
            : j
        )
      );

      // Create Escrow (local for now - would need API endpoint)
      setAllEscrows(prev => [
        ...prev,
        {
          id: newEscrowId,
          jobId,
          clientId: user.email,
          providerId,
          amount: price,
          status: 'bloqueado',
          createdAt: new Date().toISOString(),
        },
      ]);

      // Notify provider
      await API.createNotification({
        userId: providerId,
        text: `Sua proposta para o job "${userJobs.find(j => j.id === jobId)?.category}" foi aceita!`,
        isRead: false,
      });

      setPayingForProposal(null);
      setViewingProposalsForJob(null);
    } catch (error) {
      addToast('Erro ao processar pagamento. Tente novamente.', 'error'); // 3. Substituir alert()
    }
  };

  const handleFinalizeJob = async (reviewData: { rating: number; comment: string }) => {
    if (!jobInFocus || jobInFocus.action !== 'review') return;

    try {
      // Update Job with review and set status to 'concluido'
      await API.updateJob(jobInFocus.job.id, {
        status: 'concluido',
        review: { ...reviewData, authorId: user.email, createdAt: new Date().toISOString() },
      });

      // Release payment from escrow via API
      await API.releasePayment(jobInFocus.job.id);

      setUserJobs(prev =>
        prev.map(j =>
          j.id === jobInFocus!.job.id
            ? {
                ...j,
                status: 'concluido',
                review: {
                  ...reviewData,
                  authorId: user.email,
                  createdAt: new Date().toISOString(),
                },
              }
            : j
        )
      );

      // Update escrow locally
      setAllEscrows(prev =>
        prev.map(e =>
          e.jobId === jobInFocus!.job.id
            ? { ...e, status: 'liberado', releasedAt: new Date().toISOString() }
            : e
        )
      );

      setJobInFocus(null);
      addToast('Serviço finalizado e pagamento liberado com sucesso!', 'success'); // 3. Substituir alert()
    } catch (error) {
      addToast('Erro ao finalizar serviço. Tente novamente.', 'error'); // 3. Substituir alert()
    }
  };

  const handleOpenDispute = async (data: { reason: string; description: string }) => {
    if (!jobInFocus || jobInFocus.action !== 'dispute') return;

    await API.createDispute({
      jobId: jobInFocus.job.id,
      reporterId: user.email,
      reporterRole: 'client',
      reason: data.reason,
      description: data.description,
    });

    setUserJobs(prev =>
      prev.map(j => (j.id === jobInFocus!.job.id ? { ...j, status: 'em_disputa' } : j))
    );

    // Idealmente, o backend notificaria o provider e o admin.
    // Para fins de UI, podemos simular uma notificação local.
    addToast('Disputa criada com sucesso. Nossa equipe de mediação entrará em contato.', 'success'); // 3. Substituir alert()
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
        d.id === disputeId ? { ...d, messages: [...d.messages, newMessage] } : d
      )
    );

    const dispute = allDisputes.find(d => d.id === disputeId);
    const job = userJobs.find(j => j.id === dispute?.jobId);
    if (job?.providerId) {
      setAllNotifications(prev => [
        ...prev,
        {
          id: `notif-dispute-${Date.now()}`,
          userId: job.providerId!,
          text: `Nova mensagem na disputa do job "${job.category}".`,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSaveItem = (
    newItemData: Omit<MaintainedItem, 'id' | 'clientId' | 'maintenanceHistory' | 'createdAt'>
  ) => {
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

  const handleSendMessage = async (
    messageData: Partial<Message> & { chatId: string; text: string }
  ) => {
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
    } catch (error) {
      addToast('Erro ao enviar mensagem. Tente novamente.', 'error'); // 3. Substituir alert()
    }
  };

  const handleConfirmSchedule = (
    jobId: string,
    schedule: ScheduledDateTime,
    messageId?: string
  ) => {
    const job = userJobs.find(j => j.id === jobId);
    if (!job || !job.providerId) return;

    // 1. Update Job Status
    setUserJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'agendado' } : j)));

    const formattedDate = new Date(`${schedule.date}T00:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
    setAllNotifications(prev => [
      ...prev,
      {
        id: `notif-${Date.now()}`,
        userId: job.providerId!,
        text: `Agendamento confirmado para o job "${job.category}"!`,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    // 4. Mark the proposal message as confirmed
    if (messageId) {
      setAllMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, isScheduleConfirmed: true } : m))
      );
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
      whatsapp: String(formData.get('whatsapp') || user.whatsapp || ''),
      cpf: String(formData.get('cpf') || user.cpf || ''),
      addresses: String(formData.get('addressesExtra') || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
    };
    // Required fields: name, address, whatsapp
    if (!updated.name?.trim() || !updated.address?.trim() || !updated.whatsapp?.trim()) {
      addToast('Por favor, preencha Nome completo, Endereço completo e WhatsApp.', 'warning');
      return;
    }
    // Bio is optional; no minimum length required
    onUpdateUser(user.email, updated);
    setIsProfileModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">👋</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Olá, {user.name.split(' ')[0]}!</p>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Conta Pessoal
              </button>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => {
                setCurrentView('inicio');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'inicio'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🏠</span>
              Início
            </button>
            <button
              onClick={() => {
                setCurrentView('servicos');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'servicos'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">📋</span>
              Meus Serviços
            </button>
            <button
              onClick={() => {
                setCurrentView('itens');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'itens'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">📦</span>
              Meus Itens
            </button>
            <button
              onClick={() => {
                setCurrentView('ajuda');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'ajuda'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
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
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {currentView === 'inicio' && (
            <>
              {/* Card de Onboarding */}
              {showOnboarding && !profileComplete && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
                  <button
                    className="absolute top-4 right-4 text-white/70 hover:text-white text-xl"
                    onClick={() => setShowOnboarding(false)}
                  >
                    ✕
                  </button>
                  <div className="flex items-start gap-4 mb-6">
                    <span className="text-4xl">✨</span>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Complete seu perfil</h2>
                      <p className="text-blue-100 mb-4">
                        {onboardingStepsDone} de {onboardingStepsTotal} passos concluídos
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6">
                      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold mb-3">
                        1
                      </div>
                      <h3 className="font-semibold mb-2">Complete seu perfil</h3>
                      <p className="text-sm text-blue-100 mb-4">Adicione telefone e localização</p>
                      <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-sm px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
                      >
                        Completar
                      </button>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6">
                      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold mb-3">
                        2
                      </div>
                      <h3 className="font-semibold mb-2">Solicite seu primeiro serviço</h3>
                      <p className="text-sm text-blue-100 mb-4">A IA vai te ajudar!</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6">
                      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-xl font-bold mb-3">
                        3
                      </div>
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
                    <ClientJobCardTyped
                      key={job.id}
                      job={job}
                      proposals={allProposals.filter(p => p.jobId === job.id)}
                      onViewProposals={() =>
                        job.jobMode === 'leilao'
                          ? setViewingAuctionForJob(job)
                          : setViewingProposalsForJob(job)
                      }
                      onChat={() => setChattingWithJob(job)}
                      onFinalize={() => setJobInFocus({ job, action: 'review' })}
                      onReportIssue={() => {
                        const existingDispute = allDisputes.find(d => d.jobId === job.id);
                        if (existingDispute) setJobInFocus({ job, action: 'dispute-details' });
                        else setJobInFocus({ job, action: 'dispute' });
                      }}
                      onViewOnMap={j => setViewingJobOnMap(j)}
                      // @ts-expect-error: TS fails to pick optional prop from ClientJobCard; component supports it.
                      onViewRecommendations={() => {
                        handleViewRecommendations(job);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <span className="text-6xl mb-4 block">📋</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum serviço ainda</h3>
                  <p className="text-gray-600 mb-6">
                    Solicite seu primeiro serviço com ajuda da IA
                  </p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum item cadastrado
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Cadastre itens para facilitar manutenções futuras
                  </p>
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
                  <p className="text-sm text-gray-600">
                    Use nossa IA assistente para descrever seu problema e receber propostas de
                    profissionais qualificados.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Como funciona o pagamento?</h3>
                  <p className="text-sm text-gray-600">
                    O valor fica retido em segurança e só é liberado após a conclusão do serviço.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

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
      {proposalToPay && (
        <PaymentModal
          isOpen={!!proposalToPay}
          job={userJobs.find(j => j.id === proposalToPay.jobId)!}
          proposal={proposalToPay}
          provider={allUsers.find(u => u.email === proposalToPay.providerId)!}
          onClose={handleClosePaymentModal}
          onConfirmPayment={handleConfirmPayment}
        />
      )}
      {isMatchingModalOpen && (
        <MatchingResultsModal
          results={matchingResults}
          onClose={handleCloseMatchingModal}
          onInvite={handleInviteProvider}
        />
      )}
      {jobInFocus?.action === 'review' && (
        <ReviewModal
          job={jobInFocus.job}
          onClose={() => setJobInFocus(null)}
          onSubmit={handleFinalizeJob}
        />
      )}
      {jobInFocus?.action === 'dispute' &&
        (() => {
          // For creating a new dispute, we need a different modal
          // This is a temporary workaround - proper modal should accept onSubmit
          const mockDispute: Dispute = {
            id: 'temp',
            jobId: jobInFocus.job.id,
            initiatorId: user.email,
            status: 'aberta',
            reason: '',
            createdAt: new Date().toISOString(),
            messages: [],
          };
          return (
            <DisputeModal
              job={jobInFocus.job}
              user={user}
              dispute={mockDispute}
              onClose={() => setJobInFocus(null)}
              onSendMessage={text => handleOpenDispute({ reason: 'Disputa', description: text })}
            />
          );
        })()}
      {jobInFocus?.action === 'dispute-details' &&
        (() => {
          const dispute = allDisputes.find(d => d.jobId === jobInFocus.job.id);
          if (!dispute) return null;
          return (
            <DisputeDetailsModal
              isOpen={true}
              job={jobInFocus.job}
              dispute={dispute}
              currentUser={user}
              client={user}
              provider={allUsers.find(u => u.email === jobInFocus.job.providerId)!}
              onClose={() => setJobInFocus(null)}
              onSendMessage={handleSendDisputeMessage}
            />
          );
        })()}
      {isAddItemModalOpen && (
        <AddItemModal onClose={() => setIsAddItemModalOpen(false)} onSave={handleSaveItem} />
      )}
      {viewingItem && (
        <ItemDetailModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onServiceRequest={item => {
            onNewJobFromItem(
              `Preciso de manutenção para meu ${item.name} (${item.brand} ${item.model}).`
            );
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

      {/* AI Assistant Widget (single instance retained above) */}
      {/* Duplicate instance removed to prevent double mounting */}
      {/* Modal simples de edição de perfil */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-600"
              aria-label="Fechar"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-4">Completar Perfil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  name="name"
                  defaultValue={user.name}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  name="email"
                  defaultValue={user.email}
                  disabled
                  className="w-full rounded-md border-gray-300 bg-gray-100 text-gray-600 shadow-sm text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  name="address"
                  defaultValue={user.address}
                  placeholder="Rua, nº, bairro"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  name="whatsapp"
                  defaultValue={user.whatsapp}
                  placeholder="(DDD) 9 9999-9999"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização (cidade)
                </label>
                <input
                  name="location"
                  defaultValue={user.location}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereços adicionais (um por linha) — opcional
                </label>
                <textarea
                  name="addressesExtra"
                  defaultValue={(user.addresses || []).join('\n')}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF (opcional)
                </label>
                <input
                  name="cpf"
                  defaultValue={user.cpf}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (opcional)
                </label>
                <textarea
                  name="bio"
                  defaultValue={user.bio}
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Opcional. Você pode adicionar detalhes sobre você quando preferir.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
