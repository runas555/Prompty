import React, { useState, useEffect } from "react";
import { X, History, Copy, Check, Clock, RotateCcw, ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Version {
  id: string;
  prompt: string;
  version: number;
  createdAt: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string | null;
  agentName: string;
  onRestore: (promptText: string) => Promise<boolean>;
}

export default function HistoryModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  onRestore
}: HistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && agentId) {
      fetchVersions();
    }
  }, [isOpen, agentId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error("Ошибка при получении истории версий:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = async (promptText: string, verId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = promptText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(verId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Не удалось скопировать:", err);
    }
  };

  const handleRestore = async (promptText: string, verId: string) => {
    setRestoringId(verId);
    try {
      const success = await onRestore(promptText);
      if (success) {
        await fetchVersions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Задний фон */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Контейнер */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl z-10 flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 truncate max-w-lg">
              История версий: {agentName}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Тело модального окна */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500/30 border-t-cyan-500" />
              <p className="text-sm text-slate-500 font-medium">Загрузка версий промптов...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-500">У данного агента нет сохраненной истории версий.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {versions.map((ver, index) => {
                const isLatest = index === 0;
                return (
                  <div 
                    key={ver.id}
                    className={`border rounded-xl bg-slate-950/40 p-5 flex flex-col gap-4 transition-all duration-200 hover:border-slate-700 ${
                      isLatest 
                        ? "border-cyan-900/50 shadow-sm shadow-cyan-950/10" 
                        : "border-slate-800"
                    }`}
                  >
                    {/* Метаданные версии */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isLatest 
                            ? "bg-cyan-950/60 text-cyan-400 border-cyan-800" 
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}>
                          Версия {ver.version} {isLatest && "(Актуальная)"}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(ver.createdAt)}
                        </span>
                      </div>

                      {/* Кнопки взаимодействия */}
                      <div className="flex items-center gap-2">
                        {/* Скопировать */}
                        <button
                          onClick={() => handleCopy(ver.prompt, ver.id)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                            copiedId === ver.id
                              ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {copiedId === ver.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              Скопировано
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Копировать
                            </>
                          )}
                        </button>

                        {/* Восстановить (только если не актуальная прямо сейчас) */}
                        {!isLatest && (
                          <button
                            onClick={() => handleRestore(ver.prompt, ver.id)}
                            disabled={restoringId !== null}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-900 transition-all duration-200"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Восстановить в v{versions[0].version + 1}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Текст версии промпта */}
                    <div className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-slate-300 max-h-56 overflow-y-auto border border-slate-900 select-text leading-relaxed">
                      <p className="whitespace-pre-wrap select-text">{ver.prompt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}