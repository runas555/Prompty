const fs = require('fs');
const path = require('path');

console.log('=== ЗАПУСК ПАТЧА ОПТИМИЗАЦИИ МОБИЛЬНОЙ ВЕРСИИ ===\n');

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

  // 1. Обновление глобальных стилей: src/app/globals.css (Адаптация безопасных зон для iOS/Android)
  const updatedGlobals = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #080c14;
  color: #f1f5f9;
  font-family: ui-sans-serif, system-ui, sans-serif;
  /* Предотвращаем горизонтальный скролл на мобильных устройствах */
  overflow-x: hidden; 
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
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Безопасный отступ снизу для мобильных экранов с вырезом */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Скрытие скроллбара для горизонтального меню */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}`;
  writeProjectFile('src/app/globals.css', updatedGlobals);

  // 2. Оптимизация шапки: src/components/Header.tsx (Минималистичный вид на мобильных экранах)
  const updatedHeader = `import React from "react";
import { Terminal } from "lucide-react";

interface HeaderProps {
  user: { id: string; username: string; bio: string } | null;
  onLoginClick: () => void;
  onOpenAddModal: () => void;
  totalAgents: number;
}

export default function Header({
  user,
  onLoginClick,
  onOpenAddModal,
  totalAgents
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 w-full transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-indigo-500/20">
              <Terminal className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PromptSocial
              </h1>
              <p className="hidden sm:block text-[10px] text-slate-500 font-medium">
                Каталог системных промптов ({totalAgents} агентов)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Кнопка "Создать" в шапке показывается только на Desktop, на мобилках она вынесена навигацией */}
            <button
              onClick={user ? onOpenAddModal : onLoginClick}
              className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95"
            >
              Поделиться
            </button>
            
            {!user && (
              <button
                onClick={onLoginClick}
                className="md:hidden flex items-center justify-center bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}`;
  writeProjectFile('src/components/Header.tsx', updatedHeader);

  // 3. Обновление Сайдбара: src/components/Sidebar.tsx (Скрытие на мобильных экранах)
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
    <aside className="hidden md:flex w-64 flex-col gap-6 shrink-0">
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
        <p className="mt-1">PromptSocial &bull; Open-Source v1.2</p>
      </div>
    </aside>
  );
}`;
  writeProjectFile('src/components/Sidebar.tsx', updatedSidebar);

  // 4. Оптимизация карточки агента: src/components/AgentCard.tsx (Увеличенные тач-зоны и адаптивные отступы)
  const updatedAgentCard = `import React, { useState } from "react";
import { Heart, MessageSquare, Copy, Check, History, Edit, Trash2 } from "lucide-react";
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
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-[340px] sm:h-[390px] relative group overflow-hidden hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300 glass">
      <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={\`h-7 w-7 rounded-lg bg-gradient-to-tr \${getUserGradient(agent.username)} flex items-center justify-center text-[10px] text-slate-950 font-extrabold uppercase shrink-0\`}>
                {agent.username.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-300 truncate">@{agent.username}</p>
                <p className="hidden sm:block text-[10px] text-slate-500 truncate max-w-[130px]">{agent.userBio || "Промптер"}</p>
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

          <h3 className="font-bold text-slate-100 text-sm sm:text-base truncate mb-1">
            {highlight(agent.name, highlightText)}
          </h3>

          {agent.tags && agent.tags.trim() && (
            <div className="flex flex-wrap gap-1 mb-2 max-h-5 overflow-hidden">
              {agent.tags.split(",").map((tag, idx) => (
                <span key={idx} className="text-[9px] sm:text-[10px] text-slate-400 font-medium bg-slate-800/40 px-1.5 py-0.5 rounded">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Текст промпта */}
        <div className="flex-1 bg-slate-950 p-3 sm:p-4 rounded-xl text-xs sm:text-sm text-slate-300 border border-slate-850 overflow-y-auto mb-3 sm:mb-4 font-mono text-[11px] sm:text-[12px] opacity-90 select-text leading-relaxed">
          <p className="whitespace-pre-wrap select-text">{highlight(agent.prompt, highlightText)}</p>
        </div>

        {/* Действия и метрики - увеличены тач-зоны до 40px+ */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-2.5 sm:pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLikeToggle(agent.id, agent.hasLiked)}
              className={\`flex items-center justify-center gap-1.5 text-xs font-semibold h-10 px-3 rounded-xl transition-colors \${
                agent.hasLiked 
                  ? "text-rose-400 bg-rose-950/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 bg-slate-900/40 border border-slate-800/50"
              }\`}
            >
              <Heart className={\`h-4.5 w-4.5 \${agent.hasLiked ? "fill-rose-400 text-rose-400" : ""}\`} />
              <span>{agent.likeCount}</span>
            </button>

            <button
              onClick={() => onOpenHistory(agent)}
              className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 h-10 px-3 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-800/40"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span>{agent.commentCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwner && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(agent); }}
                  className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-xl border border-slate-800/50 transition-all"
                  title="Редактировать"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(agent.id); }}
                  className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-xl border border-slate-800/50 transition-all"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              onClick={handleCopy}
              className={\`flex items-center gap-1.5 text-xs font-bold h-10 px-4 rounded-xl shadow-sm active:scale-95 transition-all duration-200 \${
                copied
                  ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }\`}
            >
              {copied ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "ОК" : "Копировать"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  writeProjectFile('src/components/AgentCard.tsx', updatedAgentCard);

  // 5. Оптимизация модалок: Модифицируем AuthModal, PostModal, DetailModal и BioModal под Bottom Sheets (снизу на мобилках)
  const convertToBottomSheet = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Меняем контейнер модалки, чтобы на мобилках он прилипал к низу
    code = code.replace(
      'className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"',
      'className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh] bottom-0 sm:bottom-auto absolute sm:relative"'
    );
    code = code.replace(
      'className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl z-10 flex flex-col"',
      'className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden shadow-2xl z-10 flex flex-col bottom-0 sm:bottom-auto absolute sm:relative"'
    );
    code = code.replace(
      'className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl z-10 overflow-hidden"',
      'className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 overflow-hidden bottom-0 sm:bottom-auto absolute sm:relative"'
    );
    code = code.replace(
      'className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 flex flex-col"',
      'className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 flex flex-col bottom-0 sm:bottom-auto absolute sm:relative"'
    );

    // Центрирование модалок во весь экран на мобильных устройствах
    code = code.replace(
      'className="fixed inset-0 z-50 flex items-center justify-center p-4"',
      'className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"'
    );

    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[BOTTOM SHEET UX APPLIED] ${filePath}`);
  };

  convertToBottomSheet('src/components/AuthModal.tsx');
  convertToBottomSheet('src/components/PostModal.tsx');
  convertToBottomSheet('src/components/DetailModal.tsx');
  convertToBottomSheet('src/components/BioModal.tsx');

  // 6. Обновление Главного Модуля: src/app/page.tsx (Внедрение Bottom Tab Bar и контекстного рендеринга разделов)
  const updatedMainPage = `"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar, { CATEGORIES } from "@/components/Sidebar";
import AgentCard, { Agent } from "@/components/AgentCard";
import DetailModal from "@/components/DetailModal";
import AuthModal from "@/components/AuthModal";
import PostModal from "@/components/PostModal";
import BioModal from "@/components/BioModal";
import { 
  AlertCircle, Terminal, Search, Layers, 
  User, Settings, LogOut, PlusCircle, Compass 
} from "lucide-react";

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
  const [user, setUser] = useState<{ id: string; username: string; bio: string } | null>(null);

  // Навигация для мобильных платформ
  const [mobileTab, setMobileTab] = useState<"feed" | "categories" | "search" | "profile">("feed");

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
        
        {/* Сайдбар скрыт на мобильных устройствах, заменяясь на Bottom Navigation */}
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
        />

        <div className="flex-1 flex flex-col gap-5 md:gap-6">
          
          {/* ================= DESKTOP VIEW LAYOUT ================= */}
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

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mt-1 select-none hide-scrollbar">
              {MODELS.map(m => {
                const isActive = activeModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModel(m.id)}
                    className={\`text-xs px-3.5 py-1.5 rounded-full border transition-all shrink-0 font-semibold \${
                      isActive 
                        ? "bg-cyan-950 border-cyan-800 text-cyan-300 shadow-sm" 
                        : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200"
                    }\`}
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

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 h-[340px] animate-pulse" />
                ))}
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-3xl p-8 max-w-lg mx-auto">
                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                  <Terminal className="h-7 w-7 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Раздел пуст</h3>
                <p className="text-sm text-slate-500 mt-1">Опубликуйте первый промпт в этой секции!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-xs text-slate-950 font-bold uppercase">
                    {user.username.slice(0, 2)}
                  </div>
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
                    onClick={() => setIsBioOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                    О себе
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
          setUser({ ...userData, bio: "" });
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
  console.log('МОБИЛЬНАЯ ВЕРСИЯ УСПЕШНО ОПТИМИЗИРОВАНА!');
  console.log('======================================================');
  console.log('Ключевые изменения:');
  console.log('1. Внедрен удобный нижний Bottom Tab Bar для мобильных устройств.');
  console.log('2. Сайдбары и разделы оптимизированы под мобильный контент.');
  console.log('3. Все модальные окна адаптированы под паттерн Bottom Sheet (выдвижные шторки).');
  console.log('4. Увеличены тач-таргеты кнопок управления для удобства клика пальцами.\n');

} catch (error) {
  console.error('[FATAL ERROR] Ошибка при оптимизации мобильной версии:', error.message);
  process.exit(1);
}