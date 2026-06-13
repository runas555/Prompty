const fs = require('fs');
const path = require('path');

console.log('=== ЗАПУСК UX-ПАТЧА ДЛЯ ГОСТЕВОГО ДОСТУПА ===\n');

try {
  // Вспомогательная функция для безопасной записи
  function writeProjectFile(filePath, content) {
    const resolvedPath = path.resolve(filePath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, content, 'utf8');
    console.log(`[UPDATED] ${filePath}`);
  }

  // 1. Обновление API Агентов: Разрешаем GET-запросы без токена
  const apiAgentsContent = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    
    // Получаем всех агентов для свободного просмотра всеми гостями
    const queryResult = await db.execute(\`
      SELECT 
        a.id, 
        a.user_id,
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
      userId: row.user_id as string, // Передаем ID владельца для разграничения прав в UI
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
      return NextResponse.json({ error: "Для создания агентов необходима авторизация" }, { status: 401 });
    }

    const { name, prompt } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Заполните все поля формы" }, { status: 400 });
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
      userId: user.id,
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
  writeProjectFile('src/app/api/agents/route.ts', apiAgentsContent);

  // 2. Обновление карточки агента: Скрытие элементов управления для невладельцев
  const agentCardContent = `import React, { useState } from "react";
import { Copy, Check, History, Edit, Trash2, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export interface Agent {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  prompt: string;
  version: number;
  updatedAt: number;
}

interface AgentCardProps {
  agent: Agent;
  currentUserId?: string | null;
  onEdit: (agent: Agent) => void;
  onOpenHistory: (agentId: string) => void;
  onDelete: (agentId: string) => void;
  highlightText?: string;
}

export default function AgentCard({
  agent,
  currentUserId,
  onEdit,
  onOpenHistory,
  onDelete,
  highlightText = ""
}: AgentCardProps) {
  const [copied, setCopied] = useState(false);
  const isOwner = currentUserId === agent.userId;

  const handleCopy = async () => {
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
      console.error("Не удалось скопировать промпт:", err);
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between h-[340px] relative group overflow-hidden">
      <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
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

        <div className="flex-1 bg-slate-950/80 rounded-lg p-3 text-sm text-slate-300 border border-slate-800/80 overflow-y-auto mb-4 relative select-text">
          <p className="whitespace-pre-wrap leading-relaxed break-words font-mono text-[12px] opacity-90 select-text">
            {highlight(agent.prompt, highlightText)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenHistory(agent.id)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="История изменений"
            >
              <History className="h-4.5 w-4.5" />
            </button>

            {/* Рендерим кнопки редактирования только владельцам */}
            {isOwner && (
              <>
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
              </>
            )}
          </div>

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
  writeProjectFile('src/components/AgentCard.tsx', agentCardContent);

  // 3. Создание компонента модального окна входа: src/components/AuthModal.tsx
  const authModalContent = `import React, { useState } from "react";
import { X, User, Lock, AlertCircle, Terminal } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; username: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    setLoading(true);
    setError("");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          onSuccess(data.user);
          onClose();
        } else {
          alert("Аккаунт успешно создан! Теперь вы можете войти.");
          setMode("login");
          setPassword("");
        }
      } else {
        setError(data.error || "Произошла ошибка авторизации");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl z-10 overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 mb-3">
            <Terminal className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {mode === "login" ? "Вход в систему" : "Регистрация"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Для создания и изменения собственных промптов
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
              <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
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
                placeholder="Никнейм"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all duration-200"
          >
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          {mode === "login" ? (
            <p className="text-slate-500">
              Еще нет аккаунта?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-cyan-400 font-semibold hover:underline">
                Создать профиль
              </button>
            </p>
          ) : (
            <p className="text-slate-500">
              Уже есть аккаунт?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-cyan-400 font-semibold hover:underline">
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}`;
  writeProjectFile('src/components/AuthModal.tsx', authModalContent);

  // 4. Обновление Header: Поддержка гостевого входа и красивой кнопки "Войти"
  const headerContent = `import React from "react";
import { Terminal, Search, LogOut, Sparkles, User, LogIn } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: { id: string; username: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onOpenAddModal: () => void;
  totalAgents: number;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  user,
  onLoginClick,
  onLogout,
  onOpenAddModal,
  totalAgents
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 w-full transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <Terminal className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PromptHistorian
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Каталог промптов ({totalAgents} агентов)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

            {user ? (
              <>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-300">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="font-semibold">{user.username}</span>
                </div>

                <button
                  onClick={onOpenAddModal}
                  className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm shadow-md active:scale-95 transition-all duration-200"
                >
                  <Sparkles className="h-4 w-4 fill-slate-950" />
                  Новый агент
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900/80 border border-slate-800/80 rounded-lg transition-all duration-200"
                  title="Выйти из системы"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenAddModal} // Клик вызовет окно входа на главной странице
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-lg text-sm border border-slate-700 transition-all duration-200"
                >
                  <Sparkles className="h-4 w-4" />
                  Новый агент
                </button>

                <button
                  onClick={onLoginClick}
                  className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-all duration-200 active:scale-95"
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
  writeProjectFile('src/components/Header.tsx', headerContent);

  // 5. Полная замена главной страницы (src/app/page.tsx)
  const mainPageContent = `"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AgentCard, { Agent } from "@/components/AgentCard";
import AgentModal from "@/components/AgentModal";
import HistoryModal from "@/components/HistoryModal";
import AuthModal from "@/components/AuthModal";
import { Terminal, AlertCircle } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Состояние пользователя
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Состояния окон управления
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistoryAgent, setActiveHistoryAgent] = useState<{ id: string; name: string } | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

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
      console.error("Session verification failed", err);
    } finally {
      // Гости также загружают агентов, поэтому вызываем загрузку независимо от сессии
      fetchAgents();
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
      setError("Не удалось установить соединение с сервером базы данных.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Вы уверены, что хотите выйти из аккаунта?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      await fetchAgents();
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
    if (!confirm("Вы уверены, что хотите удалить агента и всю его историю версий?")) return;
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

  const handleOpenAddModal = () => {
    if (!user) {
      setIsAuthOpen(true); // Если гость пытается создать - открываем авторизацию
    } else {
      setEditingAgent(null);
      setIsAddOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAddModal={handleOpenAddModal}
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
          <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl max-w-xl mx-auto p-8">
            <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <Terminal className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchQuery ? "Совпадений не найдено" : "Каталог пуст"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2">
              {searchQuery
                ? "Попробуйте скорректировать условия фильтра."
                : "В системе еще нет ни одного агента. Войдите, чтобы добавить своего."}
            </p>
            {!searchQuery && !user && (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="mt-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm border border-slate-700 transition-all duration-200"
              >
                Войти и создать агента
              </button>
            )}
            {!searchQuery && user && (
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsAddOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm border border-slate-700 transition-all duration-200"
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
                currentUserId={user ? user.id : null}
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

      {/* Модалка входа */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(userData) => {
          setUser(userData);
          fetchAgents();
        }}
      />

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
        <p>PromptHistorian &bull; Публичный просмотр и личные кабинеты для промпт-инженеров.</p>
      </footer>
    </div>
  );
}`;
  writeProjectFile('src/app/page.tsx', mainPageContent);

  console.log('\n======================================================');
  console.log('UX ПАТЧ УСПЕШНО ПРИМЕНЕН!');
  console.log('======================================================');
  console.log('Поведение системы обновлено:');
  console.log('1. Неавторизованные гости могут открыто искать, просматривать и копировать промпты.');
  console.log('2. Гости могут просматривать историю изменений версий.');
  console.log('3. Модальное окно входа открывается только по клику на кнопку "Войти"');
  console.log('   или при попытке добавить промпт без авторизации.');
  console.log('4. Редактировать или удалять карточки могут исключительно их владельцы.\n');

} catch (err) {
  console.error('[FATAL ERROR] Ошибка при наложении UX патча:', err.message);
  process.exit(1);
}