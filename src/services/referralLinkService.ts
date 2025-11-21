/**
 * Referral Link Generator Service
 * 
 * Generates personalized referral links for prospectors with UTM parameters
 * to track conversions and attribute commissions correctly.
 * 
 * Features:
 * - Unique link per prospector
 * - UTM tracking for analytics
 * - Short link generation (optional)
 * - QR code generation for print materials
 * - Click tracking and analytics
 */

import { db } from '../firebaseConfig';
import { collection, doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';

export interface ReferralLink {
  prospectorId: string;
  prospectorName: string;
  fullUrl: string;
  shortCode: string;
  shortUrl: string;
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
  };
  qrCodeUrl?: string;
  clicks: number;
  conversions: number;
  createdAt: Date;
  lastClickedAt?: Date;
}

export interface LinkAnalytics {
  totalClicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
  clicksByDay: Array<{ date: string; clicks: number }>;
  clicksBySource: Array<{ source: string; clicks: number }>;
  topPerformingLinks: Array<{ url: string; clicks: number; conversions: number }>;
}

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://servio-ai.com';
// const SHORT_DOMAIN = 'servio.link'; // Could use a URL shortener service (future implementation)

/**
 * Generate unique referral link for a prospector
 */
export async function generateReferralLink(
  prospectorId: string,
  prospectorName: string,
  campaign: string = 'phase1',
  content?: string
): Promise<ReferralLink> {
  // Check if link already exists
  const existingLinkDoc = await getDoc(doc(db, 'referral_links', prospectorId));
  
  if (existingLinkDoc.exists()) {
    return existingLinkDoc.data() as ReferralLink;
  }

  // Generate short code (6 characters: alphanumeric)
  const shortCode = generateShortCode(prospectorId);

  // Build UTM parameters
  const utmParams = {
    source: 'prospector',
    medium: 'referral',
    campaign,
    content: content || prospectorId,
  };

  // Build full URL with UTM params
  const queryParams = new URLSearchParams({
    ref: prospectorId,
    utm_source: utmParams.source,
    utm_medium: utmParams.medium,
    utm_campaign: utmParams.campaign,
    utm_content: utmParams.content,
  });

  const fullUrl = `${BASE_URL}/register?${queryParams.toString()}`;
  const shortUrl = `${BASE_URL}/r/${shortCode}`;

  const referralLink: ReferralLink = {
    prospectorId,
    prospectorName,
    fullUrl,
    shortCode,
    shortUrl,
    utmParams,
    clicks: 0,
    conversions: 0,
    createdAt: new Date(),
  };

  // Save to Firestore
  await setDoc(doc(db, 'referral_links', prospectorId), referralLink);

  // Also create short link mapping
  await setDoc(doc(db, 'short_links', shortCode), {
    prospectorId,
    fullUrl,
    createdAt: new Date(),
  });

  // Link generated successfully
  return referralLink;
}

/**
 * Track click on referral link
 */
export async function trackClick(
  prospectorId: string,
  source: 'web' | 'mobile' | 'email' | 'whatsapp' | 'social' = 'web',
  userAgent?: string
): Promise<void> {
  const linkRef = doc(db, 'referral_links', prospectorId);

  // Increment click count
  await updateDoc(linkRef, {
    clicks: increment(1),
    lastClickedAt: Timestamp.now(),
  });

  // Log click event for analytics
  await setDoc(doc(collection(db, 'referral_clicks')), {
    prospectorId,
    source,
    userAgent,
    timestamp: Timestamp.now(),
  });

  // Click tracked successfully
}

/**
 * Track conversion (when prospect registers)
 */
export async function trackConversion(
  prospectorId: string,
  providerId: string
): Promise<void> {
  const linkRef = doc(db, 'referral_links', prospectorId);

  // Increment conversion count
  await updateDoc(linkRef, {
    conversions: increment(1),
  });

  // Log conversion event
  await setDoc(doc(collection(db, 'referral_conversions')), {
    prospectorId,
    providerId,
    timestamp: Timestamp.now(),
  });

  // Conversion tracked successfully
}

/**
 * Resolve short link to full URL
 */
export async function resolveShortLink(shortCode: string): Promise<string | null> {
  const shortLinkDoc = await getDoc(doc(db, 'short_links', shortCode));
  
  if (!shortLinkDoc.exists()) {
    return null;
  }

  const { fullUrl, prospectorId } = shortLinkDoc.data();

  // Track click
  await trackClick(prospectorId, 'web');

  return fullUrl;
}

/**
 * Get referral link for a prospector
 */
export async function getReferralLink(prospectorId: string): Promise<ReferralLink | null> {
  const linkDoc = await getDoc(doc(db, 'referral_links', prospectorId));
  
  if (!linkDoc.exists()) {
    return null;
  }

  return linkDoc.data() as ReferralLink;
}

/**
 * Get analytics for a prospector's referral link
 */
export async function getLinkAnalytics(prospectorId: string): Promise<LinkAnalytics> {
  const linkDoc = await getDoc(doc(db, 'referral_links', prospectorId));
  
  if (!linkDoc.exists()) {
    return {
      totalClicks: 0,
      uniqueClicks: 0,
      conversions: 0,
      conversionRate: 0,
      clicksByDay: [],
      clicksBySource: [],
      topPerformingLinks: [],
    };
  }

  const link = linkDoc.data() as ReferralLink;

  // Calculate conversion rate
  const conversionRate = link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0;

  // TODO: Implement more detailed analytics from referral_clicks collection
  // For now, return basic stats

  return {
    totalClicks: link.clicks,
    uniqueClicks: link.clicks, // TODO: Calculate unique IPs
    conversions: link.conversions,
    conversionRate,
    clicksByDay: [],
    clicksBySource: [],
    topPerformingLinks: [
      {
        url: link.shortUrl,
        clicks: link.clicks,
        conversions: link.conversions,
      },
    ],
  };
}

/**
 * Generate QR code URL for a referral link (using external service)
 */
export function generateQRCodeUrl(url: string, size: number = 300): string {
  // Using QR Server API (free, no registration needed)
  const encodedUrl = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
}

/**
 * Generate social media share URLs
 */
export function generateShareUrls(referralUrl: string, message: string): {
  facebook: string;
  twitter: string;
  linkedin: string;
  whatsapp: string;
  telegram: string;
} {
  const encodedUrl = encodeURIComponent(referralUrl);
  const encodedMessage = encodeURIComponent(message);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
  };
}

/**
 * Generate short code from prospector ID (6 alphanumeric characters)
 */
function generateShortCode(prospectorId: string): string {
  // Use first 6 characters of prospector ID (assuming it's a hash/UUID)
  // In production, could use a proper short URL service
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const index = prospectorId.charCodeAt(i % prospectorId.length) % chars.length;
    code += chars[index];
  }
  
  return code;
}

/**
 * Get leaderboard of top performing referral links
 */
export async function getTopReferralLinks(_limit: number = 10): Promise<Array<{
  prospectorId: string;
  prospectorName: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
}>> {
  // TODO: Implement proper query with ordering
  // For now, return empty array
  return [];
}

/**
 * Bulk generate referral links for multiple prospectors
 */
export async function bulkGenerateReferralLinks(
  prospectors: Array<{ id: string; name: string }>
): Promise<ReferralLink[]> {
  const links: ReferralLink[] = [];

  for (const prospector of prospectors) {
    const link = await generateReferralLink(prospector.id, prospector.name);
    links.push(link);
  }

  // Bulk generation complete
  return links;
}
