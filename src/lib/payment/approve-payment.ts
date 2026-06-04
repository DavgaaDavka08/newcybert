import { Payment } from '@/models/Payment';
import { User } from '@/models/User';
import { parsePremiumPlanType } from '@/lib/premium-pricing';

/**
 * Atomically approve a bank-transfer payment and activate Premium.
 *
 * Double-approval prevention:
 *   findOneAndUpdate only matches status='waiting_verification',
 *   flipping it to 'processing' before touching the user doc.
 */
export async function approvePayment(
  paymentId: string,
  adminEmail: string,
): Promise<{ ok: true; premiumUntil: Date } | { ok: false; error: string }> {
  // Atomic claim
  const claimed = await Payment.findOneAndUpdate(
    { _id: paymentId, status: 'waiting_verification', method: 'bank_transfer' },
    { $set: { status: 'processing' } },
    { new: false },
  ).lean() as {
    _id: unknown;
    type: string;
    userId: unknown;
    amount: number;
  } | null;

  if (!claimed) {
    const current = await Payment.findById(paymentId).lean() as { status?: string } | null;
    if (!current) return { ok: false, error: 'Төлбөр олдсонгүй' };
    if (current.status === 'success') return { ok: false, error: 'Аль хэдийн баталгаажсан' };
    return { ok: false, error: `Баталгаажуулах боломжгүй (статус: ${current.status ?? 'unknown'})` };
  }

  const plan = parsePremiumPlanType(claimed.type);
  if (!plan) {
    await Payment.findByIdAndUpdate(paymentId, {
      $set: { status: 'waiting_verification' },
    });
    return { ok: false, error: 'Тарифын мэдээлэл олдсонгүй' };
  }

  try {
    const now = new Date();
    const user = await User.findById(claimed.userId);
    if (!user) {
      await Payment.findByIdAndUpdate(paymentId, { $set: { status: 'waiting_verification' } });
      return { ok: false, error: 'Хэрэглэгч олдсонгүй' };
    }

    // Extend premium from today or from current expiry, whichever is later
    const MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, annual: 12 };
    const months = MONTHS[plan] ?? 1;
    const base = user.premiumUntil && new Date(user.premiumUntil) > now
      ? new Date(user.premiumUntil)
      : now;
    const premiumUntil = new Date(base);
    premiumUntil.setMonth(premiumUntil.getMonth() + months);

    user.isPremium    = true;
    user.premiumUntil = premiumUntil;
    user.premiumType  = plan;
    user.coins = (user.coins ?? 0) + 50 * months;
    await user.save();

    await Payment.findByIdAndUpdate(paymentId, {
      $set: {
        status: 'success',
        paidAt: now,
        reviewedBy: adminEmail,
        reviewedAt: now,
      },
    });

    return { ok: true, premiumUntil };
  } catch (err) {
    // Restore so admin can retry
    await Payment.findByIdAndUpdate(paymentId, { $set: { status: 'waiting_verification' } });
    throw err;
  }
}

export async function rejectPayment(
  paymentId: string,
  adminEmail: string,
  reason?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await Payment.findOneAndUpdate(
    {
      _id: paymentId,
      method: 'bank_transfer',
      status: { $in: ['pending', 'waiting_verification'] },
    },
    {
      $set: {
        status: 'rejected',
        reviewedBy: adminEmail,
        reviewedAt: new Date(),
        rejectedReason: reason ?? '',
      },
    },
    { new: false },
  );

  if (!result) {
    const current = await Payment.findById(paymentId).lean() as { status?: string } | null;
    if (!current) return { ok: false, error: 'Төлбөр олдсонгүй' };
    if (current.status === 'success') return { ok: false, error: 'Аль хэдийн баталгаажсан төлбөрийг цуцлах боломжгүй' };
    return { ok: false, error: `Цуцлах боломжгүй (статус: ${current.status ?? 'unknown'})` };
  }

  return { ok: true };
}
