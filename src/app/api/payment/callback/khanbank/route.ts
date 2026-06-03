import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { fulfillPaymentIfPaid } from '@/lib/payment/fulfill';

/** Khan Bank returnUrl — хэрэглэгч төлбөр хийсний дараа энд ирнэ */
export async function GET(req: NextRequest) {
  const base =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000';

  const paymentId = req.nextUrl.searchParams.get('paymentId');
  const failed = req.nextUrl.searchParams.get('payment') === 'failed';

  if (failed || !paymentId) {
    return NextResponse.redirect(`${base}/dashboard/premium?payment=failed`);
  }

  try {
    await connectDB();
    const result = await fulfillPaymentIfPaid(paymentId);
    if (result.status === 'success') {
      return NextResponse.redirect(`${base}/dashboard/premium?payment=success`);
    }
    return NextResponse.redirect(`${base}/dashboard/premium?payment=pending&id=${paymentId}`);
  } catch {
    return NextResponse.redirect(`${base}/dashboard/premium?payment=error`);
  }
}
