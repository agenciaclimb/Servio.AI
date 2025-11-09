import React, { useState, useEffect } from 'react';
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
import ProviderDashboardSkeleton from './skeletons/ProviderDashboardSkeleton';
import PaymentSetupCard from './PaymentSetupCard';

import * as API from '../services/api';

interface ProviderDashboardProps {
  user: User;
  onViewProfile: (userId: string) => void;
  onPlaceBid: (jobId: string, amount: number) => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  user,
  onViewProfile,
  onPlaceBid,
}) => {
  const [proposingForJob, setProposingForJob] = useState<Job | null>(null);
  const [viewingAuctionForJob, setViewingAuctionForJob] = useState<Job | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [referralEmail, setReferralEmail] = useState<{subject: string, body: string} | null>(null);
  const [chattingWithJob, setChattingWithJob] = useState<Job | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  // Component-specific data states
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);

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
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  const [allFraudAlerts, setAllFraudAlerts] = useState<FraudAlert[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch all necessary data within the component
        const [openJobs, providerJobs, proposals, bids, users, messages] = await Promise.all([
          API.fetchOpenJobs(),
          API.fetchJobsForProvider(user.email),
          API.fetchProposalsForProvider(user.email),
          API.fetchBidsForProvider(user.email),
          API.fetchAllUsers(),
          API.fetchMessages(),
        ]);

        setAvailableJobs(openJobs.filter(j => j.clientId !== user.email));
        setMyJobs(providerJobs.filter(j => !['concluido', 'cancelado'].includes(j.status)));
        setCompletedJobs(providerJobs.filter(j => j.status === 'concluido'));
        setMyProposals(proposals);
        setMyBids(bids);
        setAllUsers(users);
        setAllMessages(messages);
        // Disputes and alerts would also be fetched here if needed globally in this component
        // For now, they are passed as empty arrays or managed via props if still necessary elsewhere.

      } catch (error) {
        console.error("Failed to load provider dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user.verificationStatus === 'verificado') {
      loadDashboardData();
    }
  }, [user.email, user.verificationStatus]);


  if (user.verificationStatus !== 'verificado') {
    return <ProviderOnboarding user={user} />;
  }

  // Jobs provider has proposed on
  const proposedJobIds = myProposals.map(p => p.jobId);
  const biddedJobIds = myBids.map(b => b.jobId);
  
  const handleSendProposal = async (proposalData: { message: string; price: number }) => {
    if (!proposingForJob) return;

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
      console.log('Proposal sent successfully:', newProposal);

      // Fraud check
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
      console.error("Failed to send proposal:", error);
      alert("Erro ao enviar proposta. Tente novamente.");
      setProposingForJob(null);
    }
  };
  
  const handleSaveProfile = async (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData };
    setAllUsers(prev => prev.map(u => u.email === user.email ? updatedUser : u));
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
    const job = myJobs.find(j => j.id === jobId);
    if(!job) return;

    const updatedJob = { ...job, status: newStatus };
    setMyJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    
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
        console.log(`Referral sent to ${friendEmail}`);
    } catch (error) {
        alert("Failed to generate referral email.");
    }
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

      // Send notification to the client
      const job = myJobs.find(j => j.id === messageData.chatId);
      if (job) {
        await API.createNotification({
          userId: job.clientId,
          text: `Nova mensagem de ${user.name} sobre o job "${job.category}".`,
          isRead: false,
        });
      }
      
      console.log('Message sent and saved to Firestore');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  const handleConfirmSchedule = (jobId: string, schedule: ScheduledDateTime, messageId?: string) => {
    const job = myJobs.find(j => j.id === jobId);
    if (!job) return;

    // 1. Update Job Status
    const updatedJob = { ...job, status: 'agendado' as JobStatus };
    setMyJobs(prev => prev.map(j => (j.id === jobId ? updatedJob : j)));
    API.updateJob(jobId, { status: 'agendado' });
    
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
    API.createNotification({
      userId: job.clientId,
      text: `Agendamento confirmado por ${user.name} para o job "${job.category}"!`,
      isRead: false,
    });

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
        const job = myJobs.find(j => j.id === dispute?.jobId);
        if (job) {
            API.createNotification({
              userId: job.clientId,
              text: `Nova mensagem na disputa do job "${job.category}".`,
              isRead: false,
            });
        }
    };

    const handleJobClick = (job: Job) => {
        if (job.jobMode === 'leilao') {
            setViewingAuctionForJob(job);
        } else {
            setProposingForJob(job);
        }
    };

  if (isLoading) {
    return <ProviderDashboardSkeleton />;
  }


  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProfileStrength user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
          </div>
          <div className="flex flex-col space-y-4">
              <ProfileTips user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
              <ReferralProgram onSendReferral={handleSendReferral} />
              <PaymentSetupCard user={user} />
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
                bids={myBids.filter(b => b.jobId === job.id)}
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
          bids={myBids.filter(b => b.jobId === viewingAuctionForJob.id)}
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