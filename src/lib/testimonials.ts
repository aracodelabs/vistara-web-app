import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { services, testimonials } from "@/db/schema";
import type {
  PaginatedTestimonialsResult,
  ReviewSummaryStats,
} from "./testimonials-types";

export {
  TESTIMONIAL_FILTER_SLUGS,
  type ApprovedTestimonial,
  type PaginatedTestimonialsResult,
  type ReviewSummaryStats,
  type TestimonialFilterSlug,
} from "./testimonials-types";

export async function getApprovedTestimonials({
  serviceSlug = "all",
  page = 1,
  pageSize = 9,
}: {
  serviceSlug?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedTestimonialsResult> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(24, Math.max(1, Math.floor(pageSize)));

  if (!process.env.DATABASE_URL) {
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: safePageSize,
      totalPages: 1,
    };
  }

  try {
    const db = getDb();
    const offset = (safePage - 1) * safePageSize;

    const filterSlug =
      serviceSlug && serviceSlug !== "all" ? serviceSlug.trim() : null;

    const whereCondition = filterSlug
      ? and(eq(testimonials.is_approved, true), eq(services.slug, filterSlug))
      : eq(testimonials.is_approved, true);

    const [countRows, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(testimonials)
        .leftJoin(services, eq(testimonials.service_id, services.id))
        .where(whereCondition),
      db
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
          createdAt: testimonials.created_at,
        })
        .from(testimonials)
        .leftJoin(services, eq(testimonials.service_id, services.id))
        .where(whereCondition)
        .orderBy(desc(testimonials.created_at), desc(testimonials.id))
        .limit(safePageSize)
        .offset(offset),
    ]);

    const totalCount = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));

    return {
      items: rows.map((row) => ({
        ...row,
        language: row.language === "ar" ? "ar" : "en",
        createdAt: row.createdAt.toISOString(),
      })),
      totalCount,
      page: Math.min(safePage, totalPages),
      pageSize: safePageSize,
      totalPages,
    };
  } catch (error) {
    console.warn(
      "Returning empty testimonials list due to database read error:",
      error
    );
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: safePageSize,
      totalPages: 1,
    };
  }
}

export async function getApprovedReviewSummary(): Promise<ReviewSummaryStats> {
  const emptyDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (!process.env.DATABASE_URL) {
    return {
      totalApproved: 0,
      averageRating: null,
      distribution: emptyDistribution,
    };
  }

  try {
    const db = getDb();

    const grouped = await db
      .select({
        rating: testimonials.rating,
        count: sql<number>`count(*)::int`,
      })
      .from(testimonials)
      .where(eq(testimonials.is_approved, true))
      .groupBy(testimonials.rating);

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let totalApproved = 0;
    let ratingSum = 0;

    for (const row of grouped) {
      if (row.rating >= 1 && row.rating <= 5) {
        const star = row.rating as 1 | 2 | 3 | 4 | 5;
        distribution[star] = row.count;
        totalApproved += row.count;
        ratingSum += star * row.count;
      }
    }

    const averageRating =
      totalApproved > 0
        ? Math.round((ratingSum / totalApproved) * 10) / 10
        : null;

    return {
      totalApproved,
      averageRating,
      distribution,
    };
  } catch (error) {
    console.warn(
      "Returning empty review summary due to database read error:",
      error
    );
    return {
      totalApproved: 0,
      averageRating: null,
      distribution: emptyDistribution,
    };
  }
}
