import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminActivityLogs, adminUsers } from "@/db/schema";
import {
  hashPassword,
  logAdminActivity,
  requireAdminApiSession,
  revokeAllUserSessions,
} from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
} from "@/lib/validation";

const PUBLIC_USER_COLUMNS = {
  id: adminUsers.id,
  email: adminUsers.email,
  name: adminUsers.name,
  role: adminUsers.role,
  is_active: adminUsers.is_active,
  last_login_at: adminUsers.last_login_at,
  created_at: adminUsers.created_at,
  updated_at: adminUsers.updated_at,
};

export async function GET() {
  const auth = await requireAdminApiSession("users:manage");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const db = getDb();
    const [users, activity] = await Promise.all([
      db
        .select(PUBLIC_USER_COLUMNS)
        .from(adminUsers)
        .orderBy(asc(adminUsers.id)),
      db
        .select({
          id: adminActivityLogs.id,
          admin_user_id: adminActivityLogs.admin_user_id,
          actor_name: adminUsers.name,
          actor_email: adminUsers.email,
          action: adminActivityLogs.action,
          entity_type: adminActivityLogs.entity_type,
          entity_id: adminActivityLogs.entity_id,
          details: adminActivityLogs.details,
          ip_address: adminActivityLogs.ip_address,
          created_at: adminActivityLogs.created_at,
        })
        .from(adminActivityLogs)
        .leftJoin(adminUsers, eq(adminActivityLogs.admin_user_id, adminUsers.id))
        .orderBy(desc(adminActivityLogs.created_at))
        .limit(25),
    ]);

    return NextResponse.json({ ok: true, items: users, activity }, { status: 200 });
  } catch (error) {
    console.error("Error listing admin users:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load administrator accounts." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiSession("users:manage");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminUserCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid user payload.",
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const db = getDb();

    const [duplicate] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        {
          ok: false,
          error: "An administrator with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(parsed.data.password);
    const [created] = await db
      .insert(adminUsers)
      .values({
        name: parsed.data.name,
        email,
        password_hash: passwordHash,
        role: parsed.data.role,
        is_active: true,
      })
      .returning(PUBLIC_USER_COLUMNS);

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "admin_user_created",
      entityType: "admin_user",
      entityId: String(created.id),
      details: { email: created.email, role: created.role },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create administrator." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiSession("users:manage");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || "Invalid user update.",
        },
        { status: 400 }
      );
    }

    const { id, role, is_active, action } = parsed.data;
    const db = getDb();

    const [target] = await db
      .select(PUBLIC_USER_COLUMNS)
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Administrator not found." },
        { status: 404 }
      );
    }

    if (action === "revoke_sessions") {
      await revokeAllUserSessions(id);
      await logAdminActivity({
        adminUserId: auth.user.id,
        action: "admin_sessions_revoked",
        entityType: "admin_user",
        entityId: String(id),
        ipAddress: getClientIp(request),
      });
      return NextResponse.json({ ok: true, item: target }, { status: 200 });
    }

    if (id === auth.user.id && role && role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { ok: false, error: "You cannot demote your own Super Admin role." },
        { status: 400 }
      );
    }

    if (id === auth.user.id && is_active === false) {
      return NextResponse.json(
        { ok: false, error: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }

    const wouldLoseSuperAdmin =
      target.role === "SUPER_ADMIN" &&
      ((role && role !== "SUPER_ADMIN") || is_active === false);

    if (wouldLoseSuperAdmin) {
      const [otherSuper] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(adminUsers)
        .where(
          and(
            eq(adminUsers.role, "SUPER_ADMIN"),
            eq(adminUsers.is_active, true),
            ne(adminUsers.id, id)
          )
        );
      if ((otherSuper?.count ?? 0) === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "At least one active Super Admin must remain.",
          },
          { status: 400 }
        );
      }
    }

    const updates: Partial<typeof adminUsers.$inferInsert> = {
      updated_at: new Date(),
    };
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const [updated] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning(PUBLIC_USER_COLUMNS);

    if (is_active === false || (role && role !== target.role)) {
      await revokeAllUserSessions(id);
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "admin_user_updated",
      entityType: "admin_user",
      entityId: String(id),
      details: { role, is_active },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, item: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update administrator." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiSession("users:manage");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = Number.parseInt(searchParams.get("id") || "", 10);
    if (!Number.isInteger(id) || id <= 0) {
      const body = await request.json().catch(() => null);
      id = Number(body?.id);
    }

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid administrator id." },
        { status: 400 }
      );
    }

    if (id === auth.user.id) {
      return NextResponse.json(
        { ok: false, error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [target] = await db
      .select(PUBLIC_USER_COLUMNS)
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Administrator not found." },
        { status: 404 }
      );
    }

    if (target.role === "SUPER_ADMIN") {
      const [otherSuper] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(adminUsers)
        .where(
          and(
            eq(adminUsers.role, "SUPER_ADMIN"),
            eq(adminUsers.is_active, true),
            ne(adminUsers.id, id)
          )
        );
      if ((otherSuper?.count ?? 0) === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "At least one active Super Admin must remain.",
          },
          { status: 400 }
        );
      }
    }

    await revokeAllUserSessions(id);
    await db.delete(adminUsers).where(eq(adminUsers.id, id));

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "admin_user_deleted",
      entityType: "admin_user",
      entityId: String(id),
      details: { email: target.email },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete administrator." },
      { status: 500 }
    );
  }
}
