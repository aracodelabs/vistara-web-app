import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { adminUsers } from "./schema";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const email = (process.env.ADMIN_INITIAL_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD || "";
  const name = (process.env.ADMIN_INITIAL_NAME || "Vistara Super Admin").trim();

  if (!email || !password) {
    throw new Error(
      "ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD must be set to bootstrap an admin user."
    );
  }
  if (password.length < 10) {
    throw new Error("ADMIN_INITIAL_PASSWORD must be at least 10 characters.");
  }

  const db = getDb();
  const passwordHash = hashPassword(password);

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(adminUsers)
      .set({
        name,
        password_hash: passwordHash,
        is_active: true,
        role: "SUPER_ADMIN",
        updated_at: new Date(),
      })
      .where(eq(adminUsers.id, existing[0].id));
    console.log(`Updated SUPER_ADMIN ${email} (id=${existing[0].id}).`);
  } else {
    const [inserted] = await db
      .insert(adminUsers)
      .values({
        email,
        name,
        password_hash: passwordHash,
        role: "SUPER_ADMIN",
        is_active: true,
      })
      .returning({ id: adminUsers.id });
    console.log(`Created SUPER_ADMIN ${email} (id=${inserted.id}).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Admin bootstrap failed:", err);
    process.exit(1);
  });

