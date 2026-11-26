import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { MediaLibraryManager } from "@/components/admin/media/MediaLibraryManager";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const user = await requireAdminSession("media:read");
  const counts = await getAdminNotificationCounts();

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <MediaLibraryManager
        canWrite={hasPermission(user.role, "media:write")}
        canDelete={hasPermission(user.role, "media:delete")}
      />
    </AdminShell>
  );
}
