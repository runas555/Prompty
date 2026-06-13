import React from "react";
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
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
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
}