import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/mongodb";
import { VideoLessonModel } from "@/models/VideoLessonModel";
import { VideoProgressModel } from "@/models/VideoProgressModel";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const mine = req.nextUrl.searchParams.get("mine") === "1";

    let session: Session | null = null;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }

    if (mine) {
      const role = session?.user?.role;
      if (!session?.user?.id || (role !== "teacher" && role !== "admin")) {
        return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
      }
      const rows = await VideoLessonModel.find({ uploadedBy: session.user.id })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json(rows);
    }

    const rows = await VideoLessonModel.find().sort({ createdAt: -1 }).lean();

    let completedIds: string[] = [];
    if (session?.user?.id && session.user.id !== "admin-hardcoded") {
      const progress = await VideoProgressModel.find({ userId: session.user.id }, { videoId: 1 }).lean();
      completedIds = progress.map((p) => String(p.videoId));
    }

    return NextResponse.json({ videos: rows, completedIds });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Server error";
    console.error("[GET /api/videos]", m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user?.id || (role !== "teacher" && role !== "admin")) {
      return NextResponse.json({ error: "Зөвхөн багш видео оруулна" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, mediaType, publicId, url, thumbnailUrl, durationSec, width, height } = body;
    const type = mediaType === "pdf" ? "pdf" : "video";

    if (!title?.trim()) {
      return NextResponse.json({ error: "Гарчиг оруулна уу" }, { status: 400 });
    }
    if (!publicId?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Cloudinary-аас ирсэн мэдээлэл дутуу байна" }, { status: 400 });
    }

    await connectDB();

    const doc = await VideoLessonModel.create({
      title: title.trim(),
      description: typeof description === "string" ? description : "",
      mediaType: type,
      publicId: String(publicId).trim(),
      url: String(url).trim(),
      thumbnailUrl: type === "pdf" ? undefined : thumbnailUrl ? String(thumbnailUrl) : undefined,
      durationSec: typeof durationSec === "number" ? durationSec : undefined,
      width: typeof width === "number" ? width : undefined,
      height: typeof height === "number" ? height : undefined,
      uploadedBy: session.user.id,
      uploadedByName: session.user.name ?? undefined,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Server error";
    console.error("[POST /api/videos]", m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
