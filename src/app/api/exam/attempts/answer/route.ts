import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { attemptId, questionId, selectedOption } = await req.json();

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: 'attemptId болон questionId шаардлагатай' }, { status: 400 });
    }

    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

    // Only the owner can submit answers
    if (String(attempt.studentId) !== session!.user.id) {
      return NextResponse.json({ error: 'Зөвшөөрөл байхгүй' }, { status: 403 });
    }

    if (attempt.isSubmitted) return NextResponse.json({ error: 'Already submitted' }, { status: 400 });

    const existing = attempt.answers.find((a: { questionId: string }) => a.questionId === questionId);
    if (existing) {
      (existing as { selectedOption: unknown }).selectedOption = selectedOption;
    } else {
      attempt.answers.push({ questionId, selectedOption });
    }

    await attempt.save();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
