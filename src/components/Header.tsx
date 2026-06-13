import React from "react";
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
}