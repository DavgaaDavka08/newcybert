import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { seedPhysicsContent } from '@/lib/seed-physics-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin: физикийн жишээ агуулга (тоглоом + шалгалт) суулгах */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const clear = Boolean((body as { clear?: boolean }).clear);

    await connectDB();
    const result = await seedPhysicsContent({ clear, force: clear });

    if (result.skipped) {
      return NextResponse.json({
        ok: false,
        message: 'Сэдэв аль хэдийн байна. Дахин суулгах бол «Цэвэрлээд суулгах» сонгоно уу.',
        ...result,
      });
    }

    return NextResponse.json({
      ok: true,
      message: `${result.topics} сэдэв, ${result.subtopics} хичээл, ${result.questions} асуулт, ${result.exams} шалгалт нэмэгдлээ`,
      ...result,
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : 'Алдаа';
    console.error('[POST /api/admin/seed-content]', m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
