import React, { useState, useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext'; // Importar o Provider
import { registerUserFcmToken, onForegroundMessage } from './services/messagingService';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import AuthModal from './components/AuthModal';
import { logInfo, logWarn, logError } from './utils/logger';

// Code-splitting: lazy load dashboards (componentes pesados)
const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
const ProviderDashboard = lazy(() => import('./components/ProviderDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ProspectorDashboard = lazy(() => import('./components/ProspectorDashboard'));
const AIInternalChat = lazy(() => import('./components/AIInternalChat'));

// Code-splitting: lazy load modals e wizards
const AIJobRequestWizard = lazy(() => import('./components/AIJobRequestWizard'));
const MatchingResultsModal = lazy(() => import('./components/MatchingResultsModal'));
const ProspectingNotificationModal = lazy(() => import('./components/ProspectingNotificationModal'));

// Code-splitting: lazy load pages
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const ServiceLandingPage = lazy(() => import('./components/ServiceLandingPage'));
const ProviderLandingPage = lazy(() => import('./components/ProviderLandingPage'));
const PaymentSuccessPage = lazy(() => import('./components/PaymentSuccessPage'));
const FindProvidersPage = lazy(() => import('./components/FindProvidersPage'));
const MetricsDashboard = lazy(() => import('./components/MetricsPageDashboard'));

// Loading fallback component para Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-slate-600">Carregando...</p>
    </div>
  </div>
);

import {
  User,
  Job,
  Notification,
  MatchingResult,
  MaintainedItem,
  UserType,
  JobData,
  Prospect,
} from './types';
import { serviceNameToCategory } from './services/geminiService';
// API Service - loads from backend or falls back to mock data
import * as API from './services/api';

type View =
  | { name: 'home' }
  | { name: 'dashboard' }
  | { name: 'profile'; data: { userId: string, isPublic?: boolean } }
  | { name: 'service-landing'; data: { category: string, location?: string } }
  | { name: 'provider-landing' }
  | { name: 'find-providers' }
  | { name: 'payment-success' };

const App: React.FC = () => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>({ name: 'home' });

  // Modals
  const [authModal, setAuthModal] = useState<{ mode: 'login' | 'register'; userType: UserType } | null>(null);
  const [wizardData, setWizardData] = useState<{ prompt?: string; data?: JobData } | null>(null);
  const [matchingResults, setMatchingResults] = useState<MatchingResult[] | null>(null);
  const [prospects, setProspects] = useState<Prospect[] | null>(null);
  // Lightweight data for public search page
  const [allUsersForSearch, setAllUsersForSearch] = useState<User[]>([]);
  const [allJobsForSearch, setAllJobsForSearch] = useState<Job[]>([]);
  const [isLoadingFindProviders, setIsLoadingFindProviders] = useState(false);

  // Data State - minimal global state
  const [maintainedItems, setMaintainedItems] = useState<MaintainedItem[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [jobDataToCreate, setJobDataToCreate] = useState<JobData | null>(null);
  const [contactProviderAfterLogin, setContactProviderAfterLogin] = useState<string|null>(null);

  useEffect(() => {
    // Data fetching has been moved to individual dashboards/components.
    // App.tsx is now primarily a router and high-level state manager.
  }, []);

  // Simple URL-based routing effect (apenas na montagem)
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const profileId = params.get('profile');
    const serviceCategory = params.get('servico');
    const serviceLocation = params.get('local');

    if (profileId) {
      setView({ name: 'profile', data: { userId: profileId, isPublic: true } });
    } else if (serviceCategory) {
      setView({ name: 'service-landing', data: { category: serviceCategory, location: serviceLocation || undefined } });
    }
  }, []); // Só na montagem

  // Handle dynamic import failures (stale HTML returned due to cache) by reloading with cache-buster
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem('hasReloadedForChunkError');
    
    const handler = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { message?: string } | string | undefined;
      const msg = String(typeof reason === 'object' ? reason?.message : reason || '');
      if ((msg.includes('Failed to fetch dynamically imported module') || 
           msg.includes('Importing a module script failed') ||
           msg.includes('Failed to load module script')) && !hasReloaded) {
        logInfo('[App] Detectado erro de chunk loading, recarregando página...');
        sessionStorage.setItem('hasReloadedForChunkError', 'true');
        globalThis.location.reload();
      }
    };
    
    const errorHandler = (e: ErrorEvent) => {
      if ((e.message.includes('Failed to fetch dynamically imported module') ||
           e.message.includes('Importing a module script failed') ||
           e.message.includes('Failed to load module script')) && !hasReloaded) {
        logInfo('[App] Detectado erro de chunk loading (error event), recarregando página...');
        sessionStorage.setItem('hasReloadedForChunkError', 'true');
        globalThis.location.reload();
      }
    };
    
    globalThis.addEventListener('unhandledrejection', handler);
    globalThis.addEventListener('error', errorHandler);
    
    // Limpar flag após 5 segundos (página carregou com sucesso)
    const timeout = setTimeout(() => {
      sessionStorage.removeItem('hasReloadedForChunkError');
    }, 5000);
    
    return () => {
      globalThis.removeEventListener('unhandledrejection', handler);
      globalThis.removeEventListener('error', errorHandler);
      clearTimeout(timeout);
    };
  }, []);


  const handleSetView = (viewName: View['name'], data?: Record<string, unknown>) => {
    // Clear URL params when navigating away from a public page
    if (view.name === 'profile' || view.name === 'service-landing') {
        globalThis.history.pushState({}, '', globalThis.location.pathname);
    }
    setView({ name: viewName, data } as View);
  }

  // Fetch data when navigating to public search page
  useEffect(() => {
    if (view.name !== 'find-providers') return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoadingFindProviders(true);
        const [users, jobs] = await Promise.all([
          API.fetchAllUsers(),
          API.fetchJobs(),
        ]);
        if (!cancelled) {
          setAllUsersForSearch(users);
          setAllJobsForSearch(jobs);
        }
      } catch {
        // Non-blocking: page will handle empty state
      } finally {
        if (!cancelled) setIsLoadingFindProviders(false);
      }
    })();
    return () => { cancelled = true; };
  }, [view.name]);

  // Auth Handlers
  const handleAuthSuccess = async (email: string, type: UserType, inviteCode?: string) => {
    try {
      // Mostrar feedback imediato
      setAuthModal(null);
      
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
        
        // If provider registration with invite code, register with prospector
        if (type === 'prestador' && inviteCode) {
          try {
            await API.registerWithInvite(email, inviteCode);
            logInfo('✨ Cadastro com convite realizado! Seu prospector receberá comissão pelos seus serviços.');
          } catch (inviteError) {
            logError('Error registering with invite:', inviteError);
            logWarn('⚠️ Código de convite inválido, mas seu cadastro foi realizado.');
          }
        }
      }
      
      // Atualizar usuário e ir para dashboard imediatamente
      setCurrentUser(user);
      setView({ name: 'dashboard' });

      // Attempt FCM token registration (non-blocking)
      registerUserFcmToken(email).catch((err) => {
        logWarn('Falha ao registrar token FCM:', err);
      });

      // Setup foreground notification listener once per session
      onForegroundMessage((payload) => {
        if (payload?.notification) {
          alert(`🔔 ${payload.notification.title || 'Nova notificação'}\n${payload.notification.body || ''}`);
        }
      });

      // Abrir wizard se havia job pendente (após pequeno delay para renderizar dashboard)
      setTimeout(() => {
        if (contactProviderAfterLogin) {
            handleLoginToContact(contactProviderAfterLogin);
            setContactProviderAfterLogin(null);
        } else if (jobDataToCreate) {
            setWizardData({ data: jobDataToCreate });
            setJobDataToCreate(null);
        }
      }, 300);
      
    } catch (error) {
      logError('Erro ao fazer login:', error);
      alert('Erro ao fazer login. Por favor, tente novamente.');
      setAuthModal(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    handleSetView('home');
    // Optionally: clear FCM token server-side (not strictly required now)
  };

  const handleSmartSearch = (prompt: string) => {
    if (currentUser) {
      // Se já estiver logado, abrir wizard diretamente
      setWizardData({ prompt });
      return;
    }
    
    // Se não estiver logado, salvar o prompt e abrir modal de login
    setJobDataToCreate({ 
      description: prompt, 
      category: 'reparos', 
      serviceType: 'personalizado', 
      urgency: '3dias' 
    } as JobData);
    setAuthModal({ mode: 'login', userType: 'cliente' });
  };
  
  const handleNewJobFromItem = (prompt: string) => {
      setWizardData({ prompt });
  }

  const handleUpdateUser = (userEmail: string, partial: Partial<User>) => {
    // This now calls the API directly.
    // The local state update will happen inside the component that needs it.
    API.updateUser(userEmail, partial).catch(err => 
      logError('Falha ao atualizar usuário via API:', err)
    );

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
      // Create job via API (saves to Firestore via backend)
      const newJob = await API.createJob(jobData, currentUser.email);
      setWizardData(null);

      // If it was a direct invitation, notify the provider and redirect to dashboard
      if (jobData.targetProviderId) {
          const provider = await API.fetchUserById(jobData.targetProviderId);
          if (provider) {
            await API.createNotification({
              userId: jobData.targetProviderId,
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

      // AI Matching automático (normal flow)
      try {

        const matchingResults = await API.matchProvidersForJob(newJob.id);
        
        if (matchingResults && matchingResults.length > 0) {

          // Notificar cada prestador sobre o novo job
          for (const match of matchingResults.slice(0, 5)) { // Notify top 5 matches
            try {
              await API.createNotification({
                userId: match.provider.email,
                text: `Novo serviço disponível: ${newJob.category} - ${match.reason}`,
                isRead: false,
              });
            } catch (notifError) { 
              logWarn('Falha ao criar notificação para provedor:', notifError);
            }
          }
          
          alert(`✅ Job "${newJob.category}" criado com sucesso!\n\n${matchingResults.length} prestadores qualificados foram notificados.\n\nVocê receberá propostas em breve.`);
        } else {
          // NENHUM PRESTADOR DISPONÍVEL - TRIGGER AUTO-PROSPECTING
          logInfo('[App] No providers found, triggering auto-prospecting...');
          
          // Import prospecting service dynamically
          import('./services/prospectingService').then(async (prospecting) => {
            const prospectingResult = await prospecting.triggerAutoProspecting(
              newJob,
              currentUser?.email || ''
            );
            
            if (prospectingResult.success && prospectingResult.prospectsFound > 0) {
              logInfo(`[App] Auto-prospecting found ${prospectingResult.prospectsFound} prospects`);
            }
          }).catch(err => {
            logError('[App] Auto-prospecting failed:', err);
          });

          alert(`✅ Job "${newJob.category}" criado!\n\n🔍 Não encontramos prestadores cadastrados nesta categoria ainda.\n\nNossa IA está buscando profissionais qualificados para você agora mesmo!\n\nVocê receberá uma notificação assim que encontrarmos.`);
        }
      } catch (matchingError) {
        logWarn('Erro ao buscar prestadores correspondentes:', matchingError);
        alert(`✅ Job "${newJob.category}" criado com sucesso!\n\nVocê receberá propostas em breve.`);
      }
      
      setView({ name: 'dashboard' });
      
    } catch (error) {
      logError('Erro ao criar serviço:', error);
      alert("Erro ao criar serviço. Por favor, tente novamente.");
      setWizardData(null);
    }
  };
  
  const handleInviteProvider = (_providerId: string) => {
    // This logic needs a job context, which is no longer available globally.
    // This feature might need to be moved or re-thought.

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
  
  // handlePlaceBid removed - functionality moved to ProviderDashboard


  const renderContent = () => {
    // Debug: logar estado do usuário e da view

    switch (view.name) {
      case 'dashboard':
        // Evita redirecionar para 'home' enquanto o login está finalizando.
        // Quando o usuário fizer login, setCurrentUser será atualizado e o painel renderiza.
        if (!currentUser) {
          return <div className="loading-container">Carregando seu painel…</div>;
        }
        if (currentUser.type === 'cliente') return <ClientDashboard user={currentUser} allUsers={[]} allProposals={[]} allMessages={[]} maintainedItems={maintainedItems} allDisputes={[]} allBids={[]} setAllProposals={() => {}} setAllMessages={() => {}} setAllEscrows={() => {}} setAllNotifications={setAllNotifications} onViewProfile={(userId) => handleSetView('profile', {userId})} setAllDisputes={() => {}} setMaintainedItems={setMaintainedItems} onNewJobFromItem={handleNewJobFromItem} onUpdateUser={handleUpdateUser} />;
        if (currentUser.type === 'prestador') return <ProviderDashboard user={currentUser} onUpdateUser={handleUpdateUser} />;
        if (currentUser.type === 'prospector') return <ProspectorDashboard userId={currentUser.email} />;
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
          return isLoadingFindProviders && allUsersForSearch.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Carregando profissionais…</div>
          ) : (
            <FindProvidersPage
              allUsers={allUsersForSearch}
              allJobs={allJobsForSearch}
              onViewProfile={(userId) => handleSetView('profile', { userId, isPublic: !currentUser })}
              onContact={handleLoginToContact}
            />
          );
      case 'payment-success':
        return <PaymentSuccessPage />;
      case 'metrics':
        // Métricas de prospecting - Fase 3
        if (!currentUser || !['prospector', 'admin'].includes(currentUser.type)) {
          return <div className="p-8 text-center text-red-600">Acesso negado. Apenas prospectors e admins podem visualizar métricas.</div>;
        }
        return (
          <Suspense fallback={<div className="p-8 text-center text-slate-600">Carregando métricas…</div>}>
            <MetricsDashboard />
          </Suspense>
        );
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
    globalThis.addEventListener('open-wizard-from-chat', handler as EventListener);
    return () => globalThis.removeEventListener('open-wizard-from-chat', handler as EventListener);
  }, []);

  return (
    <ToastProvider> {/* Envolver a aplicação com o ToastProvider */}
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
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                {renderContent()}
              </Suspense>
            </ErrorBoundary>
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
          <Suspense fallback={<LoadingFallback />}>
            <AIJobRequestWizard 
                onClose={() => setWizardData(null)}
                onSubmit={handleWizardSubmit}
                initialPrompt={wizardData.prompt}
                initialData={wizardData.data}
            />
          </Suspense>
        )}

        {matchingResults && (
          <Suspense fallback={<LoadingFallback />}>
            <MatchingResultsModal 
                results={matchingResults}
                onClose={() => {
                  setMatchingResults(null);
                  setView({ name: 'dashboard' });
                }}
                onInvite={handleInviteProvider}
            />
          </Suspense>
        )}
        
        {prospects && (
          <Suspense fallback={<LoadingFallback />}>
            <ProspectingNotificationModal
                prospects={prospects}
                onClose={() => {
                  setProspects(null);
                  setView({ name: 'dashboard' });
                }}
            />
          </Suspense>
        )}

        {/* Floating AI Internal Chat trigger for prospector & prestador */}
        {currentUser && (currentUser.type === 'prospector' || currentUser.type === 'prestador') && (
          <Suspense fallback={null}>
            <AIChatFloatingTrigger currentUser={currentUser} />
          </Suspense>
        )}
      </div>
    </ToastProvider>
  );
};

export default App;

// Separate component to avoid re-renders of App large tree
const AIChatFloatingTrigger: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg w-14 h-14 flex items-center justify-center text-white hover:from-indigo-700 hover:to-purple-700 transition"
        aria-label="Abrir Assistente IA"
      >
        <span className="text-xl">🤖</span>
      </button>
      {open && (
        <Suspense fallback={null}>
          <AIInternalChat currentUser={currentUser} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
};


