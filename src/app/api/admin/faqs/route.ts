import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { faqs } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import {
  DEFAULT_FAQS,
  getClientIp,
  revalidatePublicSite,
} from "@/lib/admin-defaults";
import { adminFaqSchema } from "@/lib/validation";

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
      .from(faqs)
      .orderBy(asc(faqs.sort_order), asc(faqs.id));

    if (rows.length === 0 && DEFAULT_FAQS.length > 0) {
      await db.insert(faqs).values(DEFAULT_FAQS);
      rows = await db
        .select()
        .from(faqs)
        .orderBy(asc(faqs.sort_order), asc(faqs.id));
    }

    return NextResponse.json({ ok: true, items: rows }, { status: 200 });
  } catch (error) {
    console.error("Error loading FAQs:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load FAQs." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiSession("content:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminFaqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid FAQ payload.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [created] = await db
      .insert(faqs)
      .values({
        question_en: parsed.data.question_en,
        question_ar: parsed.data.question_ar,
        answer_en: parsed.data.answer_en,
        answer_ar: parsed.data.answer_ar,
        sort_order: parsed.data.sort_order ?? 0,
        is_active: parsed.data.is_active ?? true,
      })
      .returning();

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "faq_created",
      entityType: "faq",
      entityId: String(created.id),
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/faq", "/ar/faq"]);

    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create FAQ." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiSession("content:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminFaqSchema.safeParse(body);
    if (!parsed.success || !parsed.data.id) {
      return NextResponse.json(
        {
          ok: false,
          error: !parsed.success
            ? parsed.error.issues[0]?.message || "Invalid FAQ update."
            : "FAQ id is required.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [updated] = await db
      .update(faqs)
      .set({
        question_en: parsed.data.question_en,
        question_ar: parsed.data.question_ar,
        answer_en: parsed.data.answer_en,
        answer_ar: parsed.data.answer_ar,
        sort_order: parsed.data.sort_order ?? 0,
        is_active: parsed.data.is_active ?? true,
        updated_at: new Date(),
      })
      .where(eq(faqs.id, parsed.data.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "FAQ not found." },
        { status: 404 }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "faq_updated",
      entityType: "faq",
      entityId: String(updated.id),
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/faq", "/ar/faq"]);

    return NextResponse.json({ ok: true, item: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update FAQ." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiSession("content:write");
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
        { ok: false, error: "Invalid FAQ id." },
        { status: 400 }
      );
    }

    const db = getDb();
    const deleted = await db
      .delete(faqs)
      .where(eq(faqs.id, id))
      .returning({ id: faqs.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: "FAQ not found." },
        { status: 404 }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "faq_deleted",
      entityType: "faq",
      entityId: String(id),
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/faq", "/ar/faq"]);

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete FAQ." },
      { status: 500 }
    );
  }
}
