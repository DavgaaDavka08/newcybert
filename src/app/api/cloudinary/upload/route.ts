import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  uploadBufferToCloudinary,
  cloudinaryVideoThumbnail,
  type CloudinaryMediaType,
} from "@/lib/cloudinary-server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_VIDEO_MB = 500;
const MAX_PDF_MB = 50;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user?.id || (role !== "teacher" && role !== "admin")) {
      return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const mediaType = (form.get("mediaType") as string) === "pdf" ? "pdf" : "video";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
    }

    const maxMb = mediaType === "video" ? MAX_VIDEO_MB : MAX_PDF_MB;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxMb) {
      return NextResponse.json(
        { error: `Файл хэт том (${sizeMb.toFixed(1)} MB). Хамгийн ихдээ ${maxMb} MB.` },
        { status: 400 },
      );
    }

    const name = file instanceof File ? file.name : undefined;
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await uploadBufferToCloudinary(buffer, mediaType as CloudinaryMediaType, name);

    const publicId = data.public_id as string | undefined;
    const thumbnailUrl =
      mediaType === "video" && publicId ? cloudinaryVideoThumbnail(publicId) : undefined;

    return NextResponse.json({
      ...data,
      thumbnailUrl,
      mediaType,
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Байршуулахад алдаа";
    console.error("[POST /api/cloudinary/upload]", m);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
