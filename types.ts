export type UserType = 'cliente' | 'prestador' | 'admin';
export type UserStatus = 'ativo' | 'suspenso';

export interface ProviderService {
  id: string;
  name: string;
  type: 'tabelado' | 'personalizado' | 'diagnostico';
  description: string;
  price?: number; // For 'tabelado'
}

export interface SEOProfile {
  seoTitle: string;
  metaDescription: string;
  publicHeadline: string;
  publicBio: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string; // base64 data URL
  title: string;
  description: string;
}

export interface User {
  email: string; // Also serves as ID
  name: string;
  type: UserType;
  bio: string;
  location: string;
  memberSince: string; // ISO Date string
  status: UserStatus;
  // Payments
  stripeAccountId?: string; // Stripe Connect Account ID (prestador)
  // Provider-specific fields
  headline?: string;
  specialties?: string[];
  hasCertificates?: boolean;
  hasCriminalRecordCheck?: boolean;
  availability?: 'imediata' | '24h' | '3dias' | '1semana';
  workingHours?: { start: number; end: number };
  jobsCompletedInArea?: number;
  avgResponseTimeMinutes?: number;
  completionRate?: number;
  address?: string;
  cpf?: string;
  verificationStatus?: 'pendente' | 'verificado' | 'recusado';
  documentImage?: string; // base64 data URL
  portfolio?: PortfolioItem[];
  serviceCatalog?: ProviderService[];
  seo?: SEOProfile;
  providerRate?: number; // Commission rate for provider (0.0 - 1.0), e.g., 0.85 = provider gets 85%
  fcmToken?: string; // Firebase Cloud Messaging token for push notifications
  notificationPreferences?: {
    newMessage?: boolean;
    jobStatusChange?: boolean;
    disputeEvents?: boolean;
    marketing?: boolean;
  };
}

export interface ProviderProfile {
    id: string;
    name: string;
    service: string;
    location: string;
    rating: number;
    bio: string;
    headline: string;
}

export type JobStatus = 'ativo' | 'em_leilao' | 'proposta_aceita' | 'agendado' | 'a_caminho' | 'em_progresso' | 'pagamento_pendente' | 'em_disputa' | 'concluido' | 'cancelado';
export type ServiceType = 'personalizado' | 'tabelado' | 'diagnostico';
export type JobMode = 'normal' | 'leilao';

export interface Review {
  rating: number;
  comment: string;
  authorId: string;
  createdAt: string; // ISO Date string
}

export interface Job {
  id: string;
  clientId: string;
  providerId?: string;
  itemId?: string; // ID do item de 'maintained_items'
  category: string;
  description: string;
  status: JobStatus;
  createdAt: string; // ISO Date string
  serviceType: ServiceType;
  urgency: 'hoje' | 'amanha' | '3dias' | '1semana';
  address?: string;
  // Location details (used for filtering in ProviderDashboard)
  location?: {
    address?: string;
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  media?: { name: string; type: 'image' | 'video'; path: string }[];
  fixedPrice?: number;
  visitFee?: number;
  review?: Review;
  escrowId?: string;
  disputeId?: string;
  // Auction fields
  jobMode?: JobMode;
  auctionEndDate?: string; // ISO Date string
  scheduledDate?: string; // ISO Date string
  // Earnings tracking
  earnings?: {
    totalAmount: number;
    providerShare: number;
    platformFee: number;
    paidAt?: string; // ISO Date string
  };
}

export interface Bid {
    id: string;
    jobId: string;
    providerId: string;
    amount: number;
    createdAt: string; // ISO Date string
}

// FIX: Moved JobData type here from App.tsx to be shared across components.
export type JobData = { 
  description: string; 
  category: string; 
  serviceType: ServiceType; 
  urgency: 'hoje' | 'amanha' | '3dias' | '1semana'; 
  address?: string; 
  media?: { name: string; type: 'image' | 'video'; path: string }[];
  fixedPrice?: number; 
  visitFee?: number; 
  targetProviderId?: string;
  jobMode?: JobMode;
  auctionDurationHours?: number;
}

export type ProposalStatus = 'pendente' | 'aceita' | 'recusada' | 'bloqueada';

export interface Proposal {
  id: string;
  jobId: string;
  providerId: string;
  price: number;
  message: string;
  status: ProposalStatus;
  createdAt: string; // ISO Date string
}

export interface Message {
  id: string;
  chatId: string; // Corresponds to JobId
  senderId: string;
  text: string;
  createdAt: string; // ISO Date string
  type?: 'text' | 'system_notification' | 'schedule_proposal';
  schedule?: ScheduledDateTime;
  isScheduleConfirmed?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  isRead: boolean;
  createdAt: string; // ISO Date string
}

export type EscrowStatus = 'bloqueado' | 'liberado' | 'reembolsado' | 'em_disputa';

export interface Escrow {
  id: string;
  jobId: string;
  clientId: string;
  providerId: string;
  amount: number;
  status: EscrowStatus;
  createdAt: string; // ISO Date string
  releasedAt?: string; // ISO Date string
}

export type FraudAlertStatus = 'novo' | 'revisado' | 'resolvido';

export interface FraudAlert {
  id: string;
  providerId: string;
  riskScore: number;
  reason: string;
  status: FraudAlertStatus;
  createdAt: string; // ISO Date string
}

export interface DisputeMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO Date string
}

export interface Dispute {
  id: string;
  jobId: string;
  initiatorId: string;
  reason: string;
  status: 'aberta' | 'resolvida';
  messages: DisputeMessage[];
  resolution?: {
    decidedBy: 'admin' | 'acordo';
    outcome: 'reembolsado' | 'liberado';
    reason: string;
  };
  createdAt: string; // ISO Date string
}


export interface MatchingResult {
  provider: ProviderProfile;
  compatibilityScore: number;
  justification: string;
}

export interface Prospect {
  name: string;
  specialty: string;
}

export interface MaintainedItem {
  id: string;
  clientId: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imageUrl: string;
  notes?: string;
  createdAt: string; // ISO Date string
  maintenanceHistory: {
    jobId: string;
    date: string;
    description: string;
  }[];
}

// AI-related types
export interface EnhancedJobRequest {
  enhancedDescription: string;
  suggestedCategory: string;
  suggestedServiceType: ServiceType;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface IdentifiedItem {
  itemName: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
}

export interface SEOProfileContent {
  seoTitle: string;
  metaDescription: string;
  publicHeadline: string;
  publicBio: string;
}

export interface CategoryPageContent {
  title: string;
  introduction: string;
  faq: FAQItem[];
}

export interface ScheduledDateTime {
  date: string; // e.g., "2024-05-28"
  time: string; // e.g., "14:00"
}

export interface ExtractedDocumentInfo {
    fullName: string;
    cpf: string;
}

export interface ParsedSearchQuery {
  service?: string;
  location?: string;
  attributes?: ('certificado' | 'verificado' | 'urgente' | 'imediata')[];
}

export interface MaintenanceSuggestion {
    suggestionTitle: string;
    jobDescription: string;
}

export interface ChatSuggestion {
    name: 'clarify_scope' | 'propose_schedule' | 'summarize_agreement' | 'suggest_next_step';
    args: { [key: string]: any };
    displayText: string;
}