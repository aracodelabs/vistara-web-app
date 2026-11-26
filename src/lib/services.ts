import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  serviceCategories,
  services,
  type ServiceCategory,
  type ServiceRecord,
} from "@/db/schema";
import {
  getFallbackCategories,
  getFallbackServices,
} from "@/data/services-catalog";

export const getActiveCategories = cache(async (): Promise<ServiceCategory[]> => {
  if (!process.env.DATABASE_URL) {
    return getFallbackCategories();
  }

  try {
    const db = getDb();
    return await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.is_active, true))
      .orderBy(asc(serviceCategories.id));
  } catch (error) {
    console.warn(
      "Falling back to static service categories due to database read error:",
      error
    );
    return getFallbackCategories();
  }
});

export const getActiveServices = cache(async (): Promise<ServiceRecord[]> => {
  if (!process.env.DATABASE_URL) {
    return getFallbackServices();
  }

  try {
    const db = getDb();
    return await db
      .select()
      .from(services)
      .where(eq(services.is_active, true))
      .orderBy(asc(services.sort_order), asc(services.id));
  } catch (error) {
    console.warn(
      "Falling back to static services catalog due to database read error:",
      error
    );
    return getFallbackServices();
  }
});

export const getServiceBySlug = cache(
  async (slug: string): Promise<ServiceRecord | null> => {
    if (!process.env.DATABASE_URL) {
      return getFallbackServices().find((svc) => svc.slug === slug) ?? null;
    }

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(services)
        .where(eq(services.slug, slug))
        .limit(1);
      const service = rows[0];
      if (!service || !service.is_active) return null;
      return service;
    } catch (error) {
      console.warn(
        `Falling back to static service lookup for "${slug}" due to database read error:`,
        error
      );
      return getFallbackServices().find((svc) => svc.slug === slug) ?? null;
    }
  }
);

export function getLocalizedServiceTitle(
  service: Pick<ServiceRecord, "title_en" | "title_ar">,
  locale: "en" | "ar"
): string {
  return locale === "ar" ? service.title_ar : service.title_en;
}

export function getLocalizedServiceDescription(
  service: Pick<ServiceRecord, "description_en" | "description_ar">,
  locale: "en" | "ar"
): string {
  return locale === "ar" ? service.description_ar : service.description_en;
}
