import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url: url,
  authToken: authToken,
});

export async function initDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        version INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}