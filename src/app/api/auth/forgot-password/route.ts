// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendResetPasswordEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "И-мэйл хаяг оруулна уу" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+resetPasswordToken +resetPasswordExpires");

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ success: true, message: "Хэрэв и-мэйл бүртгэлтэй бол холбоос илгээгдсэн байна" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendResetPasswordEmail(user.email, token);

    return NextResponse.json({ success: true, message: "Нууц үг сэргээх холбоос и-мэйлд илгээгдлээ" });

  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
