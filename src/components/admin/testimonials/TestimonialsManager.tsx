"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";

interface TestimonialItem {
  id: number;
  customerName: string;
  location: string | null;
  serviceId: number | null;
  serviceSlug: string | null;
  serviceTitleEn: string | null;
  rating: number;
  review: string;
  language: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
}

export function TestimonialsManager({
  canModerate,
  canDelete,
  initialStatus = "all",
}: {
  canModerate: boolean;
  canDelete: boolean;
  initialStatus?: string;
}) {
  const toast = useAdminToast();
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"all" | "pending" | "approved">(
    initialStatus === "pending" || initialStatus === "approved"
      ? initialStatus
      : "all"
  );
  const [ratingFilter, setRatingFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState<TestimonialItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editReview, setEditReview] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TestimonialItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", tab);
      if (ratingFilter !== "all") params.set("rating", ratingFilter);
      if (query.trim()) params.set("q", query.trim());

      const res = await fetch(`/api/admin/testimonials?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to load testimonials.");
      } else {
        setItems(json.items || []);
        if (json.counts) setCounts(json.counts);
      }
    } catch {
      toast.error("Network error loading testimonials.");
    } finally {
      setLoading(false);
    }
  }, [tab, ratingFilter, query, toast]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set("status", tab);
    if (ratingFilter !== "all") params.set("rating", ratingFilter);
    if (query.trim()) params.set("q", query.trim());

    fetch(`/api/admin/testimonials?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!active) return;
        if (json.ok) {
          setItems(json.items || []);
          if (json.counts) setCounts(json.counts);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, ratingFilter, query]);

  async function patchTestimonial(
    id: number,
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to update testimonial.");
      } else {
        toast.success(successMessage);
        loadTestimonials();
      }
    } catch {
      toast.error("Network error updating testimonial.");
    }
  }

  function openEditModal(item: TestimonialItem) {
    setEditing(item);
    setEditName(item.customerName);
    setEditLocation(item.location || "");
    setEditRating(item.rating);
    setEditReview(item.review);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    await patchTestimonial(
      editing.id,
      {
        customerName: editName.trim(),
        location: editLocation.trim() || null,
        rating: editRating,
        review: editReview.trim(),
      },
      "Testimonial details updated."
    );
    setSavingEdit(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/testimonials?id=${deleteTarget.id}`,
        { method: "DELETE" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to delete testimonial.");
      } else {
        toast.success("Testimonial deleted.");
        setDeleteTarget(null);
        loadTestimonials();
      }
    } catch {
      toast.error("Network error deleting testimonial.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tabs & Filters */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#013220]/10 bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "all", label: `All (${counts.all})` },
              { key: "pending", label: `Pending (${counts.pending})` },
              { key: "approved", label: `Approved (${counts.approved})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-[#014421] text-white shadow-xs"
                  : "bg-[#F7F8F4] text-[#1B1F1C]/75 hover:bg-[#E8F0E8]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer or review..."
              className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#014421] focus:bg-white"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-3 py-2 text-sm outline-none focus:border-[#014421] focus:bg-white"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={String(r)}>
                {r} Stars
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <AdminTableSkeleton rows={5} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#013220]/10 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0E8] text-[#014421]">
            <MessageSquareQuote className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#013220]">
            No testimonials in this view
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#1B1F1C]/60">
            New customer reviews submitted on the public website enter the
            pending queue unverified until moderated here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs md:flex-row md:items-start"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold text-[#013220]">
                    {item.customerName}
                  </p>
                  {item.location && (
                    <span className="text-xs text-[#1B1F1C]/60">
                      • {item.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {item.rating}/5
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.isApproved
                        ? "bg-[#E8F0E8] text-[#014421]"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {item.isApproved ? "Published" : "Pending Review"}
                  </span>
                  {item.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#014421] px-2.5 py-0.5 text-xs font-semibold text-white">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified Client
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-[#1B1F1C]/85">
                  &ldquo;{item.review}&rdquo;
                </p>

                <p className="text-xs text-[#1B1F1C]/50">
                  {item.serviceTitleEn || "General Service"} •{" "}
                  {item.language.toUpperCase()} •{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>

              {canModerate && (
                <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      patchTestimonial(
                        item.id,
                        { isApproved: !item.isApproved },
                        item.isApproved
                          ? "Moved back to pending queue."
                          : "Testimonial approved and published."
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      item.isApproved
                        ? "border border-[#013220]/15 bg-white text-[#1B1F1C] hover:bg-[#F7F8F4]"
                        : "bg-[#014421] text-white hover:bg-[#013220]"
                    }`}
                  >
                    {item.isApproved ? (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      patchTestimonial(
                        item.id,
                        { isVerified: !item.isVerified },
                        item.isVerified
                          ? "Verified badge removed."
                          : "Marked as Verified Client."
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      item.isVerified
                        ? "border-[#014421] bg-[#E8F0E8] text-[#013220]"
                        : "border-[#013220]/15 bg-white text-[#1B1F1C]/75 hover:bg-[#F7F8F4]"
                    }`}
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {item.isVerified ? "Verified" : "Verify"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="rounded-xl border border-[#013220]/15 p-2 text-[#013220] hover:bg-[#E8F0E8]"
                    aria-label="Edit testimonial"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete testimonial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#013220]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#013220]/10 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#013220]/10 pb-3">
              <h3 className="text-base font-bold text-[#013220]">
                Edit Testimonial #{editing.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-[#1B1F1C]/50 hover:bg-[#F7F8F4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-sm outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-sm outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#013220]/80">
                  Rating
                </label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 text-sm outline-none focus:border-[#014421]"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} Stars
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#013220]/80">
                  Review Content
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  value={editReview}
                  onChange={(e) => setEditReview(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 text-sm outline-none focus:border-[#014421]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-[#013220]/15 px-4 py-2 text-sm font-medium text-[#1B1F1C] hover:bg-[#F7F8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
                >
                  {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Testimonial"
        description={`Delete the review from "${deleteTarget?.customerName}"? This permanently removes it from the database.`}
        confirmLabel="Delete Review"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
