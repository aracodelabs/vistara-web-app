"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";
import {
  normalizeNavigationVisibility,
  type NavigationVisibility,
} from "@/lib/navigation-visibility";

interface ServiceAreaItem {
  slug: string;
  en: string;
  ar: string;
}

const NAV_TOGGLE_ITEMS: Array<{
  key: keyof NavigationVisibility;
  label: string;
  description: string;
}> = [
  {
    key: "reviews",
    label: "Reviews / Testimonials",
    description:
      "Controls Reviews link in the Navbar & Footer, plus access to the public /testimonials page.",
  },
  {
    key: "about",
    label: "About Us",
    description: "Show or hide the About navigation link in header and footer.",
  },
  {
    key: "services",
    label: "Services Menu",
    description: "Show or hide the Services dropdown menu and All Services links.",
  },
  {
    key: "residential",
    label: "Residential Cleaning",
    description: "Show or hide the direct Residential quick link in the Navbar.",
  },
  {
    key: "commercial",
    label: "Commercial Cleaning",
    description: "Show or hide the direct Commercial quick link in the Navbar.",
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Show or hide FAQ links in mobile navigation and footer.",
  },
  {
    key: "contact",
    label: "Contact",
    description: "Show or hide Contact Us links in header and footer.",
  },
  {
    key: "quote",
    label: "Request Quote CTA",
    description: "Show or hide the Request Quote button and footer link.",
  },
];

interface SettingsFormState {
  company_name_en: string;
  company_name_ar: string;
  company_email: string;
  whatsapp_number: string;
  contact_phone: string;
  address_en: string;
  address_ar: string;
  business_hours_en: string;
  business_hours_ar: string;
  service_areas: ServiceAreaItem[];
  social_links: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  google_review_url: string;
  default_language: "en" | "ar";
  navigation_visibility: NavigationVisibility;
}

export function SettingsManager({ canWrite }: { canWrite: boolean }) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsFormState | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!active) return;
        if (json.ok && json.item) {
          const s = json.item;
          setForm({
            company_name_en: s.company_name_en || "",
            company_name_ar: s.company_name_ar || "",
            company_email: s.company_email || "",
            whatsapp_number: s.whatsapp_number || "",
            contact_phone: s.contact_phone || "",
            address_en: s.address_en || "",
            address_ar: s.address_ar || "",
            business_hours_en: s.business_hours_en || "",
            business_hours_ar: s.business_hours_ar || "",
            service_areas: Array.isArray(s.service_areas)
              ? s.service_areas
              : [],
            social_links: s.social_links || {},
            google_review_url: s.google_review_url || "",
            default_language: s.default_language === "ar" ? "ar" : "en",
            navigation_visibility: normalizeNavigationVisibility(
              s.navigation_visibility
            ),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          google_review_url: form.google_review_url.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to update settings.");
      } else {
        toast.success("Website settings saved.");
      }
    } catch {
      toast.error("Network error saving settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return <AdminTableSkeleton rows={6} />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#013220]">
            Global Company & Contact Settings
          </h2>
          <p className="text-xs text-[#1B1F1C]/60">
            Configure Vistara business details, WhatsApp contact number, Qatar service zones, and review links.
          </p>
        </div>

        {canWrite ? (
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </button>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Read-only (Super Admin required to edit)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs text-sm">
          <h3 className="font-bold text-[#013220]">Company Identity</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Company Name (EN)
              </label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={form.company_name_en}
                onChange={(e) =>
                  setForm({ ...form, company_name_en: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Company Name (AR)
              </label>
              <input
                type="text"
                required
                dir="rtl"
                disabled={!canWrite}
                value={form.company_name_ar}
                onChange={(e) =>
                  setForm({ ...form, company_name_ar: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                WhatsApp Number (Digits Only)
              </label>
              <input
                type="text"
                required
                pattern="^\d{8,15}$"
                disabled={!canWrite}
                value={form.whatsapp_number}
                onChange={(e) =>
                  setForm({ ...form, whatsapp_number: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 font-mono text-xs outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Display Phone Number
              </label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Contact Email
              </label>
              <input
                type="email"
                required
                disabled={!canWrite}
                value={form.company_email}
                onChange={(e) =>
                  setForm({ ...form, company_email: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Default Website Language
              </label>
              <select
                disabled={!canWrite}
                value={form.default_language}
                onChange={(e) =>
                  setForm({
                    ...form,
                    default_language: e.target.value === "ar" ? "ar" : "en",
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              >
                <option value="en">English (EN)</option>
                <option value="ar">Arabic (AR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Address (EN)
              </label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={form.address_en}
                onChange={(e) =>
                  setForm({ ...form, address_en: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Address (AR)
              </label>
              <input
                type="text"
                required
                dir="rtl"
                disabled={!canWrite}
                value={form.address_ar}
                onChange={(e) =>
                  setForm({ ...form, address_ar: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Business Hours (EN)
              </label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={form.business_hours_en}
                onChange={(e) =>
                  setForm({ ...form, business_hours_en: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Business Hours (AR)
              </label>
              <input
                type="text"
                required
                dir="rtl"
                disabled={!canWrite}
                value={form.business_hours_ar}
                onChange={(e) =>
                  setForm({ ...form, business_hours_ar: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs text-sm">
          <h3 className="font-bold text-[#013220]">
            Social Links & Qatar Service Areas
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Instagram URL
              </label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.social_links.instagram || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    social_links: {
                      ...form.social_links,
                      instagram: e.target.value,
                    },
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-xs outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Facebook URL
              </label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.social_links.facebook || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    social_links: {
                      ...form.social_links,
                      facebook: e.target.value,
                    },
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-xs outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                LinkedIn URL
              </label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.social_links.linkedin || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    social_links: {
                      ...form.social_links,
                      linkedin: e.target.value,
                    },
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-xs outline-none focus:border-[#014421]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#013220]/80">
                Google Review URL
              </label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.google_review_url}
                onChange={(e) =>
                  setForm({ ...form, google_review_url: e.target.value })
                }
                placeholder="https://g.page/r/..."
                className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-xs outline-none focus:border-[#014421]"
              />
            </div>
          </div>

          <div className="border-t border-[#013220]/10 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#013220]">
                Service Areas ({form.service_areas.length})
              </p>
              {canWrite && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      service_areas: [
                        ...form.service_areas,
                        { slug: "new-area", en: "New Area", ar: "منطقة جديدة" },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1 text-xs font-semibold text-[#014421] hover:bg-[#E8F0E8]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Area
                </button>
              )}
            </div>

            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
              {form.service_areas.map((area, idx) => (
                <div
                  key={`${area.slug}-${idx}`}
                  className="grid grid-cols-12 items-center gap-2"
                >
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={area.slug}
                    onChange={(e) => {
                      const next = [...form.service_areas];
                      next[idx] = { ...area, slug: e.target.value };
                      setForm({ ...form, service_areas: next });
                    }}
                    placeholder="slug"
                    className="col-span-3 rounded-lg border border-[#013220]/15 px-2 py-1.5 font-mono text-xs"
                  />
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={area.en}
                    onChange={(e) => {
                      const next = [...form.service_areas];
                      next[idx] = { ...area, en: e.target.value };
                      setForm({ ...form, service_areas: next });
                    }}
                    placeholder="English"
                    className="col-span-4 rounded-lg border border-[#013220]/15 px-2 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    disabled={!canWrite}
                    value={area.ar}
                    onChange={(e) => {
                      const next = [...form.service_areas];
                      next[idx] = { ...area, ar: e.target.value };
                      setForm({ ...form, service_areas: next });
                    }}
                    placeholder="Arabic"
                    className="col-span-4 rounded-lg border border-[#013220]/15 px-2 py-1.5 text-xs"
                  />
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          service_areas: form.service_areas.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="col-span-1 flex justify-center rounded-lg p-1 text-red-600 hover:bg-red-50"
                      aria-label="Remove area"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navbar & Public Sections Visibility */}
      <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#013220]">
            Navbar &amp; Public Sections Visibility
          </h3>
          <p className="mt-0.5 text-xs text-[#1B1F1C]/60">
            Turn items ON or OFF to show or hide them on the public website.
            Turning <strong>Reviews / Testimonials</strong> OFF hides it from
            the Navbar, Footer, and disables the public{" "}
            <code className="rounded bg-[#F7F8F4] px-1 py-0.5 text-[11px]">
              /testimonials
            </code>{" "}
            page.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {NAV_TOGGLE_ITEMS.map((item) => {
            const enabled = form.navigation_visibility[item.key];
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#013220]/10 bg-[#F7F8F4]/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#013220]">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#1B1F1C]/65">
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Toggle ${item.label}`}
                  disabled={!canWrite}
                  onClick={() =>
                    setForm({
                      ...form,
                      navigation_visibility: {
                        ...form.navigation_visibility,
                        [item.key]: !enabled,
                      },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    enabled ? "bg-[#014421]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}
