import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { inquiries, services } from "@/db/schema";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import { adminInquiryUpdateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiSession("inquiries:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.trim();
    const serviceSlug = searchParams.get("service")?.trim();
    const queryParam = searchParams.get("q")?.trim();
    const dateFrom = searchParams.get("dateFrom")?.trim();
    const dateTo = searchParams.get("dateTo")?.trim();
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const pageSize = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(searchParams.get("pageSize") || "20", 10) || 20
      )
    );

    const conditions = [];
    if (statusParam && statusParam !== "all") {
      conditions.push(
        eq(
          inquiries.status,
          statusParam as (typeof inquiries.status.enumValues)[number]
        )
      );
    }
    if (serviceSlug && serviceSlug !== "all") {
      conditions.push(eq(services.slug, serviceSlug));
    }
    if (queryParam) {
      const pattern = `%${queryParam}%`;
      conditions.push(
        or(
          ilike(inquiries.customer_name, pattern),
          ilike(inquiries.phone_number, pattern),
          ilike(inquiries.area, pattern)
        )
      );
    }
    if (dateFrom) {
      const d = new Date(`${dateFrom}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) {
        conditions.push(gte(inquiries.created_at, d));
      }
    }
    if (dateTo) {
      const d = new Date(`${dateTo}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) {
        conditions.push(lte(inquiries.created_at, d));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const db = getDb();

    const [countRows, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(inquiries)
        .leftJoin(services, eq(inquiries.service_id, services.id))
        .where(whereClause),
      db
        .select({
          id: inquiries.id,
          customer_name: inquiries.customer_name,
          phone_number: inquiries.phone_number,
          email: inquiries.email,
          service_id: inquiries.service_id,
          service_slug: services.slug,
          service_title_en: services.title_en,
          property_type: inquiries.property_type,
          area: inquiries.area,
          preferred_date: inquiries.preferred_date,
          preferred_time: inquiries.preferred_time,
          message: inquiries.message,
          language: inquiries.language,
          status: inquiries.status,
          created_at: inquiries.created_at,
        })
        .from(inquiries)
        .leftJoin(services, eq(inquiries.service_id, services.id))
        .where(whereClause)
        .orderBy(desc(inquiries.created_at), desc(inquiries.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const totalCount = countRows[0]?.count ?? 0;

    return NextResponse.json(
      {
        ok: true,
        items: rows,
        totalCount,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing admin inquiries:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load inquiries." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiSession("inquiries:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminInquiryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const [updated] = await db
      .update(inquiries)
      .set({ status: parsed.data.status })
      .where(eq(inquiries.id, parsed.data.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Inquiry not found." },
        { status: 404 }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "inquiry.status_updated",
      entityType: "inquiry",
      entityId: updated.id,
      details: { status: updated.status },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, item: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update inquiry." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiSession("inquiries:delete");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = Number.parseInt(searchParams.get("id") || "", 10);

    if (!Number.isFinite(id) || id <= 0) {
      try {
        const body = await request.json();
        id = Number(body?.id);
      } catch {
        id = NaN;
      }
    }

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valid inquiry id is required." },
        { status: 400 }
      );
    }

    const db = getDb();
    const deleted = await db
      .delete(inquiries)
      .where(eq(inquiries.id, id))
      .returning({ id: inquiries.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Inquiry not found." },
        { status: 404 }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "inquiry.deleted",
      entityType: "inquiry",
      entityId: id,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete inquiry." },
      { status: 500 }
    );
  }
}

