// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 }) };
  }
  return { session };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 }) };
  }
  if (session.user?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin эрх шаардлагатай" }, { status: 403 }) };
  }
  return { session };
}

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Validate Mongolian phone
export function validatePhone(phone: string): boolean {
  return /^[89]\d{7}$/.test(phone.replace(/\s/g, ""));
}

// Provinces list
export const PROVINCES = [
  "Улаанбаатар", "Архангай", "Баян-Өлгий", "Баянхонгор",
  "Булган", "Говь-Алтай", "Говьсүмбэр", "Дархан-Уул",
  "Дорноговь", "Дорнод", "Дундговь", "Завхан", "Орхон",
  "Өвөрхангай", "Өмнөговь", "Сүхбаатар", "Сэлэнгэ",
  "Төв", "Увс", "Ховд", "Хөвсгөл", "Хэнтий",
];
