import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import { rejectPayment } from '@/lib/payment/approve-payment';
import { checkRateLimit } from '@/lib/rate-limit';
import { isValidObjectId } from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 30, windowMs: 60 * 1000 });
  if (limited) return limited;

  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({})) as { paymentId?: string; reason?: string };
  const { paymentId, reason } = body;

  if (!paymentId || !isValidObjectId(paymentId)) {
    return NextResponse.json({ error: 'paymentId буруу' }, { status: 400 });
  }

  await connectDB();

  const result = await rejectPayment(paymentId, session!.user.email ?? 'admin', reason);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
