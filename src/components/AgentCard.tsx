import React, { useState } from "react";
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
    const parts = text.split(new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi"));
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
              <div className={`h-7 w-7 rounded-lg bg-gradient-to-tr ${getUserGradient(agent.username)} flex items-center justify-center text-[10px] text-slate-950 font-extrabold uppercase shrink-0`}>
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
              className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors ${
                agent.hasLiked 
                  ? "text-rose-400 hover:bg-rose-950/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${agent.hasLiked ? "fill-rose-400 text-rose-400" : ""}`} />
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
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm active:scale-95 transition-all duration-200 ${
                copied
                  ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "ОК" : "Код"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}