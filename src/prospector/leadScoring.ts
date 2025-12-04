export interface Prospect {
  id?: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  source?: string | null; // google_places | manual | import | referral
  tags?: string[];
  stage?: string; // lead | qualificado | contato | proposta | ganho | perdido
  lastInteractionTs?: number; // epoch ms
  opens?: number;
  clicks?: number;
  replies?: number;
  sentiment?: 'positivo' | 'neutro' | 'negativo';
}

export interface ScoreBreakdown {
  base: number;
  engagement: number;
  profile: number;
  recency: number;
  bonus: number;
  total: number;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function daysSince(ts?: number): number {
  if (!ts) return 365;
  const diff = Date.now() - ts;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function scoreProspect(p: Prospect): ScoreBreakdown {
  // Base by source quality
  const sourceWeights: Record<string, number> = {
    google_places: 60,
    referral: 70,
    import: 45,
    manual: 50,
  };
  const base = sourceWeights[p.source || 'manual'] ?? 50;

  // Engagement: opens, clicks, replies
  const opens = clamp((p.opens || 0) * 4, 0, 25);
  const clicks = clamp((p.clicks || 0) * 6, 0, 30);
  const replies = clamp((p.replies || 0) * 12, 0, 40);
  const engagement = clamp(opens + clicks + replies, 0, 50);

  // Profile completeness
  let profile = 0;
  const fields = [p.email, p.phone, p.company, p.title, p.website, p.linkedin];
  const filled = fields.filter(Boolean).length;
  profile = clamp(filled * 10, 0, 50);

  // Recency decay
  const d = daysSince(p.lastInteractionTs);
  const recency = clamp(35 - Math.min(d, 60) * 0.6, 0, 35);

  // Bonus for positive sentiment or strategic tags
  const hasStrategicTag = (p.tags || []).some(t => ['alto_valor', 'parceria'].includes(t));
  const bonus = (p.sentiment === 'positivo' ? 10 : 0) + (hasStrategicTag ? 8 : 0);

  const total = clamp(Math.round(base * 0.3 + engagement * 0.35 + profile * 0.2 + recency * 0.1 + bonus), 0, 100);

  return { base, engagement, profile, recency, bonus, total };
}

export function getPriority(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

export function describeScore(b: ScoreBreakdown): string {
  return `base=${b.base} eng=${b.engagement} prof=${b.profile} rec=${b.recency} bonus=${b.bonus} total=${b.total}`;
}
