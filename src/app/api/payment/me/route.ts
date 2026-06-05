import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();

  const payments = await Payment.find({
    userId: session!.user.id,
    method: 'bank_transfer',
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('_id status paymentCode receiptImage amount type createdAt paidAt')
    .lean();

  const serialized = payments.map((p) => ({
    ...p,
    _id: String(p._id),
  }));

  return NextResponse.json({
    payments: serialized,
    bankInfo: {
      bankName: process.env.BANK_NAME ?? 'ХААН Банк',
      accountNumber: process.env.BANK_ACCOUNT ?? '',
      accountHolder: process.env.BANK_HOLDER ?? '',
    },
  });
}
