// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    premiumUsers,
    todayActive,
    payments,
    totalCoinSpent,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isPremium: true }),
    User.countDocuments({ lastLoginDate: { $gte: today } }),
    Payment.find({ status: "success" }).select("amount createdAt"),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }]),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Last 7 days new users
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersLast7 = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

  // Users by province
  const byProvince = await User.aggregate([
    { $group: { _id: "$province", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Recent payments
  const recentPayments = await Payment.find({ status: "success" })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("userId", "firstName lastName email");

  return NextResponse.json({
    totalUsers,
    premiumUsers,
    todayActive,
    totalRevenue,
    newUsersLast7,
    byProvince,
    recentPayments,
  });
}
