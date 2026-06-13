import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { Agent } from "./AgentCard";

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string) => Promise<boolean>;
  agent?: Agent | null;
}

export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  agent
}: AgentModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPrompt(agent.prompt);
    } else {
      setName("");
      setPrompt("");
    }
    setError("");
  }, [agent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Пожалуйста, укажите имя агента");
      return;
    }
    if (!prompt.trim()) {
      setError("Укажите текст промпта (системные инструкции)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const success = await onSave(name.trim(), prompt.trim());
      if (success) {
        onClose();
      } else {
        setError("Возникла ошибка сохранения. Убедитесь в верности Секретного токена");
      }
    } catch (err: any) {
      setError(err.message || "Не удалось отправить запрос");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Задний фон */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Контейнер модального окна */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl z-10 transition-transform duration-300 max-h-[90vh] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              {agent ? "Редактирование агента" : "Создание нового агента"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-5">
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 flex items-start gap-3 text-sm text-red-300 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Имя агента */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Имя агента (Краткое описание задачи)
            </label>
            <input
              type="text"
              placeholder="Например: Python-программист, Копирайтер текстов..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
            />
          </div>

          {/* Текст промпта */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Системный промпт / Инструкции
            </label>
            <textarea
              placeholder="Вставьте сюда ваш промпт, описывающий роль ИИ, правила вывода, тон..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200 resize-none"
            />
          </div>

          {/* Нижняя панель действий */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-55 disabled:cursor-not-allowed text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/10 active:scale-95 transition-all duration-200"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}