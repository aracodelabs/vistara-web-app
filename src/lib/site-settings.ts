import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { websiteSettings } from "@/db/schema";
import {
  DEFAULT_NAVIGATION_VISIBILITY,
  normalizeNavigationVisibility,
  type NavigationVisibility,
} from "./navigation-visibility";

if (typeof window !== "undefined") {
  throw new Error("site-settings is server-only");
}

export async function getNavigationVisibility(): Promise<NavigationVisibility> {
  try {
    const db = getDb();
    const [row] = await db
      .select({
        navigation_visibility: websiteSettings.navigation_visibility,
      })
      .from(websiteSettings)
      .where(eq(websiteSettings.key, "primary"))
      .limit(1);

    return normalizeNavigationVisibility(row?.navigation_visibility);
  } catch {
    return { ...DEFAULT_NAVIGATION_VISIBILITY };
  }
}
