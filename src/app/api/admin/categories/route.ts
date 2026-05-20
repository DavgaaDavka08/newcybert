// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Question } from "@/models/Question";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const categories = await Category.find().sort({ order: 1 });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  await connectDB();
  const cat = await Category.create(body);
  return NextResponse.json({ success: true, category: cat }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, ...updates } = await req.json();
  await connectDB();
  const cat = await Category.findByIdAndUpdate(id, updates, { new: true });
  return NextResponse.json({ success: true, category: cat });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id шаардлагатай" }, { status: 400 });

  await connectDB();
  await Promise.all([
    Category.findByIdAndDelete(id),
    Question.deleteMany({ categoryId: id }),
  ]);
  return NextResponse.json({ success: true });
}
