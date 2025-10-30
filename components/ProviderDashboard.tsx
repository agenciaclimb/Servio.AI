import React, { useState } from 'react';
import { Job, User, Proposal, FraudAlert, Dispute, JobStatus, Notification, Message, ScheduledDateTime, DisputeMessage, Bid } from '../types';
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

interface ProviderDashboardProps {
  user: User;
  allJobs: Job[];
  allUsers: User[];
  allProposals: Proposal[];
  allMessages: Message[];
  allDisputes: Dispute[];
  allBids: Bid[];
  setAllJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  setAllProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  setAllMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setAllNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onViewProfile: (userId: string) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setAllFraudAlerts: React.Dispatch<React.SetStateAction<FraudAlert[]>>;
  setAllDisputes: React.Dispatch<React.SetStateAction<Dispute[]>>;
  onPlaceBid: (jobId: string, amount: number) => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  user, allJobs, allUsers, allProposals, allMessages, allDisputes, allBids,
  setAllProposals, setAllNotifications, setUsers, setAllJobs, setAllMessages, setAllDisputes, setAllFraudAlerts,
  onPlaceBid
}) => {
  const [proposingForJob, setProposingForJob] = useState<Job | null>(null);
  const [viewingAuctionForJob, setViewingAuctionForJob] = useState<Job | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [referralEmail, setReferralEmail] = useState<{subject: string, body: string} | null>(null);
  const [chattingWithJob, setChattingWithJob] = useState<Job | null>(null);

  if (user.verificationStatus !== 'verificado') {
    return <ProviderOnboarding user={user} setUsers={setUsers} />;
  }

  // Jobs provider has proposed on
  const proposedJobIds = allProposals.filter(p => p.providerId === user.email).map(p => p.jobId);
  const biddedJobIds = allBids.filter(b => b.providerId === user.email).map(b => b.jobId);
  
  // Jobs available for provider to propose on
  const availableJobs = allJobs.filter(job => (job.status === 'ativo' || job.status === 'em_leilao') && job.clientId !== user.email);

  // Jobs assigned to the provider
  const myJobs = allJobs.filter(job => job.providerId === user.email && job.status !== 'concluido' && job.status !== 'cancelado');
  
  const completedJobs = allJobs.filter(job => job.providerId === user.email && job.status === 'concluido');

  const handleSendProposal = async (proposalData: { message: string; price: number }) => {
    if (!proposingForJob) return;

    const newProposal: Proposal = {
      id: `prop-${Date.now()}`,
      jobId: proposingForJob.id,
      providerId: user.email,
      ...proposalData,
      status: 'pendente',
      createdAt: new Date().toISOString()
    };
    setAllProposals(prev => [...prev, newProposal]);
    setAllNotifications(prev => [...prev, {
      id: `notif-${Date.now()}`,
      userId: proposingForJob.clientId,
      text: `Você recebeu uma nova proposta para "${proposingForJob.category}".`,
      isRead: false,
      createdAt: new Date(),
    }]);

    setProposingForJob(null);

    // Fraud check
    try {
        const analysis = await analyzeProviderBehaviorForFraud(user, { type: 'proposal', data: newProposal });
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
        console.error("Fraud analysis failed during proposal:", error);
    }
  };
  
  const handleSaveProfile = async (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData };
    setUsers(prev => prev.map(u => u.email === user.email ? updatedUser : u));
    setIsProfileModalOpen(false);

    // Fraud check
    try {
        const analysis = await analyzeProviderBehaviorForFraud(updatedUser, { type: 'profile_update', data: updatedData });
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
        console.error("Fraud analysis failed during profile update:", error);
    }
  };

  const handleUpdateJobStatus = (jobId: string, newStatus: JobStatus) => {
    setAllJobs(prev => prev.map(j => j.id === jobId ? {...j, status: newStatus} : j));
    const job = allJobs.find(j => j.id === jobId);
    if(job) {
       setAllNotifications(prev => [...prev, {
        id: `notif-${Date.now()}`,
        userId: job.clientId,
        text: `Atualização no seu job: ${user.name} está ${newStatus.replace('_', ' ')}.`,
        isRead: false,
        createdAt: new Date(),
      }]);

       const statusUpdateMessage: Message = {
        id: `msg-system-status-${Date.now()}`,
        chatId: jobId,
        senderId: 'system',
        text: `Status atualizado para: ${newStatus.replace('_', ' ')}`,
        createdAt: new Date().toISOString(),
        type: 'system_notification',
      };
      setAllMessages(prev => [...prev, statusUpdateMessage]);
    }
  };
  
  const handleSendReferral = async (friendEmail: string) => {
    try {
        const emailContent = await generateReferralEmail(user.name, friendEmail);
        setReferralEmail(emailContent);
        // In a real app, you'd send the email here.
        console.log(`Referral sent to ${friendEmail}`);
    } catch (error) {
        alert("Failed to generate referral email.");
    }
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
       setAllNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`,
            userId: job.clientId,
            text: `Nova mensagem de ${user.name} sobre o job "${job.category}".`,
            isRead: false,
            createdAt: new Date(),
        }]);
    }
  };

  const handleConfirmSchedule = (jobId: string, schedule: ScheduledDateTime, messageId?: string) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    // 1. Update Job Status
    setAllJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'agendado' } : j)));
    
    const formattedDate = new Date(`${schedule.date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
    setAllNotifications(prev => [...prev, {
        id: `notif-${Date.now()}`,
        userId: job.clientId,
        text: `Agendamento confirmado por ${user.name} para o job "${job.category}"!`,
        isRead: false,
        createdAt: new Date(),
    }]);

    // 4. Mark the proposal message as confirmed
    if (messageId) {
        setAllMessages(prev => prev.map(m => m.id === messageId ? { ...m, isScheduleConfirmed: true } : m));
    }
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
        if (job) {
            setAllNotifications(prev => [...prev, {
                id: `notif-dispute-${Date.now()}`,
                userId: job.clientId,
                text: `Nova mensagem na disputa do job "${job.category}".`,
                isRead: false,
                createdAt: new Date(),
            }]);
        }
    };

    const handleJobClick = (job: Job) => {
        if (job.jobMode === 'leilao') {
            setViewingAuctionForJob(job);
        } else {
            setProposingForJob(job);
        }
    };


  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProfileStrength user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
          </div>
          <div className="flex flex-col space-y-4">
              <ProfileTips user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
              <ReferralProgram onSendReferral={handleSendReferral} />
          </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Meus Serviços em Andamento</h2>
        {myJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oportunidades Disponíveis</h2>
        {availableJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                bids={allBids.filter(b => b.jobId === job.id)}
                onProposeClick={() => handleJobClick(job)}
                hasProposed={job.jobMode === 'leilao' ? biddedJobIds.includes(job.id) : proposedJobIds.includes(job.id)}
              />
            ))}
          </div>
        ) : (
           <div className="text-center py-10 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-600">Nenhuma oportunidade nova no momento. Volte em breve!</p>
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
          bids={allBids.filter(b => b.jobId === viewingAuctionForJob.id)}
          onClose={() => setViewingAuctionForJob(null)}
          onPlaceBid={onPlaceBid}
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
        />
      )}
    </div>
  );
};

export default ProviderDashboard;