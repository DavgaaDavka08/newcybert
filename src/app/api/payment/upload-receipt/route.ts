import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { requireAuth } from '@/lib/auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { isValidObjectId } from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 5, windowMs: 60 * 1000 });
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'Form data шаардлагатай' }, { status: 400 });
  }

  const paymentId = form.get('paymentId');
  const file = form.get('receipt');

  if (!paymentId || typeof paymentId !== 'string' || !isValidObjectId(paymentId)) {
    return NextResponse.json({ error: 'paymentId буруу' }, { status: 400 });
  }
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Баримт зураг хавсаргана уу' }, { status: 400 });
  }

  const fileType = file.type;
  if (!ALLOWED_TYPES.includes(fileType)) {
    return NextResponse.json(
      { error: 'Зөвхөн JPG, PNG, WEBP форматыг дэмждэг' },
      { status: 400 },
    );
  }

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_MB) {
    return NextResponse.json(
      { error: `Файл хэт том (${sizeMb.toFixed(1)} MB). Хамгийн ихдээ ${MAX_MB} MB.` },
      { status: 400 },
    );
  }

  await connectDB();

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return NextResponse.json({ error: 'Төлбөр олдсонгүй' }, { status: 404 });
  }

  // User can only upload for their own payment
  if (String(payment.userId) !== session!.user.id) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 403 });
  }

  if (payment.method !== 'bank_transfer') {
    return NextResponse.json({ error: 'Энэ төлбөрт баримт байршуулах боломжгүй' }, { status: 400 });
  }

  // Prevent re-uploading if already verified
  if (payment.status === 'success' || payment.status === 'rejected') {
    return NextResponse.json(
      { error: `Төлбөр аль хэдийн ${payment.status === 'success' ? 'баталгаажсан' : 'цуцлагдсан'}` },
      { status: 409 },
    );
  }

  // Prevent duplicate upload when already waiting
  if (payment.status === 'waiting_verification' && payment.receiptImage) {
    return NextResponse.json(
      { error: 'Баримт аль хэдийн илгээгдсэн. Admin шалгаж байна.' },
      { status: 409 },
    );
  }

  const filename = file instanceof File ? file.name : `receipt-${Date.now()}.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { url } = await uploadImageToCloudinary(buffer, filename, 'cyberphysics/receipts');

  payment.receiptImage = url;
  payment.status = 'waiting_verification';
  await payment.save();

  return NextResponse.json({ ok: true, receiptImage: url });
}
