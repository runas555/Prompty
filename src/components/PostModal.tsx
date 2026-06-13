import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { CATEGORIES } from "./Sidebar";
import { Agent } from "./AgentCard";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string, category: string, model: string, tags: string) => Promise<boolean>;
  agent?: Agent | null;
}

const MODELS = [
  { id: "any", label: "Универсальный (любая модель)" },
  { id: "gpt4", label: "OpenAI GPT-4 / GPT-4o" },
  { id: "claude", label: "Anthropic Claude 3.5" },
  { id: "gemini", label: "Google Gemini Pro" },
  { id: "llama", label: "LLaMA / DeepSeek" },
  { id: "midjourney", label: "Midjourney / DALL-E / Art" }
];

export default function PostModal({
  isOpen,
  onClose,
  onSave,
  agent
}: PostModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("coding");
  const [model, setModel] = useState("any");
  const [tags, setTags] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPrompt(agent.prompt);
      setCategory(agent.category);
      setModel(agent.model || "any");
      setTags(agent.tags || "");
    } else {
      setName("");
      setPrompt("");
      setCategory("coding");
      setModel("any");
      setTags("");
    }
    setError("");
  }, [agent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim() || !category || !model) {
      setError("Пожалуйста, заполните все обязательные поля формы");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const success = await onSave(name.trim(), prompt.trim(), category, model, tags.trim());
      if (success) {
        onClose();
      } else {
        setError("Возникла ошибка при сохранении данных.");
      }
    } catch (err: any) {
      setError(err.message || "Не удалось отправить запрос.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">
              {agent ? "Редактирование публикации" : "Поделиться новым промптом"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-xl p-4 flex items-start gap-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Категория */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.filter(c => c.id !== "all").map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* AI Модель */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Целевая модель</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Теги */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Теги (Через запятую)</label>
            <input
              type="text"
              placeholder="Например: react, typescript, seo, refactoring"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Название роли / Задача промпта</label>
            <input
              type="text"
              placeholder="Например: Генератор SEO метаданных..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Текст */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Инструкции (Промпт)</label>
            <textarea
              placeholder="Задайте системную роль, ограничения и формат ответов..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all active:scale-95"
            >
              {loading ? "Сохранение..." : "Опубликовать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}