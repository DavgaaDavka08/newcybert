import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { TopicModel } from '@/models/TopicModel';
import { SubtopicModel } from '@/models/SubtopicModel';

type TopicLean = { _id: Types.ObjectId; name: string; color: string; icon: string; description: string };
type SubtopicLean = { _id: Types.ObjectId; topicId: Types.ObjectId; name: string; description: string; order: number };

export async function GET() {
  try {
    await connectDB();
    const topics = await TopicModel.find({ isActive: true }).sort({ order: 1 }).lean<TopicLean[]>();
    const subtopics = await SubtopicModel.find({ isActive: true }, { questions: 0 }).sort({ order: 1 }).lean<SubtopicLean[]>();

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
