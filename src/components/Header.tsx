import React from "react";
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
                  <div className={`h-6 w-6 rounded-lg bg-gradient-to-tr ${getUserGradient(user.username)} flex items-center justify-center text-[10px] text-slate-950 font-bold uppercase`}>
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
}