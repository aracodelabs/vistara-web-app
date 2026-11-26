"use client";

import React, { useEffect, useState } from "react";
import { Globe, ImageIcon, Loader2, Save } from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";

interface SeoEntry {
  id: number;
  page_key: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  og_image: string | null;
  canonical_url: string | null;
}

export function SeoManager({ canWrite }: { canWrite: boolean }) {
  const toast = useAdminToast();
  const [items, setItems] = useState<SeoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState("home");
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  function populateForm(entry: SeoEntry) {
    setSelectedKey(entry.page_key);
    setTitleEn(entry.title_en);
    setTitleAr(entry.title_ar);
    setDescEn(entry.description_en);
    setDescAr(entry.description_ar);
    setOgImage(entry.og_image || "");
    setCanonicalUrl(entry.canonical_url || "");
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/seo", { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!active) return;
        if (json.ok) {
          const list: SeoEntry[] = json.items || [];
          setItems(list);
          const first = list[0];
          if (first) populateForm(first);
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
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_key: selectedKey,
          title_en: titleEn.trim(),
          title_ar: titleAr.trim(),
          description_en: descEn.trim(),
          description_ar: descAr.trim(),
          og_image: ogImage.trim() || null,
          canonical_url: canonicalUrl.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to save SEO metadata.");
      } else {
        toast.success(`SEO metadata saved for "${selectedKey}".`);
        setItems((prev) =>
          prev.map((row) => (row.page_key === selectedKey ? json.item : row))
        );
      }
    } catch {
      toast.error("Network error saving SEO metadata.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AdminTableSkeleton rows={5} />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
      <div className="space-y-1.5 rounded-2xl border border-[#013220]/10 bg-white p-3 shadow-xs lg:col-span-1">
        <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1B1F1C]/50">
          Public Routes
        </p>
        {items.map((item) => (
          <button
            key={item.page_key}
            type="button"
            onClick={() => populateForm(item)}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold capitalize transition ${
              selectedKey === item.page_key
                ? "bg-[#014421] text-white"
                : "text-[#1B1F1C]/80 hover:bg-[#F7F8F4]"
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            {item.page_key}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-2xl border border-[#013220]/10 bg-white p-6 shadow-xs lg:col-span-3"
      >
        <div className="flex items-center justify-between border-b border-[#013220]/10 pb-3">
          <div>
            <h3 className="text-base font-bold capitalize text-[#013220]">
              SEO Settings: {selectedKey} Page
            </h3>
            <p className="text-xs text-[#1B1F1C]/60">
              Bilingual search titles, meta descriptions, Open Graph image, and canonical URL.
            </p>
          </div>
          {canWrite && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-xs font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save SEO
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#013220]/80">
              Meta Title (EN) *
            </label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-sm outline-none focus:border-[#014421]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#013220]/80">
              Meta Title (AR) *
            </label>
            <input
              type="text"
              required
              dir="rtl"
              disabled={!canWrite}
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-sm outline-none focus:border-[#014421]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#013220]/80">
              Meta Description (EN) *
            </label>
            <textarea
              rows={3}
              required
              minLength={10}
              disabled={!canWrite}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 text-sm outline-none focus:border-[#014421]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#013220]/80">
              Meta Description (AR) *
            </label>
            <textarea
              rows={3}
              required
              minLength={10}
              dir="rtl"
              disabled={!canWrite}
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 text-sm outline-none focus:border-[#014421]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#013220]/80">
              Open Graph Image
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                disabled={!canWrite}
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="/images/hero-villa.jpg"
                className="flex-1 rounded-xl border border-[#013220]/15 px-3 py-2 text-xs outline-none focus:border-[#014421]"
              />
              {canWrite && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#013220]/15 px-3 py-2 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Pick
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#013220]/80">
              Canonical URL
            </label>
            <input
              type="text"
              disabled={!canWrite}
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://vistaraqatar.com/en"
              className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-xs outline-none focus:border-[#014421]"
            />
          </div>
        </div>
      </form>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => setOgImage(url)}
      />
    </div>
  );
}
