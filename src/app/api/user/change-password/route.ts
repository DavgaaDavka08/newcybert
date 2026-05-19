import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ error: 'Эндээс нууц үг солихгүй' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Шинэ нууц үг хамгийн багадаа 6 тэмдэгт' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('+password');
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!user.password) {
      return NextResponse.json({ error: 'Google-ээр нэвтэрсэн данс — нууц үг байхгүй' }, { status: 400 });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return NextResponse.json({ error: 'Одоогийн нууц үг буруу байна' }, { status: 400 });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
