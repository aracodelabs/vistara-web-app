import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { services, testimonials } from "@/db/schema";
import { createTestimonialSchema } from "@/lib/validation";
import {
  getApprovedReviewSummary,
  getApprovedTestimonials,
} from "@/lib/testimonials";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const DUPLICATE_COOLDOWN_MS = 5 * 60 * 1000;
const URL_PATTERN = /(https?:\/\/|www\.)/i;

const ipSubmissions = new Map<string, number[]>();
const recentFingerprints = new Map<string, number>();

function isRateLimited(ip: string, fingerprint: string): boolean {
  const now = Date.now();

  const lastDuplicate = recentFingerprints.get(fingerprint);
  if (lastDuplicate && now - lastDuplicate < DUPLICATE_COOLDOWN_MS) {
    return true;
  }

  const timestamps = (ipSubmissions.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    ipSubmissions.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);
  recentFingerprints.set(fingerprint, now);

  if (recentFingerprints.size > 500) {
    for (const [key, time] of recentFingerprints.entries()) {
      if (now - time > DUPLICATE_COOLDOWN_MS) {
        recentFingerprints.delete(key);
      }
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get("service") || "all";
    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const parsedPageSize = Number.parseInt(
      searchParams.get("pageSize") || "9",
      10
    );

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const pageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? Math.min(24, parsedPageSize)
        : 9;

    const [paginated, summary] = await Promise.all([
      getApprovedTestimonials({ serviceSlug, page, pageSize }),
      getApprovedReviewSummary(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        ...paginated,
        summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching approved testimonials:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load customer reviews." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = createTestimonialSchema();
    const parsed = schema.safeParse(body);

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

    const data = parsed.data;

    // Honeypot spam protection
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json(
        { ok: true, id: 0, status: "pending_moderation" },
        { status: 200 }
      );
    }

    // Reject URLs in review text
    if (URL_PATTERN.test(data.review)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Links are not permitted in customer reviews.",
          code: "LINKS_NOT_ALLOWED",
        },
        { status: 400 }
      );
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const normalizedName = data.customerName.trim().toLowerCase();
    const reviewPrefix = data.review.trim().toLowerCase().slice(0, 60);
    const fingerprint = `${clientIp}:${normalizedName}:${data.serviceSlug}:${reviewPrefix}`;

    if (isRateLimited(clientIp, fingerprint)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Too many reviews submitted recently. Please try again later.",
        },
        { status: 429 }
      );
    }

    const db = getDb();

    const matchedServices = await db
      .select({ id: services.id })
      .from(services)
      .where(
        and(eq(services.slug, data.serviceSlug), eq(services.is_active, true))
      )
      .limit(1);

    const matchedService = matchedServices[0];
    if (!matchedService) {
      return NextResponse.json(
        {
          ok: false,
          error: "Selected cleaning service was not found.",
        },
        { status: 400 }
      );
    }

    // Force is_approved = false and is_verified = false server-side
    const [created] = await db
      .insert(testimonials)
      .values({
        customer_name: data.customerName,
        location: data.location || null,
        service_id: matchedService.id,
        rating: data.rating,
        review: data.review,
        language: data.language,
        is_verified: false,
        is_approved: false,
      })
      .returning({ id: testimonials.id });

    return NextResponse.json(
      {
        ok: true,
        id: created.id,
        status: "pending_moderation",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting testimonial:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to submit your review right now.",
      },
      { status: 500 }
    );
  }
}
