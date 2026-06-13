import React, { useState } from "react";
import { useLanguage, getLocalizedName } from "@/lib/i18n";
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
  const { t, language } = useLanguage();
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
    <article 
      itemScope 
      itemType="https://schema.org/CreativeWork" 
      onClick={() => onOpenHistory(agent)} 
      className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[210px] sm:h-[235px] relative group overflow-hidden hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all duration-350 cursor-pointer glass select-none"
    >
      <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <meta itemProp="datePublished" content={new Date(agent.createdAt).toISOString()} />
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
                <div className={`h-6 w-6 rounded bg-gradient-to-tr ${getUserGradient(agent.username)} flex items-center justify-center text-[9px] text-slate-950 font-black uppercase shrink-0`}>
                  {agent.username.slice(0, 2)}
                </div>
              )}
              <span itemProp="author" className="text-xs font-bold text-slate-300 truncate">@{agent.username}</span>
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

          <h3 itemProp="name" className="font-bold text-slate-100 text-sm truncate leading-snug mb-1">
            {highlight(getLocalizedName(agent.name, language), highlightText)}
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
          <p itemProp="text" className="whitespace-pre-wrap select-text">{highlight(agent.prompt, highlightText)}</p>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-800/50 pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLikeToggle(agent.id, agent.hasLiked)}
              className={`flex items-center gap-1 text-[11px] font-bold h-7 px-2.5 rounded-lg transition-colors ${
                agent.hasLiked 
                  ? "text-rose-400 bg-rose-950/25" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${agent.hasLiked ? "fill-rose-400 text-rose-400" : ""}`} />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(agent.id);
                  }}
                  className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-slate-800/50 rounded-lg transition-all"
                  title={t("confirmDelete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(agent);
                  }}
                  className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all"
                  title={t("agentCardEdit")}
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 text-[10px] font-bold h-7 px-3.5 rounded-lg active:scale-95 transition-all duration-200 ${
                copied
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-900/60"
                  : "bg-indigo-600/80 hover:bg-indigo-600 text-white"
              }`}
            >
              {copied ? <Check className="h-3 w-3 stroke-[2.5]" /> : null}
              <span>{copied ? t("agentCardCopied") : t("agentCardCopy")}</span>
            </button>
          </div>
        </div>
      </div>
    </article>);
}