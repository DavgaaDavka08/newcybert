import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ExamModel } from '@/models/ExamModel';
import { AttemptModel } from '@/models/AttemptModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();

    const exams = await ExamModel.find().sort({ createdAt: -1 }).lean();

    // Try to get session — gracefully skip if it fails
    let submittedIds = new Set<string>();
    try {
      const session = await getServerSession(authOptions);
      const studentId = session?.user?.id;
      if (studentId) {
        const attempts = await AttemptModel.find(
          { studentId, isSubmitted: true },
          { examId: 1 }
        ).lean();
        submittedIds = new Set(attempts.map((a: any) => a.examId.toString()));
      }
    } catch {
      // session fetch failed — continue without attempt data
    }

    const result = exams.map((e: any) => ({
      ...e,
      hasAttempt: submittedIds.has(e._id.toString()),
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[GET /api/exam/exams]', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch exams', detail: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Шалгалтын нэр шаардлагатай' }, { status: 400 });
    }

    const exam = await ExamModel.create(body);
    return NextResponse.json(exam, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/exam/exams]', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
