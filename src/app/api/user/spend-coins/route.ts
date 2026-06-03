import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";

// Зоос зарцуулах үйлдлүүд ба тэдгээрийн үнэ
const COIN_COSTS: Record<string, number> = {
  exam_start:       6,
  ai_explanation:   3,
  video_hint:       5,
  pdf_download:    20,
  mock_exam:       15,
  certificate:     50,
};

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { action } = await req.json();

  const cost = COIN_COSTS[action];
  if (cost === undefined) {
    return NextResponse.json({ error: "Үл мэдэгдэх үйлдэл" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session!.user.id);
  if (!user) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  // Premium хэрэглэгчид зоос зарцуулахгүй
  if (user.isPremium) {
    return NextResponse.json({ success: true, coins: user.coins, free: true });
  }

  if ((user.coins ?? 0) < cost) {
    return NextResponse.json(
      { error: "Зоос хүрэлцэхгүй байна", coins: user.coins, required: cost },
      { status: 402 }
    );
  }

  user.coins = (user.coins ?? 0) - cost;
  await user.save();

  return NextResponse.json({ success: true, coins: user.coins, spent: cost });
}
