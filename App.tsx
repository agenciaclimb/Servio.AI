// FIX: Create the main App component
// FIX: Import useState and useEffect from React to resolve 'Cannot find name' errors.
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ClientDashboard from './components/ClientDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import AIJobRequestWizard from './components/AIJobRequestWizard';
import MatchingResultsModal from './components/MatchingResultsModal';
import ProspectingNotificationModal from './components/ProspectingNotificationModal';
import ProfilePage from './components/ProfilePage';
import ServiceLandingPage from './components/ServiceLandingPage';
import ProviderLandingPage from './components/ProviderLandingPage';
import FindProvidersPage from './components/FindProvidersPage'; // FIX: Import FindProvidersPage

import {
  User,
  Job,
  Proposal,
  Message,
  Notification,
  Escrow,
  FraudAlert,
  Dispute,
  MatchingResult,
  MaintainedItem,
  UserType,
  JobData,
  Prospect,
  Bid,
} from './types';
import { getMatchingProviders, analyzeProviderBehaviorForFraud } from './services/geminiService';
// FIX: Import mock data and correct serviceNameToCategory import
import { MOCK_USERS, MOCK_JOBS, MOCK_PROPOSALS, MOCK_MESSAGES, MOCK_ITEMS, MOCK_NOTIFICATIONS, MOCK_BIDS, MOCK_FRAUD_ALERTS } from './mockData';
import { serviceNameToCategory } from './services/geminiService';

type View =
  | { name: 'home' }
  | { name: 'dashboard' }
  | { name: 'profile'; data: { userId: string, isPublic?: boolean } }
  | { name: 'service-landing'; data: { category: string, location?: string } }
  | { name: 'provider-landing' }
  | { name: 'find-providers' }; // FIX: Update view type

const App: React.FC = () => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>({ name: 'home' });
  
  // Modals
  const [authModal, setAuthModal] = useState<{ mode: 'login' | 'register'; userType: UserType } | null>(null);
  const [wizardData, setWizardData] = useState<{ prompt?: string; data?: JobData } | null>(null);
  const [matchingResults, setMatchingResults] = useState<MatchingResult[] | null>(null);
  const [prospects, setProspects] = useState<Prospect[] | null>(null);

  // Mock Data State
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [allJobs, setAllJobs] = useState<Job[]>(MOCK_JOBS);
  const [allProposals, setAllProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [allMessages, setAllMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [maintainedItems, setMaintainedItems] = useState<MaintainedItem[]>(MOCK_ITEMS);
  const [allNotifications, setAllNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [allBids, setAllBids] = useState<Bid[]>(MOCK_BIDS);
  const [allEscrows, setAllEscrows] = useState<Escrow[]>([]);
  const [allFraudAlerts, setAllFraudAlerts] = useState<FraudAlert[]>(MOCK_FRAUD_ALERTS);
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  
  const [jobDataToCreate, setJobDataToCreate] = useState<JobData | null>(null);
  const [contactProviderAfterLogin, setContactProviderAfterLogin] = useState<string|null>(null);

  // Simple URL-based routing effect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('profile');
    const serviceCategory = params.get('servico');
    const serviceLocation = params.get('local');

    if (profileId) {
      setView({ name: 'profile', data: { userId: profileId, isPublic: !currentUser } });
    } else if (serviceCategory) {
       setView({ name: 'service-landing', data: { category: serviceCategory, location: serviceLocation || undefined } });
    } else {
       // setView({ name: 'home' }); // Avoid resetting view on every render
    }
  }, [currentUser]); // Re-evaluate when user logs in/out


  const handleSetView = (viewName: string, data?: any) => {
    // Clear URL params when navigating away from a public page
    if (view.name === 'profile' || view.name === 'service-landing') {
        window.history.pushState({}, '', window.location.pathname);
    }
    setView({ name: viewName as any, data });
  }

  // Auth Handlers
  const handleAuthSuccess = (email: string, type: UserType) => {
    let user = allUsers.find(u => u.email === email);
    if (!user) {
        // Create a new user for registration
        user = {
            email,
            name: email.split('@')[0],
            type: type,
            bio: '',
            location: 'São Paulo, SP',
            memberSince: new Date().toISOString(),
            status: 'ativo',
            verificationStatus: type === 'prestador' ? 'pendente' : undefined
        };
        setAllUsers(prev => [...prev, user!]);
    }
    setCurrentUser(user);
    setAuthModal(null);

    // If user wanted to contact a provider, handle that now
    if (contactProviderAfterLogin) {
        handleLoginToContact(contactProviderAfterLogin);
        setContactProviderAfterLogin(null);
    } else if (jobDataToCreate) {
        // If there was a job being created, open the wizard now
        setWizardData({ data: jobDataToCreate });
        setJobDataToCreate(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    handleSetView('home');
  };

  const handleSmartSearch = (prompt: string) => {
    setWizardData({ prompt });
  };
  
  const handleNewJobFromItem = (prompt: string) => {
      setWizardData({ prompt });
  }

  const handleUpdateUser = (userEmail: string, partial: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.email === userEmail ? { ...u, ...partial } : u));
    if (currentUser?.email === userEmail) {
      setCurrentUser(prev => prev ? { ...prev, ...partial } : prev);
    }
    setAllNotifications(prev => ([
      ...prev,
      {
        id: `notif-profile-${Date.now()}`,
        userId: userEmail,
        text: 'Seu perfil foi atualizado com sucesso.',
        isRead: false,
        createdAt: new Date(),
      }
    ]));
  }

  const handleWizardSubmit = async (jobData: JobData) => {
    if (!currentUser) {
        // If user isn't logged in, save the data and show login modal
        setJobDataToCreate(jobData);
        setAuthModal({ mode: 'login', userType: 'cliente' });
        setWizardData(null);
        return;
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      clientId: currentUser.email,
      description: jobData.description,
      category: jobData.category,
      serviceType: jobData.serviceType,
      urgency: jobData.urgency,
      address: jobData.address,
      media: jobData.media,
      fixedPrice: jobData.fixedPrice,
      visitFee: jobData.visitFee,
      status: jobData.jobMode === 'leilao' ? 'em_leilao' : 'ativo',
      createdAt: new Date(),
      jobMode: jobData.jobMode || 'normal',
      auctionEndDate: jobData.jobMode === 'leilao' && jobData.auctionDurationHours 
        ? new Date(Date.now() + jobData.auctionDurationHours * 60 * 60 * 1000).toISOString()
        : undefined,
    };
    setAllJobs(prev => [newJob, ...prev]);
    setWizardData(null);

    // If it was a direct invitation, notify the provider and redirect to dashboard
    if (jobData.targetProviderId) {
        const provider = allUsers.find(u => u.email === jobData.targetProviderId);
        if (provider) {
             setAllNotifications(prev => [...prev, {
                id: `notif-direct-${Date.now()}`,
                userId: jobData.targetProviderId!,
                text: `Você recebeu um convite direto de ${currentUser.name} para o job "${newJob.category}".`,
                isRead: false,
                createdAt: new Date(),
            }]);
            alert(`✅ Ótimo! Seu pedido foi enviado diretamente para ${provider.name}.\n\nEles serão notificados e você receberá uma proposta em breve.`);
            setView({ name: 'dashboard' });
        }
        return;
    }
    
    if (newJob.jobMode === 'leilao') {
      alert(`✅ Seu leilão para "${newJob.category}" foi publicado!\n\nFica ativo até ${new Date(newJob.auctionEndDate!).toLocaleString('pt-BR')}.\n\nPrestadores começarão a enviar lances em breve.`);
      setView({ name: 'dashboard' });
      return;
    }

    // AI Matching (normal flow)
    try {
      const results = await getMatchingProviders(newJob, allUsers, allJobs);
      if (results.length > 0) {
        setMatchingResults(results);
      } else {
         setProspects([{name: "João da Silva", specialty: "Eletricista"}, {name: "Marcos Andrade", specialty: "Eletricista Predial"}]);
      }
    } catch (error) {
       console.error("Matching failed:", error);
       alert("Ocorreu um erro ao buscar profissionais. Tente novamente.");
    }
  };
  
  const handleInviteProvider = (providerId: string) => {
      const job = allJobs[0]; // Assume the last created job
      setAllNotifications(prev => [...prev, {
          id: `notif-invite-${Date.now()}`,
          userId: providerId,
          text: `Você foi convidado para o job "${job.category}"`,
          isRead: false,
          createdAt: new Date(),
      }]);
  };
  
  const handleLoginToContact = (providerId: string) => {
      const provider = allUsers.find(u => u.email === providerId);
      if (!provider) return;

      if (!currentUser) {
          setContactProviderAfterLogin(providerId);
          setAuthModal({ mode: 'login', userType: 'cliente' });
          return;
      }
      
      const prompt = `Preciso de um serviço de ${provider.headline || provider.specialties?.[0] || 'profissional'}.`;
      setWizardData({ prompt, data: { ...({} as JobData), targetProviderId: providerId } });
  };
  
  const handlePlaceBid = async (jobId: string, amount: number) => {
    if (!currentUser || currentUser.type !== 'prestador') return;
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    const newBid: Bid = {
        id: `bid-${Date.now()}`,
        jobId,
        providerId: currentUser.email,
        amount,
        createdAt: new Date().toISOString(),
    };
    setAllBids(prev => [...prev, newBid]);
    
    // Notify the client
    setAllNotifications(prev => [...prev, {
        id: `notif-bid-${Date.now()}`,
        userId: job.clientId,
        text: `Novo lance de ${amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} no seu leilão para "${job.category}"!`,
        isRead: false,
        createdAt: new Date(),
    }]);

    // Fraud check
    try {
        const analysis = await analyzeProviderBehaviorForFraud(currentUser, { type: 'bid', data: newBid });
        if (analysis?.isSuspicious) {
            const newAlert: FraudAlert = {
                id: `fra-${Date.now()}`,
                providerId: currentUser.email,
                riskScore: analysis.riskScore,
                reason: analysis.reason,
                status: 'novo',
                createdAt: new Date().toISOString(),
            };
            setAllFraudAlerts(prev => [newAlert, ...prev]);
        }
    } catch (error) {
        console.error("Fraud analysis failed during bid:", error);
    }
  };


  const renderContent = () => {
    switch (view.name) {
      case 'dashboard':
        if (!currentUser) { handleSetView('home'); return null; }
  if (currentUser.type === 'cliente') return <ClientDashboard user={currentUser} allJobs={allJobs} allUsers={allUsers} allProposals={allProposals} allMessages={allMessages} maintainedItems={maintainedItems} allDisputes={allDisputes} allBids={allBids} setAllJobs={setAllJobs} setAllProposals={setAllProposals} setAllMessages={setAllMessages} setAllNotifications={setAllNotifications} onViewProfile={(userId) => handleSetView('profile', {userId})} setAllEscrows={setAllEscrows} setAllDisputes={setAllDisputes} setMaintainedItems={setMaintainedItems} onNewJobFromItem={handleNewJobFromItem} onUpdateUser={handleUpdateUser} />;
        if (currentUser.type === 'prestador') return <ProviderDashboard user={currentUser} allJobs={allJobs} allUsers={allUsers} allProposals={allProposals} allMessages={allMessages} allDisputes={allDisputes} allBids={allBids} setAllJobs={setAllJobs} setAllProposals={setAllProposals} setAllMessages={setAllMessages} setAllNotifications={setAllNotifications} onViewProfile={(userId) => handleSetView('profile', {userId})} setUsers={setAllUsers} setAllFraudAlerts={setAllFraudAlerts} setAllDisputes={setAllDisputes} onPlaceBid={handlePlaceBid} />;
        if (currentUser.type === 'admin') return <AdminDashboard user={currentUser} allJobs={allJobs} allUsers={allUsers} allProposals={allProposals} allFraudAlerts={allFraudAlerts} allEscrows={allEscrows} allDisputes={allDisputes} setAllFraudAlerts={setAllFraudAlerts} setAllUsers={setAllUsers} setAllJobs={setAllJobs} setAllEscrows={setAllEscrows} setAllDisputes={setAllDisputes} setAllNotifications={setAllNotifications} />;
        return null;
      case 'profile':
        const profileUser = allUsers.find(u => u.email === view.data.userId);
        if (!profileUser) return <div>Perfil não encontrado.</div>;
        return <ProfilePage user={profileUser} allJobs={allJobs} allUsers={allUsers} onBackToDashboard={() => handleSetView('dashboard')} isPublicView={!!view.data.isPublic} onLoginToContact={handleLoginToContact} />;
      case 'service-landing':
          return <ServiceLandingPage category={view.data.category} location={view.data.location} allUsers={allUsers} serviceNameToCategory={serviceNameToCategory} />;
      case 'provider-landing':
          return <ProviderLandingPage onRegisterClick={() => setAuthModal({mode: 'register', userType: 'prestador'})} />;
      // FIX: Add case for find-providers view
      case 'find-providers':
          return <FindProvidersPage allUsers={allUsers} allJobs={allJobs} onViewProfile={(userId) => handleSetView('profile', { userId, isPublic: !currentUser })} onContact={handleLoginToContact} />;
      case 'home':
      default:
        return (
          <div>
            <HeroSection onSmartSearch={handleSmartSearch} />
          </div>
        );
    }
  };

  const userNotifications = currentUser ? allNotifications.filter(n => n.userId === currentUser.email) : [];

  // Listener: abrir wizard a partir do chat IA (Cliente)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<JobData>;
      setWizardData({ data: custom.detail });
    };
    window.addEventListener('open-wizard-from-chat', handler as EventListener);
    return () => window.removeEventListener('open-wizard-from-chat', handler as EventListener);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      <Header
        user={currentUser}
        notifications={userNotifications}
        onLoginClick={(type) => setAuthModal({ mode: 'login', userType: type })}
        onRegisterClick={(type) => setAuthModal({ mode: 'register', userType: type })}
        onLogoutClick={handleLogout}
        onSetView={handleSetView}
        onMarkAsRead={(id) => setAllNotifications(allNotifications.map(n => n.id === id ? {...n, isRead: true} : n))}
        onMarkAllAsRead={() => setAllNotifications(allNotifications.map(n => n.userId === currentUser?.email ? {...n, isRead: true} : n))}
      />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {renderContent()}
        </div>
      </main>

      {authModal && (
        <AuthModal
          mode={authModal.mode}
          userType={authModal.userType}
          onClose={() => setAuthModal(null)}
          onSwitchMode={(newMode) => setAuthModal({ ...authModal, mode: newMode })}
          onSuccess={handleAuthSuccess}
        />
      )}
      
      {wizardData && (
        <AIJobRequestWizard 
            onClose={() => setWizardData(null)}
            onSubmit={handleWizardSubmit}
            initialPrompt={wizardData.prompt}
            initialData={wizardData.data}
        />
      )}

      {matchingResults && (
        <MatchingResultsModal 
            results={matchingResults}
            onClose={() => {
              setMatchingResults(null);
              setView({ name: 'dashboard' });
            }}
            onInvite={handleInviteProvider}
        />
      )}
      
      {prospects && (
        <ProspectingNotificationModal
            prospects={prospects}
            onClose={() => {
              setProspects(null);
              setView({ name: 'dashboard' });
            }}
        />
      )}
    </div>
  );
};

export default App;