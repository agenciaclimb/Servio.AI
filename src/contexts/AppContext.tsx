import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';
import { User, Job, Proposal, Message, MaintainedItem, Notification, Bid, FraudAlert, JobData, Dispute, ProviderService, StaffRole, Escrow } from '../../types';
import { api } from '../lib/api';
import { aiApi } from '../lib/aiApi';
import { requestForToken } from '../firebaseMessaging';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

// Define the shape of the context value
interface IAppContext {
  currentUser: User | null;
  authToken: string | null;
  isLoading: boolean;
  users: User[];
  jobs: Job[];
  proposals: Proposal[];
  messages: Message[];
  items: MaintainedItem[];
  notifications: Notification[];
  bids: Bid[];
  disputes: Dispute[];
  fraudAlerts: FraudAlert[];
  sentimentAlerts: any[];
  metrics: { userGrowth: any[], jobCreation: any[], revenue: any[] };
  escrows: Escrow[];
  isWizardOpen: boolean;
  disputeJobId: string | null;
  reviewJobId: string |null;
  isAddItemModalOpen: boolean;
  mapJobId: string | null;
  
  // Functions
  handleLogout: () => void;
  handleJobSubmit: (jobData: JobData, fromPending?: boolean) => Promise<void>;
  handleLandingSearch: (query: string) => void;
  handleSaveItem: (newItemData: Omit<MaintainedItem, 'id' | 'clientId' | 'maintenanceHistory' | 'createdAt'>) => Promise<void>;
  handleSendMessage: (text: string, jobId: string) => Promise<void>;
  handleAcceptProposal: (proposalId: string, jobId: string) => Promise<void>;
  handlePayment: (job: Job, amount: number) => Promise<void>;
  handleCompleteJob: (jobId: string) => Promise<void>;
  handleOpenDispute: (jobId: string, reason: string) => Promise<void>;
  handleVerification: (userId: string, newStatus: 'verificado' | 'recusado') => Promise<void>;
  handleReviewSubmit: (jobId: string, rating: number, comment: string) => Promise<void>;
  handleResolveDispute: (disputeId: string, resolution: 'release_to_provider' | 'refund_client', comment: string) => Promise<void>;
  handleResolveFraudAlert: (alertId: string) => Promise<void>;
  handleConfirmSchedule: (jobId: string, date: string, time: string) => Promise<void>;
  handleAddStaff: (newStaffData: { name: string; email: string; role: StaffRole }) => Promise<void>;
  handleSaveServiceCatalog: (updatedCatalog: ProviderService[]) => Promise<void>;
  handleMarkAsPaid: (escrowId: string) => Promise<void>;
  handleStartTrial: () => Promise<void>;
  handleRequestNotificationPermission: () => Promise<void>;
  fetchJobs: () => Promise<void>;
  fetchAdminData: () => Promise<void>;
  fetchDataForJobDetails: (jobId: string) => Promise<{ job: Job, proposals: Proposal[], messages: Message[] }>;

  // Modal Setters
  setIsWizardOpen: (isOpen: boolean) => void;
  setDisputeJobId: (jobId: string | null) => void;
  setReviewJobId: (jobId: string | null) => void;
  setIsAddItemModalOpen: (isOpen: boolean) => void;
  setMapJobId: (jobId: string | null) => void;

  // Landing search -> Wizard prompt
  initialPrompt?: string | null;
  setInitialPrompt?: (value: string | null) => void;
}

const AppContext = createContext<IAppContext | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // All state from App.tsx is moved here
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [items, setItems] = useState<MaintainedItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [sentimentAlerts, setSentimentAlerts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ userGrowth: [], jobCreation: [], revenue: [] });
  const [escrows, setEscrows] = useState<Escrow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [disputeJobId, setDisputeJobId] = useState<string | null>(null);
  const [reviewJobId, setReviewJobId] = useState<string | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [pendingJobData, setPendingJobData] = useState<JobData | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [mapJobId, setMapJobId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const stripe = useStripe();

  // All handler functions from App.tsx are moved here
  const fetchJobs = async () => {
    if (!authToken) return;
    try {
      const jobsData = await api.get<Job[]>('/jobs');
      setJobs(jobsData || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const fetchItems = async () => {
    if (!currentUser || !authToken) return;
    try {
      const itemsData = await api.get<MaintainedItem[]>(`/maintained-items?clientId=${currentUser.email}`);
      setItems(itemsData || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  };

  const fetchAdminData = async () => {
    if (!authToken) return;
    try {
      const [usersResponse, fraudAlertsResponse, disputesResponse, sentimentAlertsResponse, escrowsRes, userGrowthRes, jobCreationRes, revenueRes] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<FraudAlert[]>('/fraud-alerts'),
        api.get<Dispute[]>('/disputes'),
        api.get<any[]>('/sentiment-alerts'),
        api.get<Escrow[]>('/escrows'),
        api.get<any[]>('/metrics/user-growth'),
        api.get<any[]>('/metrics/job-creation'),
        api.get<any[]>('/metrics/revenue'),
      ]);
      setUsers(usersResponse || []);
      setFraudAlerts(fraudAlertsResponse || []);
      setDisputes(disputesResponse || []);
      setSentimentAlerts(sentimentAlertsResponse || []);
      setEscrows(escrowsRes || []);
      setMetrics({
        userGrowth: userGrowthRes || [],
        jobCreation: jobCreationRes || [],
        revenue: revenueRes || [],
      });
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
  };

  const fetchDataForJobDetails = async (jobId: string) => {
    if (!authToken) throw new Error("Not authenticated");
    const [jobResponse, proposalsResponse, messagesResponse] = await Promise.all([
        api.get<Job>(`/jobs/${jobId}`),
        api.get<Proposal[]>(`/proposals?jobId=${jobId}`),
        api.get<Message[]>(`/jobs/${jobId}/messages`)
    ]);
    return {
        job: jobResponse,
        proposals: proposalsResponse || [],
        messages: messagesResponse || [],
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        const token = await firebaseUser.getIdToken();
        setAuthToken(token);
        api.setAuthToken(token);
        aiApi.setAuthToken(token);
        try {
            const userData = await api.get<User>(`/users/${firebaseUser.email}`);
            setCurrentUser(userData);

            if (pendingJobData) {
                handleJobSubmit({ ...pendingJobData, clientId: userData.email } as any, true);
                setPendingJobData(null);
            }

            if (userData.type === 'prestador' && userData.verificationStatus !== 'verificado') {
                navigate('/onboarding');
            } else {
                navigate(location.pathname === '/' || location.pathname === '/login' ? '/dashboard' : location.pathname);
            }
        } catch (error) {
            console.error("Login failed:", error);
            await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setAuthToken(null);
        api.setAuthToken(null);
        aiApi.setAuthToken(null);
        if (location.pathname !== '/' && !location.pathname.startsWith('/servicos')) navigate('/');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [pendingJobData]);

  useEffect(() => {
      if (currentUser) {
      fetchJobs();
      if (currentUser.type === 'cliente') fetchItems();
        if (currentUser.type === 'staff') fetchAdminData();
    }
  }, [currentUser, authToken]);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleJobSubmit = async (jobData: JobData, fromPending = false) => {
    if (!currentUser && !fromPending) {
      setPendingJobData(jobData);
      setIsWizardOpen(false);
      navigate('/login');
      return;
    }
    const finalClientId = currentUser?.email || (jobData as any).clientId;
    const newJobPayload = { ...jobData, clientId: finalClientId };

    try {
      const created = await api.post<Job>('/jobs', newJobPayload);
      setIsWizardOpen(false);
      // Limpa prompt inicial após submissão
      setInitialPrompt(null);
      await fetchJobs();
      // Redireciona para detalhes do job recém-criado (melhor conversão)
      if (created && (created as any).id) {
        navigate(`/job/${(created as any).id}`);
      } else if (!fromPending) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error submitting job:", error);
    }
  };

  const handleLandingSearch = (query: string) => {
    setInitialPrompt(query);
    setIsWizardOpen(true);
  };

  const handleSaveItem = async (newItemData: Omit<MaintainedItem, 'id' | 'clientId' | 'maintenanceHistory' | 'createdAt'>) => {
    if (!currentUser || !authToken) return;
    const payload = { ...newItemData, clientId: currentUser.email };
    try {
      await api.post('/maintained-items', payload);
      setIsAddItemModalOpen(false);
      await fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleSendMessage = async (text: string, jobId: string) => {
    if (!currentUser || !authToken) return;
    const messagePayload = { chatId: jobId, senderId: currentUser.email, text };
    try {
      await api.post(`/jobs/${jobId}/messages`, messagePayload);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAcceptProposal = async (proposalId: string, jobId: string) => {
    if (!currentUser || !authToken) return;
    const proposalToAccept = proposals.find(p => p.id === proposalId);
    if (!proposalToAccept) return;

    try {
      await api.put(`/jobs/${jobId}`, { status: 'em_progresso', providerId: proposalToAccept.providerId });
      await api.put(`/proposals/${proposalId}`, { status: 'aceita' });
      await fetchJobs();
    } catch (error) {
      console.error("Error accepting proposal:", error);
    }
  };

  const handlePayment = async (job: Job, amount: number) => {
    if (!stripe || !authToken) return;
    try {
      const session = await api.post<{ id: string }>('/create-checkout-session', { job, amount });
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error("Error initiating payment:", error);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!authToken) return;
    try {
      await api.post(`/jobs/${jobId}/complete`);
      await fetchJobs();
    } catch (error) {
      console.error("Error completing job:", error);
    }
  };

  const handleOpenDispute = async (jobId: string, reason: string) => {
    if (!currentUser || !authToken) return;
    try {
      await api.post('/disputes', { jobId, initiatorId: currentUser.email, reason });
      await api.put(`/jobs/${jobId}`, { status: 'em_disputa' });
      await fetchJobs();
      setDisputeJobId(null);
    } catch (error) {
      console.error("Error opening dispute:", error);
    }
  };

  const handleVerification = async (userId: string, newStatus: 'verificado' | 'recusado') => {
    if (!authToken) return;
    try {
      await api.put(`/users/${userId}`, { verificationStatus: newStatus });
      await fetchAdminData();
    } catch (error) {
      console.error("Error during user verification:", error);
    }
  };

  const handleReviewSubmit = async (jobId: string, rating: number, comment: string) => {
    if (!currentUser || !authToken) return;
    try {
      const reviewPayload = { review: { rating, comment, authorId: currentUser.email, createdAt: new Date().toISOString() } };
      await api.put(`/jobs/${jobId}`, reviewPayload);
      await fetchJobs();
      setReviewJobId(null);
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: 'release_to_provider' | 'refund_client', comment: string) => {
    if (!authToken) return;
    try {
      await api.post(`/disputes/${disputeId}/resolve`, { resolution, comment });
      await fetchJobs();
      await fetchAdminData();
    } catch (error) {
      console.error("Error resolving dispute:", error);
    }
  };

  const handleResolveFraudAlert = async (alertId: string) => {
    if (!authToken) return;
    try {
      await api.put(`/fraud-alerts/${alertId}`, { status: 'revisado' });
      await fetchAdminData();
    } catch (error) {
      console.error("Error resolving fraud alert:", error);
    }
  };

  const handleMarkAsPaid = async (escrowId: string) => {
    if (!authToken) return;
    try {
      await api.post(`/admin/payments/${escrowId}/mark-paid`);
      await fetchAdminData();
    } catch (error) {
      console.error("Error marking escrow as paid:", error);
    }
  };

  const handleConfirmSchedule = async (jobId: string, date: string, time: string) => {
    if (!authToken) return;
    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      await api.put(`/jobs/${jobId}`, { status: 'agendado', scheduledDate: scheduledDateTime.toISOString() });
      const systemMessage = `✅ Serviço agendado para ${scheduledDateTime.toLocaleDateString('pt-BR')} às ${time}.`;
      await api.post(`/jobs/${jobId}/messages`, { senderId: 'system', text: systemMessage });
    } catch (error) {
      console.error("Error confirming schedule:", error);
    }
  };

  const handleSaveServiceCatalog = async (updatedCatalog: ProviderService[]) => {
    if (!currentUser || !authToken) return;
    try {
      await api.put(`/users/${currentUser.email}`, { serviceCatalog: updatedCatalog });
      const updatedUser = await api.get<User>(`/users/${currentUser.email}`);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error("Error saving service catalog:", error);
    }
  };

  const handleAddStaff = async (newStaffData: { name: string; email: string; role: StaffRole }) => {
    if (!currentUser || currentUser.role !== 'super_admin' || !authToken) {
      throw new Error("Permission denied.");
    }
    try {
      await api.post('/staff', newStaffData);
      await fetchAdminData();
    } catch (error) {
      console.error("Error adding staff member:", error);
    }
  };

  const handleStartTrial = async () => {
    if (!currentUser || !authToken) {
      throw new Error("Usuário não autenticado.");
    }
    try {
      await api.post(`/users/${currentUser.email}/start-trial`);
      // Recarrega os dados do usuário para refletir o status 'trialing'
      const updatedUser = await api.get<User>(`/users/${currentUser.email}`);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error("Error starting trial:", error);
      throw error; // Re-throw para que o componente possa lidar com isso (ex: mostrar um alerta)
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!currentUser || !authToken) return;

    const fcmToken = await requestForToken();
    if (fcmToken) {
      // Evita adicionar tokens duplicados
      const currentTokens = currentUser.fcmTokens || [];
      if (!currentTokens.includes(fcmToken)) {
        const updatedTokens = [...currentTokens, fcmToken];
        try {
          await api.put(`/users/${currentUser.email}`, { fcmTokens: updatedTokens });
          // Atualiza o estado local do usuário
          setCurrentUser(prev => prev ? { ...prev, fcmTokens: updatedTokens } : null);
        } catch (error) {
          console.error("Failed to save FCM token:", error);
        }
      }
    }
  };

  const value: IAppContext = {
    currentUser,
    authToken,
    isLoading,
    users,
    jobs,
    proposals,
    messages,
    items,
    notifications,
    bids,
    disputes,
    fraudAlerts,
    sentimentAlerts,
    metrics,
    escrows,
    isWizardOpen,
    disputeJobId,
    reviewJobId,
    isAddItemModalOpen,
    mapJobId,
    handleLogout,
    handleJobSubmit,
    handleLandingSearch,
    handleSaveItem,
    handleSendMessage,
    handleAcceptProposal,
    handlePayment,
    handleCompleteJob,
    handleOpenDispute,
    handleVerification,
    handleReviewSubmit,
    handleResolveDispute,
    handleResolveFraudAlert,
    handleConfirmSchedule,
    handleAddStaff,
    handleMarkAsPaid,
    handleStartTrial,
    handleRequestNotificationPermission,
    handleSaveServiceCatalog,
    fetchJobs,
    fetchAdminData,
    fetchDataForJobDetails,
    setIsWizardOpen,
    setDisputeJobId,
    setReviewJobId,
    setIsAddItemModalOpen,
    setMapJobId,
    // Expor prompt inicial para o App usar no Wizard
    initialPrompt,
    setInitialPrompt,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};