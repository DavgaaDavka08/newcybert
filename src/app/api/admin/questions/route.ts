// src/app/api/admin/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const level = searchParams.get("level");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search")?.trim();
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const query: Record<string, unknown> = {};
  if (categoryId) query.categoryId = categoryId;
  if (level) query.level = parseInt(level);
  if (difficulty && difficulty !== "all") query.difficulty = difficulty;
  if (search) {
    query.$or = [
      { question: { $regex: search, $options: "i" } },
      { explanation: { $regex: search, $options: "i" } },
    ];
  }

  await connectDB();
  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate("categoryId", "name icon color")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Question.countDocuments(query),
  ]);

  return NextResponse.json({ questions, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { categoryId, level, question, formula, options, correctIndex, explanation, difficulty, xpReward, coinReward } = body;

  if (!categoryId || !question || !options || correctIndex === undefined) {
    return NextResponse.json({ error: "Бүх заавал талбарыг бөглөнө үү" }, { status: 400 });
  }
  if (options.length !== 4) {
    return NextResponse.json({ error: "Яг 4 хариулт шаардлагатай" }, { status: 400 });
  }

  await connectDB();
  const q = await Question.create({
    categoryId,
    level: level ?? 1,
    question,
    formula: formula || undefined,
    options,
    correctIndex,
    explanation: explanation ?? "",
    difficulty: difficulty ?? "medium",
    xpReward: xpReward ?? 10,
    coinReward: coinReward ?? 5,
  });

  return NextResponse.json({ success: true, question: q }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...updates } = body;

  await connectDB();
  const q = await Question.findByIdAndUpdate(id, updates, { new: true });
  if (!q) return NextResponse.json({ error: "Асуулт олдсонгүй" }, { status: 404 });

  return NextResponse.json({ success: true, question: q });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id шаардлагатай" }, { status: 400 });

  await connectDB();
  await Question.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
