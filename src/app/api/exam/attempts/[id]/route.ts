import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';
import { ExamModel } from '@/models/ExamModel';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const attempt = await AttemptModel.findById(id)
      .populate('studentId', 'firstName lastName')
      .lean() as Record<string, unknown> | null;

    if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only the owner or an admin can view the attempt
    const ownerId = typeof attempt.studentId === 'object' && attempt.studentId !== null
      ? String((attempt.studentId as { _id: unknown })._id ?? attempt.studentId)
      : String(attempt.studentId);

    if (session!.user.role !== 'admin' && ownerId !== session!.user.id) {
      return NextResponse.json({ error: 'Зөвшөөрөл байхгүй' }, { status: 403 });
    }

    const exam = await ExamModel.findById(attempt.examId).lean() as Record<string, unknown> | null;
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const questions = exam.questions as { id: string; question: string; correctAnswer: unknown; options: string[] }[];
    const answers = (attempt.answers as { questionId: string; selectedOption: unknown }[]) ?? [];
    const total = questions.length;

    const answersWithResult = questions.map((q, idx) => {
      const ans = answers.find((a) => a.questionId === q.id);
      const selected = ans?.selectedOption ?? null;
      const correct = q.correctAnswer;
      const isCorrect = selected !== null && selected === correct;
      return {
        questionId: q.id,
        questionText: q.question,
        questionIndex: idx + 1,
        selectedOption: selected,
        correctOption: correct,
        isCorrect,
        options: q.options,
      };
    });

    const correctCount = answersWithResult.filter((a) => a.isCorrect).length;
    const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    return NextResponse.json({
      ...attempt,
      examTitle: (exam as { title?: string }).title,
      answers: answersWithResult,
      total,
      score: correctCount,
      correctCount,
      wrongCount: total - correctCount,
      percentage,
    });
  } catch (err: unknown) {
    console.error('[GET attempts/id]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
