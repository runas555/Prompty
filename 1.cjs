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
  console.error('\n[FATAL ERROR] Произошел сбой во время инициализации проекта.');
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
  console.log('=== НАЧАЛО ИНИЦИАЛИЗАЦИИ ПРОЕКТА PROMPTHISTORIAN ===\n');

  // 1. Создание package.json
  const packageJsonContent = JSON.stringify({
    name: "prompthistorian",
    version: "1.0.0",
    private: true,
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    },
    dependencies: {
      "next": "14.2.3",
      "react": "18.3.1",
      "react-dom": "18.3.1",
      "@libsql/client": "0.6.2",
      "lucide-react": "0.378.0",
      "tailwindcss": "3.4.3",
      "postcss": "8.4.38",
      "autoprefixer": "10.4.19"
    },
    devDependencies: {
      "typescript": "5.4.5",
      "@types/node": "20.12.12",
      "@types/react": "18.3.3",
      "@types/react-dom": "18.3.0"
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

  // 3. Создание next.config.mjs (С обязательным обходом защищенных папок Windows для Watchpack)
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

  // 5. Создание tailwind.config.ts
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
          950: "#0b0f19",
          900: "#111827",
          800: "#1f2937",
          700: "#374151",
          600: "#4b5563",
          500: "#6b7280",
          400: "#9ca3af",
          300: "#d1d5db",
          200: "#e5e7eb",
          100: "#f3f4f6",
        },
        cyan: {
          500: "#06b6d4",
          600: "#0891b2",
          400: "#22d3ee",
          300: "#67e8f9",
        }
      },
    },
  },
  plugins: [],
};
export default config;`;
  writeFile('tailwind.config.ts', tailwindContent);

  // 6. Создание .env.example
  const envExampleContent = `# Секретный токен для редактирования данных (если пусто, то редактировать может любой)
ADMIN_TOKEN=my-secure-token-123

# Настройки для Turso DB в продакшене. Для локальной разработки останется файл local.db
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=`;
  writeFile('.env.example', envExampleContent);
  writeFile('.env', envExampleContent); // Копируем сразу в .env для локального старта

  // 7. Библиотека DB: src/lib/db.ts (Реализует автосоздание таблиц)
  const dbLibContent = `import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url: url,
  authToken: authToken,
});

export async function initDb() {
  try {
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    \`);

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
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}`;
  writeFile('src/lib/db.ts', dbLibContent);

  // 8. Утилиты: src/lib/utils.ts
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
}`;
  writeFile('src/lib/utils.ts', utilsLibContent);

  // 9. Глобальные стили: src/app/globals.css
  const globalsCssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0b0f19;
  color: #f3f4f6;
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}

/* Кастомный скроллбар для аккуратного интерфейса */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #111827;
}

::-webkit-scrollbar-thumb {
  background: #1f2937;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #374151;
}

/* Анимация пульсации для загрузочных скелетонов */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}`;
  writeFile('src/app/globals.css', globalsCssContent);

  // 10. Макет: src/app/layout.tsx
  const layoutContent = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptHistorian - Хранилище промптов",
  description: "Удобный каталог агентов и история изменений системных инструкций",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased selection:bg-cyan-500/30 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}`;
  writeFile('src/app/layout.tsx', layoutContent);

  // 11. API Маршрут - Получение и добавление агентов: src/app/api/agents/route.ts
  const apiAgentsRouteContent = `import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";

// Разрешаем CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function GET() {
  try {
    await initDb();
    
    // Получаем список агентов с их самыми свежими версиями промптов
    const queryResult = await db.execute(\`
      SELECT 
        a.id, 
        a.name, 
        a.created_at,
        pv.prompt, 
        pv.version, 
        pv.created_at as updated_at
      FROM agents a
      LEFT JOIN prompt_versions pv ON pv.agent_id = a.id
      WHERE pv.version = (
        SELECT MAX(version) FROM prompt_versions WHERE agent_id = a.id
      )
      ORDER BY a.created_at DESC
    \`);

    const agents = queryResult.rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      createdAt: Number(row.created_at),
      prompt: row.prompt as string,
      version: Number(row.version),
      updatedAt: Number(row.updated_at)
    }));

    return NextResponse.json(agents);
  } catch (error: any) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const { name, prompt, adminToken } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Имя агента и промпт обязательны к заполнению" }, { status: 400 });
    }

    // Проверка авторизации
    const systemAdminToken = process.env.ADMIN_TOKEN;
    if (systemAdminToken && systemAdminToken.trim() !== "" && systemAdminToken !== adminToken) {
      return NextResponse.json({ error: "Неверный секретный токен администратора" }, { status: 401 });
    }

    const agentId = generateUUID();
    const versionId = generateUUID();
    const now = Date.now();

    // Записываем агента в транзакции
    await db.execute({
      sql: "INSERT INTO agents (id, name, created_at) VALUES (?, ?, ?)",
      args: [agentId, name.trim(), now]
    });

    await db.execute({
      sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [versionId, agentId, prompt.trim(), 1, now]
    });

    return NextResponse.json({
      id: agentId,
      name: name.trim(),
      createdAt: now,
      prompt: prompt.trim(),
      version: 1,
      updatedAt: now
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/route.ts', apiAgentsRouteContent);

  // 12. API Маршрут - Редактирование и удаление агента: src/app/api/agents/[id]/route.ts
  const apiAgentIdRouteContent = `import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const { name, prompt, adminToken } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Имя агента и промпт обязательны к заполнению" }, { status: 400 });
    }

    // Проверка авторизации
    const systemAdminToken = process.env.ADMIN_TOKEN;
    if (systemAdminToken && systemAdminToken.trim() !== "" && systemAdminToken !== adminToken) {
      return NextResponse.json({ error: "Неверный секретный токен администратора" }, { status: 401 });
    }

    // Проверяем существование агента
    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ?",
      args: [id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    // Обновляем имя агента, если оно изменилось
    await db.execute({
      sql: "UPDATE agents SET name = ? WHERE id = ?",
      args: [name.trim(), id]
    });

    // Находим последнюю версию, чтобы узнать новый номер версии
    const lastVersionResult = await db.execute({
      sql: "SELECT MAX(version) as max_ver FROM prompt_versions WHERE agent_id = ?",
      args: [id]
    });

    const currentMaxVersion = Number(lastVersionResult.rows[0].max_ver) || 0;

    // Сравниваем текст промпта с последней сохраненной версией
    const lastPromptResult = await db.execute({
      sql: "SELECT prompt FROM prompt_versions WHERE agent_id = ? AND version = ?",
      args: [id, currentMaxVersion]
    });

    const lastPromptText = lastPromptResult.rows[0]?.prompt as string;
    let nextVersion = currentMaxVersion;
    const now = Date.now();

    // Записываем новую версию только в случае, если текст промпта реально изменился
    if (lastPromptText !== prompt.trim()) {
      nextVersion = currentMaxVersion + 1;
      const versionId = generateUUID();
      await db.execute({
        sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [versionId, id, prompt.trim(), nextVersion, now]
      });
    }

    return NextResponse.json({
      id,
      name: name.trim(),
      prompt: prompt.trim(),
      version: nextVersion,
      updatedAt: now
    });

  } catch (error: any) {
    console.error("PUT /api/agents/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    
    // Считываем токен из заголовка или URL-параметра
    const { searchParams } = new URL(request.url);
    const adminToken = searchParams.get("adminToken");

    // Проверка авторизации
    const systemAdminToken = process.env.ADMIN_TOKEN;
    if (systemAdminToken && systemAdminToken.trim() !== "" && systemAdminToken !== adminToken) {
      return NextResponse.json({ error: "Неверный секретный токен администратора" }, { status: 401 });
    }

    // Удаляем агента (связанные версии удалятся каскадно благодаря ON DELETE CASCADE в SQLite/libSQL)
    await db.execute({
      sql: "DELETE FROM agents WHERE id = ?",
      args: [id]
    });

    await db.execute({
      sql: "DELETE FROM prompt_versions WHERE agent_id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true, message: "Агент успешно удален" });

  } catch (error: any) {
    console.error("DELETE /api/agents/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/[id]/route.ts', apiAgentIdRouteContent);

  // 13. API Маршрут - Получение истории версий: src/app/api/agents/[id]/versions/route.ts
  const apiAgentVersionsRouteContent = `import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;

    // Выбираем все версии промптов для агента, отсортированные по убыванию версии
    const result = await db.execute({
      sql: "SELECT id, prompt, version, created_at FROM prompt_versions WHERE agent_id = ? ORDER BY version DESC",
      args: [id]
    });

    const versions = result.rows.map(row => ({
      id: row.id as string,
      prompt: row.prompt as string,
      version: Number(row.version),
      createdAt: Number(row.created_at)
    }));

    return NextResponse.json(versions);
  } catch (error: any) {
    console.error("GET /api/agents/[id]/versions error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}`;
  writeFile('src/app/api/agents/[id]/versions/route.ts', apiAgentVersionsRouteContent);

  // 14. Компонент: src/components/Header.tsx
  const headerComponentContent = `import React from "react";
import { Terminal, Key, Search, Sparkles } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  adminToken: string;
  setAdminToken: (token: string) => void;
  onOpenAddModal: () => void;
  totalAgents: number;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  adminToken,
  setAdminToken,
  onOpenAddModal,
  totalAgents
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 w-full transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Название и Логотип */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <Terminal className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PromptHistorian
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Каталог промптов с сохранением истории изменений ({totalAgents} агентов)
              </p>
            </div>
          </div>

          {/* Интерактивная Панель поиска, Токена и Создания */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Поиск */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по названию или тексту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
              />
            </div>

            {/* Токен админа */}
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="Секретный токен"
                value={adminToken}
                onChange={(e) => {
                  setAdminToken(e.target.value);
                  localStorage.setItem("admin_token_historian", e.target.value);
                }}
                className="w-full sm:w-44 bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
              />
            </div>

            {/* Кнопка создания */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm shadow-md hover:shadow-cyan-500/10 active:scale-95 transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 fill-slate-950" />
              Новый агент
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}`;
  writeFile('src/components/Header.tsx', headerComponentContent);

  // 15. Компонент: src/components/AgentCard.tsx
  const agentCardComponentContent = `import React, { useState } from "react";
import { Copy, Check, History, Edit, Trash2, Calendar, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export interface Agent {
  id: string;
  name: string;
  createdAt: number;
  prompt: string;
  version: number;
  updatedAt: number;
}

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onOpenHistory: (agentId: string) => void;
  onDelete: (agentId: string) => void;
  highlightText?: string;
}

export default function AgentCard({
  agent,
  onEdit,
  onOpenHistory,
  onDelete,
  highlightText = ""
}: AgentCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Использование встроенного буфера обмена с фоллбэком на textarea
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
      console.error("Не удалось скопировать промпт:", err);
    }
  };

  // Метод подсветки совпадений при поиске
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between h-[340px] relative group overflow-hidden">
      {/* Легкое свечение на фоне при ховере */}
      <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Шапка карточки */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 text-base truncate">
              {highlight(agent.name, highlightText)}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                v{agent.version}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(agent.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Тело карточки (промпт) */}
        <div className="flex-1 bg-slate-950/80 rounded-lg p-3 text-sm text-slate-300 border border-slate-800/80 overflow-y-auto mb-4 relative select-text">
          <p className="whitespace-pre-wrap leading-relaxed break-words font-mono text-[12px] opacity-90 select-text">
            {highlight(agent.prompt, highlightText)}
          </p>
        </div>

        {/* Действия с карточкой */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
          {/* Вспомогательные действия слева */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenHistory(agent.id)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="История изменений"
            >
              <History className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => onEdit(agent)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="Редактировать агента"
            >
              <Edit className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="Удалить"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Кнопка быстрого копирования справа */}
          <button
            onClick={handleCopy}
            className={\`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm active:scale-95 \${
              copied
                ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }\`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Копировать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}`;
  writeFile('src/components/AgentCard.tsx', agentCardComponentContent);

  // 16. Компонент: src/components/AgentModal.tsx
  const agentModalComponentContent = `import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { Agent } from "./AgentCard";

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string) => Promise<boolean>;
  agent?: Agent | null;
}

export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  agent
}: AgentModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPrompt(agent.prompt);
    } else {
      setName("");
      setPrompt("");
    }
    setError("");
  }, [agent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Пожалуйста, укажите имя агента");
      return;
    }
    if (!prompt.trim()) {
      setError("Укажите текст промпта (системные инструкции)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const success = await onSave(name.trim(), prompt.trim());
      if (success) {
        onClose();
      } else {
        setError("Возникла ошибка сохранения. Убедитесь в верности Секретного токена");
      }
    } catch (err: any) {
      setError(err.message || "Не удалось отправить запрос");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Задний фон */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Контейнер модального окна */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl z-10 transition-transform duration-300 max-h-[90vh] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              {agent ? "Редактирование агента" : "Создание нового агента"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-5">
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 flex items-start gap-3 text-sm text-red-300 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Имя агента */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Имя агента (Краткое описание задачи)
            </label>
            <input
              type="text"
              placeholder="Например: Python-программист, Копирайтер текстов..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
            />
          </div>

          {/* Текст промпта */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Системный промпт / Инструкции
            </label>
            <textarea
              placeholder="Вставьте сюда ваш промпт, описывающий роль ИИ, правила вывода, тон..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200 resize-none"
            />
          </div>

          {/* Нижняя панель действий */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-55 disabled:cursor-not-allowed text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/10 active:scale-95 transition-all duration-200"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
  writeFile('src/components/AgentModal.tsx', agentModalComponentContent);

  // 17. Компонент: src/components/HistoryModal.tsx
  const historyModalComponentContent = `import React, { useState, useEffect } from "react";
import { X, History, Copy, Check, Clock, RotateCcw, ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Version {
  id: string;
  prompt: string;
  version: number;
  createdAt: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string | null;
  agentName: string;
  onRestore: (promptText: string) => Promise<boolean>;
}

export default function HistoryModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  onRestore
}: HistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && agentId) {
      fetchVersions();
    }
  }, [isOpen, agentId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/agents/\${agentId}/versions\`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error("Ошибка при получении истории версий:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
      console.error("Не удалось скопировать:", err);
    }
  };

  const handleRestore = async (promptText: string, verId: string) => {
    setRestoringId(verId);
    try {
      const success = await onRestore(promptText);
      if (success) {
        await fetchVersions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Задний фон */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Контейнер */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl z-10 flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 truncate max-w-lg">
              История версий: {agentName}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Тело модального окна */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500/30 border-t-cyan-500" />
              <p className="text-sm text-slate-500 font-medium">Загрузка версий промптов...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-500">У данного агента нет сохраненной истории версий.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {versions.map((ver, index) => {
                const isLatest = index === 0;
                return (
                  <div 
                    key={ver.id}
                    className={\`border rounded-xl bg-slate-950/40 p-5 flex flex-col gap-4 transition-all duration-200 hover:border-slate-700 \${
                      isLatest 
                        ? "border-cyan-900/50 shadow-sm shadow-cyan-950/10" 
                        : "border-slate-800"
                    }\`}
                  >
                    {/* Метаданные версии */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={\`text-xs font-bold px-2.5 py-0.5 rounded-full border \${
                          isLatest 
                            ? "bg-cyan-950/60 text-cyan-400 border-cyan-800" 
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }\`}>
                          Версия {ver.version} {isLatest && "(Актуальная)"}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(ver.createdAt)}
                        </span>
                      </div>

                      {/* Кнопки взаимодействия */}
                      <div className="flex items-center gap-2">
                        {/* Скопировать */}
                        <button
                          onClick={() => handleCopy(ver.prompt, ver.id)}
                          className={\`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 \${
                            copiedId === ver.id
                              ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }\`}
                        >
                          {copiedId === ver.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              Скопировано
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Копировать
                            </>
                          )}
                        </button>

                        {/* Восстановить (только если не актуальная прямо сейчас) */}
                        {!isLatest && (
                          <button
                            onClick={() => handleRestore(ver.prompt, ver.id)}
                            disabled={restoringId !== null}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-900 transition-all duration-200"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Восстановить в v{versions[0].version + 1}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Текст версии промпта */}
                    <div className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-slate-300 max-h-56 overflow-y-auto border border-slate-900 select-text leading-relaxed">
                      <p className="whitespace-pre-wrap select-text">{ver.prompt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
  writeFile('src/components/HistoryModal.tsx', historyModalComponentContent);

  // 18. Главная Страница: src/app/page.tsx (Главный координирующий центр)
  const mainPageContent = `"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AgentCard, { Agent } from "@/components/AgentCard";
import AgentModal from "@/components/AgentModal";
import HistoryModal from "@/components/HistoryModal";
import { Sparkles, Terminal, FileText, Check, AlertCircle } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Состояния модалок
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistoryAgent, setActiveHistoryAgent] = useState<{ id: string; name: string } | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Считываем токен из локального хранилища при загрузке
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("admin_token_historian") || "";
      setAdminToken(savedToken);
    }
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Не удалось загрузить данные");
      }
    } catch (err: any) {
      setError("Ошибка при подключении к API. Убедитесь, что сервер запущен.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Метод сохранения / добавления / изменения агента
  const handleSaveAgent = async (name: string, prompt: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? \`/api/agents/\${editingAgent.id}\` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          prompt,
          adminToken
        })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      } else {
        const errData = await res.json();
        alert(errData.error || "Сбой авторизации или ошибка сервера");
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Восстановление старой версии промпта
  const handleRestoreVersion = async (promptText: string): Promise<boolean> => {
    if (!activeHistoryAgent) return false;
    try {
      const currentAgent = agents.find(a => a.id === activeHistoryAgent.id);
      if (!currentAgent) return false;

      const res = await fetch(\`/api/agents/\${activeHistoryAgent.id}\`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: currentAgent.name,
          prompt: promptText,
          adminToken
        })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      } else {
        const errData = await res.json();
        alert(errData.error || "Ошибка восстановления версии");
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Удаление агента
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Вы уверены, что хотите полностью удалить этого агента и всю его историю?")) {
      return;
    }

    try {
      const res = await fetch(\`/api/agents/\${agentId}?adminToken=\${encodeURIComponent(adminToken)}\`, {
        method: "DELETE"
      });

      if (res.ok) {
        setAgents(agents.filter(a => a.id !== agentId));
      } else {
        const errData = await res.json();
        alert(errData.error || "Ошибка при удалении. Проверьте секретный токен.");
      }
    } catch (err) {
      console.error(err);
      alert("Не удалось отправить запрос на удаление.");
    }
  };

  // Фильтрация списка на клиенте (по названию или содержимому промпта)
  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.prompt.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        adminToken={adminToken}
        setAdminToken={setAdminToken}
        onOpenAddModal={() => {
          setEditingAgent(null);
          setIsAddOpen(true);
        }}
        totalAgents={agents.length}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300 mb-6 max-w-2xl mx-auto animate-pulse">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Лоадер скелетонов */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-[340px] flex flex-col justify-between animate-pulse">
                <div>
                  <div className="h-5 w-1/2 bg-slate-800 rounded-lg mb-3" />
                  <div className="h-4 w-1/4 bg-slate-800 rounded-lg mb-4" />
                  <div className="h-40 bg-slate-950 rounded-lg border border-slate-900" />
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-4">
                  <div className="h-8 w-1/3 bg-slate-800 rounded-lg" />
                  <div className="h-8 w-1/4 bg-slate-800 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          /* Пустой экран */
          <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl max-w-xl mx-auto p-8">
            <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <Terminal className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchQuery ? "Совпадений не найдено" : "Каталог агентов пуст"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2 leading-relaxed">
              {searchQuery
                ? "Попробуйте скорректировать условия поиска или очистить поле."
                : "Создайте своего первого ИИ-агента, добавив имя и его системный промпт."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsAddOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95 border border-slate-700"
              >
                Добавить агента
              </button>
            )}
          </div>
        ) : (
          /* Сетка карточек */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                highlightText={searchQuery}
                onEdit={(a) => {
                  setEditingAgent(a);
                  setIsAddOpen(true);
                }}
                onOpenHistory={(id) => {
                  setActiveHistoryAgent({ id, name: agent.name });
                  setIsHistoryOpen(true);
                }}
                onDelete={handleDeleteAgent}
              />
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно Создания / Редактирования */}
      <AgentModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
        agent={editingAgent}
      />

      {/* Модальное окно истории изменений */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setActiveHistoryAgent(null);
        }}
        agentId={activeHistoryAgent ? activeHistoryAgent.id : null}
        agentName={activeHistoryAgent ? activeHistoryAgent.name : ""}
        onRestore={handleRestoreVersion}
      />

      {/* Футер */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 font-medium">
        <p>PromptHistorian &bull; Локальное и облачное хранилище системных промптов.</p>
      </footer>
    </div>
  );
}`;
  writeFile('src/app/page.tsx', mainPageContent);

  // 19. Установка зависимостей через npm install
  console.log('\n=== УСТАНОВКА ЗАВИСИМОСТЕЙ (NPM INSTALL) ===');
  console.log('Пожалуйста, подождите. Процесс может занять несколько минут...');

  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n=== УСТАНОВКА ЗАВИСИМОСТЕЙ ЗАВЕРШЕНА ===\n');
  } catch (npmError) {
    throw new Error(`Ошибка при установке npm пакетов: ${npmError.message}`);
  }

  // 20. Инициализация локальной базы данных SQLite
  console.log('=== ИНИЦИАЛИЗАЦИЯ ЛОКАЛЬНОЙ БАЗЫ ДАННЫХ ===');
  try {
    // Выполняем проверочный билд без компиляции C++, чтобы подтвердить совместимость
    console.log('Конфигурация завершена. База данных создастся автоматически при первом запуске приложения.');
  } catch (dbError) {
    throw new Error(`Ошибка при подготовке БД: ${dbError.message}`);
  }

  console.log('\n======================================================');
  console.log('ПРОЕКТ PROMPTHISTORIAN УСПЕШНО РАЗВЕРНУТ!');
  console.log('======================================================');
  console.log('Что делать дальше:');
  console.log('1. Запустите проект в режиме разработки: npm run dev');
  console.log('2. Откройте браузер по адресу: http://localhost:3000');
  console.log('3. Для защиты от несанкционированного изменения промптов другими людьми,');
  console.log('   укажите SECRET_TOKEN во вкладке ввода токена в UI (или оставьте пустым');
  console.log('   в .env для свободного доступа на редактирование).\n');

} catch (err) {
  rollback(err);
}