// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/auth";

// GET all users (with pagination + search)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const role  = searchParams.get("role") ?? "";

  const query: any = {};
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName:  { $regex: search, $options: "i" } },
      { email:     { $regex: search, $options: "i" } },
    ];
  }
  if (role) query.role = role;

  await connectDB();

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}

// PATCH update user (premium unlock, role change)
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { userId, updates } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId шаардлагатай" }, { status: 400 });

  await connectDB();

  const allowed = ["isPremium", "premiumUntil", "premiumType", "role", "coins", "xp", "lives"];
  const safeUpdates: any = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key];
  }

  const user = await User.findByIdAndUpdate(userId, safeUpdates, { new: true })
    .select("-password");

  if (!user) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  return NextResponse.json({ success: true, user });
}

// DELETE user
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId шаардлагатай" }, { status: 400 });

  await connectDB();
  await User.findByIdAndDelete(userId);
  return NextResponse.json({ success: true });
}
