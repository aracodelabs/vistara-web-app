import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { InquiriesManager } from "@/components/admin/inquiries/InquiriesManager";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdminSession("inquiries:read");
  const [counts, params] = await Promise.all([
    getAdminNotificationCounts(),
    searchParams,
  ]);

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <InquiriesManager
        canWrite={hasPermission(user.role, "inquiries:write")}
        canDelete={hasPermission(user.role, "inquiries:delete")}
        initialStatus={params?.status || "all"}
      />
    </AdminShell>
  );
}
