import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { seoMetadata } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import {
  DEFAULT_SEO_PAGES,
  getClientIp,
  revalidatePublicSite,
} from "@/lib/admin-defaults";
import { adminSeoUpdateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAdminApiSession("seo:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const db = getDb();
    let rows = await db
      .select()
      .from(seoMetadata)
      .orderBy(asc(seoMetadata.id));

    const existingKeys = new Set(rows.map((r) => r.page_key));
    const missing = DEFAULT_SEO_PAGES.filter(
      (def) => !existingKeys.has(def.page_key)
    );

    if (missing.length > 0) {
      await db
        .insert(seoMetadata)
        .values(missing)
        .onConflictDoNothing({ target: seoMetadata.page_key });

      rows = await db
        .select()
        .from(seoMetadata)
        .orderBy(asc(seoMetadata.id));
    }

    return NextResponse.json({ ok: true, items: rows }, { status: 200 });
  } catch (error) {
    console.error("Error loading SEO metadata:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load SEO settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApiSession("seo:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminSeoUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid SEO payload.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [saved] = await db
      .insert(seoMetadata)
      .values({
        page_key: parsed.data.page_key,
        title_en: parsed.data.title_en,
        title_ar: parsed.data.title_ar,
        description_en: parsed.data.description_en,
        description_ar: parsed.data.description_ar,
        og_image: parsed.data.og_image || null,
        canonical_url: parsed.data.canonical_url || null,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: seoMetadata.page_key,
        set: {
          title_en: parsed.data.title_en,
          title_ar: parsed.data.title_ar,
          description_en: parsed.data.description_en,
          description_ar: parsed.data.description_ar,
          og_image: parsed.data.og_image || null,
          canonical_url: parsed.data.canonical_url || null,
          updated_at: new Date(),
        },
      })
      .returning();

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "seo_updated",
      entityType: "seo_metadata",
      entityId: parsed.data.page_key,
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite([
      "/en/about",
      "/ar/about",
      "/en/contact",
      "/ar/contact",
      "/en/quote",
      "/ar/quote",
      "/en/faq",
      "/ar/faq",
    ]);

    return NextResponse.json({ ok: true, item: saved }, { status: 200 });
  } catch (error) {
    console.error("Error updating SEO metadata:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save SEO metadata." },
      { status: 500 }
    );
  }
}
