"use client";

import React from "react";
import { X } from "lucide-react";
import { Agent } from "./AgentCard";
import { useLanguage, parseBio, getLocalizedName } from "@/lib/i18n";
import { getUserGradient } from "@/lib/utils";

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  bio: string;
  avatar: string;
  authorAgents: Agent[];
  onOpenAgent: (agent: Agent) => void;
}

export default function PublicProfileModal({
  isOpen,
  onClose,
  username,
  bio,
  avatar,
  authorAgents,
  onOpenAgent
}: PublicProfileModalProps) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;

  const parsed = parseBio(bio);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col bottom-0 sm:bottom-auto absolute sm:relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">{t("publicProfileTitle")}</h3>

        {/* Profile Card */}
        <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col gap-4 mb-5 relative overflow-hidden glass">
          <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            {avatar ? (
              <img 
                src={avatar} 
                alt={username} 
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-slate-800 shadow-md"
              />
            ) : (
              <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-tr ${getUserGradient(username)} flex items-center justify-center text-lg text-slate-950 font-black uppercase shrink-0 border border-slate-800 shadow-md`}>
                {username.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-slate-100">@{username}</p>
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                {t("prof_" + parsed.profession)}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic leading-relaxed break-words bg-slate-950/70 p-3 rounded-xl border border-slate-900 relative z-10">
            {parsed.bioText || t("sidebarBioEmpty")}
          </p>
        </div>

        {/* Publications list */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            {t("publicProfilePrompts")} ({authorAgents.length})
          </h4>
          
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {authorAgents.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">Нет активных публикаций.</p>
            ) : (
              authorAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => {
                    onOpenAgent(agent);
                    onClose();
                  }}
                  className="bg-slate-950/30 border border-slate-850 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {getLocalizedName(agent.name, language)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate mt-1">
                      {agent.prompt.substring(0, 60)}...
                    </p>
                  </div>
                  <span className="text-[8px] font-extrabold text-indigo-400 bg-indigo-950/30 border border-indigo-900/50 px-1.5 py-0.5 rounded uppercase shrink-0">
                    v{agent.version}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
