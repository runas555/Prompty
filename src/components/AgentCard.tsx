import React, { useState } from "react";
import { Copy, Check, History, Edit, Trash2, Calendar, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export interface Agent {
  id: string;
  name: string;
  createdAt: number;
  prompt: string;
  version: number;
  updatedAt: number;
}

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onOpenHistory: (agentId: string) => void;
  onDelete: (agentId: string) => void;
  highlightText?: string;
}

export default function AgentCard({
  agent,
  onEdit,
  onOpenHistory,
  onDelete,
  highlightText = ""
}: AgentCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Использование встроенного буфера обмена с фоллбэком на textarea
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
      console.error("Не удалось скопировать промпт:", err);
    }
  };

  // Метод подсветки совпадений при поиске
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between h-[340px] relative group overflow-hidden">
      {/* Легкое свечение на фоне при ховере */}
      <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Шапка карточки */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 text-base truncate">
              {highlight(agent.name, highlightText)}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                v{agent.version}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(agent.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Тело карточки (промпт) */}
        <div className="flex-1 bg-slate-950/80 rounded-lg p-3 text-sm text-slate-300 border border-slate-800/80 overflow-y-auto mb-4 relative select-text">
          <p className="whitespace-pre-wrap leading-relaxed break-words font-mono text-[12px] opacity-90 select-text">
            {highlight(agent.prompt, highlightText)}
          </p>
        </div>

        {/* Действия с карточкой */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
          {/* Вспомогательные действия слева */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenHistory(agent.id)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="История изменений"
            >
              <History className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => onEdit(agent)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="Редактировать агента"
            >
              <Edit className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              title="Удалить"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Кнопка быстрого копирования справа */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm active:scale-95 ${
              copied
                ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Копировать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}