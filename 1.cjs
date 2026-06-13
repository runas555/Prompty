const fs = require('fs');
const path = require('path');

console.log('=== ЗАПУСК ПАТЧА ПОЛНОЦЕННЫХ ПРОФИЛЕЙ И СЖАТИЯ ФОТО ===\n');

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

  // 1. Обновление БД: src/lib/db.ts (Миграция добавления аватаров в таблицу users)
  const updatedDbLib = `import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url: url,
  authToken: authToken,
});

export async function initDb() {
  try {
    // 1. Пользователи (с поддержкой аватара)
    await db.execute(\`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        bio TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
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

    // БЕЗОПАСНЫЕ МИГРАЦИИ СХЕМЫ
    try {
      await db.execute("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''");
    } catch (e) {}

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

  // 2. Обновление API Проверки сессии: src/app/api/auth/me/route.ts (Возвращаем аватар при загрузке)
  const updatedApiMe = `import { NextRequest, NextResponse } from "next/server";
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
      sql: "SELECT id, username, bio, avatar FROM users WHERE id = ?",
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
        bio: (user.bio as string) || "",
        avatar: (user.avatar as string) || ""
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}`;
  writeProjectFile('src/app/api/auth/me/route.ts', updatedApiMe);

  // 3. Создание API Профиля и Статистики: src/app/api/auth/profile/route.ts
  const apiProfileContent = `import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    // Считаем персональную статистику
    const promptsResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM agents WHERE user_id = ?",
      args: [user.id]
    });

    const commentsResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM comments WHERE user_id = ?",
      args: [user.id]
    });

    const likesResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM likes WHERE agent_id IN (SELECT id FROM agents WHERE user_id = ?)",
      args: [user.id]
    });

    return NextResponse.json({
      promptsCount: Number(promptsResult.rows[0].count) || 0,
      commentsCount: Number(commentsResult.rows[0].count) || 0,
      likesReceived: Number(likesResult.rows[0].count) || 0
    });
  } catch (error: any) {
    console.error("Profile Stats GET error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { bio, avatar } = await request.json();

    // Обновляем текстовое описание и аватар (Base64)
    await db.execute({
      sql: "UPDATE users SET bio = ?, avatar = ? WHERE id = ?",
      args: [bio ? bio.trim() : "", avatar || "", user.id]
    });

    return NextResponse.json({ success: true, bio, avatar });
  } catch (error: any) {
    console.error("Profile Save POST error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}`;
  writeProjectFile('src/app/api/auth/profile/route.ts', apiProfileContent);
  
  // Удаляем старый файл био, если он существовал
  try {
    const oldBioPath = path.resolve('src/app/api/auth/bio/route.ts');
    if (fs.existsSync(oldBioPath)) {
      fs.unlinkSync(oldBioPath);
    }
  } catch(e){}

  // 4. Обновление API Получения Ленты: src/app/api/agents/route.ts (Join u.avatar в запросах ленты)
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
    const authorId = searchParams.get("authorId") || "";
    const likedBy = searchParams.get("likedBy") || "";

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
        u.avatar,
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

    if (authorId) {
      sqlQuery += " AND a.user_id = ?";
      args.push(authorId);
    }

    if (likedBy) {
      sqlQuery += " AND a.id IN (SELECT agent_id FROM likes WHERE user_id = ?)";
      args.push(likedBy);
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
      avatar: (row.avatar as string) || "", // Возвращаем аватар автора
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

  // 5. Обновление Карточки Агента: src/components/AgentCard.tsx (Рендеринг загруженного аватара вместо монохромной заглушки)
  const updatedAgentCard = `import React, { useState } from "react";
import { Heart, MessageSquare, Copy, Check, Edit, Trash2 } from "lucide-react";
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
  avatar: string; // Новое поле аватара
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
  any: "Any",
  gpt4: "GPT-4",
  claude: "Claude",
  gemini: "Gemini",
  llama: "LLaMA",
  midjourney: "MJ"
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
    <div 
      onClick={() => onOpenHistory(agent)}
      className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[210px] sm:h-[235px] relative group overflow-hidden hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all duration-350 cursor-pointer glass select-none"
    >
      <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Рендерим загруженное фото или градиентную заглушку */}
              {agent.avatar ? (
                <img 
                  src={agent.avatar} 
                  alt="avatar" 
                  className="h-6 w-6 rounded object-cover shrink-0 border border-slate-800"
                />
              ) : (
                <div className={\`h-6 w-6 rounded bg-gradient-to-tr \${getUserGradient(agent.username)} flex items-center justify-center text-[9px] text-slate-950 font-black uppercase shrink-0\`}>
                  {agent.username.slice(0, 2)}
                </div>
              )}
              <span className="text-xs font-bold text-slate-300 truncate">@{agent.username}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="inline-flex items-center text-[8px] font-extrabold text-indigo-400 bg-indigo-950/30 border border-indigo-900/50 px-1.5 py-0.5 rounded uppercase">
                v{agent.version}
              </span>
              <span className="inline-flex items-center text-[8px] font-extrabold text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 px-1.5 py-0.5 rounded uppercase">
                {MODEL_LABELS[agent.model] || "Model"}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-slate-100 text-sm truncate leading-snug mb-1">
            {highlight(agent.name, highlightText)}
          </h3>

          {agent.tags && agent.tags.trim() && (
            <div className="flex flex-wrap gap-1 mb-2 max-h-[16px] overflow-hidden">
              {agent.tags.split(",").map((tag, idx) => (
                <span key={idx} className="text-[9px] text-slate-500 font-semibold">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1 bg-slate-950/70 rounded-lg py-2 px-2.5 text-[11px] text-slate-400 border border-slate-850 overflow-hidden font-mono select-text leading-relaxed max-h-[50px] sm:max-h-[64px] mb-3">
          <p className="whitespace-pre-wrap select-text">{highlight(agent.prompt, highlightText)}</p>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-800/50 pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLikeToggle(agent.id, agent.hasLiked)}
              className={\`flex items-center gap-1 text-[11px] font-bold h-7 px-2.5 rounded-lg transition-colors \${
                agent.hasLiked 
                  ? "text-rose-400 bg-rose-950/25" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }\`}
            >
              <Heart className={\`h-3.5 w-3.5 \${agent.hasLiked ? "fill-rose-400 text-rose-400" : ""}\`} />
              <span>{agent.likeCount}</span>
            </button>

            <button
              onClick={() => onOpenHistory(agent)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 h-7 px-2.5 rounded-lg hover:bg-slate-800/40"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{agent.commentCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <button
                  onClick={() => onEdit(agent)}
                  className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all"
                  title="Редактировать"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            <button
              onClick={handleCopy}
              className={\`flex items-center gap-1 text-[10px] font-bold h-7 px-3.5 rounded-lg active:scale-95 transition-all duration-200 \${
                copied
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-900/60"
                  : "bg-indigo-600/80 hover:bg-indigo-600 text-white"
              }\`}
            >
              {copied ? <Check className="h-3 w-3 stroke-[2.5]" /> : null}
              <span>{copied ? "ОК" : "Копировать"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  writeProjectFile('src/components/AgentCard.tsx', updatedAgentCard);

  // 6. Создание нового интерактивного Модального Окна Профиля (HTML5 Canvas Сжатие)
  const updatedProfileModal = `import React, { useState, useEffect } from "react";
import { X, AlertCircle, Camera, Check } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bio: string, avatar: string) => Promise<boolean>;
  currentBio: string;
  currentAvatar: string;
}

export default function ProfileModal({ isOpen, onClose, onSave, currentBio, currentAvatar }: ProfileModalProps) {
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ promptsCount: 0, commentsCount: 0, likesReceived: 0 });

  useEffect(() => {
    if (isOpen) {
      setBio(currentBio);
      setAvatar(currentAvatar);
      setError("");
      fetchStats();
    }
  }, [currentBio, currentAvatar, isOpen]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {}
  };

  if (!isOpen) return null;

  // Логика клиентского сжатия загружаемой фотографии через HTML5 Canvas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите файл изображения (png/jpg/webp).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 128; // Сжимаем до компактного размера 128х128 для мгновенного сохранения в БД
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          // Квадратный кроп по центру кадра
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          
          // Получаем Base64 сжатой jpeg-картинки (70% качества)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setAvatar(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const success = await onSave(bio.trim(), avatar);
      if (success) {
        onClose();
      } else {
        setError("Ошибка при записи профиля в базу данных.");
      }
    } catch (err: any) {
      setError("Не удалось установить соединение.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 overflow-hidden bottom-0 sm:bottom-auto absolute sm:relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-2">Настройка профиля</h3>
        <p className="text-xs text-slate-500 mb-5">Заполните информацию о себе и загрузите ваше фото.</p>

        {/* Секция статистики */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/50 border border-slate-850 p-3 rounded-xl mb-5 text-center">
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.promptsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Промптов</div>
          </div>
          <div>
            <div className="text-sm font-bold text-cyan-400">{stats.likesReceived}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Лайков</div>
          </div>
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.commentsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Отзывов</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900 p-3 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Загрузчик Аватара */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar Preview" 
                  className="h-16 w-16 rounded-xl object-cover border border-slate-850 shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-600">
                  <Camera className="h-6 w-6" />
                </div>
              )}
              <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center cursor-pointer transition-opacity">
                <Camera className="h-5 w-5 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">Фотография профиля</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Будет сжата локально и сохранена в базу данных.</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">О себе (Биография)</label>
            <textarea
              placeholder="Ваша роль, стек ИИ-моделей или краткая визитка..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              maxLength={150}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all"
            >
              {loading ? "Сохранение..." : "Сохранить профиль"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
  writeProjectFile('src/components/ProfileModal.tsx', updatedProfileModal);
  
  // Удаляем старую модалку био, если она осталась
  try {
    const oldBioModalPath = path.resolve('src/components/BioModal.tsx');
    if (fs.existsSync(oldBioModalPath)) {
      fs.unlinkSync(oldBioModalPath);
    }
  } catch(e){}

  // 7. Обновление Сайдбара: src/components/Sidebar.tsx (Вывод аватара)
  const updatedSidebarContent = `import React from "react";
import { 
  Layers, Code, PenTool, Image, Music, Laptop, 
  BarChart2, BookOpen, Cpu, ShieldAlert, Sparkles, 
  CheckSquare, HelpCircle 
} from "lucide-react";

interface SidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  user: { id: string; username: string; bio: string; avatar: string } | null;
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
    <aside className="hidden md:flex w-64 flex-col gap-6 shrink-0">
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden glass">
        <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/5 to-transparent" />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">Профиль</h3>
        {user ? (
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-lg object-cover border border-slate-800"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="text-sm font-bold text-slate-200">@{user.username}</p>
            </div>
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
        <p className="mt-1">PromptSocial &bull; Open-Source v1.3</p>
      </div>
    </aside>
  );
}`;
  writeProjectFile('src/components/Sidebar.tsx', updatedSidebarContent);

  // 8. Обновление Главной Страницы: src/app/page.tsx (Внедрение переключателя вкладок и фильтрации ленты)
  const updatedMainPage = `"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar, { CATEGORIES } from "@/components/Sidebar";
import AgentCard, { Agent } from "@/components/AgentCard";
import DetailModal from "@/components/DetailModal";
import AuthModal from "@/components/AuthModal";
import PostModal from "@/components/PostModal";
import ProfileModal from "@/components/ProfileModal";
import { AlertCircle, Terminal, Search, Compass, User, Settings, LogOut, PlusCircle } from "lucide-react";

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

  // Сессионные данные
  const [user, setUser] = useState<{ id: string; username: string; bio: string; avatar: string } | null>(null);

  // Навигация для мобильных платформ
  const [mobileTab, setMobileTab] = useState<"feed" | "categories" | "search" | "profile">("feed");

  // Табы ленты (для desktop и mobile)
  const [feedMode, setFeedMode] = useState<"all" | "my" | "liked">("all");

  // Модальные окна
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Активные объекты
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [activeCategory, activeModel, feedMode, user]);

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
      // Строим query-параметры на основе выбранной вкладки (All / My / Liked)
      let queryUrl = \`/api/agents?category=\${activeCategory}&model=\${activeModel}\`;
      if (feedMode === "my" && user) {
        queryUrl += \`&authorId=\${user.id}\`;
      } else if (feedMode === "liked" && user) {
        queryUrl += \`&likedBy=\${user.id}\`;
      }

      const res = await fetch(queryUrl);
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
      setFeedMode("all");
      fetchFeed();
      setMobileTab("feed");
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
        setMobileTab("feed");
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

  const handleSaveProfile = async (bioText: string, avatarBase64: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioText, avatar: avatarBase64 })
      });

      if (res.ok && user) {
        setUser({ ...user, bio: bioText.trim(), avatar: avatarBase64 });
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

  const handleOpenAddModal = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setEditingAgent(null);
      setIsPostOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-20 md:pb-0">
      <Header
        user={user}
        onLoginClick={() => setIsAuthOpen(true)}
        onOpenAddModal={handleOpenAddModal}
        totalAgents={agents.length}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
        />

        <div className="flex-1 flex flex-col gap-5 md:gap-6">
          
          {/* ================= DESKTOP VIEW PANEL ================= */}
          <div className="hidden md:flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по задачам, тегам (#seo, #react) или авторам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Вкладки Модов ленты на Desktop */}
            {user && (
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setFeedMode("all")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  Все публикации
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  Мои промпты
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  Мне понравилось
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mt-1 select-none hide-scrollbar">
              {MODELS.map(m => {
                const isActive = activeModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModel(m.id)}
                    className={\"text-xs px-3.5 py-1.5 rounded-full border transition-all shrink-0 font-semibold \" + (
                      isActive 
                        ? "bg-cyan-950 border-cyan-800 text-cyan-300 shadow-sm" 
                        : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= MOBILE VIEW CONTEXTUAL LAYOUT ================= */}
          
          {/* Вкладка 1: Лента промптов (мобильные) */}
          <div className={\`md:block \${mobileTab === "feed" ? "block" : "hidden"}\`}>
            {error && (
              <div className="bg-red-950/40 border border-red-900 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-300 mb-4">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Вкладки Модов ленты на Смартфонах */}
            {user && (
              <div className="flex md:hidden border-b border-slate-850 mb-4 overflow-x-auto hide-scrollbar select-none">
                <button
                  onClick={() => setFeedMode("all")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  Все посты
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  Мои промпты
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  Избранное
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-[235px] animate-pulse" />
                ))}
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl p-8 max-w-lg mx-auto">
                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                  <Terminal className="h-7 w-7 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Ничего не найдено</h3>
                <p className="text-sm text-slate-500 mt-1">Опубликуйте первый промпт в этой вкладке!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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

          {/* Вкладка 2: Выбор категорий (мобильные) */}
          <div className={\`md:hidden bg-slate-900/40 border border-slate-800 rounded-2xl p-5 glass \${mobileTab === "categories" ? "block" : "hidden"}\`}>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Выберите категорию</h3>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setMobileTab("feed");
                    }}
                    className={\`flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all active:scale-98 \${
                      isActive
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-950/40 text-slate-300 border border-slate-800/50 hover:bg-slate-800/50"
                    }\`}
                  >
                    <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Вкладка 3: Поиск и AI Модели (мобильные) */}
          <div className={\`md:hidden flex flex-col gap-4 \${mobileTab === "search" ? "block" : "hidden"}\`}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по тегам, задачам или авторам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 select-none hide-scrollbar">
              {MODELS.map(m => {
                const isActive = activeModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModel(m.id)}
                    className={\`text-xs px-3.5 py-1.5 rounded-full border transition-all shrink-0 font-semibold \${
                      isActive 
                        ? "bg-cyan-950 border-cyan-800 text-cyan-300 shadow-sm" 
                        : "bg-slate-900/40 border-slate-800/80 text-slate-400"
                    }\`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setMobileTab("feed")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm"
            >
              Перейти к результатам ({filteredAgents.length})
            </button>
          </div>

          {/* Вкладка 4: Мобильный Профиль (мобильные) */}
          <div className={\`md:hidden flex flex-col gap-4 \${mobileTab === "profile" ? "block" : "hidden"}\`}>
            {user ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 glass">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="h-11 w-11 rounded-xl object-cover border border-slate-850"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold uppercase">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-slate-200">@{user.username}</p>
                    <p className="text-xs text-slate-500">Промпт-инженер</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic leading-relaxed break-words bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  {user.bio || "Биография не указана."}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                    Настройки
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-950/20 text-red-400 py-3 rounded-xl text-xs font-bold border border-red-900/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center glass">
                <p className="text-sm text-slate-400 mb-4">Войдите в личный профиль для публикации и оценки промптов.</p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Авторизоваться
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= MOBILE BOTTOM TAB BAR NAVIGATION ================= */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-950/95 border-t border-slate-850/80 glass pb-safe z-40">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
          <button
            onClick={() => setMobileTab("feed")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "feed" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Terminal className="h-5 w-5" />
            <span>Лента</span>
          </button>

          <button
            onClick={() => setMobileTab("categories")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "categories" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Compass className="h-5 w-5" />
            <span>Разделы</span>
          </button>

          {user && (
            <button
              onClick={handleOpenAddModal}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-indigo-400 hover:text-indigo-300 transition-all active:scale-95"
            >
              <PlusCircle className="h-7 w-7 fill-indigo-950" />
            </button>
          )}

          <button
            onClick={() => setMobileTab("search")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "search" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Search className="h-5 w-5" />
            <span>Поиск</span>
          </button>

          <button
            onClick={() => setMobileTab("profile")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "profile" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <User className="h-5 w-5" />
            <span>Кабинет</span>
          </button>
        </div>
      </div>

      {/* Модальные окна */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(userData) => {
          setUser(userData);
          checkSession();
          setMobileTab("feed");
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

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleSaveProfile}
        currentBio={user ? user.bio : ""}
        currentAvatar={user ? user.avatar : ""}
      />
    </div>
  );
}`;
  writeProjectFile('src/app/page.tsx', updatedMainPage);

  console.log('\n======================================================');
  console.log('ПРОФИЛИ УСПЕШНО КАТАЛИЗИРОВАНЫ В ПРОДАКШН!');
  console.log('======================================================');
  console.log('Что сделано:');
  console.log('1. Внедрена безопасная миграция колонок аватаров (Base64) в БД.');
  console.log('2. Добавлен нативный HTML5 Canvas сжатия картинок до ~8Кб прямо на клиенте.');
  console.log('3. Профиль расширен персональной статистикой (Лайки, Промпты, Отзывы).');
  code = console.log('4. Разработаны селекторы фильтрации («Все», «Мои промпты», «Мне понравилось»).\n');

} catch (error) {
  console.error('[FATAL ERROR] Не удалось применить патч профилей:', error.message);
  process.exit(1);
}