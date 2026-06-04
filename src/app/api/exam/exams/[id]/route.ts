import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ExamModel } from '@/models/ExamModel';
import { requireAdmin, getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const exam = await ExamModel.findById(id).lean() as Record<string, unknown> | null;
    if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Non-admins get exam metadata + questions without correct answers
    const session = await getSession();
    if (session?.user?.role !== 'admin') {
      const questions = ((exam.questions as { correctAnswer?: unknown; [k: string]: unknown }[]) ?? []).map((q) => {
        const { correctAnswer: _correctAnswer, ...rest } = q;
        return rest;
      });
      return NextResponse.json({ ...exam, questions });
    }

    return NextResponse.json(exam);
  } catch (err: unknown) {
    console.error('[GET exams/id]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const exam = await ExamModel.findByIdAndUpdate(id, body, { new: true });
    if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(exam);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    await ExamModel.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
