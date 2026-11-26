"use client";

import React, { useEffect, useState } from "react";
import { Check, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";

interface MediaItem {
  id: number | null;
  url: string;
  filename: string;
  mime_type: string;
  source: string;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const toast = useAdminToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch("/api/admin/media", { cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((json) => {
        if (active && json.ok) setItems(json.items || []);
      })
      .catch(() => {
        if (active) toast.error("Unable to load Media Library.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, toast]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
        setItems((prev) => [json.item, ...prev]);
        toast.success("Image uploaded to Media Library.");
      }
    } catch {
      toast.error("Network error uploading file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#013220]/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-[#013220]/15 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#013220]/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#014421]" />
            <h3 className="text-base font-bold text-[#013220]">
              Choose from Media Library
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#014421] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#013220]">
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Upload New
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-[#1B1F1C]/50 hover:bg-[#F7F8F4]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#1B1F1C]/60">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#014421]" />
              Loading uploaded media...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#1B1F1C]/60">
              No uploaded media assets yet. Upload an image above to get
              started.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id ?? item.url}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="group relative overflow-hidden rounded-xl border border-[#013220]/10 bg-[#F7F8F4] text-left transition hover:border-[#014421] hover:ring-2 hover:ring-[#014421]/20"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-[#1B1F1C]">
                      {item.filename}
                    </p>
                  </div>
                  <span className="absolute right-2 top-2 hidden rounded-full bg-[#014421] p-1 text-white group-hover:block">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
