import React from "react";
import {Layers, Code, PenTool, Image, Music, Laptop, 
  BarChart2, BookOpen, Cpu, ShieldAlert, Sparkles, 
  CheckSquare, HelpCircle, Settings, LogOut} from "lucide-react";

interface SidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  user: { id: string; username: string; bio: string; avatar: string 
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
} | null;
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
  totalPromptsCount,
  onSettingsClick,
  onLogoutClick
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
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800/60 relative z-10">
              <button
                type="button"
                onClick={onSettingsClick}
                className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-all active:scale-95"
              >
                <Settings className="h-3.5 w-3.5" />
                Настройки
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onLogoutClick) {
                    onLogoutClick();
                  } else {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.reload();
                    } catch (err) {
                      console.error("Ошибка при выходе из системы:", err);
                    }
                  }
                }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-red-400 transition-all active:scale-95 ml-auto"
              >
                <LogOut className="h-3.5 w-3.5" />
                Выйти
              </button>
            </div>
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
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/15"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
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
}