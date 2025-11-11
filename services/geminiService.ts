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
    ParsedSearchQuery,
    ChatSuggestion,
    UserType,
} from '../types';
/**
 * NOTE FOR PRODUCTION ARCHITECTURE:
 * This service has been refactored to act as a client for a secure backend API.
 * The Gemini API key and the `@google/genai` SDK are NO LONGER USED on the frontend.
 * All AI logic is now presumed to be handled by a backend server, which this service communicates with via `fetch`.
 * This is the standard, secure way to build a production application.
 */

/**
 * Resolve a full absolute URL for backend endpoints.
 * We store only relative paths (e.g. /api/enhance-job) in the service calls.
 * Node's fetch (used by Vitest) does NOT accept relative URLs without a base,
 * so during tests (process.env.VITEST) we prepend a localhost base.
 */
function resolveEndpoint(endpoint: string): string {
    // If already absolute (http/https), return unchanged.
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    const isBrowser = typeof window !== 'undefined' && !!window.location?.origin;
    // Prefer browser origin in the browser. In Node/test environments, use Vite envs when available.
    const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
    const viteBackend = viteEnv?.VITE_BACKEND_API_URL || viteEnv?.VITE_API_BASE_URL;
    const nodeEnvBackend = (typeof process !== 'undefined' ? (process.env as any)?.VITE_BACKEND_API_URL || (process.env as any)?.API_BASE_URL : undefined);
    const base = isBrowser
        ? window.location.origin
        : viteBackend || nodeEnvBackend || 'http://localhost:5173';
    return base.replace(/\/$/, '') + endpoint; // ensure no double slash at end of base
}

/**
 * A utility to handle API responses from our own backend.
 * Ensures absolute URL resolution for Node test environment compatibility.
 */
const fetchFromBackend = async <T>(endpoint: string, body: object): Promise<T> => {
    const fullUrl = resolveEndpoint(endpoint);
    // Add a safety timeout and one quick retry to improve resilience
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout
    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'A comunicação com o servidor falhou.' }));
            throw new Error(errorData.error || `Erro no servidor (${response.status}).`);
        }
        return response.json();
    } catch (err) {
        clearTimeout(timeout);
        // one quick retry without signal (short backoff)
        await new Promise(r => setTimeout(r, 300));
        const retryResp = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => null);
        if (!retryResp || !retryResp.ok) {
            const msg = (err as Error)?.message || 'Falha de rede ao contatar o servidor.';
            throw new Error(msg);
        }
        return retryResp.json();
    }
};


/**
 * Try to enhance a job request via backend AI. If the backend is down (500/Network)
 * we fall back to a lightweight heuristic so the user can continue without blocking.
 */
export async function enhanceJobRequest(prompt: string, address?: string, fileCount?: number): Promise<EnhancedJobRequest> {
    try {
        return await fetchFromBackend<EnhancedJobRequest>('/api/enhance-job', { prompt, address, fileCount });
    } catch (err) {
        // Heuristic fallback: infer a category & service type from the prompt.
        const lower = prompt.toLowerCase();
        let category = 'geral';
        const categoryHints: { [key: string]: string } = {
            eletric: 'eletricista',
            luz: 'eletricista',
            tomada: 'eletricista',
            fio: 'eletricista',
            encan: 'encanador',
            torneira: 'encanador',
            vazamento: 'encanador',
            pintura: 'pintura',
            parede: 'pintura',
            telhado: 'reparos',
            goteira: 'reparos',
            computador: 'ti',
            notebook: 'ti',
            design: 'design',
            logo: 'design',
        };
        for (const hint in categoryHints) {
            if (lower.includes(hint)) {
                category = categoryHints[hint];
                break;
            }
        }

        // Service type heuristic: if mentions orçamento/preço -> personalizado, if simples keywords -> tabelado, if avaliar/diagnostico -> diagnostico
        let serviceType: ServiceType = 'personalizado';
        if (/diagnost/i.test(lower) || /avaliar|inspecionar/.test(lower)) serviceType = 'diagnostico';
        else if (/simples|trocar|instalar|pintar|formatar|limpar/.test(lower)) serviceType = 'tabelado';

        const fallback: EnhancedJobRequest = {
            enhancedDescription: prompt, // keep original text so user can refine
            suggestedCategory: category,
            suggestedServiceType: serviceType,
        };
        // Surface a console warning for observability (could integrate with monitoring later)
        console.warn('[enhanceJobRequest] Fallback heuristic used due to AI backend error:', err);
        return fallback;
    }
}

export async function getMatchingProviders(job: Job, allUsers: User[], allJobs: Job[]): Promise<MatchingResult[]> {
    // In a real app, we wouldn't send all users/jobs. The backend would have access to the database.
    // This is a simplification for the prototype's transition.
    try {
        return await fetchFromBackend<MatchingResult[]>('/api/match-providers', { job, allUsers, allJobs });
    } catch (e) {
        console.warn('[match-providers] Fallback to empty list due to backend error:', e);
        return [];
    }
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
    // In test environment, avoid network dependency by returning a deterministic mock.
    const isVitest = typeof process !== 'undefined' && (process.env as any)?.VITEST;
    if (isVitest) {
        return '[mock-tip] Complete seu perfil adicionando uma boa foto profissional.';
    }
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
