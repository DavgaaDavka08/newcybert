import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { attemptId, questionId, selectedOption } = await req.json();

    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    if (attempt.isSubmitted) return NextResponse.json({ error: 'Already submitted' }, { status: 400 });

    const existing = attempt.answers.find((a: any) => a.questionId === questionId);
    if (existing) {
      existing.selectedOption = selectedOption;
    } else {
      attempt.answers.push({ questionId, selectedOption });
    }

    await attempt.save();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
