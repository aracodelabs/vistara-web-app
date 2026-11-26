import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession, hasAnyAdminUser } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/authentication/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  const [hasAdmin, params] = await Promise.all([
    hasAnyAdminUser(),
    searchParams,
  ]);

  return (
    <AdminLoginForm
      needsSetup={!hasAdmin}
      resetSuccess={params?.reset === "success"}
    />
  );
}
