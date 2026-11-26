import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { services, testimonials, type TestimonialRecord } from "@/db/schema";

if (typeof window !== "undefined") {
  throw new Error("testimonials-moderation is server-only");
}

export interface ModerationActor {
  adminId: string;
  role: "admin" | "moderator";
}

export type ModerationQueueStatus = "pending" | "approved" | "all";

export interface ModerationQueueItem {
  id: number;
  customerName: string;
  location: string | null;
  serviceId: number | null;
  serviceSlug: string | null;
  serviceTitleEn: string | null;
  serviceTitleAr: string | null;
  rating: number;
  review: string;
  language: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
}

export function assertModerationActor(actor: ModerationActor): void {
  if (
    !actor ||
    typeof actor.adminId !== "string" ||
    actor.adminId.trim().length === 0 ||
    (actor.role !== "admin" && actor.role !== "moderator")
  ) {
    throw new Error("Unauthorized moderation actor.");
  }
}

export async function listModerationQueue(
  actor: ModerationActor,
  status: ModerationQueueStatus = "pending"
): Promise<ModerationQueueItem[]> {
  assertModerationActor(actor);
  const db = getDb();

  const baseQuery = db
    .select({
      id: testimonials.id,
      customerName: testimonials.customer_name,
      location: testimonials.location,
      serviceId: testimonials.service_id,
      serviceSlug: services.slug,
      serviceTitleEn: services.title_en,
      serviceTitleAr: services.title_ar,
      rating: testimonials.rating,
      review: testimonials.review,
      language: testimonials.language,
      isVerified: testimonials.is_verified,
      isApproved: testimonials.is_approved,
      createdAt: testimonials.created_at,
    })
    .from(testimonials)
    .leftJoin(services, eq(testimonials.service_id, services.id));

  if (status === "pending") {
    return baseQuery
      .where(eq(testimonials.is_approved, false))
      .orderBy(desc(testimonials.created_at), desc(testimonials.id));
  }

  if (status === "approved") {
    return baseQuery
      .where(eq(testimonials.is_approved, true))
      .orderBy(desc(testimonials.created_at), desc(testimonials.id));
  }

  return baseQuery.orderBy(desc(testimonials.created_at), desc(testimonials.id));
}

export async function approveTestimonial(
  actor: ModerationActor,
  testimonialId: number,
  options?: { isVerified?: boolean }
): Promise<TestimonialRecord | null> {
  assertModerationActor(actor);
  const db = getDb();

  const updateValues: Partial<TestimonialRecord> = {
    is_approved: true,
    ...(typeof options?.isVerified === "boolean"
      ? { is_verified: options.isVerified }
      : {}),
  };

  const [updated] = await db
    .update(testimonials)
    .set(updateValues)
    .where(eq(testimonials.id, testimonialId))
    .returning();

  return updated ?? null;
}

export async function unapproveTestimonial(
  actor: ModerationActor,
  testimonialId: number
): Promise<TestimonialRecord | null> {
  assertModerationActor(actor);
  const db = getDb();

  const [updated] = await db
    .update(testimonials)
    .set({ is_approved: false })
    .where(eq(testimonials.id, testimonialId))
    .returning();

  return updated ?? null;
}

export async function setTestimonialVerified(
  actor: ModerationActor,
  testimonialId: number,
  isVerified: boolean
): Promise<TestimonialRecord | null> {
  assertModerationActor(actor);
  const db = getDb();

  const [updated] = await db
    .update(testimonials)
    .set({ is_verified: isVerified })
    .where(eq(testimonials.id, testimonialId))
    .returning();

  return updated ?? null;
}

export async function deleteTestimonial(
  actor: ModerationActor,
  testimonialId: number
): Promise<boolean> {
  assertModerationActor(actor);
  const db = getDb();

  const deleted = await db
    .delete(testimonials)
    .where(eq(testimonials.id, testimonialId))
    .returning({ id: testimonials.id });

  return deleted.length > 0;
}
