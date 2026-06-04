import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { fulfillPaymentIfPaid } from '@/lib/payment/fulfill';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * QPay server-to-server webhook.
 * QPay calls this after the user completes payment.
 *
 * Security:
 *  - Rate limited (50 req / 60s per IP)
 *  - We NEVER trust the callback payload alone — fulfillPaymentIfPaid always
 *    re-verifies with QPay's API before activating Premium.
 *  - Atomic lock in fulfillPaymentIfPaid prevents double-fulfillment.
 */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 50, windowMs: 60 * 1000 });
  if (limited) return limited;

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    const invoiceId =
      String((body as { invoice_id?: string }).invoice_id ?? '') ||
      String((body as { object_id?: string }).object_id ?? '');

    if (!invoiceId) {
      return NextResponse.json({ ok: false, error: 'invoice_id байхгүй' }, { status: 400 });
    }

    const payment = await Payment.findOne({
      invoiceId,
      method: 'qpay',
    }).sort({ createdAt: -1 });

    if (!payment) {
      // Respond 200 to QPay so it doesn't keep retrying for unknown invoices
      return NextResponse.json({ ok: false, error: 'payment олдсонгүй' }, { status: 200 });
    }

    // Already fulfilled — idempotent response
    if (payment.status === 'success') {
      return NextResponse.json({ ok: true, status: 'already_fulfilled' });
    }

    await fulfillPaymentIfPaid(payment._id.toString());
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'callback error';
    console.error('[qpay-callback]', msg);
    // Return 200 so QPay doesn't hammer us with retries for transient errors
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ service: 'qpay-callback', method: 'POST' });
}
