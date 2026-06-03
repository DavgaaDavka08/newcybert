import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/mongodb";
import { VideoLessonModel } from "@/models/VideoLessonModel";
import { VideoProgressModel } from "@/models/VideoProgressModel";
import { User } from "@/models/User";

const VIDEO_XP = 5; // Видео бүрэн үзэх = +5 XP

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    }

    const userId = session.user.id;
    if (userId === "admin-hardcoded") {
      return NextResponse.json({ error: "Demo admin-д XP олгохгүй" }, { status: 400 });
    }

    const { id } = await params;
    await connectDB();

    const video = await VideoLessonModel.findById(id);
    if (!video) {
      return NextResponse.json({ error: "Бичлэг олдсонгүй" }, { status: 404 });
    }

    const existing = await VideoProgressModel.findOne({ userId, videoId: id });
    if (existing) {
      return NextResponse.json({
        alreadyCompleted: true,
        xpAwarded: 0,
        totalXp: session.user.xp ?? 0,
        message: "Та энэ хичээлийг өмнө нь дуусгасан байна",
      });
    }

    await VideoProgressModel.create({ userId, videoId: id, xpAwarded: VIDEO_XP });

    const user = await User.findById(userId);
    if (user) {
      user.xp = (user.xp ?? 0) + VIDEO_XP;
      user.level = Math.floor((user.xp ?? 0) / 200) + 1;
      await user.save();
    }

    return NextResponse.json({
      alreadyCompleted: false,
      xpAwarded: VIDEO_XP,
      totalXp: user?.xp ?? (session.user.xp ?? 0) + VIDEO_XP,
      message: `+${VIDEO_XP} XP — хичээл дууслаа!`,
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Server error";
    console.error("[POST /api/videos/complete]", m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
