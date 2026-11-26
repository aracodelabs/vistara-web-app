import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { websiteContent } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import {
  DEFAULT_CONTENT_SECTIONS,
  getClientIp,
  revalidatePublicSite,
} from "@/lib/admin-defaults";
import { adminContentUpdateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAdminApiSession("content:read");
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
      .from(websiteContent)
      .orderBy(asc(websiteContent.id));

    const existingKeys = new Set(rows.map((r) => r.section_key));
    const missing = DEFAULT_CONTENT_SECTIONS.filter(
      (def) => !existingKeys.has(def.section_key)
    );

    if (missing.length > 0) {
      await db
        .insert(websiteContent)
        .values(
          missing.map((def) => ({
            section_key: def.section_key,
            content_en: def.content_en as Record<string, unknown>,
            content_ar: def.content_ar as Record<string, unknown>,
          }))
        )
        .onConflictDoNothing({ target: websiteContent.section_key });

      rows = await db
        .select()
        .from(websiteContent)
        .orderBy(asc(websiteContent.id));
    }

    return NextResponse.json({ ok: true, items: rows }, { status: 200 });
  } catch (error) {
    console.error("Error loading website content:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load website content." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApiSession("content:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminContentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid content payload.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [saved] = await db
      .insert(websiteContent)
      .values({
        section_key: parsed.data.section_key,
        content_en: parsed.data.content_en,
        content_ar: parsed.data.content_ar,
        updated_by: auth.user.id,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: websiteContent.section_key,
        set: {
          content_en: parsed.data.content_en,
          content_ar: parsed.data.content_ar,
          updated_by: auth.user.id,
          updated_at: new Date(),
        },
      })
      .returning();

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "content_updated",
      entityType: "website_content",
      entityId: parsed.data.section_key,
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite();

    return NextResponse.json({ ok: true, item: saved }, { status: 200 });
  } catch (error) {
    console.error("Error updating website content:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save website content." },
      { status: 500 }
    );
  }
}
