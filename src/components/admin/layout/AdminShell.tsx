"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  hasPermission,
  type AdminPermission,
  type AdminRole,
} from "@/lib/auth/permissions";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";

export interface AdminShellUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: AdminPermission;
  badge?: number;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
};

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/inquiries": "Inquiries",
  "/admin/testimonials": "Testimonials",
  "/admin/services": "Services",
  "/admin/categories": "Categories",
  "/admin/content": "Website Content & FAQs",
  "/admin/media": "Media Library",
  "/admin/seo": "SEO Metadata",
  "/admin/settings": "Website Settings",
  "/admin/users": "Admin Users & Security",
};

export function AdminShell({
  user,
  pendingNotifications = { newInquiries: 0, pendingTestimonials: 0 },
  children,
}: {
  user: AdminShellUser;
  pendingNotifications?: {
    newInquiries: number;
    pendingTestimonials: number;
  };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useAdminToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        permission: "dashboard:view",
      },
      {
        label: "Inquiries",
        href: "/admin/inquiries",
        icon: Inbox,
        permission: "inquiries:read",
        badge: pendingNotifications.newInquiries,
      },
      {
        label: "Testimonials",
        href: "/admin/testimonials",
        icon: MessageSquareQuote,
        permission: "testimonials:read",
        badge: pendingNotifications.pendingTestimonials,
      },
      {
        label: "Services",
        href: "/admin/services",
        icon: Sparkles,
        permission: "services:read",
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: FolderKanban,
        permission: "categories:read",
      },
      {
        label: "Content & FAQs",
        href: "/admin/content",
        icon: FileText,
        permission: "content:read",
      },
      {
        label: "Media Library",
        href: "/admin/media",
        icon: ImageIcon,
        permission: "media:read",
      },
      {
        label: "SEO",
        href: "/admin/seo",
        icon: Globe,
        permission: "seo:read",
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "settings:read",
      },
      {
        label: "Admin Users",
        href: "/admin/users",
        icon: Users,
        permission: "users:manage",
      },
    ],
    [pendingNotifications]
  );

  const visibleNav = useMemo(
    () => navItems.filter((item) => hasPermission(user.role, item.permission)),
    [navItems, user.role]
  );

  const currentPageTitle = ROUTE_TITLES[pathname] || "Administration";
  const totalAlerts =
    (hasPermission(user.role, "inquiries:read")
      ? pendingNotifications.newInquiries
      : 0) +
    (hasPermission(user.role, "testimonials:read")
      ? pendingNotifications.pendingTestimonials
      : 0);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      toast.success("Signed out securely.");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-[#013220] text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/admin"
          onClick={() => isMobile && setMobileOpen(false)}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-xs">
            <Image
              src="/images/vistara-logo.png"
              alt="Vistara"
              width={28}
              height={28}
              className="h-full w-full object-contain"
            />
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-white">
                Vistara Admin
              </p>
              <p className="truncate text-[11px] text-white/65">
                Qatar Operations
              </p>
            </div>
          )}
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-white/75 hover:bg-white/10 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="hidden rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              title={sidebarCollapsed && !isMobile ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-[#013220] shadow-xs"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active ? "text-[#014421]" : "text-white/70 group-hover:text-white"
                }`}
              />
              {(!sidebarCollapsed || isMobile) && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        active
                          ? "bg-[#E8F0E8] text-[#013220]"
                          : "bg-[#6BAE00] text-[#013220]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/en"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {(!sidebarCollapsed || isMobile) && (
            <span className="truncate">View Public Website</span>
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F7F8F4] text-[#1B1F1C]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-[#013220]/10 transition-all duration-200 lg:block ${
          sidebarCollapsed ? "w-[74px]" : "w-64"
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#013220]/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl">
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#013220]/10 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#013220]/15 text-[#013220] hover:bg-[#F7F8F4] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#1B1F1C]/55">
                <Link href="/admin" className="hover:text-[#014421]">
                  Admin
                </Link>
                {pathname !== "/admin" && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="truncate font-medium text-[#014421]">
                      {currentPageTitle}
                    </span>
                  </>
                )}
              </div>
              <h1 className="truncate text-base font-bold text-[#013220] sm:text-lg">
                {currentPageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((p) => !p);
                  setProfileOpen(false);
                }}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#013220]/10 bg-[#F7F8F4] text-[#013220] hover:bg-[#E8F0E8]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {totalAlerts > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6BAE00] px-1 text-[10px] font-bold text-[#013220]">
                    {totalAlerts > 99 ? "99+" : totalAlerts}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#013220]/10 bg-white p-3 shadow-xl">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-[#1B1F1C]/50">
                    Attention Needed
                  </p>
                  <div className="space-y-1.5">
                    {hasPermission(user.role, "inquiries:read") && (
                      <Link
                        href="/admin/inquiries?status=New"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-[#F7F8F4]"
                      >
                        <span className="text-[#1B1F1C]">New Inquiries</span>
                        <span className="rounded-full bg-[#E8F0E8] px-2 py-0.5 text-xs font-semibold text-[#014421]">
                          {pendingNotifications.newInquiries}
                        </span>
                      </Link>
                    )}
                    {hasPermission(user.role, "testimonials:read") && (
                      <Link
                        href="/admin/testimonials?status=pending"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-[#F7F8F4]"
                      >
                        <span className="text-[#1B1F1C]">
                          Pending Testimonials
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          {pendingNotifications.pendingTestimonials}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((p) => !p);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-[#013220]/10 bg-[#F7F8F4] py-1.5 pl-2.5 pr-2 text-left transition hover:bg-[#E8F0E8]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#014421] text-xs font-bold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[130px] truncate text-xs font-semibold text-[#1B1F1C]">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-medium text-[#355E3B]">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#1B1F1C]/50" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#013220]/10 bg-white p-2 shadow-xl">
                  <div className="border-b border-[#013220]/10 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-[#1B1F1C]">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-[#1B1F1C]/60">
                      {user.email}
                    </p>
                    <span className="mt-1.5 inline-block rounded-full bg-[#E8F0E8] px-2 py-0.5 text-[10px] font-semibold text-[#014421]">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="mt-1.5 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
