/**
 * API Service - Centralized API calls to backend
 * Falls back to mock data if backend is unavailable
 */

import {
  User,
  Job,
  Proposal,
  Message,
  Notification,
  FraudAlert,
  Dispute,
  MaintainedItem,
  Bid,
  JobData,
} from '../types';

import {
  MOCK_USERS,
  MOCK_JOBS,
  MOCK_PROPOSALS,
  MOCK_MESSAGES,
  MOCK_ITEMS,
  MOCK_NOTIFICATIONS,
  MOCK_BIDS,
  MOCK_FRAUD_ALERTS,
} from '../mockData';

// Get backend URL from environment variable (prefer unified VITE_API_BASE_URL)
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_BACKEND_API_URL ||
  'https://servio-backend-h5ogjon7aa-uw.a.run.app';
const USE_MOCK = false; // Always try real backend first, fallback to mock on error

console.log('API Service initialized:', { BACKEND_URL, USE_MOCK });

/**
 * Generic API call helper
 */
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
}

// ============================================================================
// USERS
// ============================================================================

export async function fetchAllUsers(): Promise<User[]> {
  if (USE_MOCK) {
    console.log('Using mock users data');
    return Promise.resolve(MOCK_USERS);
  }

  try {
    return await apiCall<User[]>('/users');
  } catch (error) {
    console.warn('Failed to fetch users from backend, using mock data');
    return MOCK_USERS;
  }
}

export async function fetchProviders(): Promise<User[]> {
  if (USE_MOCK) {
    console.log('Using mock providers data');
    return Promise.resolve(MOCK_USERS.filter(u => u.type === 'prestador' && u.verificationStatus === 'verificado'));
  }

  try {
    return await apiCall<User[]>('/users?type=prestador&verificationStatus=verificado');
  } catch (error) {
    console.warn('Failed to fetch providers from backend, using mock data');
    return MOCK_USERS.filter(u => u.type === 'prestador' && u.verificationStatus === 'verificado');
  }
}

export async function fetchUserById(userId: string): Promise<User | null> {
  if (USE_MOCK) {
    const user = MOCK_USERS.find((u) => u.email === userId);
    return Promise.resolve(user || null);
  }

  try {
    return await apiCall<User>(`/users/${userId}`);
  } catch (error) {
    console.warn(`Failed to fetch user ${userId}, using mock data`);
    const user = MOCK_USERS.find((u) => u.email === userId);
    return user || null;
  }
}

export async function createUser(user: Omit<User, 'memberSince'>): Promise<User> {
  if (USE_MOCK) {
    const newUser: User = {
      ...user,
      memberSince: new Date().toISOString(),
    };
    MOCK_USERS.push(newUser);
    console.log('Mock: Created user', newUser);
    return Promise.resolve(newUser);
  }

  try {
    return await apiCall<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  if (USE_MOCK) {
    console.log('Mock: Updated user', userId, updates);
    const existingUser = MOCK_USERS.find((u) => u.email === userId);
    if (!existingUser) throw new Error('User not found');
    return Promise.resolve({ ...existingUser, ...updates });
  }

  try {
    return await apiCall<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

// ============================================================================
// STRIPE CONNECT
// ============================================================================

export async function createStripeConnectAccount(userId: string): Promise<{ accountId: string }> {
  if (USE_MOCK) {
    console.log('Mock: Creating Stripe Connect Account for', userId);
    // In mock, we'll just pretend and update the user object
    const user = MOCK_USERS.find(u => u.email === userId);
    if (user) {
      user.stripeAccountId = `acct_mock_${Date.now()}`;
    }
    return Promise.resolve({ accountId: `acct_mock_${Date.now()}` });
  }

  return apiCall<{ accountId: string }>('/api/stripe/create-connect-account', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function createStripeAccountLink(userId: string): Promise<{ url: string }> {
  if (USE_MOCK) {
    console.log('Mock: Creating Stripe Account Link for', userId);
    return Promise.resolve({ url: 'https://mock.stripe.com/onboarding-link' });
  }

  return apiCall<{ url: string }>('/api/stripe/create-account-link', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// ============================================================================
// STRIPE CHECKOUT & PAYMENTS
// ============================================================================

export async function createCheckoutSession(
  job: Job, 
  amount: number
): Promise<{ id: string }> {
  if (USE_MOCK) {
    console.log('Mock: Creating Stripe Checkout Session', { jobId: job.id, amount });
    return Promise.resolve({ id: `cs_mock_${Date.now()}` });
  }

  return apiCall<{ id: string }>('/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ job, amount }),
  });
}

export async function releasePayment(jobId: string): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) {
    console.log('Mock: Releasing payment for job', jobId);
    return Promise.resolve({ success: true, message: 'Pagamento liberado com sucesso (mock)' });
  }

  return apiCall<{ success: boolean; message: string }>(`/jobs/${jobId}/release-payment`, {
    method: 'POST',
  });
}


// ============================================================================
// JOBS
// ============================================================================

export async function fetchJobs(): Promise<Job[]> {
  if (USE_MOCK) {
    console.log('Using mock jobs data');
    return Promise.resolve(MOCK_JOBS);
  }

  try {
    return await apiCall<Job[]>('/jobs');
  } catch (error) {
    console.warn('Failed to fetch jobs from backend, using mock data');
    return MOCK_JOBS;
  }
}

export async function fetchJobsForUser(userId: string): Promise<Job[]> {
  if (USE_MOCK) {
    console.log(`Using mock jobs data for user ${userId}`);
    return Promise.resolve(MOCK_JOBS.filter(job => job.clientId === userId));
  }

  try {
    return await apiCall<Job[]>(`/jobs?clientId=${userId}`);
  } catch (error) {
    console.warn(`Failed to fetch jobs for user ${userId} from backend, using mock data`);
    return MOCK_JOBS.filter(job => job.clientId === userId);
  }
}

export async function fetchOpenJobs(): Promise<Job[]> {
  if (USE_MOCK) {
    console.log('Using mock open jobs data');
    return Promise.resolve(MOCK_JOBS.filter(job => job.status === 'ativo' || job.status === 'em_leilao'));
  }

  try {
    // In a real scenario, the backend would be more flexible
    const active = await apiCall<Job[]>('/jobs?status=ativo');
    const auction = await apiCall<Job[]>('/jobs?status=em_leilao');
    return [...active, ...auction];
  } catch (error) {
    console.warn('Failed to fetch open jobs from backend, using mock data');
    return MOCK_JOBS.filter(job => job.status === 'ativo' || job.status === 'em_leilao');
  }
}

export async function fetchJobsForProvider(providerId: string): Promise<Job[]> {
  if (USE_MOCK) {
    console.log(`Using mock jobs data for provider ${providerId}`);
    return Promise.resolve(MOCK_JOBS.filter(job => job.providerId === providerId));
  }

  try {
    return await apiCall<Job[]>(`/jobs?providerId=${providerId}`);
  } catch (error) {
    console.warn(`Failed to fetch jobs for provider ${providerId} from backend, using mock data`);
    return MOCK_JOBS.filter(job => job.providerId === providerId);
  }
}

export async function fetchJobById(jobId: string): Promise<Job | null> {
  if (USE_MOCK) {
    const job = MOCK_JOBS.find((j) => j.id === jobId);
    return Promise.resolve(job || null);
  }

  try {
    return await apiCall<Job>(`/jobs/${jobId}`);
  } catch (error) {
    console.warn(`Failed to fetch job ${jobId}, using mock data`);
    const job = MOCK_JOBS.find((j) => j.id === jobId);
    return job || null;
  }
}

export async function createJob(jobData: JobData, clientId: string): Promise<Job> {
  const newJob: Omit<Job, 'id'> = {
    clientId,
    description: jobData.description,
    category: jobData.category,
    serviceType: jobData.serviceType,
    urgency: jobData.urgency,
    address: jobData.address,
    media: jobData.media,
    fixedPrice: jobData.fixedPrice,
    visitFee: jobData.visitFee,
  status: jobData.jobMode === 'leilao' ? 'em_leilao' : 'ativo',
  createdAt: new Date().toISOString(),
    jobMode: jobData.jobMode || 'normal',
    auctionEndDate:
      jobData.jobMode === 'leilao' && jobData.auctionDurationHours
        ? new Date(Date.now() + jobData.auctionDurationHours * 60 * 60 * 1000).toISOString()
        : undefined,
  };

  if (USE_MOCK) {
    const job: Job = {
      ...newJob,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    console.log('Mock: Created job', job);
    return Promise.resolve(job);
  }

  try {
    return await apiCall<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(newJob),
    });
  } catch (error) {
    console.error('Failed to create job:', error);
    throw error;
  }
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
  if (USE_MOCK) {
    console.log('Mock: Updated job', jobId, updates);
    const existingJob = MOCK_JOBS.find((j) => j.id === jobId);
    if (!existingJob) throw new Error('Job not found');
    return Promise.resolve({ ...existingJob, ...updates });
  }

  try {
    return await apiCall<Job>(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Failed to update job:', error);
    throw error;
  }
}

// ============================================================================
// PROPOSALS
// ============================================================================

export async function fetchProposals(): Promise<Proposal[]> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_PROPOSALS);
  }

  try {
    return await apiCall<Proposal[]>('/proposals');
  } catch (error) {
    console.warn('Failed to fetch proposals, using mock data');
    return MOCK_PROPOSALS;
  }
}

export async function fetchProposalsForProvider(providerId: string): Promise<Proposal[]> {
  if (USE_MOCK) {
    console.log(`Using mock proposals data for provider ${providerId}`);
    return Promise.resolve(MOCK_PROPOSALS.filter(p => p.providerId === providerId));
  }

  try {
    return await apiCall<Proposal[]>(`/proposals?providerId=${providerId}`);
  } catch (error) {
    console.warn(`Failed to fetch proposals for provider ${providerId} from backend, using mock data`);
    return MOCK_PROPOSALS.filter(p => p.providerId === providerId);
  }
}

export async function createProposal(proposal: Omit<Proposal, 'id' | 'createdAt'>): Promise<Proposal> {
  if (USE_MOCK) {
    const newProposal: Proposal = {
      ...proposal,
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    console.log('Mock: Created proposal', newProposal);
    return Promise.resolve(newProposal);
  }

  try {
    return await apiCall<Proposal>('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposal),
    });
  } catch (error) {
    console.error('Failed to create proposal:', error);
    throw error;
  }
}

export async function updateProposal(proposalId: string, updates: Partial<Proposal>): Promise<Proposal> {
  if (USE_MOCK) {
    console.log('Mock: Updated proposal', proposalId, updates);
    const existing = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    if (!existing) throw new Error('Proposal not found');
    return Promise.resolve({ ...existing, ...updates });
  }

  try {
    return await apiCall<Proposal>(`/proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Failed to update proposal:', error);
    throw error;
  }
}

// ============================================================================
// MESSAGES
// ============================================================================

export async function fetchMessages(chatId?: string): Promise<Message[]> {
  if (USE_MOCK) {
    return Promise.resolve(chatId ? MOCK_MESSAGES.filter(m => m.chatId === chatId) : MOCK_MESSAGES);
  }

  try {
    const url = chatId ? `/messages?chatId=${chatId}` : '/messages';
    return await apiCall<Message[]>(url);
  } catch (error) {
    console.warn('Failed to fetch messages, using mock data');
    return chatId ? MOCK_MESSAGES.filter(m => m.chatId === chatId) : MOCK_MESSAGES;
  }
}

export async function createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
  if (USE_MOCK) {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    console.log('Mock: Created message', newMessage);
    return Promise.resolve(newMessage);
  }

  try {
    return await apiCall<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to create message:', error);
    throw error;
  }
}

// ============================================================================
// MAINTAINED ITEMS
// ============================================================================

export async function fetchMaintainedItems(clientId: string): Promise<MaintainedItem[]> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_ITEMS.filter((item) => item.clientId === clientId));
  }

  try {
    return await apiCall<MaintainedItem[]>(`/maintained-items?clientId=${clientId}`);
  } catch (error) {
    console.warn('Failed to fetch maintained items, using mock data');
    return MOCK_ITEMS.filter((item) => item.clientId === clientId);
  }
}

export async function createMaintainedItem(item: Omit<MaintainedItem, 'id' | 'createdAt' | 'maintenanceHistory'>): Promise<MaintainedItem> {
  if (USE_MOCK) {
    const newItem: MaintainedItem = {
      ...item,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
      maintenanceHistory: [],
    };
    console.log('Mock: Created maintained item', newItem);
    return Promise.resolve(newItem);
  }

  try {
    return await apiCall<MaintainedItem>('/maintained-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  } catch (error) {
    console.error('Failed to create maintained item:', error);
    throw error;
  }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_NOTIFICATIONS.filter((n) => n.userId === userId));
  }

  try {
    return await apiCall<Notification[]>(`/notifications?userId=${userId}`);
  } catch (error) {
    console.warn('Failed to fetch notifications, using mock data');
    return MOCK_NOTIFICATIONS.filter((n) => n.userId === userId);
  }
}

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
  if (USE_MOCK) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    console.log('Mock: Created notification', newNotification);
    return Promise.resolve(newNotification);
  }

  try {
    return await apiCall<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

// ============================================================================
// BIDS (for auction mode)
// ============================================================================

export async function fetchBids(): Promise<Bid[]> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_BIDS);
  }

  try {
    return await apiCall<Bid[]>('/bids');
  } catch (error) {
    console.warn('Failed to fetch bids, using mock data');
    return MOCK_BIDS;
  }
}

export async function fetchBidsForProvider(providerId: string): Promise<Bid[]> {
    if (USE_MOCK) {
        console.log(`Using mock bids data for provider ${providerId}`);
        return Promise.resolve(MOCK_BIDS.filter(b => b.providerId === providerId));
    }

    try {
        return await apiCall<Bid[]>(`/bids?providerId=${providerId}`);
    } catch (error) {
        console.warn(`Failed to fetch bids for provider ${providerId} from backend, using mock data`);
        return MOCK_BIDS.filter(b => b.providerId === providerId);
    }
}

// ============================================================================
// DISPUTES (for admin)
// ============================================================================

export async function fetchDisputes(): Promise<Dispute[]> {
    if (USE_MOCK) {
        console.log('Using mock disputes data (empty array)');
        return Promise.resolve([]);
    }

    try {
        return await apiCall<Dispute[]>('/disputes');
    } catch (error) {
        console.warn('Failed to fetch disputes from backend, using mock data');
        return [];
    }
}

// ============================================================================
// SENTIMENT / RISK ALERTS (formerly "fraud alerts") (for admin)
// ============================================================================

/**
 * Fetch sentiment/risk alerts from the backend.
 * These alerts are generated based on chat sentiment analysis, payment disputes,
 * and other risk indicators.
 */
export async function fetchSentimentAlerts(): Promise<FraudAlert[]> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_FRAUD_ALERTS);
  }

  try {
    return await apiCall<FraudAlert[]>('/sentiment-alerts');
  } catch (error) {
    console.warn('Failed to fetch sentiment alerts, using mock data');
    return MOCK_FRAUD_ALERTS;
  }
}

/**
 * @deprecated Use fetchSentimentAlerts() instead. 
 * This function is maintained for backward compatibility.
 * 
 * The term "fraud alerts" was originally used but the backend now calls these
 * "sentiment alerts" to better reflect that they are generated from multiple
 * risk signals (sentiment analysis, disputes, etc), not just fraud.
 */
export async function fetchFraudAlerts(): Promise<FraudAlert[]> {
  return fetchSentimentAlerts();
}

// ============================================================================
// AI MATCHING
// ============================================================================

export interface MatchingProvider {
  provider: User;
  score: number;
  reason: string;
}

/**
 * Calls backend AI matching endpoint to find best providers for a job
 * Falls back to basic local matching if backend is unavailable
 */
export async function matchProvidersForJob(jobId: string): Promise<MatchingProvider[]> {
  if (USE_MOCK) {
    console.log('Mock: Matching providers locally for job', jobId);
    // Basic mock matching - just return verified providers
    const providers = MOCK_USERS.filter(
      u => u.type === 'prestador' && u.verificationStatus === 'verificado'
    );
    return Promise.resolve(
      providers.map(p => ({
        provider: p,
        score: 0.8,
        reason: 'Prestador verificado com experiência na categoria'
      }))
    );
  }

  try {
    return await apiCall<MatchingProvider[]>(`/api/match-providers`, {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  } catch (error) {
    console.warn('AI matching failed, using basic local matching');
    // Fallback to basic matching
    const providers = await fetchProviders();
    return providers.slice(0, 3).map(p => ({
      provider: p,
      score: 0.7,
      reason: 'Prestador disponível'
    }));
  }
}

// ============================================================================
// ADMIN PROVIDER MANAGEMENT (stubs for future backend integration)
// ============================================================================

interface ProviderStatusResponse { success: boolean; message: string; user?: User }

/**
 * Suspends a provider (admin action). Backend should validate admin auth and persist status + audit log.
 * Stub: Performs API call; if fails, throws (no mock fallback – suspension must be explicit).
 */
export async function suspendProvider(userId: string, reason: string): Promise<ProviderStatusResponse> {
  return apiCall<ProviderStatusResponse>(`/admin/providers/${userId}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

/**
 * Reactivates a suspended provider (admin action).
 */
export async function reactivateProvider(userId: string): Promise<ProviderStatusResponse> {
  return apiCall<ProviderStatusResponse>(`/admin/providers/${userId}/reactivate`, {
    method: 'POST'
  });
}

/**
 * Sets verification status for a provider. Used by admin identity review workflow.
 */
export async function setVerificationStatus(userId: string, status: 'pendente' | 'verificado' | 'recusado', note?: string): Promise<ProviderStatusResponse> {
  return apiCall<ProviderStatusResponse>(`/admin/providers/${userId}/verification`, {
    method: 'POST',
    body: JSON.stringify({ status, note })
  });
}

// ============================================================================
// DISPUTE MANAGEMENT
// ============================================================================

export interface CreateDisputeData {
  jobId: string;
  reporterId: string;
  reporterRole: 'client' | 'provider';
  reason: string;
  description: string;
}

export async function createDispute(data: CreateDisputeData): Promise<Dispute> {
  return apiCall<Dispute>('/api/disputes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function resolveDispute(disputeId: string, resolution: { decision: string; notes: string }): Promise<Dispute> {
  return apiCall<Dispute>(`/api/disputes/${disputeId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(resolution)
  });
}

// ============================================================================
// PAYMENT CONFIRMATION
// ============================================================================

export async function confirmPayment(jobId: string, sessionId: string): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }>('/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ jobId, sessionId })
  });
}
