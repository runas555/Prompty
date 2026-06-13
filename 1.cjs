const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const createdFiles = [];
const createdDirs = [];

// Вспомогательная функция для создания папок с отслеживанием изменений
function makeDir(dirPath) {
  const resolvedPath = path.resolve(dirPath);
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
    createdDirs.push(resolvedPath);
    console.log(`[DIR CREATED] ${dirPath}`);
  }
}

// Вспомогательная функция для записи файлов с отслеживанием изменений
function writeFile(filePath, content) {
  const resolvedPath = path.resolve(filePath);
  const dirPath = path.dirname(resolvedPath);
  makeDir(dirPath);
  fs.writeFileSync(resolvedPath, content, 'utf8');
  createdFiles.push(resolvedPath);
  console.log(`[FILE CREATED] ${filePath}`);
}

// Функция отката изменений при возникновении критических ошибок во время выполнения
function rollback(error) {
  console.error('\n[FATAL ERROR] Произошел сбой во время инициализации социальной сети PromptSocial.');
  console.error(error);
  console.log('\n[ROLLBACK] Начинается процесс очистки созданных файлов...');

  // Удаляем файлы
  for (const file of createdFiles.reverse()) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`[CLEANED] Файл удален: ${path.relative(process.cwd(), file)}`);
      }
    } catch (e) {
      console.error(`Не удалось удалить файл ${file}:`, e.message);
    }
  }

  // Удаляем директории
  for (const dir of createdDirs.reverse()) {
    try {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        console.log(`[CLEANED] Папка удалена: ${path.relative(process.cwd(), dir)}`);
      }
    } catch (e) {
      console.error(`Не удалось удалить папку ${dir}:`, e.message);
    }
  }

  console.log('[ROLLBACK COMPLETED] Система возвращена в исходное состояние.\n');
  process.exit(1);
}

try {
  console.log('=== НАЧАЛО ИНИЦИАЛИЗАЦИИ СОЦИАЛЬНОЙ СЕТИ PROMPTSOCIAL ===\n');

  // 1. Создание package.json
  const packageJsonContent = JSON.stringify({
    name: "promptsocial",
    version: "1.0.0",
    private: true,
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    },
    dependencies: {
      "next": "14.2.3",
      "react": "18.3.1",
      "react-dom": "18.3.1",
      "@libsql/client": "0.6.2",
      "lucide-react": "0.378.0",
      "bcryptjs": "2.4.3",
      "jsonwebtoken": "9.0.2",
      "tailwindcss": "3.4.3",
      "postcss": "8.4.38",
      "autoprefixer": "10.4.19"
    },
    devDependencies: {
      "typescript": "5.4.5",
      "@types/node": "20.12.12",
      "@types/react": "18.3.3",
      "@types/react-dom": "18.3.0",
      "@types/bcryptjs": "2.4.6",
      "@types/jsonwebtoken": "9.0.6"
    }
  }, null, 2);
  writeFile('package.json', packageJsonContent);

  // 2. Создание tsconfig.json
  const tsconfigContent = JSON.stringify({
    compilerOptions: {
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [
        {
          name: "next"
        }
      ],
      paths: {
        "@/*": ["./src/*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2);
  writeFile('tsconfig.json', tsconfigContent);

  // 3. Создание next.config.mjs (С обязательным обходом Windows путей для Watchpack)
  const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/System Volume Information/**',
          '**/$RECYCLE.BIN/**',
          '**/*.sys'
        ]
      };
    }
    return config;
  }
};

export default nextConfig;`;
  writeFile('next.config.mjs', nextConfigContent);

  // 4. Создание postcss.config.mjs
  const postcssContent = `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;`;
  writeFile('postcss.config.mjs', postcssContent);

  // 5. Создание tailwind.config.ts (С расширенной палитрой для PromptSocial)
  const tailwindContent = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#080c14",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
        },
        indigo: {
          500: "#6366f1",
          600: "#4f46e5",
          400: "#818cf8",
          950: "#312e81"
        },
        cyan: {
          500: "#06b6d4",
          600: "#0891b2",
          400: "#22d3ee",
          950: "#164e63"
        }
      },
    },
  },
  plugins: [],
};
export default config;`;
  writeFile('tailwind.config.ts', tailwindContent);

  // 6. Создание .env.example
  const randomJwtSecret = "sec_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const envContent = `JWT_SECRET=${randomJwtSecret}
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=`;
  writeFile('.env.example', envContent);
  writeFile('.env', envContent);

  // 7. Скрипт БД: src/lib/db.ts (Реляционная база данных для соцсети)
  const dbLibContent = `import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url: url,
  authToken: authToken,
});

export async function initDb() {
  try {
    // 1. Пользователи
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        bio TEXT DEFAULT '',
        created_at INTEGER NOT NULL
      );
    \`);

    // 2. Посты (Агенты)
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    \`);

    // 3. Версии промптов
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        version INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );
    \`);

    // 4. Комментарии
    await db.execute(\`
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
    \`);

    // 5. Лайки
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS likes (
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, agent_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );
    \`);

    // Индексы для оптимизации селектов в ленте
    await db.execute("CREATE INDEX IF NOT EXISTS idx_comments_agent ON comments(agent_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_likes_agent ON likes(agent_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id)");

  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}`;
  writeFile('src/lib/db.ts', dbLibContent);

  // 8. Скрипт авторизации: src/lib/auth.ts
  const authLibContent = `import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_local_jwt_fallback_secret_key";

export interface AuthUser {
  id: string;
  username: string;
}

export function verifyAuth(request: NextRequest): AuthUser | null {
  const cookieHeader = request.cookies.get("auth_token");
  if (!cookieHeader) return null;

  try {
    const token = cookieHeader.value;
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}`;
  writeFile('src/lib/auth.ts', authLibContent);

  // 9. Утилиты: src/lib/utils.ts (Градиенты аватаров и форматирование дат)
  const utilsLibContent = `export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateUUID(): string {
  return "id_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Детерминированная цветовая палитра для аватаров
export function getUserGradient(username: string): string {
  const gradients = [
    "from-indigo-500 to-cyan-500",
    "from-purple-500 to-indigo-600",
    "from-cyan-500 to-teal-500",
    "from-pink-500 to-rose-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}`;
  writeFile('src/lib/utils.ts', utilsLibContent);

  // 10. Глобальные стили: src/app/globals.css
  const globalsCssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #080c14;
  color: #f1f5f9;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #080c14;
}

::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

/* Эффект матового стекла (glassmorphism) */
.glass {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}`;
  writeFile('src/app/globals.css', globalsCssContent);

  // 11. Макет приложения: src/app/layout.tsx
  const layoutContent = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptSocial - Социальная сеть промпт-инженеров",
  description: "Делитесь системными инструкциями, оценивайте, версионируйте и комментируйте лучшие промпты.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-300">
        {children}
      </body>
    </html>
  );
}`;
  writeFile('src/app/layout.tsx', layoutContent);

  // 12. API Авторизация - Регистрация: src/app/api/auth/register/route.ts
  const apiRegisterContent = `import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await initDb();
    const { username, password } = await request.json();

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: "Все поля формы обязательны" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: "Имя должно содержать не менее 3 символов" }, { status: 400 });
    }
    if (password.trim().length < 6) {
      return NextResponse.json({ error: "Пароль должен содержать не менее 6 символов" }, { status: 400 });
    }

    const userCheck = await db.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [cleanUsername]
    });

    if (userCheck.rows.length > 0) {
      return NextResponse.json({ error: "Данное имя пользователя уже зарегистрировано" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);
    const userId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [userId, cleanUsername, passwordHash, now]
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/auth/register/route.ts', apiRegisterContent);

  // 13. API Авторизация - Вход: src/app/api/auth/login/route.ts
  const apiLoginContent = `import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_local_jwt_fallback_secret_key";

export async function POST(request: Request) {
  try {
    await initDb();
    const { username, password } = await request.json();

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    const result = await db.execute({
      sql: "SELECT id, username, password_hash, bio FROM users WHERE username = ?",
      args: [cleanUsername]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Неправильное имя пользователя или пароль" }, { status: 401 });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password.trim(), user.password_hash as string);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Неправильное имя пользователя или пароль" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, bio: user.bio || "" }
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/auth/login/route.ts', apiLoginContent);

  // 14. API Авторизация - Выход: src/app/api/auth/logout/route.ts
  const apiLogoutContent = `import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0
  });
  return response;
}`;
  writeFile('src/app/api/auth/logout/route.ts', apiLogoutContent);

  // 15. API Авторизация - Личный Профиль: src/app/api/auth/me/route.ts
  const apiMeContent = `import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const verified = verifyAuth(request);
    if (!verified) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userQuery = await db.execute({
      sql: "SELECT id, username, bio FROM users WHERE id = ?",
      args: [verified.id]
    });

    if (userQuery.rows.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = userQuery.rows[0];
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id as string,
        username: user.username as string,
        bio: (user.bio as string) || ""
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}`;
  writeFile('src/app/api/auth/me/route.ts', apiMeContent);

  // 16. API Авторизация - Обновление Биографии: src/app/api/auth/bio/route.ts
  const apiBioContent = `import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db, initDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { bio } = await request.json();

    await db.execute({
      sql: "UPDATE users SET bio = ? WHERE id = ?",
      args: [bio ? bio.trim() : "", user.id]
    });

    return NextResponse.json({ success: true, bio: bio ? bio.trim() : "" });
  } catch (error: any) {
    console.error("Bio Update Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/auth/bio/route.ts', apiBioContent);

  // 17. API Бизнес-Логика - Получение и публикация агентов (Социальный Feed): src/app/api/agents/route.ts
  const apiAgentsRouteContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    
    // Считываем параметр фильтрации по категории
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";

    let sqlQuery = \`
      SELECT 
        a.id, 
        a.user_id,
        a.name, 
        a.category,
        a.created_at,
        u.username,
        u.bio,
        pv.prompt, 
        pv.version, 
        pv.created_at as updated_at,
        (SELECT COUNT(*) FROM likes WHERE agent_id = a.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE agent_id = a.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE agent_id = a.id AND user_id = ?) as has_liked
      FROM agents a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN prompt_versions pv ON pv.agent_id = a.id
      WHERE pv.version = (
        SELECT MAX(version) FROM prompt_versions WHERE agent_id = a.id
      )
    \`;

    const args: any[] = [user ? user.id : "guest_unauthorized"];

    if (category !== "all") {
      sqlQuery += " AND a.category = ?";
      args.push(category);
    }

    sqlQuery += " ORDER BY a.created_at DESC";

    const queryResult = await db.execute({ sql: sqlQuery, args });

    const feed = queryResult.rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      category: row.category as string,
      createdAt: Number(row.created_at),
      username: (row.username as string) || "Deleted User",
      userBio: (row.bio as string) || "",
      prompt: row.prompt as string,
      version: Number(row.version),
      updatedAt: Number(row.updated_at),
      likeCount: Number(row.like_count),
      commentCount: Number(row.comment_count),
      hasLiked: Number(row.has_liked) > 0
    }));

    return NextResponse.json(feed);
  } catch (error: any) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Пожалуйста, войдите в систему" }, { status: 401 });
    }

    const { name, prompt, category } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim() || !category) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const agentId = generateUUID();
    const versionId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO agents (id, user_id, name, category, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [agentId, user.id, name.trim(), category, now]
    });

    await db.execute({
      sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [versionId, agentId, prompt.trim(), 1, now]
    });

    return NextResponse.json({ success: true, agentId }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/route.ts', apiAgentsRouteContent);

  // 18. API Бизнес-Логика - Обновление и удаление постов: src/app/api/agents/[id]/route.ts
  const apiAgentIdRouteContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Запрещено без авторизации" }, { status: 401 });
    }

    const { name, prompt, category } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim() || !category) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Пост не найден или доступ ограничен" }, { status: 404 });
    }

    await db.execute({
      sql: "UPDATE agents SET name = ?, category = ? WHERE id = ?",
      args: [name.trim(), category, id]
    });

    const lastVersionResult = await db.execute({
      sql: "SELECT MAX(version) as max_ver FROM prompt_versions WHERE agent_id = ?",
      args: [id]
    });

    const currentMaxVersion = Number(lastVersionResult.rows[0].max_ver) || 0;

    const lastPromptResult = await db.execute({
      sql: "SELECT prompt FROM prompt_versions WHERE agent_id = ? AND version = ?",
      args: [id, currentMaxVersion]
    });

    const lastPromptText = lastPromptResult.rows[0]?.prompt as string;
    let nextVersion = currentMaxVersion;
    const now = Date.now();

    if (lastPromptText !== prompt.trim()) {
      nextVersion = currentMaxVersion + 1;
      const versionId = generateUUID();
      await db.execute({
        sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [versionId, id, prompt.trim(), nextVersion, now]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/agents/[id] error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Доступ ограничен" }, { status: 401 });
    }

    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Пост не найден или доступ ограничен" }, { status: 404 });
    }

    await db.execute({ sql: "DELETE FROM agents WHERE id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM prompt_versions WHERE agent_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM comments WHERE agent_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM likes WHERE agent_id = ?", args: [id] });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/agents/[id] error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/[id]/route.ts', apiAgentIdRouteContent);

  // 19. API Социальное взаимодействие - Лайки: src/app/api/agents/[id]/like/route.ts
  const apiAgentLikeContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { id: agentId } = params;

    // Вставляем запись лайка, игнорируя дублирования на уровне СУБД
    await db.execute({
      sql: "INSERT OR IGNORE INTO likes (user_id, agent_id, created_at) VALUES (?, ?, ?)",
      args: [user.id, agentId, Date.now()]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Like Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { id: agentId } = params;

    await db.execute({
      sql: "DELETE FROM likes WHERE user_id = ? AND agent_id = ?",
      args: [user.id, agentId]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unlike Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/[id]/like/route.ts', apiAgentLikeContent);

  // 20. API Социальное взаимодействие - Комментарии: src/app/api/agents/[id]/comments/route.ts
  const apiAgentCommentsContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id: agentId } = params;

    // Считываем комментарии с профилями авторов
    const commentsResult = await db.execute({
      sql: \`
        SELECT 
          c.id, 
          c.text, 
          c.prompt_version, 
          c.created_at, 
          u.username
        FROM comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.agent_id = ?
        ORDER BY c.created_at DESC
      \`,
      args: [agentId]
    });

    const comments = commentsResult.rows.map(row => ({
      id: row.id as string,
      text: row.text as string,
      promptVersion: Number(row.prompt_version),
      createdAt: Number(row.created_at),
      username: (row.username as string) || "Deleted User"
    }));

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error("GET Comments error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Только зарегистрированные пользователи могут оставлять комментарии" }, { status: 401 });
    }

    const { id: agentId } = params;
    const { text, promptVersion } = await request.json();

    if (!text || !text.trim() || !promptVersion) {
      return NextResponse.json({ error: "Введите текст комментария" }, { status: 400 });
    }

    const commentId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO comments (id, agent_id, user_id, text, prompt_version, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [commentId, agentId, user.id, text.trim(), promptVersion, now]
    });

    return NextResponse.json({
      id: commentId,
      text: text.trim(),
      promptVersion,
      createdAt: now,
      username: user.username
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST Comment Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/[id]/comments/route.ts', apiAgentCommentsContent);

  // 21. API Социальное взаимодействие - Исторические версии промпта: src/app/api/agents/[id]/versions/route.ts
  const apiAgentVersionsContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id: agentId } = params;

    const result = await db.execute({
      sql: "SELECT id, prompt, version, created_at FROM prompt_versions WHERE agent_id = ? ORDER BY version DESC",
      args: [agentId]
    });

    const versions = result.rows.map(row => ({
      id: row.id as string,
      prompt: row.prompt as string,
      version: Number(row.version),
      createdAt: Number(row.created_at)
    }));

    return NextResponse.json(versions);
  } catch (error: any) {
    console.error("GET Versions error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/[id]/versions/route.ts', apiAgentVersionsContent);

  // 22. Компонент UI - Верхняя Навигация: src/components/Header.tsx
  const headerComponentContent = `import React from "react";
import { Terminal, LogIn, LogOut, Sparkles, User, Settings } from "lucide-react";
import { getUserGradient } from "@/lib/utils";

interface HeaderProps {
  user: { id: string; username: string; bio: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onOpenBioModal: () => void;
}

export default function Header({
  user,
  onLoginClick,
  onLogout,
  onOpenAddModal,
  onOpenBioModal
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 w-full transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-indigo-500/20">
              <Terminal className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PromptSocial
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Сообщество и репозиторий лучших системных инструкций
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            {user ? (
              <>
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  <Sparkles className="h-4 w-4 fill-slate-950" />
                  Поделиться
                </button>

                <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 pl-2 pr-3 py-1.5 rounded-xl text-sm text-slate-300">
                  <div className={\`h-6 w-6 rounded-lg bg-gradient-to-tr \${getUserGradient(user.username)} flex items-center justify-center text-[10px] text-slate-950 font-bold uppercase\`}>
                    {user.username.slice(0, 2)}
                  </div>
                  <span className="font-semibold">{user.username}</span>
                </div>

                <button
                  onClick={onOpenBioModal}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-lg transition-all"
                  title="О себе"
                >
                  <Settings className="h-4.5 w-4.5" />
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-all"
                  title="Выйти"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  Поделиться промптом
                </button>

                <button
                  onClick={onLoginClick}
                  className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-all duration-200 active:scale-95"
                >
                  <LogIn className="h-4 w-4" />
                  Войти
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}`;
  writeFile('src/components/Header.tsx', headerComponentContent);

  // 23. Компонент UI - Сайдбар Меню Категорий: src/components/Sidebar.tsx
  const sidebarComponentContent = `import React from "react";
import { Layers, Code, PenTool, Image, HelpCircle, Laptop } from "lucide-react";

interface SidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  user: { id: string; username: string; bio: string } | null;
  totalPromptsCount: number;
}

export const CATEGORIES = [
  { id: "all", label: "Все категории", icon: Layers },
  { id: "coding", label: "Программирование", icon: Code },
  { id: "writing", label: "Тексты и переводы", icon: PenTool },
  { id: "art", label: "Генерация артов", icon: Image },
  { id: "assistant", label: "Бизнес и ассистенты", icon: Laptop },
  { id: "other", label: "Разное", icon: HelpCircle }
];

export default function Sidebar({
  activeCategory,
  setActiveCategory,
  user,
  totalPromptsCount
}: SidebarProps) {
  return (
    <aside className="w-full md:w-64 flex flex-col gap-6 shrink-0">
      {/* Карточка профиля в сайдбаре */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/5 to-transparent" />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">Профиль</h3>
        {user ? (
          <div className="relative z-10 flex flex-col gap-2.5">
            <p className="text-sm font-bold text-slate-200">Привет, {user.username}!</p>
            <p className="text-xs text-slate-400 italic line-clamp-3 leading-relaxed">
              {user.bio || "Биография не указана. Напишите пару слов о себе в настройках шапки."}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 relative z-10 leading-relaxed">
            Войдите или зарегистрируйтесь, чтобы публиковать свои промпты, вести обсуждения и оценивать работы коллег.
          </p>
        )}
      </div>

      {/* Меню категорий */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Категории</h3>
        <nav className="flex flex-col gap-1">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={\`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 \${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }\`}
              >
                <Icon className={\`h-4 w-4 \${isActive ? "text-white" : "text-slate-400"}\`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Общая статистика */}
      <div className="text-xs text-slate-500 px-4">
        <p>Активных промптов в ленте: {totalPromptsCount}</p>
        <p className="mt-1">PromptSocial &bull; Open-Source v1.0</p>
      </div>
    </aside>
  );
}`;
  writeFile('src/components/Sidebar.tsx', sidebarComponentContent);

  // 24. Компонент UI - Карточка Промпта в ленте: src/components/AgentCard.tsx
  const agentCardComponentContent = `import React, { useState } from "react";
import { Heart, MessageSquare, Copy, Check, History, Trash2, Calendar } from "lucide-react";
import { formatDateTime, getUserGradient } from "@/lib/utils";

export interface Agent {
  id: string;
  userId: string;
  name: string;
  category: string;
  createdAt: number;
  username: string;
  userBio: string;
  prompt: string;
  version: number;
  updatedAt: number;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
}

interface AgentCardProps {
  agent: Agent;
  currentUser: { id: string } | null;
  onEdit: (agent: Agent) => void;
  onOpenHistory: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onLikeToggle: (agentId: string, currentLikeStatus: boolean) => void;
  highlightText?: string;
}

export default function AgentCard({
  agent,
  currentUser,
  onEdit,
  onOpenHistory,
  onDelete,
  onLikeToggle,
  highlightText = ""
}: AgentCardProps) {
  const [copied, setCopied] = useState(false);
  const isOwner = currentUser?.id === agent.userId;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(agent.prompt);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = agent.prompt;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const highlight = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(\`(\${query.replace(/[-[\\]{}()*+?.,\\\\^$|#\\s]/g, "\\\\$&")})\`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-cyan-500/30 text-cyan-300 rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-[360px] relative group overflow-hidden hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300">
      <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Автор и теги */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={\`h-7 w-7 rounded-lg bg-gradient-to-tr \${getUserGradient(agent.username)} flex items-center justify-center text-[10px] text-slate-950 font-extrabold uppercase shrink-0\`}>
                {agent.username.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-300 truncate">{agent.username}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{agent.userBio || "Промпт-инженер"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center text-[9px] font-extrabold text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-2 py-0.5 rounded-full uppercase">
                v{agent.version}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {formatDateTime(agent.createdAt)}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-slate-100 text-base truncate mb-2">
            {highlight(agent.name, highlightText)}
          </h3>
        </div>

        {/* Текст промпта */}
        <div className="flex-1 bg-slate-950 p-4 rounded-xl text-sm text-slate-300 border border-slate-800/60 overflow-y-auto mb-4 font-mono text-[12px] opacity-90 select-text leading-relaxed">
          <p className="whitespace-pre-wrap select-text">{highlight(agent.prompt, highlightText)}</p>
        </div>

        {/* Метрики соцсети и кнопки */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-3">
          {/* Социальная панель слева */}
          <div className="flex items-center gap-3">
            {/* Кнопка лайка */}
            <button
              onClick={() => onLikeToggle(agent.id, agent.hasLiked)}
              className={\`flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors \${
                agent.hasLiked 
                  ? "text-rose-400 hover:bg-rose-950/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }\`}
            >
              <Heart className={\`h-4.5 w-4.5 \${agent.hasLiked ? "fill-rose-400 text-rose-400" : ""}\`} />
              <span>{agent.likeCount}</span>
            </button>

            {/* Просмотр комментариев / историй */}
            <button
              onClick={() => onOpenHistory(agent)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-800/40"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span>{agent.commentCount}</span>
            </button>
          </div>

          {/* Инструменты управления владельца и копирование справа */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenHistory(agent)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="Детали и версии"
            >
              <History className="h-4 w-4" />
            </button>

            {isOwner && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(agent); }}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                  title="Редактировать"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(agent.id); }}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              onClick={handleCopy}
              className={\`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm active:scale-95 transition-all duration-200 \${
                copied
                  ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }\`}
            >
              {copied ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "ОК" : "Код"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  writeFile('src/components/AgentCard.tsx', agentCardComponentContent);

  // 25. Компонент UI - Детальный просмотр, версии и соц-обсуждение: src/components/DetailModal.tsx
  const detailModalComponentContent = `import React, { useState, useEffect } from "react";
import { X, History, MessageSquare, Copy, Check, Clock, Send, Sparkles } from "lucide-react";
import { formatDateTime, getUserGradient } from "@/lib/utils";
import { Agent } from "./AgentCard";

interface Version {
  id: string;
  prompt: string;
  version: number;
  createdAt: number;
}

interface Comment {
  id: string;
  text: string;
  promptVersion: number;
  createdAt: number;
  username: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  currentUser: { id: string; username: string } | null;
  onRestore: (promptText: string) => Promise<boolean>;
  onTriggerLogin: () => void;
}

export default function DetailModal({
  isOpen,
  onClose,
  agent,
  currentUser,
  onRestore,
  onTriggerLogin
}: DetailModalProps) {
  const [tab, setTab] = useState<"read" | "versions" | "comments">("read");
  const [versions, setVersions] = useState<Version[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && agent) {
      setTab("read");
      fetchVersions();
      fetchComments();
    }
  }, [isOpen, agent]);

  const fetchVersions = async () => {
    if (!agent) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(\`/api/agents/\${agent.id}/versions\`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchComments = async () => {
    if (!agent) return;
    setLoadingComments(true);
    try {
      const res = await fetch(\`/api/agents/\${agent.id}/comments\`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  if (!isOpen || !agent) return null;

  const handleCopy = async (promptText: string, verId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = promptText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(verId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onTriggerLogin();
      return;
    }
    if (!commentText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(\`/api/agents/\${agent.id}/comments\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentText,
          promptVersion: agent.version
        })
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (promptText: string) => {
    setActionLoading(true);
    try {
      const success = await onRestore(promptText);
      if (success) {
        await fetchVersions();
        setTab("read");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl z-10 flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={\`h-8 w-8 rounded-lg bg-gradient-to-tr \${getUserGradient(agent.username)} flex items-center justify-center text-[10px] text-slate-950 font-bold uppercase shrink-0\`}>
              {agent.username.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 truncate max-w-lg">{agent.name}</h2>
              <p className="text-xs text-slate-500">Автор: @{agent.username} &bull; Версия v{agent.version}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Табы */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          <button
            onClick={() => setTab("read")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "read" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            Инструкция
          </button>
          <button
            onClick={() => setTab("versions")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "versions" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            История версий ({versions.length})
          </button>
          <button
            onClick={() => setTab("comments")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "comments" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            Обсуждение ({comments.length})
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-950/20">
          
          {/* TAB 1: Просмотр и быстрое копирование */}
          {tab === "read" && (
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Текущий системный промпт</span>
                <button
                  onClick={() => handleCopy(agent.prompt, "current")}
                  className={\`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all \${
                    copiedId === "current" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }\`}
                >
                  {copiedId === "current" ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === "current" ? "Скопировано!" : "Скопировать промпт"}</span>
                </button>
              </div>
              <div className="flex-1 bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-sm text-slate-200 leading-relaxed overflow-y-auto select-text min-h-80 max-h-96">
                <p className="whitespace-pre-wrap select-text">{agent.prompt}</p>
              </div>
            </div>
          )}

          {/* TAB 2: История версий промпта */}
          {tab === "versions" && (
            <div className="flex flex-col gap-4">
              {loadingVersions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500" />
                  <p className="text-xs text-slate-500">Загрузка истории...</p>
                </div>
              ) : (
                versions.map((ver, idx) => (
                  <div key={ver.id} className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-indigo-400">
                          v{ver.version} {idx === 0 && "(Актуальная)"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(ver.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(ver.prompt, ver.id)}
                          className={\`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all \${
                            copiedId === ver.id ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }\`}
                        >
                          {copiedId === ver.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>Копировать</span>
                        </button>
                        
                        {idx !== 0 && currentUser?.id === agent.userId && (
                          <button
                            onClick={() => handleRestore(ver.prompt)}
                            disabled={actionLoading}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            Восстановить
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 border border-slate-900 max-h-40 overflow-y-auto leading-relaxed select-text">
                      <p className="whitespace-pre-wrap select-text">{ver.prompt}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Комментарии и отзывы соцсети */}
          {tab === "comments" && (
            <div className="flex flex-col gap-6">
              {/* Форма ввода комментария */}
              <form onSubmit={handleAddComment} className="flex flex-col gap-3">
                <textarea
                  placeholder={currentUser ? "Обсудить этот промпт... напишите ваши тесты или предложите улучшения" : "Для публикации комментариев необходимо авторизоваться."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser || actionLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Комментарий привязывается к версии v{agent.version}</span>
                  {currentUser ? (
                    <button
                      type="submit"
                      disabled={actionLoading || !commentText.trim()}
                      className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Отправить
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onTriggerLogin}
                      className="text-xs text-indigo-400 font-semibold hover:underline"
                    >
                      Войти в аккаунт
                    </button>
                  )}
                </div>
              </form>

              {/* Лента обсуждения */}
              <div className="flex flex-col gap-4 border-t border-slate-800/60 pt-5">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500/30 border-t-indigo-500" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-xs text-slate-500">Обсуждение еще не начато. Будьте первыми!</p>
                ) : (
                  comments.map(comm => (
                    <div key={comm.id} className="flex gap-3 bg-slate-900/20 border border-slate-850 p-4 rounded-xl items-start">
                      <div className={\`h-8 w-8 rounded-lg bg-gradient-to-tr \${getUserGradient(comm.username)} flex items-center justify-center text-[10px] text-slate-950 font-extrabold uppercase shrink-0\`}>
                        {comm.username.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">@{comm.username}</span>
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-900/80 border border-slate-800 px-1.5 py-0.5 rounded">
                              к версии v{comm.promptVersion}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{formatDateTime(comm.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed break-words">{comm.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}`;
  writeFile('src/components/DetailModal.tsx', detailModalComponentContent);

  // 26. Компонент UI - Окно Авторизации: src/components/AuthModal.tsx
  writeFile('src/components/AuthModal.tsx', fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8'));

  // 27. Компонент UI - Создание Поста: src/components/PostModal.tsx
  const postModalComponentContent = `import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { CATEGORIES } from "./Sidebar";
import { Agent } from "./AgentCard";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string, category: string) => Promise<boolean>;
  agent?: Agent | null;
}

export default function PostModal({
  isOpen,
  onClose,
  onSave,
  agent
}: PostModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("coding");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPrompt(agent.prompt);
      setCategory(agent.category);
    } else {
      setName("");
      setPrompt("");
      setCategory("coding");
    }
    setError("");
  }, [agent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim() || !category) {
      setError("Пожалуйста, заполните все поля формы");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const success = await onSave(name.trim(), prompt.trim(), category);
      if (success) {
        onClose();
      } else {
        setError("Сбой отправки на сервер базы данных.");
      }
    } catch (err: any) {
      setError(err.message || "Не удалось отправить данные.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">
              {agent ? "Редактирование публикации" : "Поделиться новым промптом"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-5">
          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-xl p-4 flex items-start gap-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Категория */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Категория применения</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIES.filter(c => c.id !== "all").map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Имя */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Название промпта / Роль ИИ</label>
            <input
              type="text"
              placeholder="Например: Эксперт по рефакторингу React кода..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Текст */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Системные инструкции (Промпт)</label>
            <textarea
              placeholder="Вставьте сюда ваши системные правила поведения для языковой модели..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all active:scale-95"
            >
              {loading ? "Сохранение..." : "Опубликовать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
  writeFile('src/components/PostModal.tsx', postModalComponentContent);

  // 28. Компонент UI - Редактирование биографии профиля: src/components/BioModal.tsx
  const bioModalComponentContent = `import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";

interface BioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bio: string) => Promise<boolean>;
  currentBio: string;
}

export default function BioModal({ isOpen, onClose, onSave, currentBio }: BioModalProps) {
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBio(currentBio);
    setError("");
  }, [currentBio, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const success = await onSave(bio);
      if (success) {
        onClose();
      } else {
        setError("Сбой сохранения биографии.");
      }
    } catch (err: any) {
      setError("Ошибка сети.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-2">Настройка профиля</h3>
        <p className="text-xs text-slate-500 mb-4">Напишите короткую биографию, она отобразится на ваших карточках в ленте.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900 p-3 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <textarea
            placeholder="Ваша роль, навыки или стек ИИ моделей..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            maxLength={150}
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="text-right text-[10px] text-slate-600 font-medium">Максимум 150 символов</div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
  writeFile('src/components/BioModal.tsx', bioModalComponentContent);

  // 29. Замена Главного Экрана Социальной Сетки: src/app/page.tsx
  const socialMainPageContent = `"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AgentCard, { Agent } from "@/components/AgentCard";
import DetailModal from "@/components/DetailModal";
import AuthModal from "@/components/AuthModal";
import PostModal from "@/components/PostModal";
import BioModal from "@/components/BioModal";
import { AlertCircle, Terminal, Search } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Сессия
  const [user, setUser] = useState<{ id: string; username: string; bio: string } | null>(null);

  // Модальные окна
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);

  // Активные объекты
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [activeCategory]);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(\`/api/agents?category=\${activeCategory}\`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Ошибка загрузки ленты");
      }
    } catch (err) {
      setError("Не удалось соединиться с сервером базы данных.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Выйти из аккаунта?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      fetchFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAgent = async (name: string, prompt: string, category: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? \`/api/agents/\${editingAgent.id}\` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt, category })
      });

      if (res.ok) {
        await fetchFeed();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleRestoreVersion = async (promptText: string): Promise<boolean> => {
    if (!activeAgent) return false;
    try {
      const res = await fetch(\`/api/agents/\${activeAgent.id}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeAgent.name,
          prompt: promptText,
          category: activeAgent.category
        })
      });

      if (res.ok) {
        await fetchFeed();
        // Обновляем локально активного агента
        setActiveAgent({
          ...activeAgent,
          prompt: promptText,
          version: activeAgent.version + 1
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Вы уверены, что хотите удалить публикацию?")) return;
    try {
      const res = await fetch(\`/api/agents/\${agentId}\`, { method: "DELETE" });
      if (res.ok) {
        setAgents(agents.filter(a => a.id !== agentId));
      } else {
        const errData = await res.json();
        alert(errData.error || "Ошибка удаления");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeToggle = async (agentId: string, currentLikeStatus: boolean) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    // Оптимистичное обновление UI
    setAgents(prevAgents =>
      prevAgents.map(a => {
        if (a.id === agentId) {
          return {
            ...a,
            hasLiked: !currentLikeStatus,
            likeCount: currentLikeStatus ? a.likeCount - 1 : a.likeCount + 1
          };
        }
        return a;
      })
    );

    try {
      const method = currentLikeStatus ? "DELETE" : "POST";
      await fetch(\`/api/agents/\${agentId}/like\`, { method });
    } catch (err) {
      console.error("Ошибка синхронизации лайка:", err);
    }
  };

  const handleSaveBio = async (bioText: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioText })
      });

      if (res.ok && user) {
        setUser({ ...user, bio: bioText.trim() });
        fetchFeed();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.prompt.toLowerCase().includes(q) ||
      agent.username.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        user={user}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingAgent(null);
          setIsPostOpen(true);
        }}
        onOpenBioModal={() => setIsBioOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Боковая панель меню */}
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
        />

        {/* Главная лента */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Панель поиска по сообществу */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск промптов по роли ИИ, тексту или автору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
            />
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 4].map(i => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 h-[360px] animate-pulse" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl p-8 max-w-lg mx-auto">
              <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                <Terminal className="h-7 w-7 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">
                {searchQuery ? "Совпадений не найдено" : "Категория пуста"}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {searchQuery ? "Попробуйте изменить поисковые слова." : "Будьте первым промптером в данной теме!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  currentUser={user}
                  highlightText={searchQuery}
                  onEdit={(a) => {
                    setEditingAgent(a);
                    setIsPostOpen(true);
                  }}
                  onOpenHistory={(a) => {
                    setActiveAgent(a);
                    setIsDetailOpen(true);
                  }}
                  onDelete={handleDeleteAgent}
                  onLikeToggle={handleLikeToggle}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Модальные окна */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(userData) => {
          setUser({ ...userData, bio: "" });
          checkSession();
        }}
      />

      <PostModal
        isOpen={isPostOpen}
        onClose={() => {
          setIsPostOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
        agent={editingAgent}
      />

      <DetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActiveAgent(null);
        }}
        agent={activeAgent}
        currentUser={user}
        onRestore={handleRestoreVersion}
        onTriggerLogin={() => {
          setIsDetailOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <BioModal
        isOpen={isBioOpen}
        onClose={() => setIsBioOpen(false)}
        onSave={handleSaveBio}
        currentBio={user ? user.bio : ""}
      />
    </div>
  );
}`;
  writeFile('src/app/page.tsx', socialMainPageContent);

  // 30. Обновление зависимостей и завершение работы
  console.log('\n=== УСТАНОВКА ЗАВИСИМОСТЕЙ (NPM INSTALL) ===');
  console.log('Пожалуйста, подождите. Процесс может занять несколько минут...');

  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n=== УСТАНОВКА ЗАВИСИМОСТЕЙ ЗАВЕРШЕНА ===\n');
  } catch (npmError) {
    throw new Error(`Ошибка при установке npm пакетов: ${npmError.message}`);
  }

  console.log('\n======================================================');
  console.log('СОЦИАЛЬНАЯ СЕТЬ PROMPTSOCIAL УСПЕШНО РАЗВЕРНУТА!');
  console.log('======================================================');
  console.log('Что делать дальше:');
  console.log('1. Запустите проект в режиме разработки: npm run dev');
  console.log('2. Откройте браузер по адресу: http://localhost:3000');
  console.log('3. Просматривайте промпты, создавайте аккаунты, оценивайте и');
  console.log('   комментируйте лучшие системные инструкции промптеров!');
  console.log('4. Проект готов для развертывания на Vercel с автоматической');
  console.log('   поддержкой SQLite локально и Turso в продакшене.\n');

} catch (err) {
  rollback(err);
}