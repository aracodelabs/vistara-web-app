import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { testimonials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import { getClientIp, revalidatePublicSite } from "@/lib/admin-defaults";
import {
  approveTestimonial,
  deleteTestimonial,
  editTestimonial,
  listModerationQueue,
  setTestimonialVerified,
  unapproveTestimonial,
  type ModerationActor,
  type ModerationQueueStatus,
} from "@/lib/testimonials-moderation";
import { adminTestimonialUpdateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiSession("testimonials:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get("status")?.trim() ||
      "all") as ModerationQueueStatus;
    const status: ModerationQueueStatus =
      statusParam === "pending" || statusParam === "approved"
        ? statusParam
        : "all";
    const ratingParam = Number.parseInt(searchParams.get("rating") || "", 10);
    const serviceSlug = searchParams.get("service")?.trim() || "all";
    const query = searchParams.get("q")?.trim().toLowerCase() || "";

    const actor: ModerationActor = {
      adminId: String(auth.user.id),
      role: auth.user.role,
    };

    const allRows = await listModerationQueue(actor, "all");

    const counts = {
      all: allRows.length,
      pending: allRows.filter((item) => !item.isApproved).length,
      approved: allRows.filter((item) => item.isApproved).length,
    };

    const items = allRows.filter((item) => {
      if (status === "pending" && item.isApproved) return false;
      if (status === "approved" && !item.isApproved) return false;
      if (Number.isInteger(ratingParam) && ratingParam >= 1 && ratingParam <= 5) {
        if (item.rating !== ratingParam) return false;
      }
      if (serviceSlug !== "all" && item.serviceSlug !== serviceSlug) {
        return false;
      }
      if (query) {
        const hay = `${item.customerName} ${item.location || ""} ${item.review} ${item.serviceTitleEn || ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    return NextResponse.json({ ok: true, items, counts }, { status: 200 });
  } catch (error) {
    console.error("Error listing testimonials:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load testimonials." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiSession("testimonials:moderate");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminTestimonialUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            parsed.error.issues[0]?.message || "Invalid testimonial payload.",
        },
        { status: 400 }
      );
    }

    const {
      id,
      isApproved,
      isVerified,
      customerName,
      location,
      rating,
      review,
    } = parsed.data;

    const db = getDb();
    const [existing] = await db
      .select({ id: testimonials.id })
      .from(testimonials)
      .where(eq(testimonials.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Testimonial not found." },
        { status: 404 }
      );
    }

    const actor: ModerationActor = {
      adminId: String(auth.user.id),
      role: auth.user.role,
    };

    let updated = null;

    if (
      customerName !== undefined ||
      location !== undefined ||
      rating !== undefined ||
      review !== undefined
    ) {
      updated = await editTestimonial(actor, id, {
        ...(customerName !== undefined ? { customer_name: customerName } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(rating !== undefined ? { rating } : {}),
        ...(review !== undefined ? { review } : {}),
      });
    }

    if (typeof isApproved === "boolean") {
      updated = isApproved
        ? await approveTestimonial(actor, id, {
          ...(typeof isVerified === "boolean" ? { isVerified } : {}),
        })
        : await unapproveTestimonial(actor, id);
    } else if (typeof isVerified === "boolean") {
      updated = await setTestimonialVerified(actor, id, isVerified);
    }

    if (!updated) {
      const [refreshed] = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.id, id))
        .limit(1);
      updated = refreshed ?? null;
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "testimonial_updated",
      entityType: "testimonial",
      entityId: String(id),
      details: {
        isApproved,
        isVerified,
        editedContent:
          customerName !== undefined ||
          location !== undefined ||
          rating !== undefined ||
          review !== undefined,
      },
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/testimonials", "/ar/testimonials"]);

    return NextResponse.json({ ok: true, item: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update testimonial." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiSession("testimonials:delete");
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
        { ok: false, error: "Invalid testimonial id." },
        { status: 400 }
      );
    }

    const actor: ModerationActor = {
      adminId: String(auth.user.id),
      role: auth.user.role,
    };

    const deleted = await deleteTestimonial(actor, id);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "Testimonial not found." },
        { status: 404 }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "testimonial_deleted",
      entityType: "testimonial",
      entityId: String(id),
      ipAddress: getClientIp(request),
    });

    revalidatePublicSite(["/en/testimonials", "/ar/testimonials"]);

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete testimonial." },
      { status: 500 }
    );
  }
}

