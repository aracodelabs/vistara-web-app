import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import {
  createAdminSession,
  logAdminActivity,
  verifyPassword,
} from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import { adminLoginSchema } from "@/lib/validation";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedAttempts = new Map<string, number[]>();

function isLoginRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (failedAttempts.get(key) ?? []).filter(
    (ts) => now - ts < LOGIN_WINDOW_MS
  );
  failedAttempts.set(key, recent);
  return recent.length >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const recent = (failedAttempts.get(key) ?? []).filter(
    (ts) => now - ts < LOGIN_WINDOW_MS
  );
  recent.push(now);
  failedAttempts.set(key, recent);

  if (failedAttempts.size > 500) {
    for (const [k, list] of failedAttempts.entries()) {
      const valid = list.filter((ts) => now - ts < LOGIN_WINDOW_MS);
      if (valid.length === 0) failedAttempts.delete(k);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const clientIp = getClientIp(request);
    const rateKey = `${clientIp}:${email}`;

    if (isLoginRateLimited(rateKey)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Too many failed sign-in attempts. Please wait 15 minutes and try again.",
        },
        { status: 429 }
      );
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.email, email), eq(adminUsers.is_active, true)))
      .limit(1);

    const user = rows[0];
    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      recordFailedAttempt(rateKey);
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    failedAttempts.delete(rateKey);

    await db
      .update(adminUsers)
      .set({ last_login_at: new Date(), updated_at: new Date() })
      .where(eq(adminUsers.id, user.id));

    await createAdminSession(user.id);
    await logAdminActivity({
      adminUserId: user.id,
      action: "admin.login",
      entityType: "admin_user",
      entityId: user.id,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to sign in right now." },
      { status: 500 }
    );
  }
}

