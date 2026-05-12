// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";
import { PROVINCES } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, phone, province, school, role } = body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Бүх заавал талбарыг бөглөнө үү" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Нууц үг хамгийн багадаа 6 тэмдэгт байна" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "И-мэйл хаяг буруу байна" }, { status: 400 });
    }
    if (province && !PROVINCES.includes(province)) {
      return NextResponse.json({ error: "Аймаг/нийслэл буруу байна" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Энэ и-мэйл хаяг бүртгэлтэй байна" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Generate teacher code if teacher role
    let teacherCode: string | undefined;
    if (role === "teacher") {
      teacherCode = `TCP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone,
      province,
      school,
      role: role === "teacher" ? "teacher" : "student",
      teacherCode,
      isVerified: true, // Email verification disabled for simplicity
      coins: 100, // Welcome bonus
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.firstName).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Бүртгэл амжилттай! Нэвтэрч орно уу.",
      teacherCode: teacherCode ?? null,
    }, { status: 201 });

  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
