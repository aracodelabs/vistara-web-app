import { NextRequest, NextResponse } from "next/server";
import { asc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { serviceCategories, services } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import { getClientIp, revalidatePublicSite } from "@/lib/admin-defaults";
import {
  generateAndAttachImage,
  getBrandedFallbackImage,
} from "@/lib/image-generation/service-image";
import {
  adminCategoryCreateSchema,
  adminCategoryUpdateSchema,
} from "@/lib/validation";

export async function GET() {
  const auth = await requireAdminApiSession("categories:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const db = getDb();
    const [categories, counts] = await Promise.all([
      db
        .select()
        .from(serviceCategories)
        .orderBy(asc(serviceCategories.sort_order), asc(serviceCategories.id)),
      db
        .select({
          categoryId: services.category_id,
          categorySlug: services.category,
          count: sql<number>`count(*)::int`,
        })
        .from(services)
        .groupBy(services.category_id, services.category),
    ]);

    const items = categories.map((cat) => {
      const matched = counts.filter(
        (c) => c.categoryId === cat.id || c.categorySlug === cat.slug
      );
      const serviceCount = matched.reduce((acc, row) => acc + row.count, 0);
      return {
        ...cat,
        serviceCount,
      };
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (error) {
    console.error("Error listing categories:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiSession("categories:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminCategoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid category payload.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [duplicate] = await db
      .select({ id: serviceCategories.id })
      .from(serviceCategories)
      .where(eq(serviceCategories.slug, parsed.data.slug))
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: "A category with this slug already exists." },
        { status: 409 }
      );
    }

    const manualImage = parsed.data.image?.trim() || "";
    const hasManualImage = manualImage.length > 0;
    const initialImage = hasManualImage
      ? manualImage
      : getBrandedFallbackImage(parsed.data.slug, parsed.data.slug);

    const [created] = await db
      .insert(serviceCategories)
      .values({
        slug: parsed.data.slug,
        name_en: parsed.data.name_en,
        name_ar: parsed.data.name_ar,
        description_en: parsed.data.description_en,
        description_ar: parsed.data.description_ar,
        image: initialImage,
        image_source: hasManualImage ? "manual" : "fallback",
        image_generation_status: hasManualImage ? "manual" : "not_generated",
        sort_order: parsed.data.sort_order ?? 0,
        is_active: parsed.data.is_active ?? true,
      })
      .returning();

    let warning: string | undefined;
    let finalItem = created;

    if (!hasManualImage) {
      const genResult = await generateAndAttachImage({
        entityType: "category",
        entityId: created.id,
        titleEn: created.name_en,
        descriptionEn: created.description_en,
        category: created.slug,
        slug: created.slug,
        adminUserId: auth.user.id,
      });
      warning = genResult.warning;
      const [refreshed] = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.id, created.id))
        .limit(1);
      if (refreshed) {
        finalItem = refreshed;
      }
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "category_created",
      entityType: "category",
      entityId: String(created.id),
      details: { slug: created.slug },
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/services", "/ar/services"]);

    return NextResponse.json(
      { ok: true, item: { ...finalItem, serviceCount: 0 }, warning },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create category." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiSession("categories:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminCategoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid category update.",
        },
        { status: 400 }
      );
    }

    const { id, ...rest } = parsed.data;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Category not found." },
        { status: 404 }
      );
    }

    if (rest.slug && rest.slug !== existing.slug) {
      const [dup] = await db
        .select({ id: serviceCategories.id })
        .from(serviceCategories)
        .where(eq(serviceCategories.slug, rest.slug))
        .limit(1);
      if (dup) {
        return NextResponse.json(
          { ok: false, error: "Another category already uses this slug." },
          { status: 409 }
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (rest.slug !== undefined) updates.slug = rest.slug;
    if (rest.name_en !== undefined) updates.name_en = rest.name_en;
    if (rest.name_ar !== undefined) updates.name_ar = rest.name_ar;
    if (rest.description_en !== undefined)
      updates.description_en = rest.description_en;
    if (rest.description_ar !== undefined)
      updates.description_ar = rest.description_ar;
    if (rest.sort_order !== undefined) updates.sort_order = rest.sort_order;
    if (rest.is_active !== undefined) updates.is_active = rest.is_active;

    if (rest.image !== undefined) {
      const trimmed = rest.image?.trim() || null;
      updates.image = trimmed;
      if (trimmed) {
        updates.image_source = rest.image_source ?? "manual";
        updates.image_generation_status = "manual";
      }
    }

    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(serviceCategories)
        .set(updates)
        .where(eq(serviceCategories.id, id))
        .returning();

      if (rest.slug && rest.slug !== existing.slug) {
        await tx
          .update(services)
          .set({ category: rest.slug })
          .where(
            or(
              eq(services.category_id, id),
              eq(services.category, existing.slug)
            )
          );
      }
      return row;
    });

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "category_updated",
      entityType: "category",
      entityId: String(id),
      details: { updatedFields: Object.keys(updates) },
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/services", "/ar/services"]);

    return NextResponse.json({ ok: true, item: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiSession("categories:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = Number.parseInt(searchParams.get("id") || "", 10);
    let reassignToCategoryId = Number.parseInt(
      searchParams.get("reassignToCategoryId") || "",
      10
    );

    if (!Number.isInteger(id) || id <= 0) {
      const body = await request.json().catch(() => null);
      id = Number(body?.id);
      if (!Number.isInteger(reassignToCategoryId) || reassignToCategoryId <= 0) {
        reassignToCategoryId = Number(body?.reassignToCategoryId);
      }
    }

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid category id." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Category not found." },
        { status: 404 }
      );
    }

    const referencing = await db
      .select({ id: services.id })
      .from(services)
      .where(
        or(eq(services.category_id, id), eq(services.category, existing.slug))
      );

    if (referencing.length > 0) {
      if (
        !Number.isInteger(reassignToCategoryId) ||
        reassignToCategoryId <= 0 ||
        reassignToCategoryId === id
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: `Cannot delete category "${existing.name_en}" because ${referencing.length} service(s) reference it. Select a target category to reassign them first.`,
            serviceCount: referencing.length,
          },
          { status: 409 }
        );
      }

      const [targetCat] = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.id, reassignToCategoryId))
        .limit(1);

      if (!targetCat) {
        return NextResponse.json(
          { ok: false, error: "Target category for reassignment not found." },
          { status: 404 }
        );
      }

      await db.transaction(async (tx) => {
        await tx
          .update(services)
          .set({
            category_id: targetCat.id,
            category: targetCat.slug,
          })
          .where(
            or(
              eq(services.category_id, id),
              eq(services.category, existing.slug)
            )
          );

        await tx
          .delete(serviceCategories)
          .where(eq(serviceCategories.id, id));
      });
    } else {
      await db
        .delete(serviceCategories)
        .where(eq(serviceCategories.id, id));
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "category_deleted",
      entityType: "category",
      entityId: String(id),
      details: {
        slug: existing.slug,
        reassignedCount: referencing.length,
        reassignToCategoryId:
          referencing.length > 0 ? reassignToCategoryId : null,
      },
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/services", "/ar/services"]);

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete category." },
      { status: 500 }
    );
  }
}
