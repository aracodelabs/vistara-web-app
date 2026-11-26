import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { inquiries, testimonials } from "@/db/schema";

export async function getAdminNotificationCounts(): Promise<{
  newInquiries: number;
  pendingTestimonials: number;
}> {
  try {
    const db = getDb();
    const [inqRows, testRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(inquiries)
        .where(eq(inquiries.status, "New")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(testimonials)
        .where(eq(testimonials.is_approved, false)),
    ]);

    return {
      newInquiries: inqRows[0]?.count ?? 0,
      pendingTestimonials: testRows[0]?.count ?? 0,
    };
  } catch {
    return { newInquiries: 0, pendingTestimonials: 0 };
  }
}
