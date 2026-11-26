import React from "react";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { DashboardClient } from "@/components/admin/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdminSession("dashboard:view");
  const counts = await getAdminNotificationCounts();

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <DashboardClient userRole={user.role} />
    </AdminShell>
  );
}
