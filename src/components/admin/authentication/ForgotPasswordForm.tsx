"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
} from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(
          data.error || "Unable to send reset request right now."
        );
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setErrorMsg("Network error while sending reset link. Please try again.");
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
            <KeyRound className="h-3.5 w-3.5" />
            Password Recovery
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#013220]">
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-sm text-[#1B1F1C]/65">
            Enter your administrator email address and we will send a secure,
            single-use reset link valid for 30 minutes.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[#014421]/20 bg-[#E8F0E8]/60 p-4 text-sm text-[#013220]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#014421]" />
                <div>
                  <p className="font-semibold">Check your email inbox</p>
                  <p className="mt-1 leading-relaxed text-[#013220]/80">
                    If an active administrator account is registered with that
                    email address, a password reset link has been sent. The link
                    expires in 30 minutes.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/admin/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#014421] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013220]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold uppercase tracking-wide text-[#013220]/80"
              >
                Administrator Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
                <input
                  id="forgot-email"
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

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#014421] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#013220] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Reset Link
            </button>

            <div className="pt-1 text-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#014421] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
