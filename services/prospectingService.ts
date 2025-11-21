/**
 * Prospecting Service v2.0 - Enhanced automatic provider prospecting
 * Features:
 * - AI-powered profile analysis and scoring
 * - Smart follow-up sequences
 * - Personalized email templates
 * - Quality filtering and deduplication
 * - Multi-channel prospecting (email, SMS, WhatsApp)
 */

import { JobData } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://api.servio-ai.com';

interface ProspectingResult {
  success: boolean;
  prospectsFound: number;
  emailsSent: number;
  smsSent?: number;
  whatsappSent?: number;
  adminNotified: boolean;
  message: string;
  qualityScore?: number;
  topProspects?: ProspectProfile[];
}

interface GoogleSearchResult {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface ProspectProfile {
  name: string;
  email?: string;
  phone?: string;
  qualityScore: number; // 0-100
  matchScore: number; // 0-100
  experience?: string;
  specialties?: string[];
  location?: string;
  availability?: string;
  preferredContact?: 'email' | 'phone' | 'whatsapp';
  aiAnalysis?: string;
}

/**
 * Triggers automatic prospecting when no providers are available
 * 1. Searches Google for local professionals in the service category
 * 2. Extracts contact information using AI
 * 3. Sends invitation emails to found prospects
 * 4. Creates urgent notification for admin/prospecting team
 * 5. Saves prospects in database for follow-up
 */
export async function triggerAutoProspecting(
  jobData: JobData,
  clientEmail: string
): Promise<ProspectingResult> {
  try {
    console.log('[ProspectingService] Triggering auto-prospecting for:', jobData.category);

    const response = await fetch(`${BACKEND_URL}/api/auto-prospect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: jobData.category,
        location: jobData.address || 'Não especificado',
        description: jobData.description,
        clientEmail,
        urgency: 'high',
      }),
    });

    if (!response.ok) {
      throw new Error(`Prospecting API error: ${response.status}`);
    }

    const result: ProspectingResult = await response.json();
    
    console.log('[ProspectingService] Auto-prospecting completed:', result);
    return result;

  } catch (error) {
    console.error('[ProspectingService] Auto-prospecting failed:', error);
    return {
      success: false,
      prospectsFound: 0,
      emailsSent: 0,
      adminNotified: false,
      message: 'Falha na prospecção automática. Equipe será notificada manualmente.',
    };
  }
}

/**
 * Searches Google for local professionals using the backend API
 */
export async function searchGoogleForProviders(
  category: string,
  location: string
): Promise<GoogleSearchResult[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/google-search-providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, location }),
    });

    if (!response.ok) {
      throw new Error(`Google search API error: ${response.status}`);
    }

    const results: GoogleSearchResult[] = await response.json();
    return results;

  } catch (error) {
    console.error('[ProspectingService] Google search failed:', error);
    return [];
  }
}

/**
 * Sends invitation email to a prospect
 */
export async function sendProspectInvitation(
  prospectEmail: string,
  prospectName: string,
  jobCategory: string,
  jobLocation: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/send-prospect-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prospectEmail,
        prospectName,
        jobCategory,
        jobLocation,
      }),
    });

    return response.ok;

  } catch (error) {
    console.error('[ProspectingService] Failed to send invitation:', error);
    return false;
  }
}

/**
 * Creates urgent notification for admin/prospecting team
 */
export async function notifyProspectingTeam(
  category: string,
  location: string,
  clientEmail: string,
  prospectsFound: number
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/notify-prospecting-team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        location,
        clientEmail,
        prospectsFound,
        urgency: 'high',
        message: `Cliente solicitou ${category} em ${location} mas não há prestadores disponíveis. ${prospectsFound} prospectos encontrados automaticamente.`,
      }),
    });

    return response.ok;

  } catch (error) {
    console.error('[ProspectingService] Failed to notify team:', error);
    return false;
  }
}

/**
 * Saves prospect to database for follow-up
 */
export async function saveProspect(
  name: string,
  email: string,
  phone: string | undefined,
  category: string,
  location: string,
  source: 'google_auto' | 'manual'
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/prospects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        specialty: category,
        source,
        status: 'pendente',
        createdAt: new Date().toISOString(),
        notes: [{
          text: `Auto-prospectado para ${category} em ${location}`,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        }],
      }),
    });

    return response.ok;

  } catch (error) {
    console.error('[ProspectingService] Failed to save prospect:', error);
    return false;
  }
}

/**
 * NEW v2.0: Analyzes prospect profile using AI to determine quality and match score
 */
export async function analyzeProspectWithAI(
  prospect: GoogleSearchResult,
  jobCategory: string,
  jobDescription: string
): Promise<ProspectProfile> {
  try {
    const response = await fetch('${BACKEND_URL}/api/analyze-prospect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prospect,
        jobCategory,
        jobDescription,
      }),
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    return await response.json();

  } catch (error) {
    console.error('[ProspectingService] AI analysis failed:', error);
    return {
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone,
      qualityScore: prospect.rating ? prospect.rating * 20 : 50,
      matchScore: 50,
      location: prospect.address,
      preferredContact: prospect.email ? 'email' : 'phone',
    };
  }
}

/**
 * NEW v2.0: Generates personalized email using AI
 */
export async function generatePersonalizedEmail(
  prospect: ProspectProfile,
  jobCategory: string,
  jobLocation: string
): Promise<string> {
  try {
    const response = await fetch('${BACKEND_URL}/api/generate-prospect-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectName: prospect.name,
        specialties: prospect.specialties,
        jobCategory,
        jobLocation,
        qualityScore: prospect.qualityScore,
      }),
    });

    if (!response.ok) throw new Error('Email generation failed');
    const result = await response.json();
    return result.emailBody;

  } catch (error) {
    console.error('[ProspectingService] Email generation failed:', error);
    return `Olá ${prospect.name},\n\nTemos um cliente procurando por ${jobCategory} em ${jobLocation}.\n\nGostaríamos de convidá-lo(a) para participar deste projeto!\n\nCadastre-se: https://servio-ai.com/register?type=provider\n\nEquipe Servio.AI`;
  }
}

/**
 * NEW v2.0: Sends multi-channel invitation
 */
export async function sendMultiChannelInvite(
  prospect: ProspectProfile,
  jobCategory: string,
  jobLocation: string,
  channels: ('email' | 'sms' | 'whatsapp')[] = ['email']
): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
  const results = { email: false, sms: false, whatsapp: false };

  if (channels.includes('email') && prospect.email) {
    await generatePersonalizedEmail(prospect, jobCategory, jobLocation);
    results.email = await sendProspectInvitation(prospect.email, prospect.name, jobCategory, jobLocation);
  }

  if (channels.includes('sms') && prospect.phone) {
    try {
      const response = await fetch('${BACKEND_URL}/api/send-sms-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: prospect.phone, name: prospect.name, category: jobCategory, location: jobLocation }),
      });
      results.sms = response.ok;
    } catch (error) { console.error('[ProspectingService] SMS failed:', error); }
  }

  if (channels.includes('whatsapp') && prospect.phone) {
    try {
      const response = await fetch('${BACKEND_URL}/api/send-whatsapp-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: prospect.phone, name: prospect.name, category: jobCategory, location: jobLocation }),
      });
      results.whatsapp = response.ok;
    } catch (error) { console.error('[ProspectingService] WhatsApp failed:', error); }
  }

  return results;
}
