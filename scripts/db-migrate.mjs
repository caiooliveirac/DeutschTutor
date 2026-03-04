#!/usr/bin/env node
/**
 * Database migration runner.
 * Applies Drizzle schema to PostgreSQL.
 *
 * Usage: node scripts/db-migrate.mjs
 * Requires: DATABASE_URL env var
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://deutschtutor:deutschtutor@localhost:5432/deutschtutor";

async function main() {
  console.log("[migrate] Connecting to database...");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  console.log("[migrate] Running migrations from ./drizzle/migrations ...");
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });

  console.log("[migrate] Done!");
  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
