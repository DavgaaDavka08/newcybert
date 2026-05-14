import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/mongodb";
import { VideoLessonModel } from "@/models/VideoLessonModel";
import { Types } from "mongoose";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
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
    const doc = await VideoLessonModel.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
    }

    const role = session.user.role;
    const isOwner = doc.uploadedBy === session.user.id;
    const isAdmin = role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Устгах эрхгүй" }, { status: 403 });
    }

    await VideoLessonModel.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Server error";
    console.error("[DELETE /api/videos/[id]]", m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
