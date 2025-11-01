import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';
import { User, Job, Proposal, Message, MaintainedItem, Notification, Bid, FraudAlert, JobData, Dispute, ProviderService, StaffRole } from '../../types';
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
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      const jobsData: Job[] = await response.json();
      setJobs(jobsData);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const fetchItems = async () => {
    if (!currentUser || !authToken) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/maintained-items?clientId=${currentUser.email}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      const itemsData: MaintainedItem[] = await response.json();
      setItems(itemsData);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  };

  const fetchAdminData = async () => {
    if (!authToken) return;
    try {
      const [usersResponse, fraudAlertsResponse, disputesResponse, sentimentAlertsResponse, userGrowthRes, jobCreationRes, revenueRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/fraud-alerts`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/disputes`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/sentiment-alerts`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/metrics/user-growth`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/metrics/job-creation`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/metrics/revenue`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
      ]);
      setUsers(await usersResponse.json());
      setFraudAlerts(await fraudAlertsResponse.json());
      setDisputes(await disputesResponse.json());
      setSentimentAlerts(await sentimentAlertsResponse.json());
      setMetrics({
        userGrowth: await userGrowthRes.json(),
        jobCreation: await jobCreationRes.json(),
        revenue: await revenueRes.json(),
      });
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
  };

  const fetchDataForJobDetails = async (jobId: string) => {
    if (!authToken) throw new Error("Not authenticated");
    const headers = { 'Authorization': `Bearer ${authToken}` };
    const [jobResponse, proposalsResponse, messagesResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, { headers }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/proposals?jobId=${jobId}`, { headers }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages/${jobId}`, { headers })
    ]);
    return {
        job: await jobResponse.json(),
        proposals: await proposalsResponse.json(),
        messages: await messagesResponse.json(),
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        const token = await firebaseUser.getIdToken();
        setAuthToken(token);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${firebaseUser.email}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error("User not found in DB");
            const userData: User = await response.json();
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
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(newJobPayload),
      });
      if (!response.ok) throw new Error('Failed to create job.');
      setIsWizardOpen(false);
      await fetchJobs();
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
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/maintained-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
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
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(messagePayload),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAcceptProposal = async (proposalId: string, jobId: string) => {
    if (!currentUser || !authToken) return;
    const proposalToAccept = proposals.find(p => p.id === proposalId);
    if (!proposalToAccept) return;

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: 'em_progresso', providerId: proposalToAccept.providerId }),
      });
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: 'aceita' }),
      });
      await fetchJobs();
    } catch (error) {
      console.error("Error accepting proposal:", error);
    }
  };

  const handlePayment = async (job: Job, amount: number) => {
    if (!stripe || !authToken) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ job, amount }),
      });
      const session = await response.json();
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error("Error initiating payment:", error);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!authToken) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/release-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      await fetchJobs();
    } catch (error) {
      console.error("Error completing job:", error);
    }
  };

  const handleOpenDispute = async (jobId: string, reason: string) => {
    if (!currentUser || !authToken) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ jobId, initiatorId: currentUser.email, reason }),
      });
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: 'em_disputa' }),
      });
      await fetchJobs();
      setDisputeJobId(null);
    } catch (error) {
      console.error("Error opening dispute:", error);
    }
  };

  const handleVerification = async (userId: string, newStatus: 'verificado' | 'recusado') => {
    if (!authToken) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ verificationStatus: newStatus }),
      });
      await fetchAdminData();
    } catch (error) {
      console.error("Error during user verification:", error);
    }
  };

  const handleReviewSubmit = async (jobId: string, rating: number, comment: string) => {
    if (!currentUser || !authToken) return;
    try {
      const reviewPayload = { review: { rating, comment, authorId: currentUser.email, createdAt: new Date().toISOString() } };
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(reviewPayload),
      });
      await fetchJobs();
      setReviewJobId(null);
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: 'release_to_provider' | 'refund_client', comment: string) => {
    if (!authToken) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ resolution, comment }),
      });
      await fetchJobs();
      await fetchAdminData();
    } catch (error) {
      console.error("Error resolving dispute:", error);
    }
  };

  const handleResolveFraudAlert = async (alertId: string) => {
    if (!authToken) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/fraud-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: 'revisado' }),
      });
      await fetchAdminData();
    } catch (error) {
      console.error("Error resolving fraud alert:", error);
    }
  };

  const handleConfirmSchedule = async (jobId: string, date: string, time: string) => {
    if (!authToken) return;
    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: 'agendado', scheduledDate: scheduledDateTime.toISOString() }),
      });
      const systemMessage = `✅ Serviço agendado para ${scheduledDateTime.toLocaleDateString('pt-BR')} às ${time}.`;
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ chatId: jobId, senderId: 'system', text: systemMessage }),
      });
    } catch (error) {
      console.error("Error confirming schedule:", error);
    }
  };

  const handleSaveServiceCatalog = async (updatedCatalog: ProviderService[]) => {
    if (!currentUser || !authToken) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${currentUser.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ serviceCatalog: updatedCatalog }),
      });
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${currentUser.email}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      setCurrentUser(await response.json());
    } catch (error) {
      console.error("Error saving service catalog:", error);
    }
  };

  const handleAddStaff = async (newStaffData: { name: string; email: string; role: StaffRole }) => {
    if (!currentUser || currentUser.role !== 'super_admin' || !authToken) {
      throw new Error("Permission denied.");
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(newStaffData),
      });
      if (!response.ok) throw new Error('Failed to add staff member.');
      await fetchAdminData(); // Refresh the list of users
    } catch (error) {
      console.error("Error adding staff member:", error);
    }
  };

  const handleStartTrial = async () => {
    if (!currentUser || !authToken) {
      throw new Error("Usuário não autenticado.");
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${currentUser.email}/start-trial`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao iniciar o período de teste.');
      }
      // Recarrega os dados do usuário para refletir o status 'trialing'
      const userResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${currentUser.email}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      setCurrentUser(await userResponse.json());
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
          await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${currentUser.email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ fcmTokens: updatedTokens }),
          });
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