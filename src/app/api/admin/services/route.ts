import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { serviceCategories, services } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import { getClientIp, revalidatePublicSite } from "@/lib/admin-defaults";
import {
  generateAndAttachImage,
  getBrandedFallbackImage,
} from "@/lib/image-generation/service-image";
import {
  adminServiceCreateSchema,
  adminServiceUpdateSchema,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiSession("services:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category")?.trim() || "all";
    const statusFilter = searchParams.get("status")?.trim() || "all";
    const query = searchParams.get("q")?.trim().toLowerCase() || "";

    const db = getDb();
    const [allServices, allCategories] = await Promise.all([
      db
        .select()
        .from(services)
        .orderBy(asc(services.sort_order), asc(services.id)),
      db
        .select()
        .from(serviceCategories)
        .orderBy(asc(serviceCategories.sort_order), asc(serviceCategories.id)),
    ]);

    const items = allServices.filter((svc) => {
      if (categoryFilter !== "all" && svc.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "active" && !svc.is_active) return false;
      if (statusFilter === "inactive" && svc.is_active) return false;
      if (query) {
        const hay = `${svc.title_en} ${svc.title_ar} ${svc.slug} ${svc.category}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    return NextResponse.json(
      { ok: true, items, categories: allCategories },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing services:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load services." },
      { status: 500 }
    );
  }
}

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
    const parsed = adminServiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid service payload.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [duplicate] = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.slug, parsed.data.slug))
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: "A service with this slug already exists." },
        { status: 409 }
      );
    }

    let resolvedCategoryId = parsed.data.category_id ?? null;
    let resolvedCategorySlug = parsed.data.category;

    if (resolvedCategoryId) {
      const [cat] = await db
        .select({ id: serviceCategories.id, slug: serviceCategories.slug })
        .from(serviceCategories)
        .where(eq(serviceCategories.id, resolvedCategoryId))
        .limit(1);
      if (cat) {
        resolvedCategorySlug = cat.slug;
      } else {
        resolvedCategoryId = null;
      }
    } else {
      const [cat] = await db
        .select({ id: serviceCategories.id })
        .from(serviceCategories)
        .where(eq(serviceCategories.slug, resolvedCategorySlug))
        .limit(1);
      if (cat) {
        resolvedCategoryId = cat.id;
      }
    }

    const manualImage = parsed.data.image?.trim() || "";
    const hasManualImage = manualImage.length > 0;
    const initialImage = hasManualImage
      ? manualImage
      : getBrandedFallbackImage(resolvedCategorySlug, parsed.data.slug);

    const [created] = await db
      .insert(services)
      .values({
        slug: parsed.data.slug,
        category: resolvedCategorySlug,
        category_id: resolvedCategoryId,
        title_en: parsed.data.title_en,
        title_ar: parsed.data.title_ar,
        description_en: parsed.data.description_en,
        description_ar: parsed.data.description_ar,
        image: initialImage,
        image_source: hasManualImage
          ? parsed.data.image_source ?? "manual"
          : "fallback",
        image_generation_status: hasManualImage ? "manual" : "not_generated",
        seo_title_en: parsed.data.seo_title_en ?? null,
        seo_title_ar: parsed.data.seo_title_ar ?? null,
        seo_description_en: parsed.data.seo_description_en ?? null,
        seo_description_ar: parsed.data.seo_description_ar ?? null,
        sort_order: parsed.data.sort_order ?? 0,
        is_active: parsed.data.is_active ?? true,
      })
      .returning();

    let warning: string | undefined;
    let finalItem = created;

    if (!hasManualImage) {
      const genResult = await generateAndAttachImage({
        entityType: "service",
        entityId: created.id,
        titleEn: created.title_en,
        descriptionEn: created.description_en,
        category: created.category,
        slug: created.slug,
        adminUserId: auth.user.id,
      });
      warning = genResult.warning;

      const [refreshed] = await db
        .select()
        .from(services)
        .where(eq(services.id, created.id))
        .limit(1);
      if (refreshed) {
        finalItem = refreshed;
      }
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "service_created",
      entityType: "service",
      entityId: String(created.id),
      details: { slug: created.slug, hasManualImage },
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/services", "/ar/services"]);

    return NextResponse.json(
      { ok: true, item: finalItem, warning },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create service." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiSession("services:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminServiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid service update.",
        },
        { status: 400 }
      );
    }

    const { id, ...rest } = parsed.data;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Service not found." },
        { status: 404 }
      );
    }

    if (rest.slug && rest.slug !== existing.slug) {
      const [dup] = await db
        .select({ id: services.id })
        .from(services)
        .where(eq(services.slug, rest.slug))
        .limit(1);
      if (dup) {
        return NextResponse.json(
          { ok: false, error: "Another service already uses this slug." },
          { status: 409 }
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (rest.slug !== undefined) updates.slug = rest.slug;
    if (rest.category !== undefined) updates.category = rest.category;
    if (rest.category_id !== undefined) updates.category_id = rest.category_id;
    if (rest.title_en !== undefined) updates.title_en = rest.title_en;
    if (rest.title_ar !== undefined) updates.title_ar = rest.title_ar;
    if (rest.description_en !== undefined)
      updates.description_en = rest.description_en;
    if (rest.description_ar !== undefined)
      updates.description_ar = rest.description_ar;
    if (rest.seo_title_en !== undefined)
      updates.seo_title_en = rest.seo_title_en;
    if (rest.seo_title_ar !== undefined)
      updates.seo_title_ar = rest.seo_title_ar;
    if (rest.seo_description_en !== undefined)
      updates.seo_description_en = rest.seo_description_en;
    if (rest.seo_description_ar !== undefined)
      updates.seo_description_ar = rest.seo_description_ar;
    if (rest.sort_order !== undefined) updates.sort_order = rest.sort_order;
    if (rest.is_active !== undefined) updates.is_active = rest.is_active;

    if (rest.image !== undefined && rest.image.trim().length > 0) {
      updates.image = rest.image.trim();
      updates.image_source = rest.image_source ?? "manual";
      updates.image_generation_status =
        rest.image_generation_status ?? "manual";
      updates.image_generation_error = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, item: existing }, { status: 200 });
    }

    const [updated] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "service_updated",
      entityType: "service",
      entityId: String(id),
      details: { updatedFields: Object.keys(updates) },
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/services", "/ar/services"]);

    return NextResponse.json({ ok: true, item: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update service." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiSession("services:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = Number.parseInt(searchParams.get("id") || "", 10);
    if (!Number.isInteger(id) || id <= 0) {
      const body = await request.json().catch(() => null);
      id = Number(body?.id);
    }

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid service id." },
        { status: 400 }
      );
    }

    const db = getDb();
    const deleted = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning({ id: services.id, slug: services.slug });

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Service not found." },
        { status: 404 }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "service_deleted",
      entityType: "service",
      entityId: String(id),
      details: { slug: deleted[0].slug },
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/services", "/ar/services"]);

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete service." },
      { status: 500 }
    );
  }
}

