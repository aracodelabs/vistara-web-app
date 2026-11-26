import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { SeoManager } from "@/components/admin/seo/SeoManager";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const user = await requireAdminSession("seo:read");
  const counts = await getAdminNotificationCounts();

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <SeoManager canWrite={hasPermission(user.role, "seo:write")} />
    </AdminShell>
  );
}
