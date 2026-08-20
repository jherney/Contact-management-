import { Contact, Deal, LeadScore, LeadScoreTier, InteractionNote } from '../types';

interface LeadScoringOptions {
  contacts: Contact[];
  deals: Deal[];
  tagWeights?: Record<string, number>;
  interactionWeights?: Partial<Record<InteractionNote['type'], number>>;
}

const DEFAULT_TAG_WEIGHTS: Record<string, number> = {
  VIP: 30,
  Investor: 25,
  'Key Client': 20,
  Board: 25,
  Decision: 15,
};

const DEFAULT_INTERACTION_WEIGHTS: Record<InteractionNote['type'], number> = {
  Call: 5,
  Email: 3,
  Meeting: 10,
  Note: 1,
  'Follow-up': 7,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeLeadScore(
  contact: Contact,
  deals: Deal[],
  options?: {
    tagWeights?: Record<string, number>;
    interactionWeights?: Partial<Record<InteractionNote['type'], number>>;
  }
): number {
  let score = 0;
  const weights = options || {};
  const tagWeights = { ...DEFAULT_TAG_WEIGHTS, ...(weights.tagWeights || {}) };
  const interactionWeights = { ...DEFAULT_INTERACTION_WEIGHTS, ...(weights.interactionWeights || {}) };

  // 1. Interaction frequency (last 90 days weighted)
  const now = Date.now();
  const recentCutoff = now - 90 * DAY_MS;
  let recentInteractions = 0;

  (contact.interactions || []).forEach((interaction) => {
    const interactionTime = new Date(interaction.date).getTime();
    if (interactionTime > recentCutoff) {
      recentInteractions++;
      score += interactionWeights[interaction.type] || 2;
    }
  });

  // 2. Recency of last contact (more recent = higher score)
  if (contact.lastContactedAt) {
    const daysSinceContact = (now - new Date(contact.lastContactedAt).getTime()) / DAY_MS;
    if (daysSinceContact <= 3) score += 15;
    else if (daysSinceContact <= 7) score += 10;
    else if (daysSinceContact <= 14) score += 5;
    else if (daysSinceContact <= 30) score += 2;
  } else {
    score -= 5; // penalize for no interaction history
  }

  // 3. Favorites get a boost
  if (contact.isFavorite) score += 10;

  // 4. Tag-based scoring
  (contact.tags || []).forEach((tag) => {
    score += tagWeights[tag] || 0;
  });

  // 5. Deal-based scoring
  const contactDeals = deals.filter((d) => d.contactId === contact.id);
  contactDeals.forEach((deal) => {
    if (deal.stage === 'won') score += 25;
    else if (deal.stage === 'negotiation') score += 20;
    else if (deal.stage === 'proposal') score += 15;
    else if (deal.stage === 'qualified') score += 10;
    else if (deal.stage === 'lead') score += 5;
  });

  // 6. Deal value contributes (normalized: $100K+ gets full points)
  const totalDealValue = contactDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  score += Math.min(totalDealValue / 100000, 15);

  // 7. Completeness of profile
  let completeFields = 0;
  const fields = ['email', 'phone', 'company', 'jobTitle', 'address', 'linkedIn', 'notes'];
  fields.forEach((f) => {
    if (contact[f as keyof Contact]) completeFields++;
  });
  score += completeFields * 2;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getLeadScoreTier(score: number): LeadScoreTier {
  if (score >= 80) return 'vip';
  if (score >= 60) return 'hot';
  if (score >= 35) return 'warm';
  return 'cold';
}

export function getLeadScoreTierColor(tier: LeadScoreTier): string {
  switch (tier) {
    case 'vip':
      return 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/30';
    case 'hot':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'warm':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-[#fafaf9]/10 text-[#fafaf9]/40 border-white/[0.08]';
  }
}

export function computeAllLeadScores(
  contacts: Contact[],
  deals: Deal[],
  options?: {
    tagWeights?: Record<string, number>;
    interactionWeights?: Partial<Record<InteractionNote['type'], number>>;
  }
): LeadScore[] {
  return contacts.map((contact) => {
    const rawScore = computeLeadScore(contact, deals, options);
    return {
      contactId: contact.id,
      score: rawScore,
      tier: getLeadScoreTier(rawScore),
      lastCalculatedAt: new Date().toISOString(),
    };
  });
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 80) return 'bg-[#ff4d00] text-white';
  if (score >= 60) return 'bg-rose-500 text-white';
  if (score >= 35) return 'bg-amber-500/80 text-[#0a0a0a]';
  return 'bg-[#fafaf9]/20 text-[#fafaf9]/40';
}
