import React, { useState, useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { registerUserFcmToken, onForegroundMessage } from './services/messagingService';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import AuthModal from './components/AuthModal';
import { logInfo, logWarn, logError } from './utils/logger';

const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
const ProviderDashboard = lazy(() => import('./components/ProviderDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ProspectorDashboard = lazy(() => import('./components/ProspectorDashboard'));
const AIInternalChat = lazy(() => import('./components/AIInternalChat'));
const AIJobRequestWizard = lazy(() => import('./components/AIJobRequestWizard'));
const MatchingResultsModal = lazy(() => import('./components/MatchingResultsModal'));
const ProspectingNotificationModal = lazy(
  () => import('./components/ProspectingNotificationModal')
);
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const ServiceLandingPage = lazy(() => import('./components/ServiceLandingPage'));
const ProviderLandingPage = lazy(() => import('./components/ProviderLandingPage'));
const PaymentSuccessPage = lazy(() => import('./components/PaymentSuccessPage'));
const FindProvidersPage = lazy(() => import('./components/FindProvidersPage'));
const MetricsDashboard = lazy(() => import('./src/components/MetricsPageDashboard'));
const ProductListing = lazy(() => import('./src/components/ProductListing'));
const ShoppingCart = lazy(() => import('./src/components/ShoppingCart'));
const CheckoutFlow = lazy(() => import('./src/components/CheckoutFlow'));
const OrderTracking = lazy(() => import('./src/components/OrderTracking'));
const AdvancedAnalyticsDashboard = lazy(
  () => import('./src/components/AdvancedAnalyticsDashboard')
);

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
  MaintainedItem,
  UserType,
  JobData,
  Prospect,
} from './types';
import * as API from './services/api';

type View =
  | { name: 'home' }
  | { name: 'dashboard' }
  | { name: 'profile'; data: { userId: string; isPublic?: boolean } }
  | { name: 'service-landing'; data: { serviceId: string } }
  | { name: 'provider-landing' }
  | { name: 'find-providers' }
  | { name: 'payment-success' }
  | { name: 'metrics' }
  | { name: 'products' }
  | { name: 'cart'; data: { userId: string } }
  | { name: 'checkout' }
  | { name: 'order-tracking' }
  | { name: 'analytics' };

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>({ name: 'home' });
  const [authModal, setAuthModal] = useState<{
    mode: 'login' | 'register';
    userType: UserType;
  } | null>(null);
  const [wizardData, setWizardData] = useState<{ prompt?: string; data?: JobData } | null>(null);
  const [matchingResults, setMatchingResults] = useState<API.MatchingProvider[] | null>(null);
  const [prospects, setProspects] = useState<Prospect[] | null>(null);
  const [allUsersForSearch, setAllUsersForSearch] = useState<User[]>([]);
  const [allJobsForSearch, setAllJobsForSearch] = useState<Job[]>([]);
  const [isLoadingFindProviders, setIsLoadingFindProviders] = useState(false);
  const [maintainedItems, setMaintainedItems] = useState<MaintainedItem[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [jobDataToCreate, setJobDataToCreate] = useState<JobData | null>(null);
  const [contactProviderAfterLogin, setContactProviderAfterLogin] = useState<string | null>(null);

  useEffect(() => {
    // Este hook pode ser usado para inicializações no nível do App.
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const profileId = params.get('profile');
    const serviceId = params.get('serviceId');

    if (profileId) {
      setView({ name: 'profile', data: { userId: profileId, isPublic: true } });
    } else if (serviceId) {
      setView({ name: 'service-landing', data: { serviceId } });
    }
  }, []);

  useEffect(() => {
    const hasReloaded = sessionStorage.getItem('hasReloadedForChunkError');

    const handler = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { message?: string } | string | undefined;
      const msg = String(typeof reason === 'object' ? reason?.message : reason || '');
      if (
        (msg.includes('Failed to fetch dynamically imported module') ||
          msg.includes('Importing a module script failed') ||
          msg.includes('Failed to load module script')) &&
        !hasReloaded
      ) {
        logInfo('[App] Detectado erro de chunk loading, recarregando página...');
        sessionStorage.setItem('hasReloadedForChunkError', 'true');
        globalThis.location.reload();
      }
    };

    const errorHandler = (e: ErrorEvent) => {
      if (
        (e.message.includes('Failed to fetch dynamically imported module') ||
          e.message.includes('Importing a module script failed') ||
          e.message.includes('Failed to load module script')) &&
        !hasReloaded
      ) {
        logInfo('[App] Detectado erro de chunk loading (error event), recarregando página...');
        sessionStorage.setItem('hasReloadedForChunkError', 'true');
        globalThis.location.reload();
      }
    };

    globalThis.addEventListener('unhandledrejection', handler);
    globalThis.addEventListener('error', errorHandler);

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
    if (view.name === 'profile' || view.name === 'service-landing') {
      globalThis.history.pushState({}, '', globalThis.location.pathname);
    }
    setView({ name: viewName, data } as View);
  };

  useEffect(() => {
    if (view.name !== 'find-providers') return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoadingFindProviders(true);
        const [users, jobs] = await Promise.all([API.fetchAllUsers(), API.fetchJobs()]);
        if (!cancelled) {
          setAllUsersForSearch(users);
          setAllJobsForSearch(jobs);
        }
      } catch (error) {
        logWarn('Falha ao buscar providers e jobs', error);
      } finally {
        if (!cancelled) setIsLoadingFindProviders(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view.name]);

  const handleAuthSuccess = async (email: string, type: UserType, inviteCode?: string) => {
    try {
      setAuthModal(null);

      let user = await API.fetchUserById(email);

      if (!user) {
        const newUserPayload: Omit<User, 'memberSince' | 'id'> = {
          email,
          name: email.split('@')[0],
          type: type,
          bio: '',
          location: 'São Paulo, SP',
          status: 'ativo',
          verificationStatus: type === 'prestador' ? 'pendente' : undefined,
        };
        user = await API.createUser(newUserPayload);

        if (type === 'prestador' && inviteCode) {
          try {
            await API.registerWithInvite(email, inviteCode);
            logInfo(
              '✨ Cadastro com convite realizado! Seu prospector receberá comissão pelos seus serviços.'
            );
          } catch (inviteError) {
            logError('Error registering with invite:', inviteError);
            logWarn('⚠️ Código de convite inválido, mas seu cadastro foi realizado.');
          }
        }
      }

      setCurrentUser(user);
      setView({ name: 'dashboard' });

      registerUserFcmToken(email).catch(err => {
        logWarn('Falha ao registrar token FCM:', err);
      });

      onForegroundMessage(payload => {
        if (payload?.notification) {
          alert(
            `🔔 ${payload.notification.title || 'Nova notificação'}\n${payload.notification.body || ''}`
          );
        }
      });

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
  };

  const handleSmartSearch = (prompt: string) => {
    if (currentUser) {
      setWizardData({ prompt });
      return;
    }

    setJobDataToCreate({
      description: prompt,
      category: 'reparos',
      serviceType: 'personalizado',
      urgency: '3dias',
    } as JobData);
    setAuthModal({ mode: 'login', userType: 'cliente' });
  };

  const handleNewJobFromItem = (prompt: string) => {
    setWizardData({ prompt });
  };

  const handleUpdateUser = (userEmail: string, partial: Partial<User>) => {
    API.updateUser(userEmail, partial).catch(err =>
      logError('Falha ao atualizar usuário via API:', err)
    );

    if (currentUser?.email === userEmail) {
      setCurrentUser(prev => (prev ? { ...prev, ...partial } : prev));
    }
    setAllNotifications(prev => [
      ...prev,
      {
        id: `notif-profile-${Date.now()}`,
        userId: userEmail,
        text: 'Seu perfil foi atualizado com sucesso.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleWizardSubmit = async (jobData: JobData) => {
    if (!currentUser) {
      setJobDataToCreate(jobData);
      setAuthModal({ mode: 'login', userType: 'cliente' });
      setWizardData(null);
      return;
    }

    try {
      const newJob = await API.createJob(jobData, currentUser.email);
      setWizardData(null);

      if (jobData.targetProviderId) {
        const provider = await API.fetchUserById(jobData.targetProviderId);
        if (provider) {
          await API.createNotification({
            userId: jobData.targetProviderId,
            text: `Você recebeu um convite direto de ${currentUser.name} para o job "${newJob.category}".`,
            isRead: false,
          });
          alert(
            `✅ Ótimo! Seu pedido foi enviado diretamente para ${provider.name}.\n\nEles serão notificados e você receberá uma proposta em breve.`
          );
          setView({ name: 'dashboard' });
        }
        return;
      }

      if (newJob.jobMode === 'leilao') {
        alert(
          `✅ Seu leilão para "${newJob.category}" foi publicado!\n\nFica ativo até ${new Date(newJob.auctionEndDate!).toLocaleString('pt-BR')}.\n\nPrestadores começarão a enviar lances em breve.`
        );
        setView({ name: 'dashboard' });
        return;
      }

      try {
        const matchingResults = await API.matchProvidersForJob(newJob.id);

        if (matchingResults && matchingResults.length > 0) {
          for (const match of matchingResults.slice(0, 5)) {
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

          alert(
            `✅ Job "${newJob.category}" criado com sucesso!\n\n${matchingResults.length} prestadores qualificados foram notificados.\n\nVocê receberá propostas em breve.`
          );
        } else {
          logInfo('[App] No providers found, triggering auto-prospecting...');

          import('./services/prospectingService')
            .then(async prospecting => {
              const prospectingResult = await prospecting.triggerAutoProspecting(
                newJob,
                currentUser?.email || ''
              );

              if (prospectingResult.success && prospectingResult.prospectsFound > 0) {
                logInfo(
                  `[App] Auto-prospecting found ${prospectingResult.prospectsFound} prospects`
                );
              }
            })
            .catch(err => {
              logError('[App] Auto-prospecting failed:', err);
            });

          alert(
            `✅ Job "${newJob.category}" criado!\n\n🔍 Não encontramos prestadores cadastrados nesta categoria ainda.\n\nNossa IA está buscando profissionais qualificados para você agora mesmo!\n\nVocê receberá uma notificação assim que encontrarmos.`
          );
        }
      } catch (matchingError) {
        logWarn('Erro ao buscar prestadores correspondentes:', matchingError);
        alert(
          `✅ Job "${newJob.category}" criado com sucesso!\n\nVocê receberá propostas em breve.`
        );
      }

      setView({ name: 'dashboard' });
    } catch (error) {
      logError('Erro ao criar serviço:', error);
      alert('Erro ao criar serviço. Por favor, tente novamente.');
      setWizardData(null);
    }
  };

  const handleInviteProvider = (providerId: string) => {
    logInfo(`Convite enviado para o provedor: ${providerId}`);
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

  const renderContent = () => {
    switch (view.name) {
      case 'dashboard':
        if (!currentUser) {
          return <div className="loading-container">Carregando seu painel…</div>;
        }
        if (currentUser.type === 'cliente')
          return (
            <ClientDashboard
              user={currentUser}
              allUsers={[]}
              allProposals={[]}
              allMessages={[]}
              maintainedItems={maintainedItems}
              allDisputes={[]}
              allBids={[]}
              setAllProposals={() => {}}
              setAllMessages={() => {}}
              setAllEscrows={() => {}}
              setAllNotifications={setAllNotifications}
              onViewProfile={userId => handleSetView('profile', { userId })}
              setAllDisputes={() => {}}
              setMaintainedItems={setMaintainedItems}
              onNewJobFromItem={handleNewJobFromItem}
              onUpdateUser={handleUpdateUser}
            />
          );
        if (currentUser.type === 'prestador')
          return <ProviderDashboard user={currentUser} onUpdateUser={handleUpdateUser} />;
        if (currentUser.type === 'prospector')
          return <ProspectorDashboard userId={currentUser.email} />;
        if (currentUser.type === 'admin') return <AdminDashboard user={currentUser} />;
        return null;
      case 'profile':
        return (
          <ProfilePage
            userId={view.data.userId}
            onBackToDashboard={() => handleSetView('dashboard')}
            isPublicView={!!view.data.isPublic}
            onLoginToContact={handleLoginToContact}
          />
        );
      case 'service-landing':
        return <ServiceLandingPage serviceId={view.data.serviceId} />;
      case 'provider-landing':
        return (
          <ProviderLandingPage
            onRegisterClick={() => setAuthModal({ mode: 'register', userType: 'prestador' })}
          />
        );
      case 'find-providers':
        return isLoadingFindProviders && allUsersForSearch.length === 0 ? (
          <div className="p-8 text-center text-slate-600">Carregando profissionais…</div>
        ) : (
          <FindProvidersPage
            allUsers={allUsersForSearch}
            allJobs={allJobsForSearch}
            onViewProfile={userId => handleSetView('profile', { userId, isPublic: !currentUser })}
            onContact={handleLoginToContact}
          />
        );
      case 'payment-success':
        return <PaymentSuccessPage />;
      case 'metrics':
        if (!currentUser || !['prospector', 'admin'].includes(currentUser.type)) {
          return (
            <div className="p-8 text-center text-red-600">
              Acesso negado. Apenas prospectors e admins podem visualizar métricas.
            </div>
          );
        }
        return (
          <Suspense
            fallback={<div className="p-8 text-center text-slate-600">Carregando métricas…</div>}
          >
            <MetricsDashboard />
          </Suspense>
        );
      case 'products':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProductListing />
          </Suspense>
        );
      case 'cart':
        if (!currentUser) {
          return (
            <div className="p-8 text-center text-slate-600">
              <p className="mb-4">Faça login para acessar seu carrinho</p>
              <button
                onClick={() => setAuthModal({ mode: 'login', userType: 'cliente' })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Fazer Login
              </button>
            </div>
          );
        }
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ShoppingCart userId={currentUser.email} onCheckout={() => handleSetView('checkout')} />
          </Suspense>
        );
      case 'checkout':
        if (!currentUser) {
          return (
            <div className="p-8 text-center text-slate-600">
              <p className="mb-4">Faça login para continuar</p>
              <button
                onClick={() => setAuthModal({ mode: 'login', userType: 'cliente' })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Fazer Login
              </button>
            </div>
          );
        }
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CheckoutFlow userId={currentUser.email} />
          </Suspense>
        );
      case 'order-tracking':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <OrderTracking />
          </Suspense>
        );
      case 'analytics':
        if (!currentUser || !['admin', 'prospector'].includes(currentUser.type)) {
          return (
            <div className="p-8 text-center text-red-600">
              Acesso negado. Apenas admins podem visualizar análises avançadas.
            </div>
          );
        }
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AdvancedAnalyticsDashboard />
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

  const userNotifications = currentUser
    ? allNotifications.filter(n => n.userId === currentUser.email)
    : [];

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<JobData>;
      setWizardData({ data: custom.detail });
    };
    globalThis.addEventListener('open-wizard-from-chat', handler as EventListener);
    return () => globalThis.removeEventListener('open-wizard-from-chat', handler as EventListener);
  }, []);

  return (
    <ToastProvider>
      <div className="bg-slate-50 min-h-screen">
        <Header
          user={currentUser}
          notifications={userNotifications}
          onLoginClick={type => setAuthModal({ mode: 'login', userType: type })}
          onRegisterClick={type => setAuthModal({ mode: 'register', userType: type })}
          onLogoutClick={handleLogout}
          onSetView={handleSetView}
          onMarkAsRead={id =>
            setAllNotifications(
              allNotifications.map(n => (n.id === id ? { ...n, isRead: true } : n))
            )
          }
          onMarkAllAsRead={() =>
            setAllNotifications(
              allNotifications.map(n =>
                n.userId === currentUser?.email ? { ...n, isRead: true } : n
              )
            )
          }
        />
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>{renderContent()}</Suspense>
            </ErrorBoundary>
          </div>
        </main>

        {authModal && (
          <AuthModal
            mode={authModal.mode}
            userType={authModal.userType}
            onClose={() => setAuthModal(null)}
            onSwitchMode={newMode => setAuthModal({ ...authModal, mode: newMode })}
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
