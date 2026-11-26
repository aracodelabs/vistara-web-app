import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { inquiries, services, testimonials } from "@/db/schema";
import { requireAdminApiSession } from "@/lib/admin-auth";
import { getApprovedReviewSummary } from "@/lib/testimonials";

export async function GET() {
  const auth = await requireAdminApiSession("dashboard:view");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const db = getDb();

    const [
      statusCounts,
      monthlyCounts,
      topServices,
      distinctCustomersRow,
      pendingCountRow,
      activeServicesRow,
      recentInquiries,
      pendingTestimonials,
      recentServices,
      reviewSummary,
    ] = await Promise.all([
      db
        .select({
          status: inquiries.status,
          count: sql<number>`count(*)::int`,
        })
        .from(inquiries)
        .groupBy(inquiries.status),
      db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${inquiries.created_at}), 'YYYY-MM')`,
          count: sql<number>`count(*)::int`,
        })
        .from(inquiries)
        .groupBy(sql`date_trunc('month', ${inquiries.created_at})`)
        .orderBy(sql`date_trunc('month', ${inquiries.created_at}) ASC`)
        .limit(6),
      db
        .select({
          serviceTitle: services.title_en,
          count: sql<number>`count(*)::int`,
        })
        .from(inquiries)
        .leftJoin(services, eq(inquiries.service_id, services.id))
        .groupBy(services.title_en)
        .orderBy(sql`count(*) DESC`)
        .limit(5),
      db
        .select({
          count: sql<number>`count(DISTINCT ${inquiries.phone_number})::int`,
        })
        .from(inquiries),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(testimonials)
        .where(eq(testimonials.is_approved, false)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(services)
        .where(eq(services.is_active, true)),
      db
        .select({
          id: inquiries.id,
          customer_name: inquiries.customer_name,
          phone_number: inquiries.phone_number,
          area: inquiries.area,
          status: inquiries.status,
          service_title_en: services.title_en,
          created_at: inquiries.created_at,
        })
        .from(inquiries)
        .leftJoin(services, eq(inquiries.service_id, services.id))
        .orderBy(desc(inquiries.created_at), desc(inquiries.id))
        .limit(5),
      db
        .select({
          id: testimonials.id,
          customer_name: testimonials.customer_name,
          rating: testimonials.rating,
          review: testimonials.review,
          service_title_en: services.title_en,
          created_at: testimonials.created_at,
        })
        .from(testimonials)
        .leftJoin(services, eq(testimonials.service_id, services.id))
        .where(eq(testimonials.is_approved, false))
        .orderBy(desc(testimonials.created_at))
        .limit(5),
      db
        .select({
          id: services.id,
          title_en: services.title_en,
          slug: services.slug,
          category: services.category,
          is_active: services.is_active,
          image_generation_status: services.image_generation_status,
          updated_at: services.updated_at,
        })
        .from(services)
        .orderBy(desc(services.updated_at))
        .limit(5),
      getApprovedReviewSummary(),
    ]);

    const statusMap: Record<string, number> = {
      New: 0,
      Contacted: 0,
      "Quotation Sent": 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    };
    let totalInquiries = 0;
    for (const row of statusCounts) {
      statusMap[row.status] = row.count;
      totalInquiries += row.count;
    }

    return NextResponse.json(
      {
        ok: true,
        stats: {
          totalInquiries,
          newInquiries: statusMap.New,
          contactedInquiries: statusMap.Contacted,
          confirmedInquiries: statusMap.Confirmed,
          completedInquiries: statusMap.Completed,
          distinctCustomers: distinctCustomersRow[0]?.count ?? 0,
          pendingTestimonials: pendingCountRow[0]?.count ?? 0,
          publishedTestimonials: reviewSummary.totalApproved,
          averageRating: reviewSummary.averageRating,
          activeServices: activeServicesRow[0]?.count ?? 0,
        },
        charts: {
          statusDistribution: statusMap,
          monthlyComparison: monthlyCounts,
          topServices: topServices.map((t) => ({
            name: t.serviceTitle || "General",
            count: t.count,
          })),
        },
        widgets: {
          recentInquiries,
          pendingTestimonials,
          recentServices,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load dashboard data." },
      { status: 500 }
    );
  }
}
