import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  mediaAssets,
  seoMetadata,
  serviceCategories,
  services,
} from "@/db/schema";

if (typeof window !== "undefined") {
  throw new Error("storage/image-storage is server-only");
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function detectMimeFromMagicBytes(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: RIFF .... WEBP
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function parseImageDimensions(
  buf: Buffer,
  mimeType: string
): { width: number | null; height: number | null } {
  try {
    if (mimeType === "image/png" && buf.length >= 24) {
      return {
        width: buf.readUInt32BE(16),
        height: buf.readUInt32BE(20),
      };
    }

    if (mimeType === "image/jpeg") {
      let offset = 2;
      while (offset + 9 < buf.length) {
        if (buf[offset] !== 0xff) break;
        const marker = buf[offset + 1];
        const length = buf.readUInt16BE(offset + 2);
        if (
          marker === 0xc0 ||
          marker === 0xc1 ||
          marker === 0xc2 ||
          marker === 0xc3
        ) {
          return {
            height: buf.readUInt16BE(offset + 5),
            width: buf.readUInt16BE(offset + 7),
          };
        }
        if (length < 2) break;
        offset += 2 + length;
      }
    }

    if (mimeType === "image/webp" && buf.length >= 30) {
      const chunk = buf.subarray(12, 16).toString("ascii");
      if (chunk === "VP8 " && buf.length >= 30) {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      if (chunk === "VP8L" && buf.length >= 25) {
        const b = buf.readUInt32LE(21);
        return {
          width: (b & 0x3fff) + 1,
          height: ((b >> 14) & 0x3fff) + 1,
        };
      }
      if (chunk === "VP8X" && buf.length >= 30) {
        const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
        const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
        return { width: w, height: h };
      }
    }
  } catch {
    return { width: null, height: null };
  }
  return { width: null, height: null };
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function sanitizeBaseName(name: string): string {
  const base = path.basename(name, path.extname(name));
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "vistara-image"
  );
}

export async function storeValidatedImage({
  buffer,
  filename,
  declaredMimeType,
  source,
  prompt = null,
  uploadedBy = null,
}: {
  buffer: Buffer;
  filename: string;
  declaredMimeType?: string;
  source: "manual" | "ai-generated";
  prompt?: string | null;
  uploadedBy?: number | null;
}) {
  if (buffer.length === 0) {
    throw new Error("Uploaded image file is empty.");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image file size exceeds the 5 MB limit.");
  }

  const detectedMime = detectMimeFromMagicBytes(buffer);
  if (!detectedMime) {
    throw new Error(
      "Unsupported or invalid image file. Only JPG, JPEG, PNG, and WebP images are allowed."
    );
  }

  if (
    declaredMimeType &&
    !ALLOWED_IMAGE_MIMES.has(declaredMimeType.toLowerCase())
  ) {
    throw new Error("Unsupported image MIME type.");
  }

  const { width, height } = parseImageDimensions(buffer, detectedMime);
  if (width !== null && height !== null && (width < 100 || height < 100)) {
    throw new Error("Image dimensions must be at least 100x100 pixels.");
  }

  const ext = extensionForMime(detectedMime);
  const safeName = `${sanitizeBaseName(filename)}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const blobPath = `vistara/${source}/${safeName}`;

  let storedUrl = "";
  let storageProvider = "vercel-blob";
  let storedPathname = blobPath;

  const blobToken = (process.env.BLOB_READ_WRITE_TOKEN || "").trim();

  if (blobToken) {
    const uploaded = await put(blobPath, buffer, {
      access: "public",
      contentType: detectedMime,
      token: blobToken,
      addRandomSuffix: false,
    });
    storedUrl = uploaded.url;
    storedPathname = uploaded.pathname;
    storageProvider = "vercel-blob";
  } else if (!process.env.VERCEL) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, buffer);
    storedUrl = `/uploads/${safeName}`;
    storedPathname = `/uploads/${safeName}`;
    storageProvider = "local-public";
  } else {
    throw new Error(
      "Cloud image storage is not configured. Set BLOB_READ_WRITE_TOKEN in Vercel environment variables."
    );
  }

  const db = getDb();
  const [record] = await db
    .insert(mediaAssets)
    .values({
      url: storedUrl,
      pathname: storedPathname,
      filename: safeName,
      mime_type: detectedMime,
      size_bytes: buffer.length,
      width,
      height,
      source,
      storage_provider: storageProvider,
      prompt,
      uploaded_by: uploadedBy,
    })
    .returning();

  return record;
}

export interface MediaAssetWithUsage {
  id: number | null;
  url: string;
  pathname: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  source: string;
  storage_provider: string;
  prompt: string | null;
  created_at: string;
  usedIn: string[];
}

const BUILTIN_IMAGES = [
  { url: "/images/hero-villa.jpg", filename: "hero-villa.jpg" },
  { url: "/images/about-team.jpg", filename: "about-team.jpg" },
  { url: "/images/service-apartment.jpg", filename: "service-apartment.jpg" },
  { url: "/images/service-sofa.jpg", filename: "service-sofa.jpg" },
  { url: "/images/service-kitchen.jpg", filename: "service-kitchen.jpg" },
  { url: "/images/service-office.jpg", filename: "service-office.jpg" },
  { url: "/images/vistara-logo.png", filename: "vistara-logo.png" },
];

export async function listMediaAssetsWithUsage(): Promise<
  MediaAssetWithUsage[]
> {
  const db = getDb();
  const [assets, allServices, allCategories, allSeo] = await Promise.all([
    db.select().from(mediaAssets).orderBy(desc(mediaAssets.created_at)),
    db.select({ title_en: services.title_en, image: services.image }).from(services),
    db
      .select({
        name_en: serviceCategories.name_en,
        image: serviceCategories.image,
      })
      .from(serviceCategories),
    db
      .select({ page_key: seoMetadata.page_key, og_image: seoMetadata.og_image })
      .from(seoMetadata),
  ]);

  const usageMap = new Map<string, string[]>();
  const addUsage = (url: string | null | undefined, label: string) => {
    if (!url) return;
    const list = usageMap.get(url) ?? [];
    list.push(label);
    usageMap.set(url, list);
  };

  allServices.forEach((s) => addUsage(s.image, `Service: ${s.title_en}`));
  allCategories.forEach((c) => addUsage(c.image, `Category: ${c.name_en}`));
  allSeo.forEach((seo) => addUsage(seo.og_image, `SEO: ${seo.page_key}`));

  const dbUrls = new Set(assets.map((a) => a.url));
  const result: MediaAssetWithUsage[] = assets.map((a) => ({
    id: a.id,
    url: a.url,
    pathname: a.pathname,
    filename: a.filename,
    mime_type: a.mime_type,
    size_bytes: a.size_bytes,
    width: a.width,
    height: a.height,
    source: a.source,
    storage_provider: a.storage_provider,
    prompt: a.prompt,
    created_at: a.created_at.toISOString(),
    usedIn: usageMap.get(a.url) ?? [],
  }));

  for (const b of BUILTIN_IMAGES) {
    if (!dbUrls.has(b.url)) {
      result.push({
        id: null,
        url: b.url,
        pathname: b.url,
        filename: b.filename,
        mime_type: b.url.endsWith(".png") ? "image/png" : "image/jpeg",
        size_bytes: 0,
        width: null,
        height: null,
        source: "built-in",
        storage_provider: "public-static",
        prompt: null,
        created_at: new Date(0).toISOString(),
        usedIn: usageMap.get(b.url) ?? [],
      });
    }
  }

  return result;
}

export async function deleteMediaAssetById(id: number): Promise<{
  ok: boolean;
  status: number;
  error?: string;
}> {
  const db = getDb();
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  const asset = rows[0];
  if (!asset) {
    return { ok: false, status: 404, error: "Media asset not found." };
  }

  const [refServices, refCategories, refSeo] = await Promise.all([
    db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.image, asset.url))
      .limit(1),
    db
      .select({ id: serviceCategories.id })
      .from(serviceCategories)
      .where(eq(serviceCategories.image, asset.url))
      .limit(1),
    db
      .select({ id: seoMetadata.id })
      .from(seoMetadata)
      .where(eq(seoMetadata.og_image, asset.url))
      .limit(1),
  ]);

  if (
    refServices.length > 0 ||
    refCategories.length > 0 ||
    refSeo.length > 0
  ) {
    return {
      ok: false,
      status: 409,
      error:
        "Cannot delete this image because it is currently used by an active service, category, or SEO metadata record.",
    };
  }

  if (
    asset.storage_provider === "vercel-blob" &&
    process.env.BLOB_READ_WRITE_TOKEN
  ) {
    try {
      await del(asset.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (err) {
      console.warn("Failed to remove blob from Vercel Blob storage:", err);
    }
  } else if (asset.storage_provider === "local-public") {
    const filePath = path.join(
      process.cwd(),
      "public",
      asset.pathname.replace(/^\/+/, "")
    );
    await fs.unlink(filePath).catch(() => undefined);
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return { ok: true, status: 200 };
}
