import React from "react";
import { hasPermission, requireAdminSession } from "@/lib/admin-auth";
import { getAdminNotificationCounts } from "@/lib/admin-shell-data";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { TestimonialsManager } from "@/components/admin/testimonials/TestimonialsManager";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdminSession("testimonials:read");
  const [counts, params] = await Promise.all([
    getAdminNotificationCounts(),
    searchParams,
  ]);

  return (
    <AdminShell user={user} pendingNotifications={counts}>
      <TestimonialsManager
        canModerate={hasPermission(user.role, "testimonials:moderate")}
        canDelete={hasPermission(user.role, "testimonials:delete")}
        initialStatus={params?.status || "all"}
      />
    </AdminShell>
  );
}
