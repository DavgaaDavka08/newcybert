import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/mongodb";
import { VideoLessonModel } from "@/models/VideoLessonModel";
import { Types } from "mongoose";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Буруу ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description } = body;

    await connectDB();
    const doc = await VideoLessonModel.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
    }

    const role = session.user.role;
    const isOwner = doc.uploadedBy === session.user.id;
    const isAdmin = role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Засах эрхгүй" }, { status: 403 });
    }

    if (typeof title === "string" && title.trim()) doc.title = title.trim();
    if (typeof description === "string") doc.description = description;
    await doc.save();

    return NextResponse.json(doc);
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Server error";
    console.error("[PATCH /api/videos/[id]]", m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}

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
