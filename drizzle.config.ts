import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED or DATABASE_URL must be set for Drizzle migrations."
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
