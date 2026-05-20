import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { GamePathConfig, type GamePathConfigLean } from '@/models/GamePathConfig';
import { LEVELS_PER_TOPIC } from '@/lib/game-defaults';

/** Legacy path — шинэ тоглоом Topic/Subtopic API ашиглана. Хоосон буцаана, default seed хийхгүй. */
export async function GET() {
  try {
    await connectDB();
    const doc = await GamePathConfig.findOne({ key: 'default' }).lean<GamePathConfigLean | null>();

    if (!doc?.topics?.length) {
      return NextResponse.json({
        topics: [],
        lessonNodes: [],
        levelsPerTopic: LEVELS_PER_TOPIC,
        legacy: true,
        message: 'Use /api/game/topics for course content',
      });
    }

    const topics = [...doc.topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return NextResponse.json({
      topics: topics.map(t => ({ id: t.id, name: t.name, icon: t.icon, color: t.color })),
      lessonNodes: doc.lessonNodes ?? [],
      levelsPerTopic: LEVELS_PER_TOPIC,
      legacy: true,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
