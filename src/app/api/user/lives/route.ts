import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { syncLives, loseLife } from '@/lib/gamification-server';
import { MAX_LIVES } from '@/lib/gamification';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPremium =
      user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());

    if (isPremium) {
      return NextResponse.json({ lives: 99, maxLives: 99, nextRefillAt: null });
    }

    if (action === 'lose') {
      const result = loseLife(user);
      await user.save();
      return NextResponse.json({ ...result, maxLives: user.maxLives ?? MAX_LIVES });
    }

    if (action === 'sync') {
      const nextRefillAt = syncLives(user);
      await user.save();
      return NextResponse.json({
        lives: user.lives,
        maxLives: user.maxLives ?? MAX_LIVES,
        nextRefillAt,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
