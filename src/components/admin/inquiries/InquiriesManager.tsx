"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  MessageSquarePlus,
  Phone,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { INQUIRY_STATUSES } from "@/lib/validation";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";

interface InquiryItem {
  id: number;
  customer_name: string;
  phone_number: string;
  email: string | null;
  service_id: number | null;
  service_slug: string | null;
  service_title_en: string | null;
  property_type: string | null;
  area: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  language: string;
  status: string;
  created_at: string;
}

interface InquiryNote {
  id: number;
  inquiry_id: number;
  admin_user_id: number | null;
  author_name: string;
  note: string;
  created_at: string;
}

interface ServiceOption {
  slug: string;
  title_en: string;
}

const STATUS_BADGE: Record<string, string> = {
  New: "bg-[#6BAE00]/25 text-[#013220] border-[#6BAE00]/40",
  Contacted: "bg-sky-50 text-sky-900 border-sky-200",
  "Quotation Sent": "bg-amber-50 text-amber-900 border-amber-200",
  Confirmed: "bg-[#014421] text-white border-[#014421]",
  Completed: "bg-[#E8F0E8] text-[#013220] border-[#013220]/20",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

export function InquiriesManager({
  canWrite,
  canDelete,
  initialStatus = "all",
}: {
  canWrite: boolean;
  canDelete: boolean;
  initialStatus?: string;
}) {
  const toast = useAdminToast();
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [servicesList, setServicesList] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selected, setSelected] = useState<InquiryItem | null>(null);
  const [notes, setNotes] = useState<InquiryNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<InquiryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "15");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (serviceFilter !== "all") params.set("service", serviceFilter);
      if (query.trim()) params.set("q", query.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to load inquiries.");
      } else {
        setItems(json.items || []);
        setTotalPages(json.totalPages || 1);
        setTotalCount(json.totalCount || 0);
      }
    } catch {
      toast.error("Network error while loading inquiries.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, serviceFilter, query, dateFrom, dateTo, toast]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "15");
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (serviceFilter !== "all") params.set("service", serviceFilter);
    if (query.trim()) params.set("q", query.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    fetch(`/api/admin/inquiries?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        json: await res.json().catch(() => ({})),
      }))
      .then(({ ok, json }) => {
        if (!active) return;
        if (ok && json.ok) {
          setItems(json.items || []);
          setTotalPages(json.totalPages || 1);
          setTotalCount(json.totalCount || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, statusFilter, serviceFilter, query, dateFrom, dateTo]);

  useEffect(() => {
    fetch("/api/admin/services", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.items)) {
          setServicesList(
            json.items.map((s: ServiceOption) => ({
              slug: s.slug,
              title_en: s.title_en,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  async function openDetails(item: InquiryItem) {
    setSelected(item);
    setNotes([]);
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${item.id}/notes`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setNotes(json.items || []);
      }
    } catch {
      toast.error("Unable to load internal notes.");
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleStatusUpdate(inquiryId: number, newStatus: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inquiryId, status: newStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Failed to update status.");
      } else {
        setItems((prev) =>
          prev.map((row) =>
            row.id === inquiryId ? { ...row, status: newStatus } : row
          )
        );
        if (selected?.id === inquiryId) {
          setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
        }
        toast.success(`Status updated to ${newStatus}.`);
      }
    } catch {
      toast.error("Network error updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || noteInput.trim().length < 2) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${selected.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteInput.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to save note.");
      } else {
        setNotes((prev) => [json.item, ...prev]);
        setNoteInput("");
        toast.success("Internal note saved.");
      }
    } catch {
      toast.error("Network error saving note.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/inquiries?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to delete inquiry.");
      } else {
        toast.success("Inquiry deleted.");
        if (selected?.id === deleteTarget.id) setSelected(null);
        setDeleteTarget(null);
        fetchInquiries();
      }
    } catch {
      toast.error("Network error deleting inquiry.");
    } finally {
      setDeleting(false);
    }
  }

  function copyPhone(id: number, phone: string) {
    navigator.clipboard?.writeText(phone).then(() => {
      setCopiedId(id);
      toast.success("Phone number copied.");
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  function whatsappReplyUrl(inq: InquiryItem): string {
    const digits = inq.phone_number.replace(/\D/g, "");
    const normalized = digits.startsWith("974") ? digits : `974${digits}`;
    const text = encodeURIComponent(
      `Hello ${inq.customer_name}, thank you for contacting Vistara Qatar regarding ${inq.service_title_en || "our cleaning services"}.`
    );
    return `https://wa.me/${normalized}?text=${text}`;
  }

  return (
    <div className="space-y-5">
      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-[#013220]/10 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B1F1C]/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search customer name, phone, or Qatar area..."
              className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#014421] focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-3 py-2 text-sm outline-none focus:border-[#014421] focus:bg-white"
          >
            <option value="all">All Statuses</option>
            {INQUIRY_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-3 py-2 text-sm outline-none focus:border-[#014421] focus:bg-white"
          >
            <option value="all">All Services</option>
            {servicesList.map((svc) => (
              <option key={svc.slug} value={svc.slug}>
                {svc.title_en}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              aria-label="From date"
              className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-2.5 py-2 text-xs outline-none focus:border-[#014421] focus:bg-white"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              aria-label="To date"
              className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 px-2.5 py-2 text-xs outline-none focus:border-[#014421] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#013220]/10 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0E8] text-[#014421]">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#013220]">
            No inquiries match your filters
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#1B1F1C]/60">
            Adjust your search criteria or wait for new customer quote requests
            from the website.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#013220]/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#013220]/10 bg-[#F7F8F4] text-xs font-semibold uppercase tracking-wider text-[#013220]/70">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service & Property</th>
                  <th className="px-4 py-3">Area / Preferred</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#013220]/10">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-[#F7F8F4]/70"
                  >
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-semibold text-[#1B1F1C]">
                        {item.customer_name}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#1B1F1C]/65">
                        <Phone className="h-3 w-3" />
                        <span>{item.phone_number}</span>
                        <button
                          type="button"
                          onClick={() => copyPhone(item.id, item.phone_number)}
                          className="rounded p-0.5 text-[#014421] hover:bg-[#E8F0E8]"
                          title="Copy phone number"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-medium text-[#013220]">
                        {item.service_title_en || "General Cleaning"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#1B1F1C]/60">
                        {item.property_type || "Standard"} •{" "}
                        {item.language.toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs text-[#1B1F1C]/70">
                      <p className="font-medium text-[#1B1F1C]">
                        {item.area || "Doha"}
                      </p>
                      {item.preferred_date && (
                        <p className="mt-0.5 inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.preferred_date}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_BADGE[item.status] ||
                          "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right align-top">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetails(item)}
                          className="rounded-lg border border-[#013220]/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                        >
                          Details
                        </button>
                        <a
                          href={whatsappReplyUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#014421] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#013220]"
                        >
                          WhatsApp
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            aria-label="Delete inquiry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-[#013220]/10 bg-[#F7F8F4]/50 px-4 py-3 text-xs text-[#1B1F1C]/65">
            <span>
              Showing page {page} of {totalPages} ({totalCount} total inquiries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 bg-white px-2.5 py-1 font-medium hover:bg-[#E8F0E8] disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 bg-white px-2.5 py-1 font-medium hover:bg-[#E8F0E8] disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Slide-over Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#013220]/40 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#013220]/10 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#355E3B]">
                  Inquiry #{selected.id}
                </p>
                <h3 className="text-lg font-bold text-[#013220]">
                  {selected.customer_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-[#1B1F1C]/50 hover:bg-[#F7F8F4] hover:text-[#1B1F1C]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#013220]/10 bg-[#F7F8F4]/70 p-4">
                <div>
                  <p className="text-xs text-[#1B1F1C]/55">Phone</p>
                  <p className="font-semibold text-[#1B1F1C]">
                    {selected.phone_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#1B1F1C]/55">Email</p>
                  <p className="truncate font-medium text-[#1B1F1C]">
                    {selected.email || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#1B1F1C]/55">Service</p>
                  <p className="font-semibold text-[#014421]">
                    {selected.service_title_en || "General"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#1B1F1C]/55">Area & Property</p>
                  <p className="font-medium text-[#1B1F1C]">
                    {selected.area || "Doha"} • {selected.property_type || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#1B1F1C]/55">Preferred Schedule</p>
                  <p className="font-medium text-[#1B1F1C]">
                    {selected.preferred_date || "Flexible"}{" "}
                    {selected.preferred_time ? `(${selected.preferred_time})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#1B1F1C]/55">Submitted</p>
                  <p className="font-medium text-[#1B1F1C]">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selected.message && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#013220]/70">
                    Customer Notes
                  </p>
                  <p className="mt-1.5 rounded-xl border border-[#013220]/10 bg-[#F7F8F4]/40 p-3.5 text-sm leading-relaxed text-[#1B1F1C]">
                    {selected.message}
                  </p>
                </div>
              )}

              {/* Status Control */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#013220]/70">
                  Booking Status
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <select
                    value={selected.status}
                    disabled={!canWrite || updatingStatus}
                    onChange={(e) =>
                      handleStatusUpdate(selected.id, e.target.value)
                    }
                    className="flex-1 rounded-xl border border-[#013220]/15 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#014421] disabled:opacity-60"
                  >
                    {INQUIRY_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <a
                    href={whatsappReplyUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#014421] px-4 py-2 text-xs font-semibold text-white hover:bg-[#013220]"
                  >
                    Reply on WhatsApp
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="border-t border-[#013220]/10 pt-5">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#013220]/75">
                  <MessageSquarePlus className="h-4 w-4 text-[#014421]" />
                  Internal Admin Notes
                </h4>

                {canWrite && (
                  <form onSubmit={handleAddNote} className="mt-3 space-y-2">
                    <textarea
                      rows={3}
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add internal coordination notes, quotation price, or team assignment..."
                      className="w-full rounded-xl border border-[#013220]/15 bg-[#F7F8F4]/50 p-3 text-sm outline-none focus:border-[#014421] focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={savingNote || noteInput.trim().length < 2}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-xs font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
                    >
                      {savingNote && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Save Note
                    </button>
                  </form>
                )}

                <div className="mt-4 space-y-2.5">
                  {notesLoading ? (
                    <p className="text-xs text-[#1B1F1C]/50">Loading notes...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-xs text-[#1B1F1C]/50">
                      No internal notes yet.
                    </p>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-[#013220]/10 bg-[#F7F8F4]/60 p-3"
                      >
                        <div className="flex items-center justify-between text-xs text-[#1B1F1C]/60">
                          <span className="font-semibold text-[#013220]">
                            {n.author_name}
                          </span>
                          <span>
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#1B1F1C]">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Inquiry"
        description={`Are you sure you want to delete the inquiry from "${deleteTarget?.customer_name}"? This also removes its internal admin notes.`}
        confirmLabel="Delete Inquiry"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
