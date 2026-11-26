"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  FolderKanban,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";

interface CategoryItem {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image: string | null;
  image_source: string;
  image_generation_status: string;
  sort_order: number;
  is_active: boolean;
  serviceCount: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoriesManager({ canWrite }: { canWrite: boolean }) {
  const toast = useAdminToast();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [reassignId, setReassignId] = useState<number>(0);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to load categories.");
      } else {
        setItems(json.items || []);
      }
    } catch {
      toast.error("Network error loading categories.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!active) return;
        if (json.ok) setItems(json.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setNameEn("");
    setNameAr("");
    setSlug("");
    setDescEn("");
    setDescAr("");
    setImage("");
    setSortOrder(items.length + 1);
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(cat: CategoryItem) {
    setEditing(cat);
    setNameEn(cat.name_en);
    setNameAr(cat.name_ar);
    setSlug(cat.slug);
    setDescEn(cat.description_en);
    setDescAr(cat.description_ar);
    setImage(cat.image || "");
    setSortOrder(cat.sort_order);
    setIsActive(cat.is_active);
    setModalOpen(true);
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
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
        toast.success("Image uploaded.");
      }
    } catch {
      toast.error("Network error uploading file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        slug: slug.trim(),
        name_en: nameEn.trim(),
        name_ar: nameAr.trim(),
        description_en: descEn.trim(),
        description_ar: descAr.trim(),
        image: image.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };

      const res = await fetch("/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to save category.");
        setSaving(false);
        return;
      }

      if (json.warning) {
        toast.warning(json.warning);
      } else {
        toast.success(editing ? "Category updated." : "Category created.");
      }
      setModalOpen(false);
      loadCategories();
    } catch {
      toast.error("Network error saving category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateAiImage(catId: number) {
    setGeneratingId(catId);
    try {
      const res = await fetch("/api/admin/image-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "category",
          entityId: catId,
          forceRegenerate: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Image generation failed.");
      } else if (json.warning) {
        toast.warning(json.warning);
        loadCategories();
      } else {
        toast.success("AI category image generated.");
        loadCategories();
      }
    } catch {
      toast.error("Network error generating image.");
    } finally {
      setGeneratingId(null);
    }
  }

  function openDeleteDialog(cat: CategoryItem) {
    setDeleteTarget(cat);
    const other = items.find((c) => c.id !== cat.id);
    setReassignId(other?.id ?? 0);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const qs = new URLSearchParams({ id: String(deleteTarget.id) });
      if (deleteTarget.serviceCount > 0 && reassignId > 0) {
        qs.set("reassignToCategoryId", String(reassignId));
      }
      const res = await fetch(`/api/admin/categories?${qs.toString()}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to delete category.");
      } else {
        toast.success("Category deleted safely.");
        setDeleteTarget(null);
        loadCategories();
      }
    } catch {
      toast.error("Network error deleting category.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#013220]/10 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#013220]">
            Service Categories
          </h2>
          <p className="text-xs text-[#1B1F1C]/60">
            Organize residential, commercial, and specialized service groups.
          </p>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220]"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        )}
      </div>

      {loading ? (
        <AdminTableSkeleton rows={4} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#013220]/10 bg-white px-6 py-16 text-center">
          <FolderKanban className="h-10 w-10 text-[#014421]" />
          <h3 className="mt-3 text-base font-bold text-[#013220]">
            No categories yet
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#013220]/10 bg-white shadow-xs"
            >
              <div className="relative aspect-[16/9] bg-[#F7F8F4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image || "/images/hero-villa.jpg"}
                  alt={cat.name_en}
                  className="h-full w-full object-cover"
                />
                <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-[#013220] shadow-xs">
                  {cat.serviceCount} service(s)
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#355E3B]">
                  {cat.slug} • #{cat.sort_order}
                </p>
                <h3 className="mt-0.5 text-base font-bold text-[#013220]">
                  {cat.name_en}
                </h3>
                <p className="text-xs text-[#1B1F1C]/60" dir="rtl">
                  {cat.name_ar}
                </p>
                <p className="mt-2 line-clamp-2 flex-1 text-xs text-[#1B1F1C]/70">
                  {cat.description_en}
                </p>

                {canWrite && (
                  <div className="mt-4 flex items-center gap-1.5 border-t border-[#013220]/10 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1.5 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={generatingId === cat.id}
                      onClick={() => handleGenerateAiImage(cat.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1.5 text-xs font-semibold text-[#014421] hover:bg-[#E8F0E8] disabled:opacity-50"
                    >
                      {generatingId === cat.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="h-3.5 w-3.5" />
                      )}
                      AI Image
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteDialog(cat)}
                      className="ml-auto rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                      aria-label="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#013220]/45 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-[#013220]/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#013220]/10 px-6 py-4">
              <h3 className="text-base font-bold text-[#013220]">
                {editing ? `Edit Category: ${editing.name_en}` : "New Category"}
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
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => {
                      setNameEn(e.target.value);
                      if (!editing && !slug) setSlug(slugify(e.target.value));
                    }}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Arabic Name *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Slug *
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
                    Sort Order
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
                    minLength={5}
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
                    minLength={5}
                    dir="rtl"
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#013220]/10 bg-[#F7F8F4]/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#013220]">
                    Category Image
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#013220]/15 bg-white px-2.5 py-1 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]">
                      {uploading ? (
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
                      className="inline-flex items-center gap-1 rounded-xl border border-[#013220]/15 bg-white px-2.5 py-1 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Picker
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Optional image URL (empty triggers AI generation on create)"
                  className="mt-2.5 w-full rounded-xl border border-[#013220]/15 bg-white px-3 py-2 text-xs outline-none focus:border-[#014421]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#013220]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#013220]/30 accent-[#014421]"
                />
                Category Active
              </label>

              <div className="flex justify-end gap-2 border-t border-[#013220]/10 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#013220]/15 px-4 py-2 text-sm font-medium hover:bg-[#F7F8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete + Reassign Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#013220]/45 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#013220]/10 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#013220]">
              Delete Category &ldquo;{deleteTarget.name_en}&rdquo;
            </h3>
            {deleteTarget.serviceCount > 0 ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-[#1B1F1C]/75">
                  This category currently contains{" "}
                  <strong>{deleteTarget.serviceCount}</strong> service(s). Choose
                  another category to reassign them to before deletion:
                </p>
                <select
                  value={reassignId}
                  onChange={(e) => setReassignId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-sm outline-none focus:border-[#014421]"
                >
                  <option value={0}>Select target category...</option>
                  {items
                    .filter((c) => c.id !== deleteTarget.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_en} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#1B1F1C]/75">
                No services reference this category. It can be deleted safely.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#013220]/15 px-4 py-2 text-sm font-medium hover:bg-[#F7F8F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleting ||
                  (deleteTarget.serviceCount > 0 && reassignId <= 0)
                }
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => setImage(url)}
      />
    </div>
  );
}
