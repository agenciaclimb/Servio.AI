import React, { useState } from 'react';

import type { Job, User, FraudAlert, JobStatus, Message, ScheduledDateTime } from '../types';
import { useToast } from '../contexts/ToastContext';
import JobCard from './JobCard';
import ProposalModal from './ProposalModal';
import ProviderJobCard from './ProviderJobCard';
import ProfileStrength from './ProfileStrength';
import ProfileTips from './ProfileTips';
import ReferralProgram from './ReferralProgram';
import ProfileModal from './ProfileModal';
import ReferralInvitationModal from './ReferralInvitationModal';
import { generateReferralEmail, analyzeProviderBehaviorForFraud } from '../services/geminiService';
import ChatModal from './ChatModal';
import ProviderOnboarding from './ProviderOnboarding';
import AuctionRoomModal from './AuctionRoomModal';
import ProviderDashboardSkeleton from './skeletons/ProviderDashboardSkeleton';
import PaymentSetupCard from './PaymentSetupCard';
import ProviderEarningsCard from './ProviderEarningsCard';
import { useProviderDashboardData } from './useProviderDashboardData';

import * as API from '../services/api';

interface ProviderDashboardProps {
  user: User;
  // onViewProfile: (userId: string) => void; // removed (future feature placeholder)
  onPlaceBid?: (jobId: string, amount: number) => void;
  onUpdateUser?: (userEmail: string, partial: Partial<User>) => void;
  /** Quando true, desativa o fluxo de onboarding. Útil para testes unitários. */
  disableOnboarding?: boolean;
  /** Quando true, desativa a exibição do skeleton inicial. Útil para testes unitários. */
  disableSkeleton?: boolean;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  user,
  // onViewProfile,
  onPlaceBid,
  onUpdateUser,
  disableOnboarding = false,
  disableSkeleton = false,
}) => {
  const { addToast } = useToast();
  const { data, setters, isLoading } = useProviderDashboardData(user);
  const { availableJobs, myJobs, completedJobs, myProposals, myBids, allUsers, allMessages } = data;
  const { setMyJobs, setMyProposals, setAllMessages } = setters;

  const [proposingForJob, setProposingForJob] = useState<Job | null>(null);
  const [viewingAuctionForJob, setViewingAuctionForJob] = useState<Job | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [referralEmail, setReferralEmail] = useState<{ subject: string; body: string } | null>(
    null
  );
  const [chattingWithJob, setChattingWithJob] = useState<Job | null>(null);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  // Filters for available jobs
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [locationFilter, setLocationFilter] = useState<string>('');
  // Fraud alerts serão implementados posteriormente
  const [_fraudAlerts, setAllFraudAlerts] = useState<FraudAlert[]>([]);

  const handleOnboardingComplete = () => {
    // Recarregar a página para atualizar o estado do usuário
    globalThis.location.reload();
  };

  // Novo fluxo: permitir acesso ao dashboard, verificação acontece ao enviar proposta
  // Se recusado, mostrar tela de onboarding para reenviar documentos
  if (user.verificationStatus === 'recusado' && !disableOnboarding) {
    return <ProviderOnboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  // Jobs provider has proposed on
  const proposedJobIds = new Set(myProposals.map(p => p.jobId));
  const biddedJobIds = new Set(myBids.map(b => b.jobId));

  // Filter available jobs
  const filteredJobs = availableJobs.filter(job => {
    const matchesCategory = categoryFilter === 'Todos' || job.category === categoryFilter;
    const matchesLocation =
      !locationFilter ||
      job.location?.address?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      job.location?.city?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesCategory && matchesLocation;
  });

  // Get unique categories from available jobs
  const categories = ['Todos', ...new Set(availableJobs.map(j => j.category))];

  const handleSendProposal = async (proposalData: { message: string; price: number }) => {
    if (!proposingForJob) return;

    // Verificar se o usuário está verificado antes de enviar proposta
    if (user.verificationStatus !== 'verificado') {
      setProposingForJob(null);
      addToast('Para enviar propostas, você precisa verificar sua identidade primeiro.', 'warning');
      setShowVerificationPrompt(true);
      return;
    }

    try {
      // Create proposal via API
      const newProposal = await API.createProposal({
        jobId: proposingForJob.id,
        providerId: user.email,
        message: proposalData.message,
        price: proposalData.price,
        status: 'pendente',
      });

      setMyProposals(prev => [...prev, newProposal]);

      // Notify client
      API.createNotification({
        userId: proposingForJob.clientId,
        text: `Você recebeu uma nova proposta para "${proposingForJob.category}".`,
        isRead: false,
      });

      setProposingForJob(null);

      // Fraud check
      const analysis = await analyzeProviderBehaviorForFraud(user, {
        type: 'proposal',
        data: newProposal as unknown as Record<string, unknown>,
      });
      if (analysis?.isSuspicious) {
        const newAlert: FraudAlert = {
          id: `fra-${Date.now()}`,
          providerId: user.email,
          riskScore: analysis.riskScore,
          reason: analysis.reason,
          status: 'novo',
          createdAt: new Date().toISOString(),
        };
        setAllFraudAlerts((prev: FraudAlert[]) => [newAlert, ...prev]);
      }
    } catch (error) {
      addToast('Erro ao enviar proposta. Tente novamente.', 'error');
      setProposingForJob(null);
    }
  };

  const handleSaveProfile = async (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData };
    try {
      await API.updateUser(user.email, updatedData);
      // Atualizar o estado local do usuário se o callback foi fornecido
      onUpdateUser?.(user.email, updatedData);
      addToast('Perfil atualizado com sucesso.', 'success');
      setIsProfileModalOpen(false);
    } catch (e) {
      console.error('Erro ao salvar perfil:', e);
      addToast('Falha ao salvar seu perfil. Tente novamente em instantes.', 'error');
      // Mantém o modal aberto para permitir nova tentativa
    }

    // Fraud check
    try {
      const analysis = await analyzeProviderBehaviorForFraud(updatedUser, {
        type: 'profile_update',
        data: updatedData as unknown as Record<string, unknown>,
      });
      if (analysis?.isSuspicious) {
        const newAlert: FraudAlert = {
          id: `fra-${Date.now()}`,
          providerId: user.email,
          riskScore: analysis.riskScore,
          reason: analysis.reason,
          status: 'novo',
          createdAt: new Date().toISOString(),
        };
        setAllFraudAlerts(prev => [newAlert, ...prev]);
      }
    } catch (error) {
      /* Intentionally ignored - análise de fraude é best-effort */
    }
  };

  const handleUpdateJobStatus = (jobId: string, newStatus: JobStatus) => {
    const job = myJobs.find(j => j.id === jobId);
    if (!job) return;

    const updatedJob = { ...job, status: newStatus };
    setMyJobs(prev => prev.map(j => (j.id === jobId ? updatedJob : j)));

    API.updateJob(jobId, { status: newStatus });

    API.createNotification({
      userId: job.clientId,
      text: `Atualização no seu job: ${user.name} está ${newStatus.replace('_', ' ')}.`,
      isRead: false,
    });

    const statusUpdateMessage: Message = {
      id: `msg-system-status-${Date.now()}`,
      chatId: jobId,
      senderId: 'system',
      text: `Status atualizado para: ${newStatus.replace('_', ' ')}`,
      createdAt: new Date().toISOString(),
      type: 'system_notification',
    };
    setAllMessages(prev => [...prev, statusUpdateMessage]);
  };

  const handleSendReferral = async (friendEmail: string) => {
    try {
      const emailContent = await generateReferralEmail(user.name, friendEmail);
      setReferralEmail(emailContent);
      // In a real app, you'd send the email here.
    } catch (error) {
      addToast('Falha ao gerar e-mail de indicação.', 'error');
    }
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

      // Send notification to the client
      const job = myJobs.find(j => j.id === messageData.chatId);
      if (job) {
        await API.createNotification({
          userId: job.clientId,
          text: `Nova mensagem de ${user.name} sobre o job "${job.category}".`,
          isRead: false,
        });
      }
    } catch (error) {
      addToast('Erro ao enviar mensagem. Tente novamente.', 'error');
    }
  };

  const handleConfirmSchedule = (
    jobId: string,
    schedule: ScheduledDateTime,
    messageId?: string
  ) => {
    const job = myJobs.find(j => j.id === jobId);
    if (!job) return;

    // 1. Update Job Status
    const updatedJob = { ...job, status: 'agendado' as JobStatus };
    setMyJobs(prev => prev.map(j => (j.id === jobId ? updatedJob : j)));
    API.updateJob(jobId, { status: 'agendado' });

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
      senderId: 'system',
      text: confirmationText,
      createdAt: new Date().toISOString(),
      type: 'system_notification',
    };
    setAllMessages(prev => [...prev, systemMessage]);

    // 3. Notify the Client
    API.createNotification({
      userId: job.clientId,
      text: `Agendamento confirmado por ${user.name} para o job "${job.category}"!`,
      isRead: false,
    });

    // 4. Mark the proposal message as confirmed
    if (messageId) {
      setAllMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, isScheduleConfirmed: true } : m))
      );
    }
  };

  const handleJobClick = (job: Job) => {
    if (job.jobMode === 'leilao') {
      setViewingAuctionForJob(job);
    } else {
      setProposingForJob(job);
    }
  };

  if (isLoading && !disableSkeleton) {
    return <ProviderDashboardSkeleton />;
  }

  // Se usuário precisa verificação e o prompt foi acionado, mostrar onboarding
  if (showVerificationPrompt && user.verificationStatus !== 'verificado') {
    return <ProviderOnboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  // Calculate provider stats
  const totalJobs = completedJobs.length + myJobs.filter(j => j.status === 'concluido').length;
  const allReviews = completedJobs.filter(j => j.review?.rating).map(j => j.review!.rating);
  const averageRating =
    allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r, 0) / allReviews.length : 5.0;
  const currentRate = user.providerRate || 0.85; // Default 85% commission

  return (
    <div className="space-y-10">
      {/* Card de aviso sobre verificação pendente */}
      {user.verificationStatus === 'pendente' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Análise em Andamento</strong> Seus documentos estão sendo analisados. Você
                poderá enviar propostas assim que a verificação for concluída (geralmente em até
                24h).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card de call-to-action para verificação */}
      {user.verificationStatus !== 'verificado' &&
        user.verificationStatus !== 'pendente' &&
        user.verificationStatus !== 'recusado' && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Complete sua verificação:</strong> Para enviar propostas e começar a
                  trabalhar, você precisa verificar sua identidade. É rápido e seguro!
                </p>
                <button
                  onClick={() => setShowVerificationPrompt(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verificar Agora
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Exibe o card de Força do Perfil apenas se não estiver 100% completo */}
      {((user.specialties?.length || 0) === 0 || !user.bio || !user.headline) && (
        <div className="mb-6">
          <ProfileStrength user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Meus Serviços</h2>
        </div>
        <div className="flex flex-col space-y-3 md:space-y-4">
          <ProviderEarningsCard
            completedJobs={completedJobs}
            currentRate={currentRate}
            totalJobs={totalJobs}
            averageRating={averageRating}
          />
          <ProfileTips user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
          <ReferralProgram onSendReferral={handleSendReferral} />
          <PaymentSetupCard user={user} />
        </div>
      </div>

      {myJobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {myJobs.map(job => (
            <ProviderJobCard
              key={job.id}
              job={job}
              client={allUsers.find(u => u.email === job.clientId)}
              onChat={() => setChattingWithJob(job)}
              onUpdateStatus={handleUpdateJobStatus}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-600">Você não tem nenhum serviço em andamento.</p>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Oportunidades Disponíveis</h2>
          <span className="text-sm text-gray-600">{filteredJobs.length} jobs encontrados</span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
          <div className="flex-1 min-w-full sm:min-w-[200px]">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-full sm:min-w-[200px]">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Localização
            </label>
            <input
              type="text"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              placeholder="Cidade ou endereço..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(categoryFilter !== 'Todos' || locationFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCategoryFilter('Todos');
                  setLocationFilter('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                bids={myBids.filter(b => b.jobId === job.id)}
                onProposeClick={() => handleJobClick(job)}
                hasProposed={
                  job.jobMode === 'leilao' ? biddedJobIds.has(job.id) : proposedJobIds.has(job.id)
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-600">
              {availableJobs.length === 0
                ? 'Nenhuma oportunidade nova no momento. Volte em breve!'
                : 'Nenhum job encontrado com os filtros selecionados. Tente ajustar os filtros.'}
            </p>
          </div>
        )}
      </div>

      {proposingForJob && (
        <ProposalModal
          job={proposingForJob}
          provider={user}
          onClose={() => setProposingForJob(null)}
          onSubmit={handleSendProposal}
        />
      )}
      {viewingAuctionForJob && (
        <AuctionRoomModal
          job={viewingAuctionForJob}
          currentUser={user}
          bids={myBids.filter(b => b.jobId === viewingAuctionForJob.id)}
          onClose={() => setViewingAuctionForJob(null)}
          onPlaceBid={onPlaceBid || (() => {})}
        />
      )}
      {isProfileModalOpen && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
      {referralEmail && (
        <ReferralInvitationModal email={referralEmail} onClose={() => setReferralEmail(null)} />
      )}
      {chattingWithJob && (
        <ChatModal
          job={chattingWithJob}
          currentUser={user}
          otherParty={allUsers.find(u => u.email === chattingWithJob.clientId)}
          messages={allMessages.filter(m => m.chatId === chattingWithJob.id)}
          onClose={() => setChattingWithJob(null)}
          onSendMessage={handleSendMessage}
          onConfirmSchedule={handleConfirmSchedule}
          setAllMessages={setAllMessages}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;
