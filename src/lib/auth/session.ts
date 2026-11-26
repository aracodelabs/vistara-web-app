import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { generateSecureToken, hashToken } from "./password";
import {
  hasPermission,
  normalizeRole,
  type AdminPermission,
  type AdminRole,
} from "./permissions";

if (typeof window !== "undefined") {
  throw new Error("auth/session is server-only");
}

export const SESSION_COOKIE_NAME = "vistara_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AdminSessionUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
}

export async function hasAnyAdminUser(): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminUsers);
  return (rows[0]?.count ?? 0) > 0;
}

export async function createAdminSession(adminUserId: number): Promise<void> {
  const db = getDb();
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(adminSessions).values({
    admin_user_id: adminUserId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawToken) {
      return null;
    }

    const tokenHash = hashToken(rawToken);
    const db = getDb();
    const now = new Date();

    const rows = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.admin_user_id, adminUsers.id))
      .where(
        and(
          eq(adminSessions.token_hash, tokenHash),
          gt(adminSessions.expires_at, now),
          eq(adminUsers.is_active, true)
        )
      )
      .limit(1);

    const user = rows[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
    };
  } catch {
    return null;
  }
}

export async function requireAdminSession(
  permission?: AdminPermission
): Promise<AdminSessionUser> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (permission && !hasPermission(session.role, permission)) {
    redirect("/admin");
  }
  return session;
}

export type AdminApiAuthResult =
  | { ok: true; user: AdminSessionUser }
  | { ok: false; status: 401 | 403; error: string };

export async function requireAdminApiSession(
  permission?: AdminPermission
): Promise<AdminApiAuthResult> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (permission && !hasPermission(session.role, permission)) {
    return {
      ok: false,
      status: 403,
      error: "Insufficient permissions for this action.",
    };
  }
  return { ok: true, user: session };
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    const db = getDb();
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.token_hash, hashToken(rawToken)));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function revokeAllUserSessions(
  adminUserId: number
): Promise<void> {
  const db = getDb();
  await db
    .delete(adminSessions)
    .where(eq(adminSessions.admin_user_id, adminUserId));
}
