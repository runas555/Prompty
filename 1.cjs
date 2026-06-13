const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== ЗАПУСК ПАТЧА АВТОРИЗАЦИИ PROMPTHISTORIAN ===\n');

try {
  // 1. Обновление package.json (внедрение зависимостей для авторизации)
  const pkgPath = path.resolve('package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error('Файл package.json не найден. Запустите патч из корня проекта.');
  }

  console.log('[STEP 1] Чтение и обновление зависимостей в package.json...');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};

  pkg.dependencies["bcryptjs"] = "2.4.3";
  pkg.dependencies["jsonwebtoken"] = "9.0.2";
  pkg.devDependencies["@types/bcryptjs"] = "2.4.6";
  pkg.devDependencies["@types/jsonwebtoken"] = "9.0.6";

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log('[OK] package.json обновлен.');

  // 2. Генерация JWT_SECRET в .env
  console.log('\n[STEP 2] Обновление переменных окружения (.env)...');
  const envPath = path.resolve('.env');
  const randomSecret = "sec_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('JWT_SECRET')) {
      envContent += `\n\n# Секретный ключ для подписи JWT-токенов сессий\nJWT_SECRET=${randomSecret}\n`;
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('[OK] Ключ JWT_SECRET добавлен в .env.');
    } else {
      console.log('[SKIP] Ключ JWT_SECRET уже присутствует в .env.');
    }
  } else {
    fs.writeFileSync(envPath, `JWT_SECRET=${randomSecret}\n`, 'utf8');
    console.log('[OK] Создан файл .env с ключом JWT_SECRET.');
  }

  // 3. Запись/Обновление файла БД (src/lib/db.ts) с поддержкой миграции
  console.log('\n[STEP 3] Замена src/lib/db.ts для поддержки пользователей...');
  const dbLibContent = `import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url: url,
  authToken: authToken,
});

export async function initDb() {
  try {
    // 1. Таблица пользователей
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    \`);

    // 2. Таблица агентов (связана с пользователем)
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    \`);

    // 3. Таблица версий
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

    // Безопасная миграция: если база данных существовала, пробуем добавить user_id
    try {
      await db.execute("ALTER TABLE agents ADD COLUMN user_id TEXT DEFAULT 'system_default'");
    } catch (e: any) {
      // Игнорируем ошибку, если колонка уже существует в схеме
    }

  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}`;
  fs.writeFileSync(path.resolve('src/lib/db.ts'), dbLibContent, 'utf8');
  console.log('[OK] Файл src/lib/db.ts обновлен.');

  // 4. Создание файла верификации сессий (src/lib/auth.ts)
  console.log('\n[STEP 4] Создание хелпера авторизации src/lib/auth.ts...');
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
  fs.writeFileSync(path.resolve('src/lib/auth.ts'), authLibContent, 'utf8');
  console.log('[OK] Скрипт верификации auth.ts создан.');

  // 5. Создание API авторизации (Регистрация, Вход, Выход, Проверка сессии)
  console.log('\n[STEP 5] Генерация API эндпоинтов для авторизации...');
  
  // А. Регистрация: src/app/api/auth/register/route.ts
  const registerRouteContent = `import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await initDb();
    const { username, password } = await request.json();

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: "Имя пользователя и пароль обязательны" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: "Имя пользователя должно содержать не менее 3 символов" }, { status: 400 });
    }
    if (password.trim().length < 6) {
      return NextResponse.json({ error: "Пароль должен содержать не менее 6 символов" }, { status: 400 });
    }

    // Проверяем, свободен ли логин
    const userCheck = await db.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [cleanUsername]
    });

    if (userCheck.rows.length > 0) {
      return NextResponse.json({ error: "Пользователь с таким именем уже зарегистрирован" }, { status: 409 });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);
    const userId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [userId, cleanUsername, passwordHash, now]
    });

    return NextResponse.json({ success: true, message: "Регистрация успешно завершена" }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}`;
  fs.mkdirSync(path.resolve('src/app/api/auth/register'), { recursive: true });
  fs.writeFileSync(path.resolve('src/app/api/auth/register/route.ts'), registerRouteContent, 'utf8');

  // Б. Вход: src/app/api/auth/login/route.ts
  const loginRouteContent = `import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_local_jwt_fallback_secret_key";

export async function POST(request: Request) {
  try {
    await initDb();
    const { username, password } = await request.json();

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: "Введите имя пользователя и пароль" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Ищем пользователя
    const result = await db.execute({
      sql: "SELECT id, username, password_hash FROM users WHERE username = ?",
      args: [cleanUsername]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Неверное имя пользователя или пароль" }, { status: 401 });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password.trim(), user.password_hash as string);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Неверное имя пользователя или пароль" }, { status: 401 });
    }

    // Генерируем токен сессии
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username }
    });

    // Устанавливаем куку
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 дней сессии
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}`;
  fs.mkdirSync(path.resolve('src/app/api/auth/login'), { recursive: true });
  fs.writeFileSync(path.resolve('src/app/api/auth/login/route.ts'), loginRouteContent, 'utf8');

  // В. Выход: src/app/api/auth/logout/route.ts
  const logoutRouteContent = `import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Сессия успешно завершена" });
  
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0 // Сбрасываем немедленно
  });
  
  return response;
}`;
  fs.mkdirSync(path.resolve('src/app/api/auth/logout'), { recursive: true });
  fs.writeFileSync(path.resolve('src/app/api/auth/logout/route.ts'), logoutRouteContent, 'utf8');

  // Г. Проверка сессии: src/app/api/auth/me/route.ts
  const meRouteContent = `import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}`;
  fs.mkdirSync(path.resolve('src/app/api/auth/me'), { recursive: true });
  fs.writeFileSync(path.resolve('src/app/api/auth/me/route.ts'), meRouteContent, 'utf8');

  console.log('[OK] Все API авторизации сгенерированы.');

  // 6. Перезапись бизнес-логики API (Привязка к user_id)
  console.log('\n[STEP 6] Интеграция авторизации в бизнес-логику промптов...');
  
  // А. src/app/api/agents/route.ts
  const secureAgentsRouteContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const queryResult = await db.execute({
      sql: \`
        SELECT 
          a.id, 
          a.name, 
          a.created_at,
          pv.prompt, 
          pv.version, 
          pv.created_at as updated_at
        FROM agents a
        LEFT JOIN prompt_versions pv ON pv.agent_id = a.id
        WHERE a.user_id = ? AND pv.version = (
          SELECT MAX(version) FROM prompt_versions WHERE agent_id = a.id
        )
        ORDER BY a.created_at DESC
      \`,
      args: [user.id]
    });

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

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { name, prompt } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Имя агента и промпт обязательны" }, { status: 400 });
    }

    const agentId = generateUUID();
    const versionId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO agents (id, user_id, name, created_at) VALUES (?, ?, ?, ?)",
      args: [agentId, user.id, name.trim(), now]
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
  fs.writeFileSync(path.resolve('src/app/api/agents/route.ts'), secureAgentsRouteContent, 'utf8');

  // Б. src/app/api/agents/[id]/route.ts
  const secureAgentIdRouteContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { name, prompt } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    // Проверка прав на владение агентом
    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Агент не найден или доступ ограничен" }, { status: 404 });
    }

    await db.execute({
      sql: "UPDATE agents SET name = ? WHERE id = ?",
      args: [name.trim(), id]
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Агент не найден или доступ ограничен" }, { status: 404 });
    }

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
  fs.writeFileSync(path.resolve('src/app/api/agents/[id]/route.ts'), secureAgentIdRouteContent, 'utf8');

  // В. src/app/api/agents/[id]/versions/route.ts
  const secureVersionsRouteContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Доступ к истории ограничен" }, { status: 403 });
    }

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
  fs.writeFileSync(path.resolve('src/app/api/agents/[id]/versions/route.ts'), secureVersionsRouteContent, 'utf8');

  console.log('[OK] Интеграция безопасности в API завершена.');

  // 7. Обновление хедера интерфейса (src/components/Header.tsx)
  console.log('\n[STEP 7] Обновление компонента Header.tsx...');
  const updatedHeaderComponent = `import React from "react";
import { Terminal, Search, LogOut, Sparkles, User } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  username: string;
  onLogout: () => void;
  onOpenAddModal: () => void;
  totalAgents: number;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  username,
  onLogout,
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
                Индивидуальное пространство ({totalAgents} агентов)
              </p>
            </div>
          </div>

          {/* Интерактивная Панель */}
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

            {/* Имя пользователя */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-300">
              <User className="h-4 w-4 text-cyan-400" />
              <span className="font-semibold">{username}</span>
            </div>

            {/* Кнопка создания */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm shadow-md hover:shadow-cyan-500/10 active:scale-95 transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 fill-slate-950" />
              Новый агент
            </button>

            {/* Выйти */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900/80 border border-slate-800/80 rounded-lg transition-all duration-200"
              title="Выйти из системы"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}`;
  fs.writeFileSync(path.resolve('src/components/Header.tsx'), updatedHeaderComponent, 'utf8');
  console.log('[OK] Файл Header.tsx переписан под сессии.');

  // 8. Обновление главного координатора интерфейса (src/app/page.tsx)
  console.log('\n[STEP 8] Внедрение форм входа и авторизации на главную страницу (src/app/page.tsx)...');
  const updatedMainPageContent = `"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AgentCard, { Agent } from "@/components/AgentCard";
import AgentModal from "@/components/AgentModal";
import HistoryModal from "@/components/HistoryModal";
import { Terminal, Key, User, Lock, AlertCircle, Sparkles } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Состояние авторизации
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Состояния модалок
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistoryAgent, setActiveHistoryAgent] = useState<{ id: string; name: string } | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          fetchAgents();
          return;
        }
      }
      setUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      setError("Ошибка соединения с API базы данных.");
    } finally {
      setLoading(false);
    }
  };

  // Метод входа и регистрации
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Заполните имя пользователя и пароль");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });

      const data = await res.json();

      if (res.ok) {
        if (authMode === "login") {
          setUser(data.user);
          setAuthUsername("");
          setAuthPassword("");
          fetchAgents();
        } else {
          // После успешной регистрации переключаем во вход
          alert("Регистрация успешна! Теперь вы можете войти.");
          setAuthMode("login");
          setAuthPassword("");
        }
      } else {
        setAuthError(data.error || "Произошла ошибка авторизации");
      }
    } catch (err) {
      setAuthError("Ошибка отправки запроса.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Вы уверены, что хотите выйти из аккаунта?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setAgents([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAgent = async (name: string, prompt: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? \`/api/agents/\${editingAgent.id}\` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleRestoreVersion = async (promptText: string): Promise<boolean> => {
    if (!activeHistoryAgent) return false;
    try {
      const currentAgent = agents.find(a => a.id === activeHistoryAgent.id);
      if (!currentAgent) return false;

      const res = await fetch(\`/api/agents/\${activeHistoryAgent.id}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentAgent.name, prompt: promptText })
      });

      if (res.ok) {
        await fetchAgents();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Вы уверены, что хотите полностью удалить агента и всю историю изменений?")) return;
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

  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.prompt.toLowerCase().includes(q)
    );
  });

  // ЭКРАН 1: Ожидание сессии
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500/30 border-t-cyan-500" />
        <p className="text-sm text-slate-500">Авторизация сессии...</p>
      </div>
    );
  }

  // ЭКРАН 2: Форма Входа и Регистрации
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -inset-px bg-gradient-to-tr from-cyan-500/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center mb-6 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 mb-4">
              <Terminal className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              {authMode === "login" ? "Вход в PromptHistorian" : "Создать аккаунт"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Управление версиями ваших персональных системных промптов
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10">
            {authError && (
              <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Имя пользователя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Введите никнейм"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  disabled={authLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={authLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-cyan-500/10 active:scale-95 transition-all duration-200"
            >
              {authLoading ? "Пожалуйста, подождите..." : authMode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs relative z-10">
            {authMode === "login" ? (
              <p className="text-slate-500">
                Впервые здесь?{" "}
                <button 
                  onClick={() => { setAuthMode("register"); setAuthError(""); }} 
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  Создать профиль
                </button>
              </p>
            ) : (
              <p className="text-slate-500">
                Уже зарегистрированы?{" "}
                <button 
                  onClick={() => { setAuthMode("login"); setAuthError(""); }} 
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  Войти в аккаунт
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН 3: Основная рабочая среда авторизованного пользователя
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        username={user.username}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingAgent(null);
          setIsAddOpen(true);
        }}
        totalAgents={agents.length}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300 mb-6 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-[340px] flex flex-col justify-between animate-pulse">
                <div>
                  <div className="h-5 w-1/2 bg-slate-800 rounded-lg mb-3" />
                  <div className="h-4 w-1/4 bg-slate-800 rounded-lg mb-4" />
                  <div className="h-40 bg-slate-950 rounded-lg border border-slate-900" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl max-w-xl mx-auto p-8 animate-fadeIn">
            <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <Terminal className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchQuery ? "Ничего не найдено" : "Ваш список агентов пуст"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2">
              {searchQuery
                ? "Попробуйте изменить поисковый запрос."
                : "Здесь будут отображаться ваши личные агенты. Создайте первого!"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsAddOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95 border border-slate-700"
              >
                Создать агента
              </button>
            )}
          </div>
        ) : (
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

      <AgentModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgent}
        agent={editingAgent}
      />

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

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 font-medium">
        <p>PromptHistorian &bull; Личное хранилище системных промптов.</p>
      </footer>
    </div>
  );
}`;
  fs.writeFileSync(path.resolve('src/app/page.tsx'), updatedMainPageContent, 'utf8');
  console.log('[OK] Файл src/app/page.tsx полностью обновлен.');

  // 9. Автоматическая установка новых зависимостей в фоновом режиме
  console.log('\n[STEP 9] Установка пакетов (bcryptjs, jsonwebtoken)...');
  console.log('Запуск npm install, ожидайте...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n======================================================');
  console.log('ПАТЧ АВТОРИЗАЦИИ УСПЕШНО ИНТЕГРИРОВАН!');
  console.log('======================================================');
  console.log('Изменения вступили в силу:');
  console.log('1. База данных переведена на реляционную модель пользователей.');
  console.log('2. Создана форма Регистрации и Входа.');
  console.log('3. Данные теперь защищены с помощью шифрования JWT в HttpOnly куках.');
  console.log('4. Каждый пользователь может видеть только им созданных агентов.\n');
  console.log('Запустите проект заново через: npm run dev\n');

} catch (error) {
  console.error('\n[FATAL ERROR] Не удалось применить патч авторизации:');
  console.error(error.message);
  process.exit(1);
}