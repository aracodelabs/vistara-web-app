import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { serviceCategories, services } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import { getClientIp, revalidatePublicSite } from "@/lib/admin-defaults";
import { generateAndAttachImage } from "@/lib/image-generation/service-image";

const imageGenRequestSchema = z.object({
  entityType: z.enum(["service", "category"]),
  entityId: z.number().int().positive(),
  forceRegenerate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiSession("services:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = imageGenRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            parsed.error.issues[0]?.message ||
            "Invalid image generation request.",
        },
        { status: 400 }
      );
    }

    const { entityType, entityId, forceRegenerate = true } = parsed.data;
    const db = getDb();

    let result: {
      imageUrl: string;
      status: "generated" | "failed" | "manual";
      warning?: string;
    };

    if (entityType === "service") {
      const [svc] = await db
        .select()
        .from(services)
        .where(eq(services.id, entityId))
        .limit(1);

      if (!svc) {
        return NextResponse.json(
          { ok: false, error: "Service not found." },
          { status: 404 }
        );
      }

      result = await generateAndAttachImage({
        entityType: "service",
        entityId: svc.id,
        titleEn: svc.title_en,
        descriptionEn: svc.description_en,
        category: svc.category,
        slug: svc.slug,
        forceRegenerate,
        adminUserId: auth.user.id,
      });
    } else {
      const [cat] = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.id, entityId))
        .limit(1);

      if (!cat) {
        return NextResponse.json(
          { ok: false, error: "Category not found." },
          { status: 404 }
        );
      }

      result = await generateAndAttachImage({
        entityType: "category",
        entityId: cat.id,
        titleEn: cat.name_en,
        descriptionEn: cat.description_en,
        category: cat.slug,
        slug: cat.slug,
        forceRegenerate,
        adminUserId: auth.user.id,
      });
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "image_generation_triggered",
      entityType,
      entityId: String(entityId),
      details: {
        status: result.status,
        hasWarning: Boolean(result.warning),
      },
      ipAddress: getClientIp(request),
    });

    if (result.status === "generated") {
      revalidatePublicSite(["/en/services", "/ar/services"]);
    }

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("Error generating service/category image:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to process image generation." },
      { status: 500 }
    );
  }
}
