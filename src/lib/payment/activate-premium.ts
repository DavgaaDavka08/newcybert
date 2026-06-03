import { User } from '@/models/User';
import { PREMIUM_PRICES, parsePremiumPlanType, type PremiumPlanType } from '@/lib/premium-pricing';

/** Premium идэвхжүүлэх — одоогийн хугацааг сунгана */
export async function activatePremiumForUser(
  userId: string,
  plan: PremiumPlanType,
): Promise<{ premiumUntil: Date } | null> {
  const pricing = PREMIUM_PRICES[plan];
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  const currentEnd =
    user.premiumUntil && new Date(user.premiumUntil) > now
      ? new Date(user.premiumUntil)
      : now;

  const premiumUntil = new Date(currentEnd);
  premiumUntil.setMonth(premiumUntil.getMonth() + pricing.months);

  user.isPremium = true;
  user.premiumUntil = premiumUntil;
  user.premiumType = plan;
  user.coins = (user.coins ?? 0) + 50 * pricing.months;

  await user.save();
  return { premiumUntil };
}

export function planFromPaymentType(type: string): PremiumPlanType | null {
  return parsePremiumPlanType(type);
}
