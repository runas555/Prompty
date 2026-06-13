import React from "react";
import { Terminal, Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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
  const { language, setLanguage, t } = useLanguage();
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
                {t("headerCatalog")} ({totalAgents} {t("headerAgents")})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Кнопка "Создать" в шапке показывается только на Desktop, на мобилках она вынесена навигацией */}
            <button
              onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all mr-1"
              title={language === "ru" ? "Switch to English" : "Переключить на русский"}
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>{language === "ru" ? "RU" : "EN"}</span>
            </button>

            <button
              onClick={user ? onOpenAddModal : onLoginClick}
              className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95"
            >
              {t("headerShare")}
            </button>
            
            {!user && (
              <button
                onClick={onLoginClick}
                className="md:hidden flex items-center justify-center bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                {t("headerLogin")}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}