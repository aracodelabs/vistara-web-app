import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { inquiries, services } from "@/db/schema";
import { createInquirySchema } from "@/lib/validation";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const DUPLICATE_COOLDOWN_MS = 60 * 1000;

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
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = createInquirySchema();
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
      return NextResponse.json({ ok: true, id: 0 }, { status: 200 });
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const normalizedPhone = data.phoneNumber.replace(/\D/g, "");
    const fingerprint = `${clientIp}:${normalizedPhone}:${data.serviceSlug}`;

    if (isRateLimited(clientIp, fingerprint)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Too many requests submitted recently. Please wait a moment or reach out directly via WhatsApp.",
        },
        { status: 429 }
      );
    }

    const db = getDb();

    const matchedServices = await db
      .select({
        id: services.id,
        title_en: services.title_en,
        title_ar: services.title_ar,
      })
      .from(services)
      .where(eq(services.slug, data.serviceSlug))
      .limit(1);

    const matchedService = matchedServices[0] ?? null;

    const [created] = await db
      .insert(inquiries)
      .values({
        customer_name: data.customerName,
        phone_number: data.phoneNumber,
        email: data.email || null,
        service_id: matchedService?.id ?? null,
        property_type: data.propertyType,
        area: data.area,
        preferred_date: data.preferredDate || null,
        preferred_time: data.preferredTime || null,
        message: data.message || null,
        language: data.language,
        status: "New",
      })
      .returning({ id: inquiries.id });

    return NextResponse.json(
      {
        ok: true,
        id: created.id,
        serviceTitle: matchedService
          ? data.language === "ar"
            ? matchedService.title_ar
            : matchedService.title_en
          : data.serviceSlug,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to process your inquiry right now.",
      },
      { status: 500 }
    );
  }
}
