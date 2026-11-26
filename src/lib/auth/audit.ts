import { getDb } from "@/db";
import { adminActivityLogs } from "@/db/schema";

if (typeof window !== "undefined") {
  throw new Error("auth/audit is server-only");
}

export async function logAdminActivity({
  adminUserId,
  action,
  entityType,
  entityId,
  details = null,
  ipAddress = null,
}: {
  adminUserId: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(adminActivityLogs).values({
      admin_user_id: adminUserId,
      action,
      entity_type: entityType,
      entity_id: entityId !== undefined && entityId !== null ? String(entityId) : null,
      details,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.warn("Failed to write admin activity log:", err);
  }
}
