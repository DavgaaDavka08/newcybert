// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { AttemptModel } from "@/models/AttemptModel";
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
    totalStudents,
    totalXpAgg,
    attemptsToday,
    studentsWithAttempt,
    avgScoreAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isPremium: true }),
    User.countDocuments({ lastLoginDate: { $gte: today } }),
    Payment.find({ status: "success" }).select("amount createdAt"),
    User.countDocuments({ role: "student" }),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$xp" } } }]),
    AttemptModel.countDocuments({ isSubmitted: true, finishedAt: { $gte: today } }),
    AttemptModel.distinct("studentId", { isSubmitted: true }),
    AttemptModel.aggregate([
      { $match: { isSubmitted: true, totalQuestions: { $gt: 0 } } },
      {
        $project: {
          pct: { $multiply: [{ $divide: ['$score', '$totalQuestions'] }, 100] },
        },
      },
      { $group: { _id: null, avg: { $avg: '$pct' } } },
    ]),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalXP = (totalXpAgg[0] as { total?: number } | undefined)?.total ?? 0;

  const avgRow = avgScoreAgg[0] as { avg?: number } | undefined;
  const avgScore = avgRow?.avg != null ? Math.round(avgRow.avg) : 0;

  const completionRate =
    totalStudents > 0 ? Math.min(100, Math.round((studentsWithAttempt.length / totalStudents) * 100)) : 0;

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
    dashboard: {
      totalStudents,
      activeToday: todayActive,
      avgScore,
      totalXP,
      sessionsToday: attemptsToday,
      completionRate,
      weakTopics: [] as { name: string; pct: number; color: string }[],
    },
  });
}
