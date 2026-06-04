/** Server-only Cloudinary helpers */

export function getCloudinaryConfig() {
  const cloud =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  const preset =
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    process.env.CLOUDINARY_PRESET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !preset) {
    throw new Error(
      "Cloudinary тохиргоо дутуу (CLOUDINARY_CLOUD_NAME эсвэл NEXT_PUBLIC_CLOUDINARY_CLOUD, CLOUDINARY_UPLOAD_PRESET)",
    );
  }
  return { cloud, preset, apiKey, apiSecret };
}

export type CloudinaryMediaType = "video" | "pdf";

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  mediaType: CloudinaryMediaType,
  filename?: string,
): Promise<Record<string, unknown>> {
  const { cloud, preset } = getCloudinaryConfig();
  const resource = mediaType === "video" ? "video" : "raw";

  const body = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: mediaType === "video" ? "video/mp4" : "application/pdf",
  });
  body.append("file", blob, filename ?? (mediaType === "video" ? "upload.mp4" : "upload.pdf"));
  body.append("upload_preset", preset);
  if (mediaType === "pdf") {
    body.append("resource_type", "raw");
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resource}/upload`, {
    method: "POST",
    body,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Cloudinary алдаа (${res.status})`);
  }

  return data;
}

export function cloudinaryVideoThumbnail(publicId: string, cloud?: string): string | undefined {
  const c =
    cloud ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  if (!c || !publicId) return undefined;
  return `https://res.cloudinary.com/${c}/video/upload/so_1/${publicId}.jpg`;
}

/** PDF-ийг iframe-д харуулахад тохиромжтой URL */
export function cloudinaryPdfInlineUrl(url: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (url.includes("fl_inline")) return url;
  return url.replace("/upload/", "/upload/fl_inline/");
}

/**
 * Upload an image Buffer (jpg/png/webp) to Cloudinary.
 * Used for payment receipts.
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  filename: string,
  folder = "receipts",
): Promise<{ url: string; publicId: string }> {
  const { cloud, preset } = getCloudinaryConfig();

  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const mime = mimeMap[ext] ?? "image/jpeg";

  const body = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mime });
  // Sanitize filename: strip path characters
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  body.append("file", blob, safeName);
  body.append("upload_preset", preset);
  body.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    error?: { message?: string };
    secure_url?: string;
    public_id?: string;
  };

  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? `Cloudinary image upload алдаа (${res.status})`);
  }

  return { url: data.secure_url, publicId: data.public_id ?? "" };
}
