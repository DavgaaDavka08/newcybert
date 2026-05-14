import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';
import { ExamModel } from '@/models/ExamModel';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const attempt = await AttemptModel.findById(id)
      .populate('studentId', 'firstName lastName')
      .lean() as any;

    if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const exam = await ExamModel.findById(attempt.examId).lean() as any;
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const total = exam.questions.length;

    const answersWithResult = exam.questions.map((q: any, idx: number) => {
      const ans = attempt.answers?.find((a: any) => a.questionId === q.id);
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

    const correctCount = answersWithResult.filter((a: any) => a.isCorrect).length;
    const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    return NextResponse.json({
      ...attempt,
      examTitle: exam.title,
      answers: answersWithResult,
      total,
      score: correctCount,
      correctCount,
      wrongCount: total - correctCount,
      percentage,
    });
  } catch (err: any) {
    console.error('[GET attempts/id]', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
