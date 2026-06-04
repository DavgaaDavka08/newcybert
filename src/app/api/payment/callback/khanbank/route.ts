import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { fulfillPaymentIfPaid } from '@/lib/payment/fulfill';
import { checkRateLimit } from '@/lib/rate-limit';

function safeRedirect(path: string): NextResponse {
  // Always redirect to our own origin — prevents open-redirect attacks
  const base = (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  return NextResponse.redirect(`${base}${path}`);
}

/** Khan Bank returnUrl — хэрэглэгч төлбөр хийсний дараа энд ирнэ */
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 30, windowMs: 60 * 1000 });
  if (limited) return safeRedirect('/dashboard/premium?payment=failed');

  const paymentId = req.nextUrl.searchParams.get('paymentId');
  const failed = req.nextUrl.searchParams.get('payment') === 'failed';

  if (failed || !paymentId) {
    return safeRedirect('/dashboard/premium?payment=failed');
  }

  // Sanitize paymentId — must be a valid MongoDB ObjectId (24 hex chars)
  if (!/^[a-f\d]{24}$/i.test(paymentId)) {
    return safeRedirect('/dashboard/premium?payment=failed');
  }

  try {
    await connectDB();
    const result = await fulfillPaymentIfPaid(paymentId);
    if (result.status === 'success') {
      return safeRedirect('/dashboard/premium?payment=success');
    }
    return safeRedirect(`/dashboard/premium?payment=pending&id=${paymentId}`);
  } catch {
    return safeRedirect('/dashboard/premium?payment=error');
  }
}
