import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

/** Top students/teachers by XP (for dashboard + admin sidebar). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const rows = await User.find({
      role: { $in: ['student', 'teacher'] },
    })
      .sort({ xp: -1, level: -1 })
      .limit(20)
      .select('firstName lastName xp level streak')
      .lean();

    const entries = rows.map((u: { _id: unknown; firstName?: string; lastName?: string; xp?: number; level?: number; streak?: number }) => ({
      id: String(u._id),
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Сурагч',
      level: u.level ?? 1,
      xp: u.xp ?? 0,
      streak: u.streak ?? 0,
    }));

    return NextResponse.json({ entries });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
