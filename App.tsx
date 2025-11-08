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
import FindProvidersPage from './components/FindProvidersPage';

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
import { serviceNameToCategory } from './services/geminiService';
// API Service - loads from backend or falls back to mock data
import * as API from './services/api';

type View =
  | { name: 'home' }
  | { name: 'dashboard' }
  | { name: 'profile'; data: { userId: string, isPublic?: boolean } }
  | { name: 'service-landing'; data: { category: string, location?: string } }
  | { name: 'provider-landing' }
  | { name: 'find-providers' };

const App: React.FC = () => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>({ name: 'home' });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modals
  const [authModal, setAuthModal] = useState<{ mode: 'login' | 'register'; userType: UserType } | null>(null);
  const [wizardData, setWizardData] = useState<{ prompt?: string; data?: JobData } | null>(null);
  const [matchingResults, setMatchingResults] = useState<MatchingResult[] | null>(null);
  const [prospects, setProspects] = useState<Prospect[] | null>(null);

  // Garante que, ao logar, o usuário vá para o dashboard correto
  useEffect(() => {
    console.log('useEffect dashboard redirect', { currentUser, view });
    if (currentUser && view.name !== 'dashboard') {
      setView({ name: 'dashboard' });
    }
  }, [currentUser, view.name]);

  // Data State - minimal global state
  const [maintainedItems, setMaintainedItems] = useState<MaintainedItem[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [allEscrows, setAllEscrows] = useState<Escrow[]>([]);
  const [jobDataToCreate, setJobDataToCreate] = useState<JobData | null>(null);
  const [contactProviderAfterLogin, setContactProviderAfterLogin] = useState<string|null>(null);

  useEffect(() => {
    // Data fetching has been moved to individual dashboards/components.
    // App.tsx is now primarily a router and high-level state manager.
  }, []);

  // Simple URL-based routing effect (apenas na montagem)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('profile');
    const serviceCategory = params.get('servico');
    const serviceLocation = params.get('local');

    if (profileId) {
      setView({ name: 'profile', data: { userId: profileId, isPublic: true } });
    } else if (serviceCategory) {
      setView({ name: 'service-landing', data: { category: serviceCategory, location: serviceLocation || undefined } });
    }
  }, []); // Só na montagem


  const handleSetView = (viewName: string, data?: any) => {
    // Clear URL params when navigating away from a public page
    if (view.name === 'profile' || view.name === 'service-landing') {
        window.history.pushState({}, '', window.location.pathname);
    }
    setView({ name: viewName as any, data });
  }

  // Auth Handlers
  const handleAuthSuccess = async (email: string, type: UserType) => {
    console.log('handleAuthSuccess', { email, type });
    let user = await API.fetchUserById(email);

    if (!user) {
      // Create a new user for registration
      const newUserPayload: Omit<User, 'memberSince' | 'id'> = {
        email,
        name: email.split('@')[0],
        type: type,
        bio: '',
        location: 'São Paulo, SP',
        status: 'ativo',
        verificationStatus: type === 'prestador' ? 'pendente' : undefined,
      };
      // The 'id' should be the same as the email for consistency in our app model
      user = await API.createUser(newUserPayload);
    }
    setCurrentUser(user);
    setAuthModal(null);

    // Redirecionar para o painel correto após login
    setView({ name: 'dashboard' });

    // Se o usuário queria contatar um provedor, faz isso agora
    if (contactProviderAfterLogin) {
        handleLoginToContact(contactProviderAfterLogin);
        setContactProviderAfterLogin(null);
    } else if (jobDataToCreate) {
        // Se havia um job sendo criado, abre o wizard agora
        setWizardData({ data: jobDataToCreate });
        setJobDataToCreate(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    handleSetView('home');
  };

  const handleSmartSearch = (prompt: string) => {
    if (!currentUser) {
      // Se não estiver logado, salvar o prompt e abrir modal de login
      setJobDataToCreate({ 
        description: prompt, 
        category: 'reparos', 
        serviceType: 'personalizado', 
        urgency: '3dias' 
      } as JobData);
      setAuthModal({ mode: 'login', userType: 'cliente' });
    } else {
      // Se já estiver logado, abrir wizard diretamente
      setWizardData({ prompt });
    }
  };
  
  const handleNewJobFromItem = (prompt: string) => {
      setWizardData({ prompt });
  }

  const handleUpdateUser = (userEmail: string, partial: Partial<User>) => {
    // This now calls the API directly.
    // The local state update will happen inside the component that needs it.
    API.updateUser(userEmail, partial).catch(err => console.error("Failed to update user via API", err));

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
        createdAt: new Date().toISOString(),
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

    try {
      // Create job via API
      const newJob = await API.createJob(jobData, currentUser.email);
      // No need to setAllJobs here, dashboards fetch their own data
      setWizardData(null);
      console.log('Job created successfully:', newJob);

      // If it was a direct invitation, notify the provider and redirect to dashboard
      if (jobData.targetProviderId) {
          const provider = await API.fetchUserById(jobData.targetProviderId);
          if (provider) {
            await API.createNotification({
              userId: jobData.targetProviderId!,
              text: `Você recebeu um convite direto de ${currentUser.name} para o job "${newJob.category}".`,
              isRead: false,
            });
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
      const allUsersForMatching = await API.fetchAllUsers(); // Fetch users just for matching
      const results = await getMatchingProviders(newJob, allUsersForMatching, []);
      if (results.length > 0) {
        setMatchingResults(results);
      } else {
        setProspects([{name: "João da Silva", specialty: "Eletricista"}, {name: "Marcos Andrade", specialty: "Eletricista Predial"}]);
      }
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Erro ao criar serviço. Por favor, tente novamente.");
      setWizardData(null);
    }
  };
  
  const handleInviteProvider = (providerId: string) => {
    // This logic needs a job context, which is no longer available globally.
    // This feature might need to be moved or re-thought.
    console.warn("handleInviteProvider needs refactoring as allJobs is not global anymore.");
  };
  
  const handleLoginToContact = async (providerId: string) => {
      const provider = await API.fetchUserById(providerId);
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
    
    // This function is now primarily handled within ProviderDashboard.
    // The logic here could be removed if no longer used directly by App.
    console.log("Placing bid from App.tsx - this might be deprecated", { jobId, amount });
  };


  const renderContent = () => {
    // Debug: logar estado do usuário e da view
    console.log('renderContent', { currentUser, view });
    // Se estiver logado e não estiver no dashboard, força redirecionamento
    if (currentUser && view.name !== 'dashboard') {
      setView({ name: 'dashboard' });
      return null;
    }
    switch (view.name) {
      case 'dashboard':
        if (!currentUser) { handleSetView('home'); return null; }
        if (currentUser.type === 'cliente') return <ClientDashboard user={currentUser} allUsers={[]} allProposals={[]} allMessages={[]} maintainedItems={maintainedItems} allDisputes={[]} allBids={[]} setAllProposals={() => {}} setAllMessages={() => {}} setAllNotifications={setAllNotifications} onViewProfile={(userId) => handleSetView('profile', {userId})} setAllEscrows={setAllEscrows} setAllDisputes={() => {}} setMaintainedItems={setMaintainedItems} onNewJobFromItem={handleNewJobFromItem} onUpdateUser={handleUpdateUser} />;
        if (currentUser.type === 'prestador') return <ProviderDashboard user={currentUser} onViewProfile={(userId) => handleSetView('profile', {userId})} onPlaceBid={() => {}} />;
        if (currentUser.type === 'admin') return <AdminDashboard user={currentUser} />;
        return null;
      case 'profile':
        // ProfilePage will need to fetch its own user data
        return <ProfilePage userId={view.data.userId} onBackToDashboard={() => handleSetView('dashboard')} isPublicView={!!view.data.isPublic} onLoginToContact={handleLoginToContact} />;
      case 'service-landing':
          // This page will also need to fetch its own user data
          return <ServiceLandingPage category={view.data.category} location={view.data.location} serviceNameToCategory={(name: string) => serviceNameToCategory[name] || name} />;
      case 'provider-landing':
          return <ProviderLandingPage onRegisterClick={() => setAuthModal({mode: 'register', userType: 'prestador'})} />;
      // FIX: Add case for find-providers view
      case 'find-providers':
          return <FindProvidersPage allUsers={[]} allJobs={[]} onViewProfile={(userId) => handleSetView('profile', { userId, isPublic: !currentUser })} onContact={handleLoginToContact} />;
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