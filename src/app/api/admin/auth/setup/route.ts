import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import {
  createAdminSession,
  hasAnyAdminUser,
  hashPassword,
  logAdminActivity,
} from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import { adminSetupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const initialized = await hasAnyAdminUser();
    if (initialized) {
      return NextResponse.json(
        { ok: false, error: "Admin account already initialized." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = adminSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const passwordHash = hashPassword(parsed.data.password);
    const db = getDb();

    const [created] = await db
      .insert(adminUsers)
      .values({
        email,
        name: parsed.data.name.trim(),
        password_hash: passwordHash,
        role: "SUPER_ADMIN",
        is_active: true,
        last_login_at: new Date(),
      })
      .returning({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
      });

    await createAdminSession(created.id);
    await logAdminActivity({
      adminUserId: created.id,
      action: "admin.initial_setup",
      entityType: "admin_user",
      entityId: created.id,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create admin account." },
      { status: 500 }
    );
  }
}

