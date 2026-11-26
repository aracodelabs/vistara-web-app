import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { adminSessions, adminUsers, passwordResetTokens } from "@/db/schema";
import { hashPassword, hashToken, logAdminActivity } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import { adminResetPasswordSchema } from "@/lib/validation";

async function findValidResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const db = getDb();

  const rows = await db
    .select({
      id: passwordResetTokens.id,
      admin_user_id: passwordResetTokens.admin_user_id,
      expires_at: passwordResetTokens.expires_at,
    })
    .from(passwordResetTokens)
    .innerJoin(
      adminUsers,
      eq(passwordResetTokens.admin_user_id, adminUsers.id)
    )
    .where(
      and(
        eq(passwordResetTokens.token_hash, tokenHash),
        isNull(passwordResetTokens.used_at),
        gt(passwordResetTokens.expires_at, now),
        eq(adminUsers.is_active, true)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get("token")?.trim() || "";
    if (!token || token.length < 16) {
      return NextResponse.json(
        { ok: false, valid: false, error: "Invalid or missing reset token." },
        { status: 400 }
      );
    }

    const record = await findValidResetToken(token);
    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          valid: false,
          error: "This reset link is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, valid: true }, { status: 200 });
  } catch (error) {
    console.error("Reset token validation error:", error);
    return NextResponse.json(
      { ok: false, valid: false, error: "Unable to validate reset link." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            parsed.error.issues[0]?.message ||
            "Please check your password inputs.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const tokenRecord = await findValidResetToken(parsed.data.token);
    if (!tokenRecord) {
      return NextResponse.json(
        {
          ok: false,
          error: "This reset link is invalid, expired, or has already been used.",
        },
        { status: 400 }
      );
    }

    const newPasswordHash = hashPassword(parsed.data.password);
    const now = new Date();
    const db = getDb();

    await db.transaction(async (tx) => {
      await tx
        .update(adminUsers)
        .set({ password_hash: newPasswordHash, updated_at: now })
        .where(eq(adminUsers.id, tokenRecord.admin_user_id));

      // Mark this token and any other active reset tokens as used
      await tx
        .update(passwordResetTokens)
        .set({ used_at: now })
        .where(
          and(
            eq(passwordResetTokens.admin_user_id, tokenRecord.admin_user_id),
            isNull(passwordResetTokens.used_at)
          )
        );

      // Revoke all active admin sessions for security
      await tx
        .delete(adminSessions)
        .where(eq(adminSessions.admin_user_id, tokenRecord.admin_user_id));
    });

    await logAdminActivity({
      adminUserId: tokenRecord.admin_user_id,
      action: "admin.password_reset_completed",
      entityType: "admin_user",
      entityId: tokenRecord.admin_user_id,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Password updated successfully. Please sign in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to reset password right now." },
      { status: 500 }
    );
  }
}
