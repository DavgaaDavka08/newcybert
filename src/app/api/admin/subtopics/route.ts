import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { SubtopicModel } from '@/models/SubtopicModel';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const topicId = req.nextUrl.searchParams.get('topicId');
    const query = topicId ? { topicId, isActive: true } : { isActive: true };
    const subtopics = await SubtopicModel.find(query).sort({ order: 1 }).lean();
    return NextResponse.json({ subtopics });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const count = await SubtopicModel.countDocuments({ topicId: body.topicId });
    const subtopic = await SubtopicModel.create({
      topicId: body.topicId,
      name: body.name,
      description: body.description ?? '',
      content: body.content ?? '',
      order: count,
      questions: body.questions ?? [],
    });
    return NextResponse.json({ subtopic });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
