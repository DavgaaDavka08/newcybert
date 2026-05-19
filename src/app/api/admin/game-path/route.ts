import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { GamePathConfig, type GamePathConfigLean } from '@/models/GamePathConfig';
import { requireAdmin } from '@/lib/auth';
import { LEVELS_PER_TOPIC, DEFAULT_LESSON_SEQUENCE, DEFAULT_TOPICS } from '@/lib/game-defaults';

const LESSON_TYPES = new Set(['lesson', 'quiz', 'lab', 'boss', 'review']);

function seedFromDefaults() {
  return {
    topics: DEFAULT_TOPICS.map((t, i) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      order: i,
    })),
    lessonNodes: DEFAULT_LESSON_SEQUENCE.map(n => ({
      title: n.title,
      type: n.type,
      xp: n.xp,
      coins: n.coins,
    })),
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  await connectDB();
  let doc = await GamePathConfig.findOne({ key: 'default' }).lean<GamePathConfigLean | null>();
  if (!doc?.topics?.length) {
    const s = seedFromDefaults();
    doc = await GamePathConfig.findOneAndUpdate(
      { key: 'default' },
      { $setOnInsert: { key: 'default', topics: s.topics, lessonNodes: s.lessonNodes } },
      { upsert: true, new: true }
    ).lean<GamePathConfigLean | null>();
  }
  if (!doc?.topics?.length) {
    return NextResponse.json({ error: 'Game path unavailable' }, { status: 500 });
  }
  return NextResponse.json({
    topics: [...doc.topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    lessonNodes: doc.lessonNodes ?? [],
    levelsPerTopic: LEVELS_PER_TOPIC,
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const topics = Array.isArray(body.topics) ? body.topics : null;
  const lessonNodes = Array.isArray(body.lessonNodes) ? body.lessonNodes : null;
  if (!topics?.length) return NextResponse.json({ error: 'topics хоосон байна' }, { status: 400 });
  if (!lessonNodes?.length || lessonNodes.length !== LEVELS_PER_TOPIC) {
    return NextResponse.json({ error: `lessonNodes яг ${LEVELS_PER_TOPIC} байх ёстой` }, { status: 400 });
  }

  for (const t of topics) {
    if (!t.id || !String(t.id).trim()) return NextResponse.json({ error: 'topic.id шаардлагатай' }, { status: 400 });
    if (!t.name || !String(t.name).trim()) return NextResponse.json({ error: 'topic.name шаардлагатай' }, { status: 400 });
  }
  for (const n of lessonNodes) {
    if (!n.title || !String(n.title).trim()) return NextResponse.json({ error: 'lesson title хоосон' }, { status: 400 });
    const ty = String(n.type ?? 'lesson');
    if (!LESSON_TYPES.has(ty)) return NextResponse.json({ error: `Буруу type: ${ty}` }, { status: 400 });
  }

  const normalizedTopics = topics.map((t: any, i: number) => ({
    id: String(t.id).trim(),
    name: String(t.name).trim(),
    icon: String(t.icon ?? 'zap').trim(),
    color: String(t.color ?? '#2563EB').trim(),
    order: typeof t.order === 'number' ? t.order : i,
  }));

  const normalizedLessons = lessonNodes.map((n: any) => ({
    title: String(n.title).trim(),
    type: LESSON_TYPES.has(String(n.type)) ? String(n.type) : 'lesson',
    xp: Math.max(0, Number(n.xp) || 10),
    coins: Math.max(0, Number(n.coins) || 5),
  }));

  await connectDB();
  await GamePathConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: { topics: normalizedTopics, lessonNodes: normalizedLessons } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
