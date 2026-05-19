import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { AttemptModel } from '@/models/AttemptModel';
import mongoose from 'mongoose';

function adminProfile(email: string | null | undefined) {
  return {
    firstName: 'Admin',
    lastName: '',
    email: email ?? '',
    phone: '',
    province: '',
    school: '',
    grade: undefined as number | undefined,
    hasPassword: true,
    googleId: undefined as string | undefined,
    xp: 0,
    level: 1,
    coins: 9999,
    lives: 99,
    streak: 0,
    isPremium: true,
    role: 'admin',
    examAttemptsCount: 0,
    avgExamScorePct: null as number | null,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.id === 'admin-hardcoded') {
      return NextResponse.json(adminProfile(session.user.email));
    }

    await connectDB();
    const u = await User.findById(session.user.id)
      .select('+password firstName lastName email phone province school grade googleId xp level coins lives streak isPremium role')
      .lean() as Record<string, unknown> | null;

    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const hasPassword = Boolean(u.password);
    const { password: _pw, ...safe } = u;

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
      firstName: safe.firstName,
      lastName: safe.lastName,
      email: safe.email,
      phone: safe.phone ?? '',
      province: safe.province ?? '',
      school: safe.school ?? '',
      grade: typeof safe.grade === 'number' ? safe.grade : undefined,
      hasPassword,
      googleId: safe.googleId ?? undefined,
      xp: safe.xp ?? 0,
      level: safe.level ?? 1,
      coins: safe.coins ?? 0,
      lives: safe.lives ?? 0,
      streak: safe.streak ?? 0,
      isPremium: Boolean(safe.isPremium),
      role: safe.role,
      examAttemptsCount: attempts.length,
      avgExamScorePct,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ error: 'Админы профайл засварлахгүй' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const province = typeof body.province === 'string' ? body.province.trim() : undefined;
    const school = typeof body.school === 'string' ? body.school.trim() : undefined;

    const $set: Record<string, unknown> = {};
    const $unset: Record<string, string> = {};

    if ('grade' in body) {
      if (body.grade === '' || body.grade === null) {
        $unset.grade = '';
      } else {
        const g = Number(body.grade);
        if (!Number.isInteger(g) || g < 6 || g > 12) {
          return NextResponse.json({ error: 'Анги 6–12 хооронд байна' }, { status: 400 });
        }
        $set.grade = g;
      }
    }

    if (firstName !== undefined && !firstName) {
      return NextResponse.json({ error: 'Нэр хоосон байж болохгүй' }, { status: 400 });
    }
    if (lastName !== undefined && !lastName) {
      return NextResponse.json({ error: 'Овог хоосон байж болохгүй' }, { status: 400 });
    }

    await connectDB();
    if (firstName !== undefined) $set.firstName = firstName;
    if (lastName !== undefined) $set.lastName = lastName;
    if (phone !== undefined) $set.phone = phone;
    if (province !== undefined) $set.province = province;
    if (school !== undefined) $set.school = school;

    const updateDoc: { $set?: Record<string, unknown>; $unset?: Record<string, string> } = {};
    if (Object.keys($set).length) updateDoc.$set = $set;
    if (Object.keys($unset).length) updateDoc.$unset = $unset;

    if (!Object.keys(updateDoc).length) {
      return NextResponse.json({ error: 'Засах талбар байхгүй' }, { status: 400 });
    }

    const updated = (await User.findByIdAndUpdate(session.user.id, updateDoc, {
      new: true,
      runValidators: true,
    })
      .select('firstName lastName email phone province school grade googleId xp level coins lives streak isPremium role')
      .lean()) as {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      province?: string;
      school?: string;
      grade?: number;
    } | null;

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ok: true,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone ?? '',
      province: updated.province ?? '',
      school: updated.school ?? '',
      grade: typeof updated.grade === 'number' ? updated.grade : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
