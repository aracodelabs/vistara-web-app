import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  serviceCategories,
  services,
  type ServiceCategory,
  type ServiceRecord,
} from "@/db/schema";

export const getActiveCategories = cache(async (): Promise<ServiceCategory[]> => {
  const db = getDb();
  return db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.is_active, true))
    .orderBy(asc(serviceCategories.id));
});

export const getActiveServices = cache(async (): Promise<ServiceRecord[]> => {
  const db = getDb();
  return db
    .select()
    .from(services)
    .where(eq(services.is_active, true))
    .orderBy(asc(services.sort_order), asc(services.id));
});

export const getServiceBySlug = cache(
  async (slug: string): Promise<ServiceRecord | null> => {
    const db = getDb();
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.slug, slug))
      .limit(1);
    const service = rows[0];
    if (!service || !service.is_active) return null;
    return service;
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
