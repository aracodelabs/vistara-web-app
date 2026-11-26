import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers, passwordResetTokens } from "@/db/schema";
import {
  generateSecureToken,
  hashToken,
  logAdminActivity,
} from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { adminForgotPasswordSchema } from "@/lib/validation";

const RESET_WINDOW_MS = 15 * 60 * 1000;
const MAX_RESET_REQUESTS = 5;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const resetRateMap = new Map<string, number[]>();

const GENERIC_SUCCESS_MESSAGE =
  "If an active administrator account matches that email address, password reset instructions have been sent.";

function isResetRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (resetRateMap.get(key) ?? []).filter(
    (t) => now - t < RESET_WINDOW_MS
  );
  if (timestamps.length >= MAX_RESET_REQUESTS) {
    resetRateMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  resetRateMap.set(key, timestamps);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const clientIp = getClientIp(request);

    if (isResetRateLimited(`${clientIp}:${email}`)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many password reset requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    const db = getDb();
    const users = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        is_active: adminUsers.is_active,
      })
      .from(adminUsers)
      .where(and(eq(adminUsers.email, email), eq(adminUsers.is_active, true)))
      .limit(1);

    const user = users[0];
    if (user) {
      const now = new Date();
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await db.transaction(async (tx) => {
        // Invalidate previous active reset tokens for this user
        await tx
          .update(passwordResetTokens)
          .set({ used_at: now })
          .where(
            and(
              eq(passwordResetTokens.admin_user_id, user.id),
              isNull(passwordResetTokens.used_at)
            )
          );

        await tx.insert(passwordResetTokens).values({
          admin_user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });
      });

      const baseUrl = (
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000"
      ).replace(/\/+$/, "");
      const resetUrl = `${baseUrl}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;

      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      await logAdminActivity({
        adminUserId: user.id,
        action: "admin.password_reset_requested",
        entityType: "admin_user",
        entityId: user.id,
        details: { emailDispatched: emailResult.sent },
        ipAddress: clientIp,
      });
    }

    return NextResponse.json(
      { ok: true, message: GENERIC_SUCCESS_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
