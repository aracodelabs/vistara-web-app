import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ServicesManager } from "@/components/admin/services/ServicesManager";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const user = await requireAdminSession("services:read");
  const counts = await getAdminNotificationCounts();

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <ServicesManager canWrite={hasPermission(user.role, "services:write")} />
    </AdminShell>
  );
}
