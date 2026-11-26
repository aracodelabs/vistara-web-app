import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { ForgotPasswordForm } from "@/components/admin/authentication/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminForgotPasswordPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return <ForgotPasswordForm />;
}
