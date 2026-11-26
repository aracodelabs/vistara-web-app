import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { CategoriesManager } from "@/components/admin/categories/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const user = await requireAdminSession("categories:read");
  const counts = await getAdminNotificationCounts();

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <CategoriesManager
        canWrite={hasPermission(user.role, "categories:write")}
      />
    </AdminShell>
  );
}
