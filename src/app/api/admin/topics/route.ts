import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { TopicModel } from '@/models/TopicModel';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const topics = await TopicModel.find().sort({ order: 1 }).lean();
    return NextResponse.json({ topics });
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
    const count = await TopicModel.countDocuments();
    const topic = await TopicModel.create({
      name: body.name,
      description: body.description ?? '',
      color: body.color ?? '#3B82F6',
      icon: body.icon ?? 'Φ',
      order: count,
    });
    return NextResponse.json({ topic });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
