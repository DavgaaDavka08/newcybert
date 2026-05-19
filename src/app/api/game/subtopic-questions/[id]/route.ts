import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SubtopicModel } from '@/models/SubtopicModel';

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const subtopic = await SubtopicModel.findById(id).lean<SubtopicLean>();
    if (!subtopic) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const questions = (subtopic.questions ?? []).map(q => ({
      id: q._id?.toString() ?? '',
      q: q.question,
      opts: q.options,
      correct: q.correctIndex,
      exp: q.explanation ?? '',
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
