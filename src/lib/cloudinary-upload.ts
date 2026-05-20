/** Client-side Cloudinary unsigned upload (video + PDF) */

export type CloudinaryMediaType = "video" | "pdf";

function getConfig() {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
  if (!cloud || !preset) {
    throw new Error("Cloudinary тохиргоо дутуу байна (NEXT_PUBLIC_CLOUDINARY_CLOUD, NEXT_PUBLIC_CLOUDINARY_PRESET)");
  }
  return { cloud, preset };
}

export async function uploadToCloudinary(
  file: File,
  mediaType: CloudinaryMediaType,
): Promise<Record<string, unknown>> {
  const { cloud, preset } = getConfig();
  const resource = mediaType === "video" ? "video" : "raw";
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resource}/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } })?.error?.message;
    throw new Error(msg || `Cloudinary алдаа (${res.status})`);
  }
  return data as Record<string, unknown>;
}

export function cloudinaryVideoThumbnail(publicId: string): string | undefined {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  if (!cloud || !publicId) return undefined;
  return `https://res.cloudinary.com/${cloud}/video/upload/so_1/${publicId}.jpg`;
}
