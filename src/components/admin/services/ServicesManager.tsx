"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";

interface ServiceCategory {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
}

interface ServiceItem {
  id: number;
  slug: string;
  category: string;
  category_id: number | null;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  image: string;
  image_source: string;
  image_generation_status: string;
  image_generation_error: string | null;
  seo_title_en: string | null;
  seo_title_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  sort_order: number;
  is_active: boolean;
}

const IMAGE_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  manual: { label: "Manual", cls: "bg-[#E8F0E8] text-[#014421]" },
  generated: { label: "AI Generated", cls: "bg-emerald-100 text-emerald-900" },
  generating: { label: "Generating...", cls: "bg-sky-100 text-sky-900" },
  failed: { label: "Fallback (AI Warning)", cls: "bg-amber-100 text-amber-900" },
  not_generated: { label: "Default", cls: "bg-slate-100 text-slate-700" },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ServicesManager({ canWrite }: { canWrite: boolean }) {
  const toast = useAdminToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [slug, setSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("residential");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [image, setImage] = useState("");
  const [seoTitleEn, setSeoTitleEn] = useState("");
  const [seoTitleAr, setSeoTitleAr] = useState("");
  const [seoDescEn, setSeoDescEn] = useState("");
  const [seoDescAr, setSeoDescAr] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(`/api/admin/services?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to load services.");
      } else {
        setServices(json.items || []);
        setCategories(json.categories || []);
      }
    } catch {
      toast.error("Network error loading services.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, query, toast]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (query.trim()) params.set("q", query.trim());

    fetch(`/api/admin/services?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!active) return;
        if (json.ok) {
          setServices(json.items || []);
          setCategories(json.categories || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryFilter, statusFilter, query]);

  function openCreate() {
    setEditing(null);
    setTitleEn("");
    setTitleAr("");
    setSlug("");
    setCategorySlug(categories[0]?.slug || "residential");
    setDescEn("");
    setDescAr("");
    setImage("");
    setSeoTitleEn("");
    setSeoTitleAr("");
    setSeoDescEn("");
    setSeoDescAr("");
    setSortOrder(services.length + 1);
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(svc: ServiceItem) {
    setEditing(svc);
    setTitleEn(svc.title_en);
    setTitleAr(svc.title_ar);
    setSlug(svc.slug);
    setCategorySlug(svc.category);
    setDescEn(svc.description_en);
    setDescAr(svc.description_ar);
    setImage(svc.image || "");
    setSeoTitleEn(svc.seo_title_en || "");
    setSeoTitleAr(svc.seo_title_ar || "");
    setSeoDescEn(svc.seo_description_en || "");
    setSeoDescAr(svc.seo_description_ar || "");
    setSortOrder(svc.sort_order);
    setIsActive(svc.is_active);
    setModalOpen(true);
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Upload failed.");
      } else {
        setImage(json.item.url);
        toast.success("Image uploaded and attached.");
      }
    } catch {
      toast.error("Network error uploading image.");
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const matchedCat = categories.find((c) => c.slug === categorySlug);
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        slug: slug.trim(),
        category: categorySlug,
        category_id: matchedCat?.id ?? null,
        title_en: titleEn.trim(),
        title_ar: titleAr.trim(),
        description_en: descEn.trim(),
        description_ar: descAr.trim(),
        image: image.trim(),
        seo_title_en: seoTitleEn.trim() || null,
        seo_title_ar: seoTitleAr.trim() || null,
        seo_description_en: seoDescEn.trim() || null,
        seo_description_ar: seoDescAr.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };

      const res = await fetch("/api/admin/services", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to save service.");
        setSaving(false);
        return;
      }

      if (json.warning) {
        toast.warning(json.warning);
      } else {
        toast.success(
          editing ? "Service updated." : "Service created successfully."
        );
      }
      setModalOpen(false);
      loadServices();
    } catch {
      toast.error("Network error saving service.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(svc: ServiceItem) {
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: svc.id, is_active: !svc.is_active }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to change visibility.");
      } else {
        toast.success(
          svc.is_active ? "Service hidden from public site." : "Service activated."
        );
        loadServices();
      }
    } catch {
      toast.error("Network error updating visibility.");
    }
  }

  async function handleGenerateAiImage(svcId: number) {
    setGeneratingId(svcId);
    try {
      const res = await fetch("/api/admin/image-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "service",
          entityId: svcId,
          forceRegenerate: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Image generation failed.");
      } else if (json.warning) {
        toast.warning(json.warning);
        loadServices();
      } else {
        toast.success("AI image generated and saved.");
        loadServices();
      }
    } catch {
      toast.error("Network error generating image.");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/services?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to delete service.");
      } else {
        toast.success("Service deleted.");
        setDeleteTarget(null);
        loadServices();
      }
    } catch {
      toast.error("Network error deleting service.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#013220]/10 bg-white p-4 shadow-xs lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search service title or slug..."
              className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#014421] focus:bg-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-3 py-2 text-sm outline-none focus:border-[#014421] focus:bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name_en}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-3 py-2 text-sm outline-none focus:border-[#014421] focus:bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Hidden Only</option>
          </select>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220]"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        )}
      </div>

      {/* Services Grid / List */}
      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#013220]/10 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0E8] text-[#014421]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#013220]">
            No services match your filters
          </h3>
          <p className="mt-1 text-xs text-[#1B1F1C]/60">
            Create a cleaning service or clear your active search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((svc) => {
            const imgStatus =
              IMAGE_STATUS_BADGE[svc.image_generation_status] ||
              IMAGE_STATUS_BADGE.not_generated;
            return (
              <div
                key={svc.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#013220]/10 bg-white shadow-xs"
              >
                <div className="relative aspect-[16/9] w-full bg-[#F7F8F4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={svc.image || "/images/hero-villa.jpg"}
                    alt={svc.title_en}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-xs ${imgStatus.cls}`}
                    >
                      {imgStatus.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-xs ${
                        svc.is_active
                          ? "bg-[#014421] text-white"
                          : "bg-slate-800/80 text-white"
                      }`}
                    >
                      {svc.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#355E3B]">
                        {svc.category} • #{svc.sort_order}
                      </p>
                      <h3 className="mt-0.5 text-base font-bold text-[#013220]">
                        {svc.title_en}
                      </h3>
                      <p className="text-xs text-[#1B1F1C]/60" dir="rtl">
                        {svc.title_ar}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-[#1B1F1C]/70">
                    {svc.description_en}
                  </p>

                  {svc.image_generation_error && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span className="line-clamp-2">
                        {svc.image_generation_error}
                      </span>
                    </div>
                  )}

                  {canWrite && (
                    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[#013220]/10 pt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(svc)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1.5 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={generatingId === svc.id}
                        onClick={() => handleGenerateAiImage(svc.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1.5 text-xs font-semibold text-[#014421] hover:bg-[#E8F0E8] disabled:opacity-50"
                      >
                        {generatingId === svc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5" />
                        )}
                        {svc.image_generation_status === "failed"
                          ? "Retry AI"
                          : "AI Image"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(svc)}
                        className="ml-auto rounded-lg p-1.5 text-[#1B1F1C]/65 hover:bg-[#F7F8F4]"
                        title={svc.is_active ? "Hide service" : "Show service"}
                      >
                        {svc.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(svc)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                        title="Delete service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#013220]/45 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#013220]/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#013220]/10 px-6 py-4">
              <h3 className="text-base font-bold text-[#013220]">
                {editing ? `Edit Service: ${editing.title_en}` : "New Cleaning Service"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-[#1B1F1C]/50 hover:bg-[#F7F8F4]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex-1 space-y-4 overflow-y-auto p-6 text-sm"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    English Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={titleEn}
                    onChange={(e) => {
                      setTitleEn(e.target.value);
                      if (!editing && !slug) {
                        setSlug(slugify(e.target.value));
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Arabic Title *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9-]+$"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 font-mono text-xs outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Category *
                  </label>
                  <select
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    English Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Arabic Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    dir="rtl"
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              {/* Image Section */}
              <div className="rounded-2xl border border-[#013220]/10 bg-[#F7F8F4]/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#013220]">
                      Service Image
                    </p>
                    <p className="text-[11px] text-[#1B1F1C]/60">
                      Upload a photo, choose from Media Library, or leave empty on create for automatic AI image generation.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#013220]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]">
                      {uploadingImg ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#013220]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Media Library
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Optional image URL (/images/... or uploaded URL)"
                  className="mt-3 w-full rounded-xl border border-[#013220]/15 bg-white px-3 py-2 text-xs outline-none focus:border-[#014421]"
                />
              </div>

              {/* Optional SEO Metadata */}
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#013220]/10 p-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/75">
                    SEO Title (EN)
                  </label>
                  <input
                    type="text"
                    value={seoTitleEn}
                    onChange={(e) => setSeoTitleEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-1.5 text-xs outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/75">
                    SEO Title (AR)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={seoTitleAr}
                    onChange={(e) => setSeoTitleAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-1.5 text-xs outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/75">
                    SEO Description (EN)
                  </label>
                  <input
                    type="text"
                    value={seoDescEn}
                    onChange={(e) => setSeoDescEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-1.5 text-xs outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/75">
                    SEO Description (AR)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={seoDescAr}
                    onChange={(e) => setSeoDescAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-1.5 text-xs outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#013220]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#013220]/30 accent-[#014421]"
                />
                Visible on public Vistara website
              </label>

              <div className="flex justify-end gap-2 border-t border-[#013220]/10 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#013220]/15 px-4 py-2 text-sm font-medium text-[#1B1F1C] hover:bg-[#F7F8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => setImage(url)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Service"
        description={`Delete "${deleteTarget?.title_en}"? Existing inquiries linked to this service will remain intact cleanly.`}
        confirmLabel="Delete Service"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
