import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url: url,
  authToken: authToken,
});

export async function initDb() {
  try {
    // 1. Пользователи
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        bio TEXT DEFAULT '',
        created_at INTEGER NOT NULL
      );
    `);

    // 2. Посты (Агенты) с поддержкой model и tags
    await db.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        model TEXT DEFAULT 'any',
        tags TEXT DEFAULT '',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 3. Версии промптов
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

    // 4. Комментарии
    await db.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        prompt_version INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 5. Лайки
    await db.execute(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, agent_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );
    `);

    // БЕЗОПАСНАЯ МИГРАЦИЯ ДЛЯ СУЩЕСТВУЮЩИХ БД
    try {
      await db.execute("ALTER TABLE agents ADD COLUMN user_id TEXT DEFAULT 'system_default'");
    } catch (e) {}

    try {
      await db.execute("ALTER TABLE agents ADD COLUMN model TEXT DEFAULT 'any'");
    } catch (e) {}

    try {
      await db.execute("ALTER TABLE agents ADD COLUMN tags TEXT DEFAULT ''");
    } catch (e) {}

    // Индексы для оптимизации
    await db.execute("CREATE INDEX IF NOT EXISTS idx_comments_agent ON comments(agent_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_likes_agent ON likes(agent_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_agents_model ON agents(model)");

  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}