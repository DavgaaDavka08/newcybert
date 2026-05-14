import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  try {
    await connectDB();
    const { examId } = await params;
    const attempts = await AttemptModel.find({ examId, isSubmitted: true })
      .populate('studentId', 'firstName lastName email')
      .sort({ score: -1, createdAt: -1 })
      .lean();
    return NextResponse.json(attempts);
  } catch (err: any) {
    console.error('[GET attempts/exam]', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
