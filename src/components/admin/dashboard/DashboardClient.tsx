"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  FolderKanban,
  Inbox,
  MessageSquareQuote,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  AdminCardsSkeleton,
  AdminTableSkeleton,
} from "@/components/admin/shared/AdminSkeleton";
import { hasPermission, type AdminRole } from "@/lib/auth/permissions";

interface DashboardData {
  stats: {
    totalInquiries: number;
    newInquiries: number;
    contactedInquiries: number;
    confirmedInquiries: number;
    completedInquiries: number;
    distinctCustomers: number;
    pendingTestimonials: number;
    publishedTestimonials: number;
    averageRating: number;
    activeServices: number;
  };
  charts: {
    statusDistribution: Record<string, number>;
    monthlyComparison: Array<{ month: string; count: number }>;
    topServices: Array<{ name: string; count: number }>;
  };
  widgets: {
    recentInquiries: Array<{
      id: number;
      customer_name: string;
      phone_number: string;
      area: string | null;
      status: string;
      service_title_en: string | null;
      created_at: string;
    }>;
    pendingTestimonials: Array<{
      id: number;
      customer_name: string;
      rating: number;
      review: string;
      service_title_en: string | null;
      created_at: string;
    }>;
    recentServices: Array<{
      id: number;
      title_en: string;
      slug: string;
      category: string;
      is_active: boolean;
      image_generation_status: string;
      updated_at: string;
    }>;
  };
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-[#6BAE00] text-[#013220]",
  Contacted: "bg-sky-100 text-sky-900",
  "Quotation Sent": "bg-amber-100 text-amber-900",
  Confirmed: "bg-[#014421] text-white",
  Completed: "bg-[#E8F0E8] text-[#013220]",
  Cancelled: "bg-slate-200 text-slate-700",
};

const BAR_COLORS: Record<string, string> = {
  New: "bg-[#6BAE00]",
  Contacted: "bg-sky-500",
  "Quotation Sent": "bg-amber-500",
  Confirmed: "bg-[#014421]",
  Completed: "bg-[#355E3B]",
  Cancelled: "bg-slate-400",
};

export function DashboardClient({ userRole }: { userRole: AdminRole }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || "Unable to load dashboard metrics.");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error while loading dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        json: await res.json().catch(() => ({})),
      }))
      .then(({ ok, json }) => {
        if (!active) return;
        if (!ok || !json.ok) {
          setError(json.error || "Unable to load dashboard metrics.");
        } else {
          setData(json);
        }
      })
      .catch(() => {
        if (active) setError("Network error while loading dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <AdminCardsSkeleton count={4} />
        <AdminTableSkeleton rows={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
        <p className="font-semibold">Dashboard unavailable</p>
        <p className="mt-1">{error || "No data returned."}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-xs font-semibold text-white hover:bg-[#013220]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const { stats, charts, widgets } = data;
  const maxMonthly = Math.max(
    1,
    ...charts.monthlyComparison.map((m) => m.count)
  );
  const maxService = Math.max(1, ...charts.topServices.map((s) => s.count));
  const totalStatus = Math.max(
    1,
    Object.values(charts.statusDistribution).reduce((a, b) => a + b, 0)
  );

  const kpis = [
    {
      label: "Total Inquiries",
      value: stats.totalInquiries,
      sub: `${stats.contactedInquiries} contacted`,
      icon: Inbox,
      accent: "bg-[#E8F0E8] text-[#014421]",
    },
    {
      label: "New Inquiries",
      value: stats.newInquiries,
      sub: "Awaiting first response",
      icon: TrendingUp,
      accent: "bg-[#6BAE00]/20 text-[#013220]",
    },
    {
      label: "Confirmed Bookings",
      value: stats.confirmedInquiries,
      sub: `${stats.completedInquiries} completed`,
      icon: CalendarCheck2,
      accent: "bg-[#014421]/10 text-[#014421]",
    },
    {
      label: "Distinct Customers",
      value: stats.distinctCustomers,
      sub: "Unique inquiry phone numbers",
      icon: Users,
      accent: "bg-[#E8F0E8] text-[#355E3B]",
    },
    {
      label: "Published Testimonials",
      value: stats.publishedTestimonials,
      sub: `${stats.pendingTestimonials} pending moderation`,
      icon: MessageSquareQuote,
      accent: "bg-amber-50 text-amber-800",
    },
    {
      label: "Average Rating",
      value:
        stats.publishedTestimonials > 0
          ? `${stats.averageRating.toFixed(1)} / 5`
          : "—",
      sub:
        stats.publishedTestimonials > 0
          ? `Across ${stats.publishedTestimonials} approved review(s)`
          : "No published reviews yet",
      icon: Star,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#013220]">
            Operations Overview
          </h2>
          <p className="text-xs text-[#1B1F1C]/60">
            Live data sourced directly from Neon PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission(userRole, "inquiries:read") && (
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#014421] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#013220]"
            >
              <Inbox className="h-3.5 w-3.5" />
              Manage Inquiries
            </Link>
          )}
          {hasPermission(userRole, "testimonials:read") && (
            <Link
              href="/admin/testimonials?status=pending"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#013220]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
            >
              <MessageSquareQuote className="h-3.5 w-3.5" />
              Moderate Reviews
            </Link>
          )}
          {hasPermission(userRole, "services:write") && (
            <Link
              href="/admin/services"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#013220]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Services ({stats.activeServices} active)
            </Link>
          )}
          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#013220]/15 bg-white px-3 py-2 text-xs font-medium text-[#1B1F1C]/75 hover:bg-[#F7F8F4]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs transition hover:border-[#014421]/25"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1B1F1C]/55">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-[#013220]">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-xs text-[#1B1F1C]/60">{kpi.sub}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Monthly Inquiry Comparison */}
        <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#013220]">
            Monthly Inquiry Trends
          </h3>
          <p className="text-xs text-[#1B1F1C]/55">
            Inquiries submitted over recent months
          </p>

          {charts.monthlyComparison.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-center text-xs text-[#1B1F1C]/50">
              No inquiries recorded yet.
            </div>
          ) : (
            <div className="mt-6 flex h-44 items-end gap-3">
              {charts.monthlyComparison.map((item) => {
                const heightPct = Math.max(
                  10,
                  Math.round((item.count / maxMonthly) * 100)
                );
                return (
                  <div
                    key={item.month}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-xs font-semibold text-[#013220]">
                      {item.count}
                    </span>
                    <div className="flex h-28 w-full items-end rounded-lg bg-[#F7F8F4] p-1">
                      <div
                        className="w-full rounded-md bg-[#014421] transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-[#1B1F1C]/60">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#013220]">
            Inquiry Status Distribution
          </h3>
          <p className="text-xs text-[#1B1F1C]/55">
            Breakdown across booking lifecycle stages
          </p>

          {stats.totalInquiries === 0 ? (
            <div className="flex h-44 items-center justify-center text-center text-xs text-[#1B1F1C]/50">
              No inquiry statuses to display yet.
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {Object.entries(charts.statusDistribution).map(
                ([status, count]) => {
                  const pct = Math.round((count / totalStatus) * 100);
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#1B1F1C]">
                          {status}
                        </span>
                        <span className="font-semibold text-[#013220]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#F7F8F4]">
                        <div
                          className={`h-full rounded-full ${
                            BAR_COLORS[status] || "bg-[#014421]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Most Requested Services */}
        <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#013220]">
            Most Requested Services
          </h3>
          <p className="text-xs text-[#1B1F1C]/55">
            Top services linked to customer quote requests
          </p>

          {charts.topServices.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-center text-xs text-[#1B1F1C]/50">
              No service request analytics available yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {charts.topServices.map((svc) => {
                const pct = Math.max(
                  8,
                  Math.round((svc.count / maxService) * 100)
                );
                return (
                  <div key={svc.name} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-[#1B1F1C]">
                        {svc.name}
                      </span>
                      <span className="shrink-0 font-semibold text-[#014421]">
                        {svc.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F7F8F4]">
                      <div
                        className="h-full rounded-full bg-[#355E3B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Widgets Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Inquiries */}
        <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#013220]">
              Recent Inquiries
            </h3>
            {hasPermission(userRole, "inquiries:read") && (
              <Link
                href="/admin/inquiries"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#014421] hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {widgets.recentInquiries.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#1B1F1C]/50">
              No inquiries have been submitted yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#013220]/10">
              {widgets.recentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1B1F1C]">
                      {inq.customer_name}
                    </p>
                    <p className="truncate text-xs text-[#1B1F1C]/60">
                      {inq.service_title_en || "General Inquiry"}
                      {inq.area ? ` • ${inq.area}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      STATUS_COLORS[inq.status] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Testimonials */}
        <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#013220]">
              Pending Testimonials
            </h3>
            {hasPermission(userRole, "testimonials:read") && (
              <Link
                href="/admin/testimonials?status=pending"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#014421] hover:underline"
              >
                Review queue <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {widgets.pendingTestimonials.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#1B1F1C]/50">
              No pending testimonials waiting for approval.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#013220]/10">
              {widgets.pendingTestimonials.map((item) => (
                <div
                  key={item.id}
                  className="space-y-1 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[#1B1F1C]">
                      {item.customer_name}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-[#1B1F1C]/65">
                    {item.review}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Updated Services */}
        <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#013220]">
              Recently Updated Services
            </h3>
            {hasPermission(userRole, "services:read") && (
              <Link
                href="/admin/services"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#014421] hover:underline"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {widgets.recentServices.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#1B1F1C]/50">
              No services found in database.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#013220]/10">
              {widgets.recentServices.map((svc) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F0E8] text-[#014421]">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1B1F1C]">
                        {svc.title_en}
                      </p>
                      <p className="truncate text-xs capitalize text-[#1B1F1C]/55">
                        {svc.category}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      svc.is_active
                        ? "bg-[#E8F0E8] text-[#014421]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {svc.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
