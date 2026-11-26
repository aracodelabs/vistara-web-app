import React from "react";
import { ResetPasswordForm } from "@/components/admin/authentication/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token?.trim() || "";

  return <ResetPasswordForm token={token} />;
}
