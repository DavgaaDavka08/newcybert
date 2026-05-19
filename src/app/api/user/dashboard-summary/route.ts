import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';

/** Current user's exam stats for dashboard stat strip. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ examAttemptsCount: 0, avgExamScorePct: null });
    }

    await connectDB();
    const oid = new mongoose.Types.ObjectId(session.user.id);
    const attempts = await AttemptModel.find({ studentId: oid, isSubmitted: true })
      .select('score totalQuestions')
      .lean();

    let avgExamScorePct: number | null = null;
    if (attempts.length) {
      const parts = attempts.map(a => {
        const row = a as { score?: number; totalQuestions?: number };
        const t = row.totalQuestions ?? 0;
        if (!t) return 0;
        return ((row.score ?? 0) / t) * 100;
      });
      avgExamScorePct = Math.round(parts.reduce((s, x) => s + x, 0) / parts.length);
    }

    return NextResponse.json({
      examAttemptsCount: attempts.length,
      avgExamScorePct,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
