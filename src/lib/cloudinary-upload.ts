/** Client upload → our API → Cloudinary (CORS-гүй) */

export type CloudinaryMediaType = "video" | "pdf";

export async function uploadToCloudinary(
  file: File,
  mediaType: CloudinaryMediaType,
): Promise<Record<string, unknown>> {
  const body = new FormData();
  body.append("file", file);
  body.append("mediaType", mediaType);

  const res = await fetch("/api/cloudinary/upload", {
    method: "POST",
    body,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `Байршуулахад алдаа (${res.status})`);
  }

  return data;
}

export function cloudinaryVideoThumbnail(publicId: string): string | undefined {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  if (!cloud || !publicId) return undefined;
  return `https://res.cloudinary.com/${cloud}/video/upload/so_1/${publicId}.jpg`;
}
