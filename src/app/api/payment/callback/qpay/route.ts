import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { fulfillPaymentIfPaid } from '@/lib/payment/fulfill';

/** QPay төлбөр хийсний дараа server-to-server callback */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const invoiceId =
      String((body as { invoice_id?: string }).invoice_id ?? '') ||
      String((body as { object_id?: string }).object_id ?? '');

    if (!invoiceId) {
      return NextResponse.json({ ok: false, error: 'invoice_id байхгүй' }, { status: 400 });
    }

    const payment = await Payment.findOne({ invoiceId, method: 'qpay' }).sort({ createdAt: -1 });
    if (!payment) {
      return NextResponse.json({ ok: false, error: 'payment олдсонгүй' }, { status: 404 });
    }

    await fulfillPaymentIfPaid(payment._id.toString());
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'callback error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ service: 'qpay-callback', method: 'POST' });
}
