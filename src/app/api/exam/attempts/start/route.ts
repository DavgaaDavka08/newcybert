import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';
import { ExamModel } from '@/models/ExamModel';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();

    // studentId always comes from the verified session — never from request body
    const studentId = session!.user.id;
    const { examId } = body;

    if (!examId) {
      return NextResponse.json({ error: 'examId шаардлагатай' }, { status: 400 });
    }

    // Already submitted check
    const finished = await AttemptModel.findOne({ studentId, examId, isSubmitted: true });
    if (finished) {
      return NextResponse.json(
        { message: 'Та энэ шалгалтыг аль хэдийн нэг удаа өгсөн байна!', attemptId: finished._id },
        { status: 400 }
      );
    }

    // Resume existing in-progress attempt
    const existing = await AttemptModel.findOne({ studentId, examId, isSubmitted: false });
    if (existing) return NextResponse.json(existing);

    // Create new
    const exam = await ExamModel.findById(examId);
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const attempt = await AttemptModel.create({
      studentId, examId,
      answers: [], totalQuestions: exam.questions.length,
      isSubmitted: false,
    });

    return NextResponse.json(attempt);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}
