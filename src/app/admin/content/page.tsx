import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ContentManager } from "@/components/admin/content/ContentManager";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const user = await requireAdminSession("content:read");
  const counts = await getAdminNotificationCounts();

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <ContentManager canWrite={hasPermission(user.role, "content:write")} />
    </AdminShell>
  );
}
