import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  imageGenerationJobs,
  serviceCategories,
  services,
} from "@/db/schema";
import { storeValidatedImage } from "@/lib/storage/image-storage";
import { buildCategoryImagePrompt, buildServiceImagePrompt } from "./prompts";
import { generateImageFromPrompt } from "./provider";

if (typeof window !== "undefined") {
  throw new Error("image-generation/service-image is server-only");
}

export function getBrandedFallbackImage(
  category: string,
  slug?: string
): string {
  const s = (slug || "").toLowerCase();
  if (s.includes("kitchen") || s.includes("bathroom")) {
    return "/images/service-kitchen.jpg";
  }
  if (s.includes("sofa") || s.includes("carpet")) {
    return "/images/service-sofa.jpg";
  }
  if (s.includes("office") || s.includes("commercial") || category === "commercial") {
    return "/images/service-office.jpg";
  }
  if (s.includes("apartment") || s.includes("curtain") || s.includes("mattress")) {
    return "/images/service-apartment.jpg";
  }
  if (s.includes("water-tank") || s.includes("residential")) {
    return "/images/about-team.jpg";
  }
  return "/images/hero-villa.jpg";
}

export async function generateAndAttachImage({
  entityType,
  entityId,
  titleEn,
  descriptionEn,
  category,
  slug,
  forceRegenerate = false,
  adminUserId = null,
}: {
  entityType: "service" | "category";
  entityId: number;
  titleEn: string;
  descriptionEn: string;
  category: string;
  slug: string;
  forceRegenerate?: boolean;
  adminUserId?: number | null;
}): Promise<{
  imageUrl: string;
  status: "generated" | "failed" | "manual";
  warning?: string;
}> {
  const db = getDb();

  // Never overwrite a manual image unless explicitly forced
  if (entityType === "service" && !forceRegenerate) {
    const [existing] = await db
      .select({
        image: services.image,
        image_source: services.image_source,
      })
      .from(services)
      .where(eq(services.id, entityId))
      .limit(1);

    if (existing && existing.image_source === "manual" && existing.image) {
      return { imageUrl: existing.image, status: "manual" };
    }
  }

  if (entityType === "category" && !forceRegenerate) {
    const [existing] = await db
      .select({
        image: serviceCategories.image,
        image_source: serviceCategories.image_source,
      })
      .from(serviceCategories)
      .where(eq(serviceCategories.id, entityId))
      .limit(1);

    if (existing && existing.image_source === "manual" && existing.image) {
      return { imageUrl: existing.image, status: "manual" };
    }
  }

  // Prevent duplicate in-flight generation jobs
  const [inFlight] = await db
    .select({ id: imageGenerationJobs.id })
    .from(imageGenerationJobs)
    .where(
      and(
        eq(imageGenerationJobs.entity_type, entityType),
        eq(imageGenerationJobs.entity_id, entityId),
        eq(imageGenerationJobs.status, "generating")
      )
    )
    .limit(1);

  if (inFlight) {
    const fallback = getBrandedFallbackImage(category, slug);
    return {
      imageUrl: fallback,
      status: "failed",
      warning: "An image generation request is already in progress.",
    };
  }

  const prompt =
    entityType === "service"
      ? buildServiceImagePrompt({ titleEn, descriptionEn, category })
      : buildCategoryImagePrompt({
          nameEn: titleEn,
          descriptionEn,
        });

  // Mark entity as generating
  if (entityType === "service") {
    await db
      .update(services)
      .set({
        image_generation_status: "generating",
        image_generation_error: null,
        updated_at: new Date(),
      })
      .where(eq(services.id, entityId));
  } else {
    await db
      .update(serviceCategories)
      .set({ image_generation_status: "generating" })
      .where(eq(serviceCategories.id, entityId));
  }

  const [job] = await db
    .insert(imageGenerationJobs)
    .values({
      entity_type: entityType,
      entity_id: entityId,
      prompt,
      provider: process.env.IMAGE_GENERATION_PROVIDER || "unconfigured",
      status: "generating",
      created_by: adminUserId,
    })
    .returning({ id: imageGenerationJobs.id });

  const genResult = await generateImageFromPrompt(prompt);

  if (!genResult.ok) {
    const fallbackUrl = getBrandedFallbackImage(category, slug);

    await db
      .update(imageGenerationJobs)
      .set({
        status: "failed",
        provider: genResult.provider,
        error_message: genResult.error,
        result_url: fallbackUrl,
        updated_at: new Date(),
      })
      .where(eq(imageGenerationJobs.id, job.id));

    if (entityType === "service") {
      await db
        .update(services)
        .set({
          image: fallbackUrl,
          image_source: "fallback",
          image_generation_status: "failed",
          image_generation_error: genResult.error,
          updated_at: new Date(),
        })
        .where(eq(services.id, entityId));
    } else {
      await db
        .update(serviceCategories)
        .set({
          image: fallbackUrl,
          image_source: "fallback",
          image_generation_status: "failed",
        })
        .where(eq(serviceCategories.id, entityId));
    }

    return {
      imageUrl: fallbackUrl,
      status: "failed",
      warning: genResult.error,
    };
  }

  try {
    const storedAsset = await storeValidatedImage({
      buffer: genResult.buffer,
      filename: `${slug || entityType}-ai`,
      declaredMimeType: genResult.mimeType,
      source: "ai-generated",
      prompt,
      uploadedBy: adminUserId,
    });

    await db
      .update(imageGenerationJobs)
      .set({
        status: "generated",
        provider: genResult.provider,
        result_url: storedAsset.url,
        updated_at: new Date(),
      })
      .where(eq(imageGenerationJobs.id, job.id));

    if (entityType === "service") {
      await db
        .update(services)
        .set({
          image: storedAsset.url,
          image_source: "ai",
          image_generation_status: "generated",
          image_generation_error: null,
          updated_at: new Date(),
        })
        .where(eq(services.id, entityId));
    } else {
      await db
        .update(serviceCategories)
        .set({
          image: storedAsset.url,
          image_source: "ai",
          image_generation_status: "generated",
        })
        .where(eq(serviceCategories.id, entityId));
    }

    return {
      imageUrl: storedAsset.url,
      status: "generated",
    };
  } catch (storeErr) {
    const fallbackUrl = getBrandedFallbackImage(category, slug);
    const errMsg =
      storeErr instanceof Error ? storeErr.message : "Image storage failed.";

    await db
      .update(imageGenerationJobs)
      .set({
        status: "failed",
        error_message: errMsg,
        result_url: fallbackUrl,
        updated_at: new Date(),
      })
      .where(eq(imageGenerationJobs.id, job.id));

    if (entityType === "service") {
      await db
        .update(services)
        .set({
          image: fallbackUrl,
          image_source: "fallback",
          image_generation_status: "failed",
          image_generation_error: errMsg,
          updated_at: new Date(),
        })
        .where(eq(services.id, entityId));
    } else {
      await db
        .update(serviceCategories)
        .set({
          image: fallbackUrl,
          image_source: "fallback",
          image_generation_status: "failed",
        })
        .where(eq(serviceCategories.id, entityId));
    }

    return {
      imageUrl: fallbackUrl,
      status: "failed",
      warning: errMsg,
    };
  }
}
