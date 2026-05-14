import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

function calcLevel(xp: number) {
  // Level up every 200 XP
  return Math.floor(xp / 200) + 1;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { xp = 0, coins = 0, reason = '' } = await req.json();

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.xp    = (user.xp    ?? 0) + xp;
    user.coins = (user.coins ?? 0) + coins;
    user.level = calcLevel(user.xp);
    await user.save();

    console.log(`[award-xp] ${user.email} +${xp}XP +${coins}coins (${reason})`);

    return NextResponse.json({
      xp: user.xp, coins: user.coins, level: user.level,
      xpAdded: xp, coinsAdded: coins,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
