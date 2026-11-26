"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  FileText,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";

interface ContentSection {
  id: number;
  section_key: string;
  content_en: Record<string, unknown>;
  content_ar: Record<string, unknown>;
  updated_at: string;
}

interface FaqItem {
  id: number;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  sort_order: number;
  is_active: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Homepage Hero",
  about: "About Vistara",
  why_choose: "Why Choose Us",
  contact: "Contact Section",
  footer: "Footer Content",
};

export function ContentManager({ canWrite }: { canWrite: boolean }) {
  const toast = useAdminToast();
  const [activeTab, setActiveTab] = useState<"sections" | "faqs">("sections");
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedKey, setSelectedKey] = useState("hero");
  const [enJson, setEnJson] = useState<Record<string, unknown>>({});
  const [arJson, setArJson] = useState<Record<string, unknown>>({});
  const [savingSection, setSavingSection] = useState(false);

  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [qEn, setQEn] = useState("");
  const [qAr, setQAr] = useState("");
  const [aEn, setAEn] = useState("");
  const [aAr, setAAr] = useState("");
  const [faqOrder, setFaqOrder] = useState(0);
  const [faqActive, setFaqActive] = useState(true);
  const [savingFaq, setSavingFaq] = useState(false);

  const [deleteFaqTarget, setDeleteFaqTarget] = useState<FaqItem | null>(null);
  const [deletingFaq, setDeletingFaq] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, faqsRes] = await Promise.all([
        fetch("/api/admin/content", { cache: "no-store" }),
        fetch("/api/admin/faqs", { cache: "no-store" }),
      ]);
      const contentData = await contentRes.json().catch(() => ({}));
      const faqsData = await faqsRes.json().catch(() => ({}));

      if (contentRes.ok && contentData.ok) {
        const list: ContentSection[] = contentData.items || [];
        setSections(list);
        const active =
          list.find((s) => s.section_key === selectedKey) || list[0];
        if (active) {
          setSelectedKey(active.section_key);
          setEnJson(active.content_en || {});
          setArJson(active.content_ar || {});
        }
      }
      if (faqsRes.ok && faqsData.ok) {
        setFaqs(faqsData.items || []);
      }
    } catch {
      toast.error("Unable to load website content.");
    } finally {
      setLoading(false);
    }
  }, [selectedKey, toast]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/content", { cache: "no-store" }).then((r) =>
        r.json().catch(() => ({}))
      ),
      fetch("/api/admin/faqs", { cache: "no-store" }).then((r) =>
        r.json().catch(() => ({}))
      ),
    ])
      .then(([contentData, faqsData]) => {
        if (!active) return;
        if (contentData.ok) {
          const list: ContentSection[] = contentData.items || [];
          setSections(list);
          const first = list[0];
          if (first) {
            setSelectedKey(first.section_key);
            setEnJson(first.content_en || {});
            setArJson(first.content_ar || {});
          }
        }
        if (faqsData.ok) {
          setFaqs(faqsData.items || []);
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

  function selectSection(sec: ContentSection) {
    setSelectedKey(sec.section_key);
    setEnJson(sec.content_en || {});
    setArJson(sec.content_ar || {});
  }

  async function handleSaveSection(e: React.FormEvent) {
    e.preventDefault();
    setSavingSection(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_key: selectedKey,
          content_en: enJson,
          content_ar: arJson,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to save content.");
      } else {
        toast.success(
          `Saved "${SECTION_LABELS[selectedKey] || selectedKey}" content.`
        );
        setSections((prev) =>
          prev.map((s) => (s.section_key === selectedKey ? json.item : s))
        );
      }
    } catch {
      toast.error("Network error saving content.");
    } finally {
      setSavingSection(false);
    }
  }

  function openCreateFaq() {
    setEditingFaq(null);
    setQEn("");
    setQAr("");
    setAEn("");
    setAAr("");
    setFaqOrder(faqs.length + 1);
    setFaqActive(true);
    setFaqModalOpen(true);
  }

  function openEditFaq(item: FaqItem) {
    setEditingFaq(item);
    setQEn(item.question_en);
    setQAr(item.question_ar);
    setAEn(item.answer_en);
    setAAr(item.answer_ar);
    setFaqOrder(item.sort_order);
    setFaqActive(item.is_active);
    setFaqModalOpen(true);
  }

  async function handleSaveFaq(e: React.FormEvent) {
    e.preventDefault();
    setSavingFaq(true);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: editingFaq ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingFaq ? { id: editingFaq.id } : {}),
          question_en: qEn.trim(),
          question_ar: qAr.trim(),
          answer_en: aEn.trim(),
          answer_ar: aAr.trim(),
          sort_order: Number(faqOrder) || 0,
          is_active: faqActive,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to save FAQ.");
      } else {
        toast.success(editingFaq ? "FAQ updated." : "FAQ created.");
        setFaqModalOpen(false);
        loadAll();
      }
    } catch {
      toast.error("Network error saving FAQ.");
    } finally {
      setSavingFaq(false);
    }
  }

  async function handleDeleteFaq() {
    if (!deleteFaqTarget) return;
    setDeletingFaq(true);
    try {
      const res = await fetch(`/api/admin/faqs?id=${deleteFaqTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to delete FAQ.");
      } else {
        toast.success("FAQ deleted.");
        setDeleteFaqTarget(null);
        loadAll();
      }
    } catch {
      toast.error("Network error deleting FAQ.");
    } finally {
      setDeletingFaq(false);
    }
  }

  const stringKeys = Object.keys(enJson).filter(
    (k) => typeof enJson[k] === "string"
  );

  if (loading) {
    return <AdminTableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-5">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#013220]/10 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "sections"
                ? "bg-[#014421] text-white"
                : "bg-[#F7F8F4] text-[#1B1F1C]/75 hover:bg-[#E8F0E8]"
            }`}
          >
            <FileText className="h-4 w-4" />
            Page Sections ({sections.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("faqs")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "faqs"
                ? "bg-[#014421] text-white"
                : "bg-[#F7F8F4] text-[#1B1F1C]/75 hover:bg-[#E8F0E8]"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            FAQs ({faqs.length})
          </button>
        </div>

        {activeTab === "faqs" && canWrite && (
          <button
            type="button"
            onClick={openCreateFaq}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#014421] px-4 py-2 text-xs font-semibold text-white hover:bg-[#013220]"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        )}
      </div>

      {activeTab === "sections" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* Section List */}
          <div className="space-y-1.5 rounded-2xl border border-[#013220]/10 bg-white p-3 shadow-xs lg:col-span-1">
            {sections.map((sec) => (
              <button
                key={sec.section_key}
                type="button"
                onClick={() => selectSection(sec)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                  selectedKey === sec.section_key
                    ? "bg-[#014421] text-white"
                    : "text-[#1B1F1C]/80 hover:bg-[#F7F8F4]"
                }`}
              >
                <span>
                  {SECTION_LABELS[sec.section_key] || sec.section_key}
                </span>
              </button>
            ))}
          </div>

          {/* Bilingual Editor */}
          <form
            onSubmit={handleSaveSection}
            className="space-y-4 rounded-2xl border border-[#013220]/10 bg-white p-6 shadow-xs lg:col-span-3"
          >
            <div className="flex items-center justify-between border-b border-[#013220]/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#013220]">
                  {SECTION_LABELS[selectedKey] || selectedKey}
                </h3>
                <p className="text-xs text-[#1B1F1C]/60">
                  Edit bilingual English and Arabic copy stored in Neon.
                </p>
              </div>
              {canWrite && (
                <button
                  type="submit"
                  disabled={savingSection}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-xs font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
                >
                  {savingSection ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Section
                </button>
              )}
            </div>

            <div className="space-y-4">
              {stringKeys.map((fieldKey) => (
                <div
                  key={fieldKey}
                  className="grid grid-cols-1 gap-4 rounded-xl border border-[#013220]/10 bg-[#F7F8F4]/50 p-4 md:grid-cols-2"
                >
                  <div>
                    <label className="block text-xs font-semibold capitalize text-[#013220]/80">
                      {fieldKey} (English)
                    </label>
                    <textarea
                      rows={
                        String(enJson[fieldKey] || "").length > 90 ? 3 : 2
                      }
                      disabled={!canWrite}
                      value={String(enJson[fieldKey] || "")}
                      onChange={(e) =>
                        setEnJson((prev) => ({
                          ...prev,
                          [fieldKey]: e.target.value,
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#013220]/15 bg-white p-2.5 text-sm outline-none focus:border-[#014421] disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold capitalize text-[#013220]/80">
                      {fieldKey} (Arabic)
                    </label>
                    <textarea
                      rows={
                        String(arJson[fieldKey] || "").length > 90 ? 3 : 2
                      }
                      dir="rtl"
                      disabled={!canWrite}
                      value={String(arJson[fieldKey] || "")}
                      onChange={(e) =>
                        setArJson((prev) => ({
                          ...prev,
                          [fieldKey]: e.target.value,
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#013220]/15 bg-white p-2.5 text-sm outline-none focus:border-[#014421] disabled:opacity-70"
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs sm:flex-row sm:items-start"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#E8F0E8] px-2.5 py-0.5 text-[11px] font-bold text-[#014421]">
                    #{faq.sort_order}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      faq.is_active
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {faq.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#013220]">
                  {faq.question_en}
                </h4>
                <p className="text-xs text-[#1B1F1C]/75">{faq.answer_en}</p>
                <p className="pt-1 text-xs font-semibold text-[#355E3B]" dir="rtl">
                  {faq.question_ar}
                </p>
              </div>

              {canWrite && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditFaq(faq)}
                    className="rounded-xl border border-[#013220]/15 p-2 text-[#013220] hover:bg-[#E8F0E8]"
                    aria-label="Edit FAQ"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteFaqTarget(faq)}
                    className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    aria-label="Delete FAQ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAQ Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#013220]/45 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#013220]/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#013220]/10 px-6 py-4">
              <h3 className="text-base font-bold text-[#013220]">
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
              </h3>
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="rounded-lg p-1 text-[#1B1F1C]/50 hover:bg-[#F7F8F4]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveFaq}
              className="flex-1 space-y-4 overflow-y-auto p-6 text-sm"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Question (EN) *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={qEn}
                    onChange={(e) => setQEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Question (AR) *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    dir="rtl"
                    value={qAr}
                    onChange={(e) => setQAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Answer (EN) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    value={aEn}
                    onChange={(e) => setAEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 outline-none focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#013220]/80">
                    Answer (AR) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    dir="rtl"
                    value={aAr}
                    onChange={(e) => setAAr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#013220]/15 p-3 outline-none focus:border-[#014421]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#013220]">
                  <input
                    type="checkbox"
                    checked={faqActive}
                    onChange={(e) => setFaqActive(e.target.checked)}
                    className="h-4 w-4 accent-[#014421]"
                  />
                  Active FAQ
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#013220]">
                    Order:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={faqOrder}
                    onChange={(e) => setFaqOrder(Number(e.target.value))}
                    className="w-20 rounded-xl border border-[#013220]/15 px-2.5 py-1.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#013220]/10 pt-4">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="rounded-xl border border-[#013220]/15 px-4 py-2 text-sm font-medium hover:bg-[#F7F8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFaq}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
                >
                  {savingFaq && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingFaq ? "Update FAQ" : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteFaqTarget)}
        title="Delete FAQ"
        description={`Delete FAQ "${deleteFaqTarget?.question_en}"?`}
        confirmLabel="Delete FAQ"
        loading={deletingFaq}
        onConfirm={handleDeleteFaq}
        onCancel={() => setDeleteFaqTarget(null)}
      />
    </div>
  );
}
