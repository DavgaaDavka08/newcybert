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

  const pricing = PREMIUM_PRICES[plan];
  const paymentType = premiumPaymentType(plan);
  const bankName = process.env.BANK_NAME ?? 'ХААН Банк';
  const accountNumber = process.env.BANK_ACCOUNT ?? '';
  const accountHolder = process.env.BANK_HOLDER ?? '';

  if (!accountNumber || accountNumber.includes('X') || accountNumber.length < 8) {
    return NextResponse.json(
      { error: 'Төлбөрийн систем одоогоор тохируулагдаагүй байна. Удахгүй засагдана.' },
      { status: 503 },
    );
  }

  // Auto-expire payments older than 48 hours
  const expiryCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  await Payment.updateMany(
    {
      userId: session!.user.id,
      method: 'bank_transfer',
      status: 'pending',
      createdAt: { $lt: expiryCutoff },
    },
    { $set: { status: 'failed', note: 'Expired after 48h' } },
  );

  // Return existing active payment if one exists (prevents duplicate codes)
  const existing = await Payment.findOne({
    userId: session!.user.id,
    method: 'bank_transfer',
    status: { $in: ['pending', 'waiting_verification'] },
  }).sort({ createdAt: -1 }).lean() as {
    _id: unknown;
    paymentCode?: string;
    amount: number;
    type: string;
    status: string;
    receiptImage?: string;
  } | null;

  if (existing) {
    const existingPlan = parsePremiumPlanType(existing.type);
    const existingPricing = existingPlan ? PREMIUM_PRICES[existingPlan] : pricing;
    return NextResponse.json({
      ok: true,
      existing: true,
      paymentId: String(existing._id),
      paymentCode: existing.paymentCode ?? '',
      amount: existing.amount,
      plan: existingPlan ?? plan,
      months: existingPricing.months,
      bankName,
      accountNumber,
      accountHolder,
      status: existing.status as string,
      receiptImage: existing.receiptImage ?? '',
    });
  }

  const code = await generatePaymentCode();

  const payment = await Payment.create({
    userId: session!.user.id,
    amount: pricing.amount,
    type: paymentType,
    status: 'pending',
    method: 'bank_transfer',
    paymentCode: code,
    note: `${pricing.labelMn} Premium — bank transfer`,
  });

  return NextResponse.json({
    ok: true,
    existing: false,
    paymentId: payment._id.toString(),
    paymentCode: code,
    amount: pricing.amount,
    plan,
    months: pricing.months,
    bankName,
    accountNumber,
    accountHolder,
    status: 'pending',
    receiptImage: '',
  });
}
