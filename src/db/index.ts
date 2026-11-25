import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }
  const sql = neon(connectionString);
  return drizzle({ client: sql, schema });
}

let cachedDb: ReturnType<typeof getDatabase> | null = null;

export function getDb() {
  if (!cachedDb) {
    cachedDb = getDatabase();
  }
  return cachedDb;
}
