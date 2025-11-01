// @ts-nocheck
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { useAppContext } from './AppContext';
import { User, Job, Proposal, Message } from './types';

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
import CategoryLandingPage from './CategoryLandingPage';
import BlogIndexPage from './components/BlogIndexPage';
import BlogPostPage from './components/BlogPostPage';

const App: React.FC = () => {
  const {
    currentUser,
    isLoading,
    isWizardOpen,
    setIsWizardOpen,
    handleJobSubmit,
    handleLandingSearch,
    initialPrompt,
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
  } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();

  // Listen for navigation state from PublicProfilePage
  useEffect(() => {
    if (location.state?.action === 'requestQuote' && location.state?.targetProviderId) {
      // Open the wizard with the target provider ID pre-filled
      setIsWizardOpen(true);
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

      setFraudAlerts(fraudAlertsData);

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
      <main className="container mx-auto p-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage onSearch={handleLandingSearch} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/servicos/:category/:location?" element={<CategoryLandingPage />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/provider/:providerId" element={<PublicProfilePage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute isAllowed={!!currentUser} />}>
            <Route path="/dashboard" element={renderDashboard()} />
            <Route path="/job/:jobId" element={
              <JobDetailsPage />
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'provider'}>
                <ProviderOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'admin'}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/item/:itemId" element={
              <ProtectedRoute isAllowed={currentUser?.type === 'cliente'}>
                <ItemDetailsPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>

        {isWizardOpen && (
          <AIJobRequestWizard 
            onClose={() => setIsWizardOpen(false)}
            initialData={{ targetProviderId: location.state?.targetProviderId } as any}
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
const JobDetailsPage: React.FC = () => {
  const { fetchDataForJobDetails, handleConfirmSchedule } = useAppContext();
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<{ date: string; time: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    await handleConfirmSchedule(jobId!, aiSuggestion.date, aiSuggestion.time);
    setAiSuggestion(null); // Hide suggestion card
    fetchData(); // Refresh all data
  };

  if (isLoading) return <LoadingSpinner />;
  if (!job) return <div>Job não encontrado.</div>;

  return <JobDetails job={job} proposals={proposals} messages={messages} onBack={() => navigate(-1)} onDataRefresh={fetchData} aiSuggestion={aiSuggestion} onConfirmSchedule={handleConfirmScheduleWrapper} />;
};

export default App;