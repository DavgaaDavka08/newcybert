import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TopicModel } from '@/models/TopicModel';
import { SubtopicModel } from '@/models/SubtopicModel';

export async function GET() {
  try {
    await connectDB();
    const topics = await TopicModel.find({ isActive: true }).sort({ order: 1 }).lean();
    const subtopics = await SubtopicModel.find({ isActive: true }, { questions: 0 }).sort({ order: 1 }).lean();

    const result = topics.map(t => ({
      id: t._id.toString(),
      name: t.name,
      color: t.color,
      icon: t.icon,
      description: t.description,
      subtopics: subtopics
        .filter(s => s.topicId.toString() === t._id.toString())
        .map(s => ({
          id: s._id.toString(),
          name: s.name,
          description: s.description,
          order: s.order,
          questionCount: 0, // questions excluded for perf
        })),
    }));

    return NextResponse.json({ topics: result });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
