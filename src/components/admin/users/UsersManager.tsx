"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  KeyRound,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { ADMIN_ROLES } from "@/lib/validation";
import { useAdminToast } from "@/components/admin/shared/AdminToastProvider";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminSkeleton";

interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface ActivityRow {
  id: number;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export function UsersManager({ currentUserId }: { currentUserId: number }) {
  const toast = useAdminToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "EDITOR">("ADMIN");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to load administrator accounts.");
      } else {
        setUsers(json.items || []);
        setActivity(json.activity || []);
      }
    } catch {
      toast.error("Network error loading administrators.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/users", { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!active) return;
        if (json.ok) {
          setUsers(json.items || []);
          setActivity(json.activity || []);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to create administrator.");
      } else {
        toast.success("Administrator account created.");
        setCreateOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("ADMIN");
        loadUsers();
      }
    } catch {
      toast.error("Network error creating administrator.");
    } finally {
      setCreating(false);
    }
  }

  async function patchUser(
    payload: Record<string, unknown>,
    successMsg: string
  ) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Operation blocked or failed.");
      } else {
        toast.success(successMsg);
        loadUsers();
      }
    } catch {
      toast.error("Network error updating administrator.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Unable to delete administrator.");
      } else {
        toast.success("Administrator removed.");
        setDeleteTarget(null);
        loadUsers();
      }
    } catch {
      toast.error("Network error deleting administrator.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <AdminTableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#013220]">
            Administrator Accounts & RBAC
          </h2>
          <p className="text-xs text-[#1B1F1C]/60">
            Super Admins can provision staff accounts, assign roles, revoke active sessions, and audit admin actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013220]"
        >
          <Plus className="h-4 w-4" />
          Add Administrator
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-[#013220]/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#013220]/10 bg-[#F7F8F4] text-xs font-semibold uppercase tracking-wider text-[#013220]/70">
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#013220]/10">
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-[#F7F8F4]/60">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#013220]">
                        {u.name}{" "}
                        {isSelf && (
                          <span className="ml-1 rounded-full bg-[#E8F0E8] px-2 py-0.5 text-[10px] font-bold text-[#014421]">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#1B1F1C]/60">{u.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        disabled={isSelf}
                        value={u.role}
                        onChange={(e) =>
                          patchUser(
                            { id: u.id, role: e.target.value },
                            `Role updated to ${e.target.value}.`
                          )
                        }
                        className="rounded-lg border border-[#013220]/15 bg-white px-2.5 py-1 text-xs font-semibold text-[#013220] disabled:opacity-60"
                      >
                        {ADMIN_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.is_active
                            ? "bg-[#E8F0E8] text-[#014421]"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#1B1F1C]/65">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            patchUser(
                              { id: u.id, action: "revoke_sessions" },
                              `All active sessions revoked for ${u.email}.`
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1.5 text-xs font-semibold text-[#013220] hover:bg-[#E8F0E8]"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Revoke Sessions
                        </button>

                        {!isSelf && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                patchUser(
                                  { id: u.id, is_active: !u.is_active },
                                  u.is_active
                                    ? "Administrator suspended."
                                    : "Administrator reactivated."
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-[#013220]/15 px-2.5 py-1.5 text-xs font-semibold text-[#1B1F1C] hover:bg-[#F7F8F4]"
                            >
                              {u.is_active ? (
                                <>
                                  <UserX className="h-3.5 w-3.5 text-amber-600" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 text-[#014421]" />
                                  Enable
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u)}
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                              aria-label="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Activity Log */}
      <div className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#013220]">
          <Activity className="h-4 w-4 text-[#014421]" />
          Recent Admin Activity Audit Log
        </h3>

        {activity.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#1B1F1C]/50">
            No activity logs recorded yet.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-[#013220]/10 text-xs">
            {activity.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div>
                  <span className="font-semibold text-[#013220]">
                    {log.actor_name || log.actor_email || "System"}
                  </span>{" "}
                  <span className="text-[#1B1F1C]/75">performed</span>{" "}
                  <span className="rounded bg-[#E8F0E8] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#014421]">
                    {log.action}
                  </span>{" "}
                  <span className="text-[#1B1F1C]/65">
                    on {log.entity_type}
                    {log.entity_id ? ` #${log.entity_id}` : ""}
                  </span>
                </div>
                <span className="text-[#1B1F1C]/50">
                  {log.ip_address ? `${log.ip_address} • ` : ""}
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#013220]/45 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#013220]/10 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#013220]/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#014421]" />
                <h3 className="text-base font-bold text-[#013220]">
                  Add Administrator Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1 text-[#1B1F1C]/50 hover:bg-[#F7F8F4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#013220]/80">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#013220]/80">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#013220]/80">
                  Temporary Password (min 10 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#013220]/80">
                  RBAC Role *
                </label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value as "SUPER_ADMIN" | "ADMIN" | "EDITOR"
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#013220]/15 px-3 py-2 outline-none focus:border-[#014421]"
                >
                  <option value="ADMIN">ADMIN (Inquiries, Services, Reviews)</option>
                  <option value="EDITOR">EDITOR (Content, SEO, Reviews, Media)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-[#013220]/15 px-4 py-2 font-medium hover:bg-[#F7F8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#014421] px-4 py-2 font-semibold text-white hover:bg-[#013220] disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Administrator"
        description={`Remove "${deleteTarget?.email}" and revoke all of their sessions?`}
        confirmLabel="Delete User"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
