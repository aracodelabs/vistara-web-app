import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { CATEGORIES_SEED, SERVICES_SEED } from "../data/services-catalog";
import { getDb } from "./index";
import { serviceCategories, services } from "./schema";

export async function seedDatabase() {
  const db = getDb();

  const categoryIdBySlug = new Map<string, number>();

  for (const cat of CATEGORIES_SEED) {
    const existing = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(serviceCategories)
        .set({
          name_en: cat.name_en,
          name_ar: cat.name_ar,
          description_en: cat.description_en,
          description_ar: cat.description_ar,
          is_active: cat.is_active,
        })
        .where(eq(serviceCategories.id, existing[0].id));
      categoryIdBySlug.set(cat.slug, existing[0].id);
    } else {
      const [inserted] = await db
        .insert(serviceCategories)
        .values(cat)
        .returning({ id: serviceCategories.id });
      categoryIdBySlug.set(cat.slug, inserted.id);
    }
  }

  for (const svc of SERVICES_SEED) {
    const categoryId = categoryIdBySlug.get(svc.category) ?? null;
    const existing = await db
      .select()
      .from(services)
      .where(eq(services.slug, svc.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(services)
        .set({
          category: svc.category,
          category_id: categoryId,
          title_en: svc.title_en,
          title_ar: svc.title_ar,
          description_en: svc.description_en,
          description_ar: svc.description_ar,
          image: svc.image,
          sort_order: svc.sort_order,
          is_active: true,
          updated_at: new Date(),
        })
        .where(eq(services.id, existing[0].id));
    } else {
      await db.insert(services).values({
        ...svc,
        category_id: categoryId,
        is_active: true,
      });
    }
  }

  console.log(
    `Seeded ${CATEGORIES_SEED.length} categories and ${SERVICES_SEED.length} services into Neon PostgreSQL.`
  );
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to seed database:", err);
      process.exit(1);
    });
}
