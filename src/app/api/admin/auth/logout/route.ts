import { NextRequest, NextResponse } from "next/server";
import {
  destroyAdminSession,
  getAdminSession,
  logAdminActivity,
} from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    await destroyAdminSession();
    if (session) {
      await logAdminActivity({
        adminUserId: session.id,
        action: "admin.logout",
        entityType: "admin_user",
        entityId: session.id,
        ipAddress: getClientIp(request),
      });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to sign out." },
      { status: 500 }
    );
  }
}

