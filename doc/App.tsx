// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';
import { User, Job, Proposal, Message, MaintainedItem, Notification, Bid, FraudAlert, JobData, SentimentAlert } from './types';
import { MOCK_USERS, MOCK_JOBS, MOCK_PROPOSALS, MOCK_MESSAGES, MOCK_ITEMS, MOCK_NOTIFICATIONS, MOCK_BIDS, MOCK_FRAUD_ALERTS } from './mockData';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

import Login from './components/Login';
import ProviderOnboarding from './components/ProviderOnboarding';
import AIJobRequestWizard from './components/AIJobRequestWizard';
import ClientDashboard from './components/ClientDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import AdminDashboard from './components/AdminDashboard';
import JobDetails from './components/JobDetails';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import DisputeModal from './components/DisputeModal';
import ReviewModal from './components/ReviewModal';
import ServiceCatalogModal from './components/ServiceCatalogModal';
import AddItemModal from './components/AddItemModal';
import JobLocationModal from './components/JobLocationModal';
import PublicProfilePage from './components/PublicProfilePage';
import DisputeAnalysisModal from './components/DisputeAnalysisModal';
import ItemDetailsPage from './ItemDetailsPage';

const App: React.FC = () => {
  // State Management
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [items, setItems] = useState<MaintainedItem[]>(MOCK_ITEMS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bids, setBids] = useState<Bid[]>(MOCK_BIDS);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>(MOCK_FRAUD_ALERTS);
  const [sentimentAlerts, setSentimentAlerts] = useState<SentimentAlert[]>([]);

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

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        const token = await firebaseUser.getIdToken();
        // User is signed in, fetch profile from our backend API
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${firebaseUser.email}`);
        if (!response.ok) {
          console.error("Failed to fetch user profile.");
          await signOut(auth);
          return;
        }
        const userData: User = await response.json();

        if (userData) {
          setCurrentUser(userData);
          setAuthToken(token);
          // If there's a pending job, submit it now that the user is logged in
          if (pendingJobData) {
            handleJobSubmit({ ...pendingJobData, clientId: userData.email }, true);
            setPendingJobData(null);
          }

          // Redirect based on user type and status
          if (userData.type === 'provider' && userData.verificationStatus !== 'verificado') {
            navigate('/onboarding');
          } else if (userData.type === 'cliente') {
            navigate('/dashboard');
          } else if (userData.type === 'prestador') {
            navigate('/dashboard');
          } else if (userData.type === 'admin') {
            navigate('/admin');
          }
        } else {
          // Handle case where user exists in Firebase Auth but not in our 'users' collection
          // This could trigger a user creation flow. For now, we log out.
          await signOut(auth);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setAuthToken(null);
        if (location.pathname !== '/login') navigate('/');
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [pendingJobData]); // Rerun if pendingJobData changes

  // Listen for navigation state from PublicProfilePage
  useEffect(() => {
    if (location.state?.action === 'requestQuote' && location.state?.targetProviderId) {
      // Open the wizard with the target provider ID pre-filled
      setIsWizardOpen(true);
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchJobs = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs`);
      const jobsData: Job[] = await response.json();
      setJobs(jobsData);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const fetchItems = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/maintained-items/${currentUser.email}`);
      const itemsData: MaintainedItem[] = await response.json();
      setItems(itemsData);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  };

  // Fetch jobs from the backend API when a user logs in
  useEffect(() => {
    if (currentUser) {
      fetchJobs();
      if (currentUser.type === 'cliente') {
        fetchItems();
      }
    }
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      const [usersResponse, fraudAlertsResponse, disputesResponse, sentimentAlertsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users`),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/fraud-alerts`),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/disputes`),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/sentiment-alerts`),
      ]);
      const usersData: User[] = await usersResponse.json();
      const fraudAlertsData: FraudAlert[] = await fraudAlertsResponse.json();
      const disputesData: Dispute[] = await disputesResponse.json();
      const sentimentAlertsData: SentimentAlert[] = await sentimentAlertsResponse.json();
      setUsers(usersData);
      setFraudAlerts(fraudAlertsData);
      setDisputes(disputesData);
      setSentimentAlerts(sentimentAlertsData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
  };

  // Fetch admin-specific data (all users, all fraud alerts)
  useEffect(() => {
    if (currentUser?.type === 'admin') {
      fetchAdminData();
    }
  }, [currentUser]);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleJobSubmit = async (jobData: JobData, fromPending = false) => {
    if (!currentUser && !fromPending) {
      // User is not logged in, save job data and prompt for login
      setPendingJobData(jobData);
      setIsWizardOpen(false);
      navigate('/login');
      return;
    }

    const finalClientId = currentUser?.email || jobData.clientId;

    const newJobPayload = {
      ...jobData,
      clientId: finalClientId, // Ensure the client ID is set
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobPayload),
      });
      if (!response.ok) throw new Error('Failed to create job.');
      setIsWizardOpen(false);
      await fetchJobs(); // Refresh the jobs list
    } catch (error) {
      console.error("Error submitting job:", error);
      alert("Houve um erro ao criar seu serviço. Tente novamente.");
    }
  };

  const handleLandingSearch = (query: string) => {
    setInitialPrompt(query);
    setIsWizardOpen(true);
  };

  const handleSaveItem = async (newItemData: Omit<MaintainedItem, 'id' | 'clientId' | 'maintenanceHistory' | 'createdAt'>) => {
    if (!currentUser) return;
    const payload = {
      ...newItemData,
      clientId: currentUser.email,
    };
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/maintained-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save item.');
      setIsAddItemModalOpen(false);
      await fetchItems(); // Refresh the items list
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Houve um erro ao salvar o item.");
    }
  };

  const handleSendMessage = async (text: string, jobId: string) => {
    if (!currentUser || !jobId) return;

    const messagePayload = {
      chatId: jobId,
      senderId: currentUser.email,
      text,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
      });
      if (!response.ok) throw new Error('Failed to send message.');
      // The JobDetailsPage will handle its own data refresh
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAcceptProposal = async (proposalId: string, jobId: string) => {
    if (!currentUser || !jobId) return;

    const proposalToAccept = proposals.find(p => p.id === proposalId);
    if (!proposalToAccept) {
      console.error("Proposal not found");
      return;
    }

    try {
      // 1. Update the job with the provider and new status
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_progresso', providerId: proposalToAccept.providerId }),
      });

      // 2. Update the proposal status
      await fetch(`http://localhost:8081/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aceita' }),
      });

      // 3. Refresh all data
      await fetchJobs();
      // The JobDetailsPage will handle its own data refresh
    } catch (error) {
      console.error("Error accepting proposal:", error);
      alert("Houve um erro ao aceitar a proposta. Tente novamente.");
    }
  };

  const handlePayment = async (job: Job, amount: number) => {
    if (!stripe) {
      console.error("Stripe.js has not loaded yet.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, amount }),
      });

      const session = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId: session.id });

      if (result.error) {
        alert(result.error.message);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/release-payment`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao concluir o serviço.');
      }
      await fetchJobs(); // Refresh job list to show 'concluido'
    } catch (error) {
      console.error("Error completing job:", error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    }
  };

  const handleOpenDispute = async (jobId: string, reason: string) => {
    if (!currentUser) return;
    try {
      // 1. Create the dispute record
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, initiatorId: currentUser.email, reason, description: reason }),
      });

      // 2. Update the job status
      await fetch(`http://localhost:8081/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_disputa' }),
      });

      await fetchJobs(); // Refresh job list
      setDisputeJobId(null); // Close modal
    } catch (error) {
      console.error("Error opening dispute:", error);
      alert("Houve um erro ao abrir a disputa. Tente novamente.");
    }
  };

  const handleVerification = async (userId: string, newStatus: 'verificado' | 'recusado') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update user verification status.');
      
      // Refresh admin data to update the list
      await fetchAdminData();
      alert(`Usuário ${newStatus === 'verificado' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
      console.error("Error during user verification:", error);
      alert("Houve um erro ao processar a verificação.");
    }
  };

  const handleReviewSubmit = async (jobId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    try {
      const reviewPayload = {
        review: { rating, comment, authorId: currentUser.email, createdAt: new Date().toISOString() }
      };
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload),
      });
      await fetchJobs();
      setReviewJobId(null);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Houve um erro ao enviar sua avaliação.");
    }
  };

  const triggerFraudAnalysis = async (provider: User, contextAction: { type: string, data: any }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/api/analyze-provider-behavior`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, contextAction }),
      });
      const analysisResult: FraudAlert | null = await response.json();

      if (analysisResult && analysisResult.isSuspicious) {
        // If suspicious, create a fraud alert in our database
        await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/fraud-alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: provider.email,
            riskScore: analysisResult.riskScore,
            reason: analysisResult.reason,
          }),
        });
        console.log(`Fraud alert created for provider ${provider.email}`);
        // Optionally, refresh admin data if admin is logged in
        if (currentUser?.type === 'admin') {
          await fetchAdminData();
        }
      }
    } catch (error) {
      // This should not block the user's action, so we just log the error.
      console.error("Error during background fraud analysis:", error);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: 'release_to_provider' | 'refund_client', comment: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, comment }),
      });
      if (!response.ok) throw new Error('Failed to resolve dispute.');
      
      await fetchJobs();
      await fetchAdminData(); // Refresh disputes list
    } catch (error) {
      console.error("Error resolving dispute:", error);
      alert("Houve um erro ao resolver a disputa.");
    }
  };

  const handleResolveFraudAlert = async (alertId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/fraud-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revisado' }),
      });
      // Refresh admin data to update the list
      await fetchAdminData();
    } catch (error) {
      console.error("Error resolving fraud alert:", error);
      alert("Houve um erro ao resolver o alerta.");
    }
  };

  const handleConfirmSchedule = async (jobId: string, date: string, time: string) => {
    try {
      // 1. Update job status and scheduled date
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'agendado', scheduledDate: scheduledDateTime.toISOString() }),
      });

      // 2. Post system message to chat
      const formattedDate = scheduledDateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      const systemMessage = `✅ Serviço agendado para ${formattedDate} às ${time}.`;
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: jobId, senderId: 'system', text: systemMessage }),
      });
    } catch (error) {
      console.error("Error confirming schedule:", error);
    }
  };

  const handleSaveServiceCatalog = async (updatedCatalog: ProviderService[]) => {
    if (!currentUser) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/${currentUser.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceCatalog: updatedCatalog }),
      });
      // Refresh user data to reflect the change
      const response = await fetch(`http://localhost:8081/users/${currentUser.email}`);
      const userData: User = await response.json();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error saving service catalog:", error);
    }
  };

  const renderDashboard = () => {
    if (!currentUser) return <Navigate to="/login" />;
    switch (currentUser.type) {
      case 'cliente':
        return <ClientDashboard user={currentUser} jobs={jobs} items={items} onLogout={handleLogout} onCreateJob={() => setIsWizardOpen(true)} onViewMap={setMapJobId} onAddItem={() => setIsAddItemModalOpen(true)} />;
      case 'prestador':
        return <ProviderDashboard user={currentUser} jobs={jobs} onLogout={handleLogout} onSaveCatalog={handleSaveServiceCatalog} />;
      default:
        return <Navigate to="/" />; // Should not happen
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
      <main className="container mx-auto p-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage onSearch={handleLandingSearch} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/provider/:providerId" element={<PublicProfilePage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute isAllowed={!!currentUser} />}>
            <Route path="/dashboard" element={renderDashboard()} />
            <Route path="/job/:jobId" element={
              <JobDetailsPage 
                currentUser={currentUser!} 
                authToken={authToken}
                onAcceptProposal={handleAcceptProposal} 
                onSendMessage={handleSendMessage}
                onPay={handlePayment}
                onCompleteJob={handleCompleteJob} 
                onOpenDispute={() => setDisputeJobId(jobId)}
                onOpenReview={() => setReviewJobId(jobId)}
                onConfirmSchedule={handleConfirmSchedule}
              />
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'provider'}>
                <ProviderOnboarding user={currentUser!} />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'admin'}>
                <AdminDashboard user={currentUser!} users={users} jobs={jobs} fraudAlerts={fraudAlerts} disputes={disputes} sentimentAlerts={sentimentAlerts} onLogout={handleLogout} onVerifyUser={handleVerification} onResolveDispute={handleResolveDispute} onResolveFraudAlert={handleResolveFraudAlert} />
              </ProtectedRoute>
            } />
            <Route path="/item/:itemId" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'cliente'}>
                <ItemDetailsPage currentUser={currentUser!} authToken={authToken} />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>

        {isWizardOpen && (
          <AIJobRequestWizard 
            onClose={() => setIsWizardOpen(false)}
            initialData={{ targetProviderId: location.state?.targetProviderId }}
            initialPrompt={initialPrompt || undefined}
            onSubmit={handleJobSubmit}
          />
        )}
        {disputeJobId && (
          <DisputeModal 
            jobId={disputeJobId}
            onClose={() => setDisputeJobId(null)}
            onSubmit={handleOpenDispute}
          />
        )}
        {reviewJobId && (
          <ReviewModal 
            jobId={reviewJobId}
            onClose={() => setReviewJobId(null)}
            onSubmit={handleReviewSubmit}
          />
        )}
        {isAddItemModalOpen && (
          <AddItemModal 
            onClose={() => setIsAddItemModalOpen(false)}
            onSave={handleSaveItem}
          />
        )}
        {mapJobId && (
          <JobLocationModal
            job={jobs.find(j => j.id === mapJobId)!}
            client={users.find(u => u.email === jobs.find(j => j.id === mapJobId)?.clientId)!}
            provider={users.find(u => u.email === jobs.find(j => j.id === mapJobId)?.providerId)!}
            onClose={() => setMapJobId(null)}
          />
        )}
      </main>
    </div>
  );
};

// A new component to manage its own data fetching for the details page
const JobDetailsPage: React.FC<{ currentUser: User, authToken: string | null, onAcceptProposal: any, onSendMessage: any, onPay: any, onCompleteJob: any, onOpenDispute: any, onOpenReview: any, onConfirmSchedule: any }> = ({ currentUser, authToken, onAcceptProposal, onSendMessage, onPay, onCompleteJob, onOpenDispute, onOpenReview, onConfirmSchedule }) => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<{ date: string; time: string } | null>(null);

  const fetchData = async () => {
    if (!jobId) return;
    try {
      const [jobResponse, proposalsResponse, messagesResponse] = await Promise.all([
        fetch(`http://localhost:8081/jobs/${jobId}`),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/proposals?jobId=${jobId}`),
        fetch(`http://localhost:8081/messages/${jobId}`)
      ]);
      setJob(await jobResponse.json());
      setProposals(await proposalsResponse.json());
      setMessages(await messagesResponse.json());

      // After fetching messages, ask AI for suggestion
      const freshMessages = await messagesResponse.clone().json(); // Clone to read body again
      if (freshMessages.length > 2) { // Only analyze if there's some conversation
        const scheduleResponse = await fetch(`${import.meta.env.VITE_AI_API_URL}/api/propose-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: freshMessages }),
        });
        setAiSuggestion(await scheduleResponse.json());
      }
    } catch (error) {
      console.error("Failed to fetch job details", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const handleSendMessageWrapper = async (text: string) => {
    await onSendMessage(text, jobId);
    fetchData(); // Re-fetch data to show new message
  };

  const handleConfirmScheduleWrapper = async () => {
    if (!aiSuggestion) return;
    await onConfirmSchedule(jobId, aiSuggestion.date, aiSuggestion.time);
    setAiSuggestion(null); // Hide suggestion card
    fetchData(); // Refresh all data
  };

  const handleSetOnTheWay = async (jobId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/set-on-the-way`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to update status.');
      // The JobDetailsPage will refresh its own data to show the new status
    } catch (error) {
      console.error("Error setting 'on the way' status:", error);
      alert("Houve um erro ao atualizar o status.");
    }
  };

  if (!job) return <LoadingSpinner />;

  return <JobDetails job={job} proposals={proposals} messages={messages} currentUser={currentUser} authToken={authToken} onBack={() => navigate(-1)} onAcceptProposal={(propId: string) => onAcceptProposal(propId, jobId)} onSendMessage={handleSendMessageWrapper} onPay={onPay} onCompleteJob={onCompleteJob} onOpenDispute={onOpenDispute} onOpenReview={onOpenReview} onSetOnTheWay={handleSetOnTheWay} aiSuggestion={aiSuggestion} onConfirmSchedule={handleConfirmScheduleWrapper} />;
};

export default App;