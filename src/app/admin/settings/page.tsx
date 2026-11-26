import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { SettingsManager } from "@/components/admin/settings/SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireAdminSession("settings:read");
  const counts = await getAdminNotificationCounts();

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <SettingsManager
        canWrite={hasPermission(user.role, "settings:write")}
      />
    </AdminShell>
  );
}
