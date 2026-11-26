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

  let hasAdmin = false;
  let dbError: string | null = null;
  try {
    hasAdmin = await hasAnyAdminUser();
  } catch (err) {
    console.error("Admin login DB check error:", err);
    dbError =
      "Database connection is not configured or unreachable on this server. Add DATABASE_URL in Vercel Project Settings and redeploy.";
  }

  const params = await searchParams;

  return (
    <AdminLoginForm
      needsSetup={!dbError && !hasAdmin}
      resetSuccess={params?.reset === "success"}
      dbError={dbError}
    />
  );
}
