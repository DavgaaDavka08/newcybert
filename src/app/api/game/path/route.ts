import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { GamePathConfig, type ILessonNode, type IPathTopic, type GamePathConfigLean } from '@/models/GamePathConfig';
import { DEFAULT_LESSON_SEQUENCE, DEFAULT_TOPICS, LEVELS_PER_TOPIC } from '@/lib/game-defaults';

function seedFromDefaults(): { topics: IPathTopic[]; lessonNodes: ILessonNode[] } {
  const topics: IPathTopic[] = DEFAULT_TOPICS.map((t, i) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    order: i,
  }));
  const lessonNodes: ILessonNode[] = DEFAULT_LESSON_SEQUENCE.map(n => ({
    title: n.title,
    type: n.type,
    xp: n.xp,
    coins: n.coins,
  }));
  return { topics, lessonNodes };
}

export async function GET() {
  try {
    await connectDB();
    let doc = await GamePathConfig.findOne({ key: 'default' }).lean<GamePathConfigLean | null>();
    if (!doc || !doc.topics?.length) {
      const seed = seedFromDefaults();
      doc = await GamePathConfig.findOneAndUpdate(
        { key: 'default' },
        { $setOnInsert: { key: 'default', topics: seed.topics, lessonNodes: seed.lessonNodes } },
        { upsert: true, new: true }
      ).lean<GamePathConfigLean | null>();
    }
    if (!doc?.topics?.length) {
      return NextResponse.json({ error: 'Game path unavailable' }, { status: 500 });
    }
    const topics = [...doc.topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return NextResponse.json({
      topics: topics.map(t => ({ id: t.id, name: t.name, icon: t.icon, color: t.color })),
      lessonNodes: doc.lessonNodes ?? [],
      levelsPerTopic: LEVELS_PER_TOPIC,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
