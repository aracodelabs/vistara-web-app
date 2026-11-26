import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { inquiries, internalInquiryNotes } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import { adminInquiryNoteSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession("inquiries:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { id } = await params;
    const inquiryId = Number.parseInt(id, 10);
    if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid inquiry id." },
        { status: 400 }
      );
    }

    const db = getDb();
    const notes = await db
      .select()
      .from(internalInquiryNotes)
      .where(eq(internalInquiryNotes.inquiry_id, inquiryId))
      .orderBy(desc(internalInquiryNotes.created_at));

    return NextResponse.json({ ok: true, items: notes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching inquiry notes:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load notes." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession("inquiries:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { id } = await params;
    const inquiryId = Number.parseInt(id, 10);
    if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid inquiry id." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = adminInquiryNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid note.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [existing] = await db
      .select({ id: inquiries.id })
      .from(inquiries)
      .where(eq(inquiries.id, inquiryId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Inquiry not found." },
        { status: 404 }
      );
    }

    const [created] = await db
      .insert(internalInquiryNotes)
      .values({
        inquiry_id: inquiryId,
        admin_user_id: auth.user.id,
        author_name: auth.user.name,
        note: parsed.data.note,
      })
      .returning();

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "inquiry.note_added",
      entityType: "inquiry",
      entityId: inquiryId,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  } catch (error) {
    console.error("Error adding inquiry note:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save note." },
      { status: 500 }
    );
  }
}
