"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Eye,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";

interface MediaAssetItem {
  id: number | null;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  source: string;
  prompt: string | null;
  created_at: string;
  usedIn?: string[];
}

export function MediaLibraryManager({
  canWrite,
  canDelete,
}: {
  canWrite: boolean;
  canDelete: boolean;
}) {
  const toast = useAdminToast();
  const [items, setItems] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [previewItem, setPreviewItem] = useState<MediaAssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(`/api/admin/media?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to load media assets.");
      } else {
        setItems(json.items || []);
      }
    } catch {
      toast.error("Network error loading Media Library.");
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, query, toast]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (query.trim()) params.set("q", query.trim());

    fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" })
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
  }, [sourceFilter, query]);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          toast.error(`${file.name}: ${json.error || "Upload failed."}`);
        } else {
          successCount += 1;
        }
      } catch {
        toast.error(`${file.name}: Network error during upload.`);
      }
    }

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} image(s) successfully.`);
      loadMedia();
    }
    setUploading(false);
  }

  async function handleDelete() {
    if (!deleteTarget || deleteTarget.id === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Cannot delete media asset.");
      } else {
        toast.success("Media asset deleted.");
        setDeleteTarget(null);
        loadMedia();
      }
    } catch {
      toast.error("Network error deleting media asset.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload & Filter Toolbar */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#013220]/10 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search filename or URL..."
              className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#014421] focus:bg-white"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-3 py-2 text-sm outline-none focus:border-[#014421] focus:bg-white"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual Uploads</option>
            <option value="ai-generated">AI Generated</option>
            <option value="built-in">Built-in Assets</option>
          </select>
        </div>

        {canWrite && (
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220]">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Images (JPG / PNG / WebP, max 5 MB)
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                uploadFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <AdminTableSkeleton rows={4} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#013220]/10 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0E8] text-[#014421]">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#013220]">
            Media Library is empty
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#1B1F1C]/60">
            Upload JPG, PNG, or WebP photos or generate service imagery to manage
            all website assets cleanly from here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const usedIn = item.usedIn ?? [];
            const sourceLabel =
              item.source === "ai-generated"
                ? "AI"
                : item.source === "built-in"
                  ? "Built-in"
                  : "Manual";
            return (
              <div
                key={item.id ?? item.url}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#013220]/10 bg-white shadow-xs"
              >
                <div className="relative aspect-[4/3] bg-[#F7F8F4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase text-[#013220] shadow-xs">
                    {sourceLabel}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3.5 text-xs">
                  <p className="truncate font-semibold text-[#1B1F1C]">
                    {item.filename}
                  </p>
                  <p className="mt-0.5 text-[#1B1F1C]/55">
                    {item.size_bytes > 0
                      ? `${Math.round(item.size_bytes / 1024)} KB`
                      : "Static asset"}
                    {item.width && item.height
                      ? ` • ${item.width}×${item.height}`
                      : ""}
                  </p>

                  {usedIn.length > 0 && (
                    <p className="mt-2 truncate rounded-lg bg-[#E8F0E8] px-2 py-1 text-[11px] font-medium text-[#014421]">
                      In use ({usedIn.length}): {usedIn[0]}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 border-t border-[#013220]/10 pt-2.5">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1 font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(item.url);
                        toast.success("Image URL copied.");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1 font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      URL
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        disabled={item.id === null || usedIn.length > 0}
                        title={
                          item.id === null
                            ? "Built-in site asset"
                            : usedIn.length > 0
                              ? "Referenced by active site content"
                              : "Delete asset"
                        }
                        className="ml-auto rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#013220]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#013220]/15 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#013220]/10 px-5 py-3.5">
              <p className="truncate text-sm font-bold text-[#013220]">
                {previewItem.filename}
              </p>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-1 text-[#1B1F1C]/50 hover:bg-[#F7F8F4]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-[#F7F8F4] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewItem.url}
                alt={previewItem.filename}
                className="mx-auto max-h-[60vh] rounded-xl object-contain"
              />
            </div>
            <div className="space-y-1 p-4 text-xs text-[#1B1F1C]/75">
              <p>
                <strong>URL:</strong> {previewItem.url}
              </p>
              {previewItem.prompt && (
                <p>
                  <strong>AI Prompt:</strong> {previewItem.prompt}
                </p>
              )}
              <p>
                <strong>Usage:</strong>{" "}
                {(previewItem.usedIn ?? []).length > 0
                  ? (previewItem.usedIn ?? []).join(", ")
                  : "Unused"}
              </p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Media Asset"
        description={`Permanently delete "${deleteTarget?.filename}" from storage and Media Library?`}
        confirmLabel="Delete File"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
