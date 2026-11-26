import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let cachedPool: Pool | null = null;
let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getPool(): Pool {
  if (!cachedPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not defined.");
    }
    cachedPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 15000,
    });
    cachedPool.on("error", (err) => {
      console.error("Unexpected PostgreSQL pool error:", err.message);
    });
    attachDatabasePool(cachedPool);
  }
  return cachedPool;
}

export function getDb() {
  if (!cachedDb) {
    cachedDb = drizzle(getPool(), { schema });
  }
  return cachedDb;
}
