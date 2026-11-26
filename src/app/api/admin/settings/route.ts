import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { websiteSettings } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import {
  DEFAULT_WEBSITE_SETTINGS,
  getClientIp,
  revalidatePublicSite,
} from "@/lib/admin-defaults";
import { normalizeNavigationVisibility } from "@/lib/navigation-visibility";
import { adminSettingsUpdateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAdminApiSession("settings:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const db = getDb();
    let [row] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.key, "primary"))
      .limit(1);

    if (!row) {
      await db
        .insert(websiteSettings)
        .values(DEFAULT_WEBSITE_SETTINGS)
        .onConflictDoNothing({ target: websiteSettings.key });

      [row] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.key, "primary"))
        .limit(1);
    }

    const item = row ?? DEFAULT_WEBSITE_SETTINGS;
    return NextResponse.json(
      {
        ok: true,
        item: {
          ...item,
          navigation_visibility: normalizeNavigationVisibility(
            item.navigation_visibility
          ),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error loading website settings:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load website settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApiSession("settings:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminSettingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid settings payload.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const normalizedNav = normalizeNavigationVisibility(
      parsed.data.navigation_visibility
    );
    const [saved] = await db
      .insert(websiteSettings)
      .values({
        key: "primary",
        ...parsed.data,
        navigation_visibility: normalizedNav,
        google_review_url: parsed.data.google_review_url || null,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: websiteSettings.key,
        set: {
          ...parsed.data,
          navigation_visibility: normalizedNav,
          google_review_url: parsed.data.google_review_url || null,
          updated_at: new Date(),
        },
      })
      .returning();

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "settings_updated",
      entityType: "website_settings",
      entityId: "primary",
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite([
      "/en/contact",
      "/ar/contact",
      "/en/quote",
      "/ar/quote",
      "/en/about",
      "/ar/about",
    ]);

    return NextResponse.json({ ok: true, item: saved }, { status: 200 });
  } catch (error) {
    console.error("Error updating website settings:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save website settings." },
      { status: 500 }
    );
  }
}
