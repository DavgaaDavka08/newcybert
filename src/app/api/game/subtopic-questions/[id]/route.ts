import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SubtopicModel } from '@/models/SubtopicModel';
import { requireAuth } from '@/lib/auth';

type SubtopicLean = {
  name: string;
  questions?: {
    _id?: { toString(): string };
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }[];
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Questions are only served to authenticated users
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const subtopic = await SubtopicModel.findById(id).lean<SubtopicLean>();
    if (!subtopic) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Strip correct answers — client learns the correct answer via /api/game/answer after each submission
    const questions = (subtopic.questions ?? []).map(q => ({
      id: q._id?.toString() ?? '',
      q: q.question,
      opts: q.options,
      // correctIndex is NOT sent; use POST /api/game/answer to get it after answering
    }));

    return NextResponse.json({
      subtopicId: id,
      subtopicName: subtopic.name,
      questions,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
