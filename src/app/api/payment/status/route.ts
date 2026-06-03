import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { fulfillPaymentIfPaid } from '@/lib/payment/fulfill';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentId = req.nextUrl.searchParams.get('paymentId');
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId шаардлагатай' }, { status: 400 });
    }

    await connectDB();
    const payment = await Payment.findById(paymentId);
    if (!payment || String(payment.userId) !== session.user.id) {
      return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 });
    }

    if (payment.status === 'success') {
      return NextResponse.json({ status: 'success', paidAt: payment.paidAt });
    }

    const result = await fulfillPaymentIfPaid(paymentId);
    return NextResponse.json({
      status: result.status,
      premiumUntil: result.premiumUntil,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
