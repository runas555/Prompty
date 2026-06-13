const fs = require('fs');
const path = require('path');

console.log('=== ЗАПУСК ПАТЧА СИСТЕМЫ КАТЕГОРИЙ И AI-МОДЕЛЕЙ ===\n');

try {
  // Вспомогательная функция для безопасной записи файлов
  function writeProjectFile(filePath, content) {
    const resolvedPath = path.resolve(filePath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, content, 'utf8');
    console.log(`[UPDATED] ${filePath}`);
  }

  // 1. Обновление БД: src/lib/db.ts (Внедрение колонок model, tags и безопасной миграции)
  const updatedDbLib = `import { createClient } from "@libsql/client";

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

    // 2. Посты (Агенты) с поддержкой model и tags
    await db.execute(\`
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
}`;
  writeProjectFile('src/lib/db.ts', updatedDbLib);

  // 2. Обновление Сайдбара: src/components/Sidebar.tsx (12 категорий с Lucide-иконками)
  const updatedSidebar = `import React from "react";
import { 
  Layers, Code, PenTool, Image, Music, Laptop, 
  BarChart2, BookOpen, Cpu, ShieldAlert, Sparkles, 
  CheckSquare, HelpCircle 
} from "lucide-react";

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
  { id: "audio-video", label: "Аудио и видеогенерация", icon: Music },
  { id: "assistant", label: "Бизнес-ассистенты", icon: Laptop },
  { id: "marketing", label: "Маркетинг, SEO и SMM", icon: BarChart2 },
  { id: "education", label: "Обучение и наука", icon: BookOpen },
  { id: "agents", label: "Автономные агенты", icon: Cpu },
  { id: "security", label: "Безопасность и Jailbreak", icon: ShieldAlert },
  { id: "creative", label: "Творчество и ролевые", icon: Sparkles },
  { id: "productivity", label: "Личная эффективность", icon: CheckSquare },
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
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden glass">
        <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/5 to-transparent" />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">Профиль</h3>
        {user ? (
          <div className="relative z-10 flex flex-col gap-2.5">
            <p className="text-sm font-bold text-slate-200">@{user.username}</p>
            <p className="text-xs text-slate-400 italic leading-relaxed break-words line-clamp-4">
              {user.bio || "Биография не указана. Заполните её в настройках."}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 relative z-10 leading-relaxed">
            Авторизуйтесь, чтобы публиковать свои промпты, вести обсуждения и ставить лайки.
          </p>
        )}
      </div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 glass">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Категории</h3>
        <nav className="flex flex-col gap-1 max-h-[420px] overflow-y-auto pr-1">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={\`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 \${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/15"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }\`}
              >
                <Icon className={\`h-4 w-4 shrink-0 \${isActive ? "text-white" : "text-slate-400"}\`} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="text-xs text-slate-500 px-4">
        <p>Активных промптов в ленте: {totalPromptsCount}</p>
        <p className="mt-1">PromptSocial &bull; Open-Source v1.1</p>
      </div>
    </aside>
  );
}`;
  writeProjectFile('src/components/Sidebar.tsx', updatedSidebar);

  // 3. Обновление Карточки Агента: src/components/AgentCard.tsx (Индикаторы AI-моделей и хэштегов)
  const updatedAgentCard = `import React, { useState } from "react";
import { Heart, MessageSquare, Copy, Check, History, Edit, Trash2, Calendar, Cpu } from "lucide-react";
import { formatDateTime, getUserGradient } from "@/lib/utils";

export interface Agent {
  id: string;
  userId: string;
  name: string;
  category: string;
  model: string;
  tags: string;
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

const MODEL_LABELS: Record<string, string> = {
  any: "Универсальный",
  gpt4: "GPT-4 / 4o",
  claude: "Claude 3.5",
  gemini: "Gemini Pro",
  llama: "LLaMA / DeepSeek",
  midjourney: "Midjourney"
};

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
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-[390px] relative group overflow-hidden hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300 glass">
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
                <p className="text-xs font-bold text-slate-300 truncate">@{agent.username}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{agent.userBio || "Промптер"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center text-[9px] font-extrabold text-indigo-400 bg-indigo-950/40 border border-indigo-900 px-2 py-0.5 rounded-full uppercase">
                v{agent.version}
              </span>
              <span className="inline-flex items-center text-[9px] font-extrabold text-cyan-400 bg-cyan-950/40 border border-cyan-900 px-2 py-0.5 rounded-full uppercase">
                {MODEL_LABELS[agent.model] || "Модель"}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-slate-100 text-base truncate mb-1.5">
            {highlight(agent.name, highlightText)}
          </h3>

          {/* Отображение хэштегов */}
          {agent.tags && agent.tags.trim() && (
            <div className="flex flex-wrap gap-1 mb-2.5 max-h-6 overflow-hidden">
              {agent.tags.split(",").map((tag, idx) => (
                <span key={idx} className="text-[10px] text-slate-400 font-medium bg-slate-800/40 px-2 py-0.5 rounded">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Текст промпта */}
        <div className="flex-1 bg-slate-950 p-4 rounded-xl text-sm text-slate-300 border border-slate-850 overflow-y-auto mb-4 font-mono text-[12px] opacity-90 select-text leading-relaxed">
          <p className="whitespace-pre-wrap select-text">{highlight(agent.prompt, highlightText)}</p>
        </div>

        {/* Метрики соцсети и кнопки */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-2">
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

            <button
              onClick={() => onOpenHistory(agent)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-800/40"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span>{agent.commentCount}</span>
            </button>
          </div>

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
  writeProjectFile('src/components/AgentCard.tsx', updatedAgentCard);

  // 4. Обновление Модалки Создания: src/components/PostModal.tsx (Выбор AI-модели и добавление тегов)
  const updatedPostModal = `import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { CATEGORIES } from "./Sidebar";
import { Agent } from "./AgentCard";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string, category: string, model: string, tags: string) => Promise<boolean>;
  agent?: Agent | null;
}

const MODELS = [
  { id: "any", label: "Универсальный (любая модель)" },
  { id: "gpt4", label: "OpenAI GPT-4 / GPT-4o" },
  { id: "claude", label: "Anthropic Claude 3.5" },
  { id: "gemini", label: "Google Gemini Pro" },
  { id: "llama", label: "LLaMA / DeepSeek" },
  { id: "midjourney", label: "Midjourney / DALL-E / Art" }
];

export default function PostModal({
  isOpen,
  onClose,
  onSave,
  agent
}: PostModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("coding");
  const [model, setModel] = useState("any");
  const [tags, setTags] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPrompt(agent.prompt);
      setCategory(agent.category);
      setModel(agent.model || "any");
      setTags(agent.tags || "");
    } else {
      setName("");
      setPrompt("");
      setCategory("coding");
      setModel("any");
      setTags("");
    }
    setError("");
  }, [agent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim() || !category || !model) {
      setError("Пожалуйста, заполните все обязательные поля формы");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const success = await onSave(name.trim(), prompt.trim(), category, model, tags.trim());
      if (success) {
        onClose();
      } else {
        setError("Возникла ошибка при сохранении данных.");
      }
    } catch (err: any) {
      setError(err.message || "Не удалось отправить запрос.");
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-xl p-4 flex items-start gap-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Категория */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Категория</label>
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

            {/* AI Модель */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Целевая модель</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Теги */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Теги (Через запятую)</label>
            <input
              type="text"
              placeholder="Например: react, typescript, seo, refactoring"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Название роли / Задача промпта</label>
            <input
              type="text"
              placeholder="Например: Генератор SEO метаданных..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Текст */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Инструкции (Промпт)</label>
            <textarea
              placeholder="Задайте системную роль, ограничения и формат ответов..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-1">
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
  writeProjectFile('src/components/PostModal.tsx', updatedPostModal);

  // 5. Обновление API Агентов: src/app/api/agents/route.ts (Фильтрация и сохранение model и tags)
  const updatedApiAgents = `import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    
    // Считываем параметры фильтрации
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const model = searchParams.get("model") || "all";

    let sqlQuery = \`
      SELECT 
        a.id, 
        a.user_id,
        a.name, 
        a.category,
        a.model,
        a.tags,
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

    if (model !== "all") {
      sqlQuery += " AND a.model = ?";
      args.push(model);
    }

    sqlQuery += " ORDER BY a.created_at DESC";

    const queryResult = await db.execute({ sql: sqlQuery, args });

    const feed = queryResult.rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      category: row.category as string,
      model: (row.model as string) || "any",
      tags: (row.tags as string) || "",
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

    const { name, prompt, category, model, tags } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim() || !category || !model) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    // Нормализация тегов
    const cleanTags = tags 
      ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t !== "").join(",") 
      : "";

    const agentId = generateUUID();
    const versionId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO agents (id, user_id, name, category, model, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [agentId, user.id, name.trim(), category, model, cleanTags, now]
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
  writeProjectFile('src/app/api/agents/route.ts', updatedApiAgents);

  // 6. Обновление API обновления поста: src/app/api/agents/[id]/route.ts (Поддержка новых полей)
  const updatedApiAgentId = `import { NextRequest, NextResponse } from "next/server";
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

    const { name, prompt, category, model, tags } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim() || !category || !model) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Пост не найден или доступ ограничен" }, { status: 404 });
    }

    // Нормализация тегов
    const cleanTags = tags 
      ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t !== "").join(",") 
      : "";

    await db.execute({
      sql: "UPDATE agents SET name = ?, category = ?, model = ?, tags = ? WHERE id = ?",
      args: [name.trim(), category, model, cleanTags, id]
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
  writeProjectFile('src/app/api/agents/[id]/route.ts', updatedApiAgentId);

  // 7. Обновление Главной Ленты: src/app/page.tsx (Рендеринг панели фильтрации моделей и поиска по хэштегам)
  const updatedMainPage = `"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AgentCard, { Agent } from "@/components/AgentCard";
import DetailModal from "@/components/DetailModal";
import AuthModal from "@/components/AuthModal";
import PostModal from "@/components/PostModal";
import BioModal from "@/components/BioModal";
import { AlertCircle, Terminal, Search, Cpu } from "lucide-react";

const MODELS = [
  { id: "all", label: "Все ИИ модели" },
  { id: "any", label: "Универсальные" },
  { id: "gpt4", label: "GPT-4 / 4o" },
  { id: "claude", label: "Claude 3.5" },
  { id: "gemini", label: "Gemini" },
  { id: "llama", label: "LLaMA / DeepSeek" },
  { id: "midjourney", label: "Midjourney" }
];

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeModel, setActiveModel] = useState("all");
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
  }, [activeCategory, activeModel]);

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
    } finally {
      fetchFeed();
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(\`/api/agents?category=\${activeCategory}&model=\${activeModel}\`);
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

  const handleSaveAgent = async (name: string, prompt: string, category: string, model: string, tags: string): Promise<boolean> => {
    try {
      const isEdit = !!editingAgent;
      const url = isEdit ? \`/api/agents/\${editingAgent.id}\` : "/api/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt, category, model, tags })
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
          category: activeAgent.category,
          model: activeAgent.model,
          tags: activeAgent.tags
        })
      });

      if (res.ok) {
        await fetchFeed();
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
      agent.username.toLowerCase().includes(q) ||
      agent.tags.toLowerCase().includes(q)
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
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
        />

        <div className="flex-1 flex flex-col gap-6">
          {/* Панель поиска */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по задачам, тегам (#seo, #react) или авторам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
            />
          </div>

          {/* Панель фильтрации по AI Моделям */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mt-1 select-none">
            {MODELS.map(m => {
              const isActive = activeModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModel(m.id)}
                  className={\`text-xs px-3.5 py-1.5 rounded-full border transition-all shrink-0 font-semibold \${
                    isActive 
                      ? "bg-cyan-950 border-cyan-800 text-cyan-300 shadow-sm" 
                      : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }\`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 h-[390px] animate-pulse" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl p-8 max-w-lg mx-auto">
              <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                <Terminal className="h-7 w-7 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">
                {searchQuery ? "Совпадений не найдено" : "Секция пуста"}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {searchQuery ? "Скорректируйте поисковые слова." : "Опубликуйте первый промпт в этой секции!"}
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

      {/* Модалки */}
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
  writeProjectFile('src/app/page.tsx', updatedMainPage);

  console.log('\n======================================================');
  console.log('СИСТЕМА КАТЕГОРИЗАЦИИ УСПЕШНО ОБНОВЛЕНА!');
  console.log('======================================================');
  console.log('Нововведения:');
  console.log('1. Внедрены 12 специализированных сфер применения промптов.');
  console.log('2. Добавлена сортировка и фильтрация по целевой AI-модели (GPT-4, Claude и др.).');
  console.log('3. Реализована поддержка тегов (#nextjs, #seo) с удобным поиском.');
  console.log('4. Структура БД плавно мигрирована без потери старых данных.\n');

} catch (error) {
  console.error('[FATAL ERROR] Не удалось применить патч категорий:', error.message);
  process.exit(1);
}