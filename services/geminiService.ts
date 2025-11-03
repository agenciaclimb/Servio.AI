// @google/genai API implementation
import {
  Job,
  User,
  Review,
  MatchingResult,
  EnhancedJobRequest,
  FAQItem,
  IdentifiedItem,
  SEOProfileContent,
  CategoryPageContent,
  Message,
  ScheduledDateTime,
  ExtractedDocumentInfo,
  DisputeMessage,
  ServiceType,
  Prospect,
  ProviderProfile,
  ParsedSearchQuery,
  MaintainedItem,
  MaintenanceSuggestion,
  ChatSuggestion,
  UserType,
  Proposal,
  FraudAlert,
} from '../types';

/**
 * NOTE FOR PRODUCTION ARCHITECTURE:
 * 
 * This service has been refactored to act as a client for a secure backend API.
 * The Gemini API key and the `@google/genai` SDK are NO LONGER USED on the frontend.
 * All AI logic is now presumed to be handled by a backend server, which this service communicates with via `fetch`.
 * This is the standard, secure way to build a production application.
 */

import { aiApi } from '../src/lib/aiApi';

/**
 * A utility to handle API responses using the AI backend client.
 * Ensures we always hit VITE_AI_API_URL instead of the Vite dev server.
 */
const fetchFromBackend = async <T>(endpoint: string, body: object): Promise<T> => {
    try {
        return await aiApi.post<T>(endpoint, body);
    } catch (err: any) {
        const message = err?.message || 'A comunicação com o servidor falhou.';
        throw new Error(message);
    }
}


export async function enhanceJobRequest(prompt: string, address?: string, fileCount?: number): Promise<EnhancedJobRequest> {
  return fetchFromBackend<EnhancedJobRequest>('/api/enhance-job', { prompt, address, fileCount });
}

export async function getMatchingProviders(job: Job, allUsers: User[], allJobs: Job[]): Promise<MatchingResult[]> {
    // In a real app, we wouldn't send all users/jobs. The backend would have access to the database.
    // This is a simplification for the prototype's transition.
    return fetchFromBackend<MatchingResult[]>('/api/match-providers', { job, allUsers, allJobs });
}


export async function generateProposalMessage(job: Job, provider: User): Promise<string> {
    const { message } = await fetchFromBackend<{ message: string }>('/api/generate-proposal', { job, provider });
    return message;
}

export async function generateJobFAQ(job: Job): Promise<FAQItem[]> {
    return fetchFromBackend<FAQItem[]>('/api/generate-faq', { job });
}

export async function identifyItemFromImage(base64Image: string, mimeType: string): Promise<IdentifiedItem> {
    return fetchFromBackend<IdentifiedItem>('/api/identify-item', { base64Image, mimeType });
}

export const serviceNameToCategory: { [key: string]: string } = {
  'Eletricista Profissional': 'reparos',
  'Pintora Residencial': 'reparos',
  'Encanador': 'reparos',
  'Designer Gráfico': 'design',
  'Técnico de Informática': 'ti',
};

export async function enhanceProviderProfile(profile: { name: string; headline: string; bio: string }): Promise<{ suggestedHeadline: string; suggestedBio: string; }> {
  return fetchFromBackend<{ suggestedHeadline: string; suggestedBio: string; }>('/api/enhance-profile', { profile });
}

export async function generateSEOProfileContent(user: User, reviews: Review[]): Promise<SEOProfileContent> {
  return fetchFromBackend<SEOProfileContent>('/api/generate-seo', { user, reviews });
}

export async function summarizeReviews(providerName: string, reviews: Review[]): Promise<string> {
    const { summary } = await fetchFromBackend<{ summary: string }>('/api/summarize-reviews', { providerName, reviews });
    return summary;
}

export async function generateReviewComment(rating: number, category: string, description: string): Promise<string> {
    const { comment } = await fetchFromBackend<{ comment: string }>('/api/generate-comment', { rating, category, description });
    return comment;
}

export async function generateProfileTip(user: User): Promise<string> {
    const { tip } = await fetchFromBackend<{ tip: string }>('/api/generate-tip', { user });
    return tip;
}

export async function generateReferralEmail(senderName: string, friendEmail: string): Promise<{ subject: string, body: string }> {
    return fetchFromBackend<{ subject: string, body: string }>('/api/generate-referral', { senderName, friendEmail });
}

export async function generateCategoryPageContent(category: string, location?: string): Promise<CategoryPageContent> {
  return fetchFromBackend<CategoryPageContent>('/api/generate-category-page', { category, location });
}

export async function suggestMaintenance(item: MaintainedItem): Promise<MaintenanceSuggestion | null> {
    return fetchFromBackend<MaintenanceSuggestion | null>('/api/suggest-maintenance', { item });
}

export async function proposeScheduleFromChat(messages: Message[]): Promise<ScheduledDateTime | null> {
    return fetchFromBackend<ScheduledDateTime | null>('/api/propose-schedule', { messages });
}

export async function getChatAssistance(messages: Message[], currentUserType: UserType): Promise<ChatSuggestion | null> {
    return fetchFromBackend<ChatSuggestion | null>('/api/get-chat-assistance', { messages, currentUserType });
}

export async function parseSearchQuery(query: string): Promise<ParsedSearchQuery> {
    return fetchFromBackend<ParsedSearchQuery>('/api/parse-search', { query });
}

export async function extractInfoFromDocument(base64Image: string, mimeType: string): Promise<ExtractedDocumentInfo> {
    return fetchFromBackend<ExtractedDocumentInfo>('/api/extract-document', { base64Image, mimeType });
}

export async function mediateDispute(messages: DisputeMessage[], clientName: string, providerName: string): Promise<{ summary: string; analysis: string; suggestion: string; }> {
    return fetchFromBackend<{ summary: string; analysis: string; suggestion: string; }>('/api/mediate-dispute', { messages, clientName, providerName });
}

export async function analyzeProviderBehaviorForFraud(provider: User, context: { type: 'proposal' | 'bid' | 'profile_update', data: any }): Promise<{ isSuspicious: boolean; riskScore: number; reason: string } | null> {
    return fetchFromBackend<{ isSuspicious: boolean; riskScore: number; reason: string } | null>('/api/analyze-fraud', { provider, context });
}
