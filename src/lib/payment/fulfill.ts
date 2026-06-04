import { Payment } from '@/models/Payment';
import { activatePremiumForUser, planFromPaymentType } from './activate-premium';
import { verifyExternalPayment } from './index';

/**
 * Atomically fulfills a payment if QPay/KhanBank confirms it is paid.
 *
 * Double-fulfillment prevention:
 *   We use a MongoDB findOneAndUpdate that only succeeds when status='pending'.
 *   The matched document is flipped to 'processing' before any remote API call,
 *   so concurrent requests (webhook + polling) cannot both proceed.
 */
export async function fulfillPaymentIfPaid(paymentId: string): Promise<{
  status: 'pending' | 'success' | 'failed';
  premiumUntil?: Date;
}> {
  // Quick short-circuit for already-completed payments
  const current = await Payment.findById(paymentId).lean() as {
    status: string; paidAt?: Date;
  } | null;
  if (!current) return { status: 'failed' };
  if (current.status === 'success') return { status: 'success' };

  // Atomic claim: flip pending → processing (only one concurrent caller succeeds)
  const claimed = await Payment.findOneAndUpdate(
    { _id: paymentId, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: false },
  ) as {
    _id: unknown;
    status: string;
    invoiceId?: string;
    method?: string;
    amount: number;
    type: string;
    userId: unknown;
    note?: string;
  } | null;

  if (!claimed) {
    // Another request already claimed this payment or it's done
    const fresh = await Payment.findById(paymentId).lean() as { status: string } | null;
    if (fresh?.status === 'success') return { status: 'success' };
    // 'processing' means it's in-flight elsewhere — tell client to retry
    return { status: 'pending' };
  }

  if (!claimed.invoiceId || !claimed.method) {
    await Payment.findByIdAndUpdate(paymentId, { $set: { status: 'pending' } });
    return { status: 'pending' };
  }

  try {
    // Verify with the payment provider AND check amount matches
    const paid = await verifyExternalPayment(
      claimed.method as 'qpay' | 'khan_bank',
      claimed.invoiceId,
      claimed.amount,
    );

    if (!paid) {
      // Restore to pending so next poll can retry
      await Payment.findByIdAndUpdate(paymentId, { $set: { status: 'pending' } });
      return { status: 'pending' };
    }

    const plan = planFromPaymentType(claimed.type);
    if (!plan) {
      await Payment.findByIdAndUpdate(paymentId, {
        $set: {
          status: 'failed',
          note: (claimed.note ?? '') + ' · plan parse error',
        },
      });
      return { status: 'failed' };
    }

    const result = await activatePremiumForUser(String(claimed.userId), plan);

    await Payment.findByIdAndUpdate(paymentId, {
      $set: { status: 'success', paidAt: new Date() },
    });

    return { status: 'success', premiumUntil: result?.premiumUntil };
  } catch (err) {
    // On error, restore to pending so the user can retry
    await Payment.findByIdAndUpdate(paymentId, { $set: { status: 'pending' } });
    throw err;
  }
}
