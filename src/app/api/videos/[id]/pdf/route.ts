import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/mongodb";
import { VideoLessonModel, type IVideoLesson } from "@/models/VideoLessonModel";
import { Types } from "mongoose";
import { cloudinaryPdfInlineUrl } from "@/lib/cloudinary-server";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF-ийг серверээр дамжуулж iframe-д харуулна */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Буруу ID" }, { status: 400 });
    }

    await connectDB();
    const doc = await VideoLessonModel.findById(id).lean<IVideoLesson & { _id: Types.ObjectId }>();
    if (!doc || doc.mediaType !== "pdf" || !doc.url) {
      return NextResponse.json({ error: "PDF олдсонгүй" }, { status: 404 });
    }

    const fetchUrl = cloudinaryPdfInlineUrl(String(doc.url));
    const upstream = await fetch(fetchUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: "PDF татахад алдаа" }, { status: 502 });
    }

    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Server error";
    console.error("[GET /api/videos/[id]/pdf]", m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
