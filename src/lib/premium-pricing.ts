/** Premium subscription pricing — single source of truth */

export type PremiumPlanType = 'monthly' | 'quarterly' | 'annual';

export const PREMIUM_PRICES: Record<
  PremiumPlanType,
  { amount: number; months: number; label: string; labelMn: string }
> = {
  monthly: { amount: 9900, months: 1, label: 'Monthly', labelMn: 'Сарын' },
  quarterly: { amount: 24900, months: 3, label: '3-Month', labelMn: '3 сар' },
  annual: { amount: 59900, months: 12, label: 'Annual', labelMn: 'Жилийн' },
};

export const PREMIUM_FEATURES = [
  'Бүх видео хязгааргүй',
  'Бүх шалгалт хязгааргүй',
  'AI тайлбар хязгааргүй',
  'Амь хязгааргүй (∞)',
  'XP boost ×1.5',
  'PRO badge',
  'Сар бүр +50 бонус зоос',
] as const;

/** Payment document `type` field */
export function premiumPaymentType(plan: PremiumPlanType): string {
  return `premium_${plan}`;
}

export function parsePremiumPlanType(input: string): PremiumPlanType | null {
  if (input === 'monthly' || input === 'quarterly' || input === 'annual') return input;
  if (input === 'premium_monthly') return 'monthly';
  if (input === 'premium_quarterly') return 'quarterly';
  if (input === 'premium_annual') return 'annual';
  return null;
}

export function perMonthPrice(plan: PremiumPlanType): number {
  const p = PREMIUM_PRICES[plan];
  return Math.round(p.amount / p.months);
}

export function formatMnt(amount: number): string {
  return `${amount.toLocaleString('en-US')}₮`;
}

export const PREMIUM_SAVINGS: Partial<Record<PremiumPlanType, number>> = {
  quarterly: 5000,
  annual: 58900,
};
