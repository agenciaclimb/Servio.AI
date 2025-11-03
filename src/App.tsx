import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';
import { User, Job, Proposal, Message } from '../types';

// Componentes críticos (carregamento imediato)
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import CategoryLandingPage from './components/CategoryLandingPage';

// Lazy load de componentes pesados (code splitting)
const AIJobRequestWizard = lazy(() => import('./components/AIJobRequestWizard'));
const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
const ProviderDashboard = lazy(() => import('./components/ProviderDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ProviderOnboarding = lazy(() => import('./components/ProviderOnboarding'));
const JobDetails = lazy(() => import('./components/JobDetails'));
const PublicProfilePage = lazy(() => import('./components/PublicProfilePage'));
const ItemDetailsPage = lazy(() => import('./components/ItemDetailsPage'));
const BlogIndexPage = lazy(() => import('./components/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./components/BlogPostPage'));
const BetaWelcomePage = lazy(() => import('./components/BetaWelcomePage'));
const DocumentVerification = lazy(() => import('./components/DocumentVerification'));
const ComparativeAnalysis = lazy(() => import('./components/ComparativeAnalysis'));
const ProposalForm = lazy(() => import('./components/ProposalForm'));

// Modais (lazy load - só carregam quando abertos)
const DisputeModal = lazy(() => import('./components/DisputeModal'));
const ReviewModal = lazy(() => import('./components/ReviewModal'));
const ServiceCatalogModal = lazy(() => import('./components/ServiceCatalogModal'));
const AddItemModal = lazy(() => import('./components/AddItemModal'));
const JobLocationModal = lazy(() => import('./components/JobLocationModal'));
const DisputeAnalysisModal = lazy(() => import('./components/DisputeAnalysisModal'));

// Banners leves (import direto)
import NotificationPermissionBanner from './components/NotificationPermissionBanner';
import TestEnvironmentBanner from './components/TestEnvironmentBanner';
import ReportBugButton from './components/ReportBugButton';
const App: React.FC = () => {
  const {
    currentUser,
    isLoading,
    isWizardOpen,
    setIsWizardOpen,
    handleJobSubmit,
    handleLandingSearch,
    // usar o prompt vindo do contexto para pré-preencher o wizard
    initialPrompt,
    setInitialPrompt,
    disputeJobId,
    setDisputeJobId,
    handleOpenDispute,
    reviewJobId,
    setReviewJobId,
    handleReviewSubmit,
    isAddItemModalOpen,
    setIsAddItemModalOpen,
    handleSaveItem,
    mapJobId,
    setMapJobId,
    jobs,
    users,
    authToken,
    handleAcceptProposal,
    handleSendMessage,
    handlePayment,
    handleCompleteJob,
    handleRequestNotificationPermission,
  } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const isTestEnvironment = import.meta.env.VITE_APP_ENV !== 'production';

  useEffect(() => {
    // Mostra o banner apenas se o usuário estiver logado, o navegador suportar notificações,
    // a permissão ainda não tiver sido concedida e o banner não tiver sido dispensado.
    if (currentUser && 'Notification' in window && Notification.permission === 'default' && sessionStorage.getItem('notificationBannerDismissed') !== 'true') {
      setShowNotificationBanner(true);
    }
  }, [currentUser]);

  // Listen for navigation state from PublicProfilePage
  useEffect(() => {
    if (location.state?.action === 'requestQuote' && location.state?.targetProviderId) {
      // Open the wizard with the target provider ID pre-filled
      setIsWizardOpen(true);
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const renderDashboard = () => {
    if (!currentUser) return <Navigate to="/login" />;
    switch (currentUser.type) {
      case 'cliente':
        return <ClientDashboard />;
      case 'prestador':
        return <ProviderDashboard />;
      default:
        return <Navigate to="/" />; // Should not happen
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {isTestEnvironment && <TestEnvironmentBanner />}
      {isTestEnvironment && <ReportBugButton />}
      <main className="container mx-auto p-4">
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage onSearch={handleLandingSearch} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/servicos/:category/:location?" element={<CategoryLandingPage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/beta-welcome" element={<BetaWelcomePage />} />
            <Route path="/provider/:providerId" element={<PublicProfilePage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute isAllowed={!!currentUser} />}>
            <Route path="/dashboard" element={renderDashboard()} />
            <Route path="/job/:jobId" element={
              <JobDetailsPage />
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'prestador'}>
                <ProviderOnboarding user={currentUser!} />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'staff'}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/item/:itemId" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'cliente'}>
                <ItemDetailsPage currentUser={currentUser!} authToken={authToken!} />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>

        {isWizardOpen && (
          <Suspense fallback={<LoadingSpinner />}>
            <AIJobRequestWizard 
              onClose={() => { setIsWizardOpen(false); setInitialPrompt && setInitialPrompt(null); }}
              initialData={{ targetProviderId: location.state?.targetProviderId } as any}
              initialPrompt={initialPrompt || undefined}
              onSubmit={handleJobSubmit}
            />
          </Suspense>
        )}
        {disputeJobId && (
          <Suspense fallback={<LoadingSpinner />}>
            <DisputeModal 
              jobId={disputeJobId}
              onClose={() => setDisputeJobId(null)}
              onSubmit={handleOpenDispute}
            />
          </Suspense>
        )}
        {reviewJobId && (
          <Suspense fallback={<LoadingSpinner />}>
            <ReviewModal 
              jobId={reviewJobId}
              onClose={() => setReviewJobId(null)}
              onSubmit={handleReviewSubmit}
            />
          </Suspense>
        )}
        {isAddItemModalOpen && (
          <Suspense fallback={<LoadingSpinner />}>
            <AddItemModal 
              onClose={() => setIsAddItemModalOpen(false)}
              onSave={handleSaveItem}
            />
          </Suspense>
        )}
        {mapJobId && (
          <Suspense fallback={<LoadingSpinner />}>
            <JobLocationModal
              job={jobs.find(j => j.id === mapJobId)!}
              client={users.find(u => u.email === jobs.find(j => j.id === mapJobId)?.clientId)!}
              provider={users.find(u => u.email === jobs.find(j => j.id === mapJobId)?.providerId)!}
              onClose={() => setMapJobId(null)}
            />
          </Suspense>
        )}

        {showNotificationBanner && (
          <NotificationPermissionBanner 
            onAllow={async () => {
              await handleRequestNotificationPermission();
              setShowNotificationBanner(false);
            }}
            onDismiss={() => {
              sessionStorage.setItem('notificationBannerDismissed', 'true');
              setShowNotificationBanner(false);
            }}
          />
        )}
        </Suspense>
      </main>
    </div>
  );
};

// A new component to manage its own data fetching for the details page
const JobDetailsPage: React.FC = () => {
  const { 
    currentUser,
    authToken,
    users,
    proposals: allProposals, // Renomear para evitar conflito
    fetchDataForJobDetails, 
    handleConfirmSchedule,
    handleAcceptProposal,
    handleSendMessage,
    handlePayment,
    handleCompleteJob,
    setDisputeJobId,
    setReviewJobId,
  } = useAppContext();
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Usar o hook useLocation

  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<{ date: string; time: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellFeatureName, setUpsellFeatureName] = useState('');

  // Ler o rascunho da proposta do estado da navegação
  const proposalDraft = location.state?.proposalDraft || '';
  const hasProviderProposed = allProposals.some(p => p.jobId === jobId && p.providerId === currentUser?.email);

  const fetchData = async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const { job, proposals, messages } = await fetchDataForJobDetails(jobId);
      setJob(job);
      setProposals(proposals);
      setMessages(messages);
    } catch (error) {
      console.error("Failed to fetch job details", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const handleConfirmScheduleWrapper = async () => {
    if (!aiSuggestion) return;
    await handleConfirmSchedule(jobId, aiSuggestion.date, aiSuggestion.time); // Corrigido
    setAiSuggestion(null); // Hide suggestion card
    fetchData(); // Refresh all data
  };

  const handleProposalSubmit = async (price: number, message: string) => {
    if (!currentUser || !jobId || !authToken) return;
    setIsSubmitting(true);
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          jobId,
          providerId: currentUser.email,
          price,
          message,
        }),
      });
      await fetchData(); // Recarrega os dados para mostrar a nova proposta
    } catch (error) {
      console.error("Failed to submit proposal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpsellClick = (featureName: string) => {
    setUpsellFeatureName(featureName);
    setShowUpsellModal(true);
  };

  const handleRequestDocument = async (documentName: string) => {
    if (!jobId || !authToken) return;
    try {
      // Este endpoint precisará ser criado no backend
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/document-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ documentName }),
      });
      await fetchData(); // Recarrega os dados do job
    } catch (error) {
      console.error("Failed to request document:", error);
    }
  };

  const handleFileUpload = async (requestId: string, file: File) => {
    if (!jobId || !authToken) return;
    try {
      // A lógica de upload de arquivo (get signed URL, upload to GCS) seria semelhante à do AIJobRequestWizard
      // Por simplicidade, vamos simular e chamar um endpoint de atualização
      await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/document-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: 'enviado', fileName: file.name }), // Simulação
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to upload document:", error);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!job) return <div>Job não encontrado.</div>;

  return (
    <JobDetails 
      job={job} 
      proposals={proposals} 
      messages={messages} 
      currentUser={currentUser!}
      authToken={authToken}
      onBack={() => navigate(-1)} 
      onAcceptProposal={(proposalId) => handleAcceptProposal(proposalId, jobId!)}
      onSendMessage={(text) => handleSendMessage(text, jobId!)}
      onPay={(job, amount) => handlePayment(job, amount)}
      onCompleteJob={(jobId) => handleCompleteJob(jobId)}
      onOpenDispute={() => setDisputeJobId(jobId!)}
      onOpenReview={() => setReviewJobId(jobId!)}
      onSetOnTheWay={(jobId) => {/* Implementar se necessário */}}
      // Passa o formulário de proposta como um "filho" para o JobDetails
      proposalFormComponent={
        currentUser?.type === 'prestador' && !job.providerId && !hasProviderProposed ? (
          <ProposalForm 
            initialMessage={proposalDraft}
            onSubmit={handleProposalSubmit}
            isLoading={isSubmitting}
          />
        ) : null
      }
      // Passa o componente de análise comparativa
      analysisComponent={
        currentUser?.type === 'cliente' && proposals.length > 1 ? (
          <ComparativeAnalysis
            proposals={proposals}
            providers={users.filter(u => proposals.some(p => p.providerId === u.email))}
            isSubscribed={currentUser.subscription?.status === 'active' || currentUser.subscription?.status === 'trialing'}
            onUpgradeClick={() => handleUpsellClick('Análise Comparativa de Propostas')}
          />
        ) : null
      }
      // Passa o componente de verificação de documentos
      documentVerificationComponent={
        (currentUser?.type === 'cliente' || currentUser?.email === job.providerId) && job.providerId ? (
          <DocumentVerification
            job={job}
            isSubscribed={currentUser.subscription?.status === 'active' || currentUser.subscription?.status === 'trialing'}
            onUpgradeClick={() => handleUpsellClick('Verificação de Documentos')}
            onRequestDocument={handleRequestDocument}
            onFileUpload={handleFileUpload}
            isClientView={currentUser.type === 'cliente'}
          />
        ) : null
      }
      aiSuggestion={aiSuggestion} 
      onConfirmSchedule={handleConfirmScheduleWrapper}
      onDataRefresh={fetchData}
    />
  );
};

export default App;