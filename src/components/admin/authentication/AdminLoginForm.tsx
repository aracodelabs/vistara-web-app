"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";

export function AdminLoginForm({
  needsSetup,
  resetSuccess = false,
  dbError = null,
}: {
  needsSetup: boolean;
  resetSuccess?: boolean;
  dbError?: string | null;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const endpoint = needsSetup
        ? "/api/admin/auth/setup"
        : "/api/admin/auth/login";
      const payload = needsSetup
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrorMsg(
          data.error || "Authentication failed. Please check your details."
        );
        setSubmitting(false);
        return;
      }

      toast.success(
        needsSetup
          ? "Super Admin account created. Welcome to Vistara Admin!"
          : "Signed in successfully."
      );
      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMsg("Network error while signing in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8F4] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#013220]/10 bg-white p-7 shadow-xl sm:p-9">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#013220]/10 bg-[#F7F8F4] p-2.5 shadow-xs">
            <Image
              src="/images/vistara-logo.png"
              alt="Vistara Qatar"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#E8F0E8] px-3 py-1 text-xs font-semibold text-[#014421]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {needsSetup ? "Initial Super Admin Setup" : "Vistara Admin Portal"}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#013220]">
            {needsSetup ? "Create Primary Administrator" : "Administrator Sign In"}
          </h1>
          <p className="mt-1.5 text-sm text-[#1B1F1C]/65">
            {needsSetup
              ? "No administrator accounts exist yet. Set up your initial Super Admin account to secure the portal."
              : "Sign in to manage inquiries, testimonials, services, and website content."}
          </p>
        </div>

        {resetSuccess && !needsSetup && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#014421]/20 bg-[#E8F0E8]/70 p-3.5 text-sm text-[#013220]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#014421]" />
            <span>
              Your password has been updated and previous sessions were revoked.
              Sign in with your new password.
            </span>
          </div>
        )}

        {dbError && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
            {dbError}
          </div>
        )}

        {errorMsg && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {needsSetup && (
            <div>
              <label
                htmlFor="admin-name"
                className="block text-xs font-semibold uppercase tracking-wide text-[#013220]/80"
              >
                Full Name
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
                <input
                  id="admin-name"
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vistara Operations Lead"
                  className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2.5 pl-10 pr-4 text-sm text-[#1B1F1C] outline-none transition focus:border-[#014421] focus:bg-white focus:ring-2 focus:ring-[#014421]/15"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold uppercase tracking-wide text-[#013220]/80"
            >
              Work Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vistaraqatar.com"
                className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2.5 pl-10 pr-4 text-sm text-[#1B1F1C] outline-none transition focus:border-[#014421] focus:bg-white focus:ring-2 focus:ring-[#014421]/15"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wide text-[#013220]/80"
              >
                Password
              </label>
              {!needsSetup && (
                <Link
                  href="/admin/forgot-password"
                  className="text-xs font-medium text-[#014421] hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={needsSetup ? 10 : 1}
                autoComplete={needsSetup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  needsSetup
                    ? "Minimum 10 characters with mixed case & numbers"
                    : "Enter your password"
                }
                className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2.5 pl-10 pr-10 text-sm text-[#1B1F1C] outline-none transition focus:border-[#014421] focus:bg-white focus:ring-2 focus:ring-[#014421]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#1B1F1C]/45 hover:text-[#013220]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#014421] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#013220] disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {needsSetup ? "Create Super Admin & Continue" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-[#013220]/10 pt-4 text-center text-xs text-[#1B1F1C]/55">
          Protected administration portal. Unauthorized access is logged.{" "}
          <Link href="/en" className="font-medium text-[#014421] hover:underline">
            Return to Vistara Website
          </Link>
        </div>
      </div>
    </div>
  );
}
