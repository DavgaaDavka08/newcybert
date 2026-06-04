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
    .lean();

  return NextResponse.json({ payments });
}
