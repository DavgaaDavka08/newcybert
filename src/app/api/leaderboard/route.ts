import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

/** Top students by XP period (today / week / month / all). */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = new URL(req.url).searchParams.get('period') || 'all';
    const sortField =
      period === 'today' ? 'dailyXp' : period === 'week' ? 'weeklyXp' : 'xp';

    await connectDB();
    const rows = await User.find({
      role: { $in: ['student', 'teacher'] },
    })
      .sort({ [sortField]: -1, xp: -1, level: -1 })
      .limit(20)
      .select('firstName lastName xp level streak dailyXp weeklyXp')
      .lean();

    const entries = rows.map((u: {
      _id: unknown;
      firstName?: string;
      lastName?: string;
      xp?: number;
      level?: number;
      streak?: number;
      dailyXp?: number;
      weeklyXp?: number;
    }) => ({
      id: String(u._id),
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Сурагч',
      level: u.level ?? 1,
      xp: u.xp ?? 0,
      periodXp:
        period === 'today'
          ? (u.dailyXp ?? 0)
          : period === 'week'
            ? (u.weeklyXp ?? 0)
            : (u.xp ?? 0),
      streak: u.streak ?? 0,
    }));

    return NextResponse.json({ entries, period });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
