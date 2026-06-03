import { Payment } from '@/models/Payment';
import { activatePremiumForUser, planFromPaymentType } from './activate-premium';
import { verifyExternalPayment } from './index';

/** Төлбөр амжилттай бол Premium идэвхжүүлнэ */
export async function fulfillPaymentIfPaid(paymentId: string): Promise<{
  status: 'pending' | 'success' | 'failed';
  premiumUntil?: Date;
}> {
  const payment = await Payment.findById(paymentId);
  if (!payment) return { status: 'failed' };

  if (payment.status === 'success') {
    return { status: 'success' };
  }

  if (!payment.invoiceId || !payment.method) {
    return { status: 'pending' };
  }

  const paid = await verifyExternalPayment(
    payment.method as 'qpay' | 'khan_bank',
    payment.invoiceId,
  );

  if (!paid) return { status: 'pending' };

  const plan = planFromPaymentType(payment.type);
  if (!plan) {
    payment.status = 'failed';
    payment.note = (payment.note ?? '') + ' · plan parse error';
    await payment.save();
    return { status: 'failed' };
  }

  const result = await activatePremiumForUser(String(payment.userId), plan);
  payment.status = 'success';
  payment.paidAt = new Date();
  await payment.save();

  return { status: 'success', premiumUntil: result?.premiumUntil };
}
