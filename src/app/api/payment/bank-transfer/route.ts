import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { requireAuth } from '@/lib/auth';
import { generatePaymentCode } from '@/lib/payment/generate-code';
import { parsePremiumPlanType, PREMIUM_PRICES, premiumPaymentType } from '@/lib/premium-pricing';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 10, windowMs: 60 * 1000 });
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({})) as { plan?: string };
  const plan = parsePremiumPlanType(String(body.plan ?? ''));
  if (!plan) {
    return NextResponse.json({ error: 'Багц сонгоно уу (monthly | quarterly | annual)' }, { status: 400 });
  }

  await connectDB();

  // Cancel any old pending bank-transfer payments for this user+plan
  await Payment.updateMany(
    { userId: session!.user.id, method: 'bank_transfer', status: 'pending', type: premiumPaymentType(plan) },
    { $set: { status: 'failed', note: 'Superseded by new payment' } },
  );

  const code = await generatePaymentCode();
  const pricing = PREMIUM_PRICES[plan];

  const payment = await Payment.create({
    userId: session!.user.id,
    amount: pricing.amount,
    type: premiumPaymentType(plan),
    status: 'pending',
    method: 'bank_transfer',
    paymentCode: code,
    note: `${pricing.labelMn} Premium — bank transfer`,
  });

  return NextResponse.json({
    ok: true,
    paymentId: payment._id.toString(),
    paymentCode: code,
    amount: pricing.amount,
    plan,
    months: pricing.months,
    bankName: process.env.BANK_NAME ?? 'ХААН Банк',
    accountNumber: process.env.BANK_ACCOUNT ?? '',
    accountHolder: process.env.BANK_HOLDER ?? '',
  });
}
