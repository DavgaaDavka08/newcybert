import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const status = searchParams.get('status') ?? '';

  const query: Record<string, unknown> = { method: 'bank_transfer' };
  if (status) query.status = status;

  await connectDB();

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
  ]);

  return NextResponse.json({ payments, total, page, totalPages: Math.ceil(total / limit) });
}
