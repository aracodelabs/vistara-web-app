"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) {
    return { score: 0, label: "Enter a strong password", color: "bg-slate-200" };
  }
  let score = 0;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score: 1, label: "Weak — use 10+ chars, mixed case & numbers", color: "bg-red-500" };
  }
  if (score === 2) {
    return { score: 2, label: "Fair — add symbols or numbers", color: "bg-amber-500" };
  }
  if (score === 3) {
    return { score: 3, label: "Good password", color: "bg-[#6BAE00]" };
  }
  return { score: 4, label: "Strong password", color: "bg-[#014421]" };
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const toast = useAdminToast();
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    let active = true;
    async function verifyToken() {
      if (!token) {
        if (active) {
          setTokenValid(false);
          setTokenError("Missing password reset token.");
          setValidating(false);
        }
        return;
      }

      try {
        const res = await fetch(
          `/api/admin/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(
            data.error || "This password reset link is invalid or has expired."
          );
        }
      } catch {
        if (active) {
          setTokenValid(false);
          setTokenError("Unable to verify reset token right now.");
        }
      } finally {
        if (active) {
          setValidating(false);
        }
      }
    }
    verifyToken();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < 10) {
      setFormError("Password must be at least 10 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setFormError(
          data.error || "Unable to update password. Please request a new link."
        );
        setSubmitting(false);
        return;
      }

      toast.success("Password updated successfully.");
      router.replace("/admin/login?reset=success");
    } catch {
      setFormError("Network error while updating password.");
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
            Set New Password
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#013220]">
            Reset Administrator Password
          </h1>
          <p className="mt-1.5 text-sm text-[#1B1F1C]/65">
            Choose a strong password for your Vistara Admin account. All
            existing sessions will be signed out.
          </p>
        </div>

        {validating ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 py-6 text-sm text-[#1B1F1C]/65">
            <Loader2 className="h-6 w-6 animate-spin text-[#014421]" />
            <span>Verifying reset link...</span>
          </div>
        ) : !tokenValid ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold">Reset link unavailable</p>
                <p className="mt-1 text-red-800">{tokenError}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/forgot-password"
                className="flex w-full items-center justify-center rounded-xl bg-[#014421] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013220]"
              >
                Request a New Reset Link
              </Link>
              <Link
                href="/admin/login"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#013220]/15 px-4 py-2.5 text-sm font-medium text-[#013220] hover:bg-[#F7F8F4]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                {formError}
              </div>
            )}

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold uppercase tracking-wide text-[#013220]/80"
              >
                New Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 10 characters"
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

              {/* Strength meter */}
              <div className="mt-2 space-y-1.5">
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-colors ${
                        strength.score >= step ? strength.color : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#1B1F1C]/65">{strength.label}</p>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold uppercase tracking-wide text-[#013220]/80"
              >
                Confirm New Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2.5 pl-10 pr-10 text-sm text-[#1B1F1C] outline-none transition focus:border-[#014421] focus:bg-white focus:ring-2 focus:ring-[#014421]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#1B1F1C]/45 hover:text-[#013220]"
                  aria-label={
                    showConfirm ? "Hide confirmation" : "Show confirmation"
                  }
                >
                  {showConfirm ? (
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
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
