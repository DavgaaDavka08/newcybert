import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ xp: 0, level: 1, coins: 9999, lives: 99, streak: 0 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('xp level coins lives streak firstName lastName').lean() as any;
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      xp: user.xp, level: user.level, coins: user.coins,
      lives: user.lives, streak: user.streak,
      name: `${user.firstName} ${user.lastName}`.trim(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
