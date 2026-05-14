import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';
import { ExamModel } from '@/models/ExamModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const studentId = session?.user?.id ?? body.studentId;
    const { examId } = body;

    if (!studentId || !examId) {
      return NextResponse.json({ error: 'studentId болон examId шаардлагатай' }, { status: 400 });
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
