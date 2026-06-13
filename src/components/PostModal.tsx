"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, Globe } from "lucide-react";
import { Agent } from "./AgentCard";
import { useLanguage } from "@/lib/i18n";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string, category: string, model: string, tags: string) => Promise<boolean>;
  agent?: Agent | null;
}

const MODELS = [
  { id: "any", label: "Any" },
  { id: "gpt4", label: "GPT-4" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "llama", label: "LLaMA" },
  { id: "midjourney", label: "Midjourney" }
];

const CATEGORIES_LIST = [
  { id: "coding", label: "Программирование", labelEn: "Coding" },
  { id: "writing", label: "Тексты и переводы", labelEn: "Texts & Translations" },
  { id: "art", label: "Генерация артов", labelEn: "Art Generation" },
  { id: "audio-video", label: "Аудио и видеогенерация", labelEn: "Audio & Video Gen" },
  { id: "assistant", label: "Бизнес-ассистенты", labelEn: "Business Assistants" },
  { id: "marketing", label: "Маркетинг, SEO и SMM", labelEn: "Marketing, SEO & SMM" },
  { id: "education", label: "Обучение и наука", labelEn: "Education & Science" },
  { id: "agents", label: "Автономные агенты", labelEn: "Autonomous Agents" },
  { id: "security", label: "Безопасность и Jailbreak", labelEn: "Security & Jailbreak" },
  { id: "creative", label: "Творчество и ролевые", labelEn: "Creative & Roleplay" },
  { id: "productivity", label: "Личная эффективность", labelEn: "Personal Productivity" },
  { id: "other", label: "Разное", labelEn: "Other" }
];

export default function PostModal({ isOpen, onClose, onSave, agent }: PostModalProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("coding");
  const [model, setModel] = useState("any");
  const [tags, setTags] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPrompt(agent.prompt);
      setCategory(agent.category || "coding");
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
    setAutoTranslate(false);
  }, [agent, isOpen]);

  if (!isOpen) return null;

  async function translateText(text: string, toLang: "en" | "ru"): Promise<string> {
    try {
      const fromLang = toLang === "en" ? "ru" : "en";
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (err) {
      console.error("Translation API error:", err);
    }
    return text;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("errorAgentName"));
      return;
    }
    if (!prompt.trim()) {
      setError(t("errorAgentPrompt"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      let finalName = name.trim();
      let finalPrompt = prompt.trim();

      if (autoTranslate) {
        const hasCyrillic = /[а-яА-ЯёЁ]/.test(finalPrompt);
        const toLang = hasCyrillic ? "en" : "ru";
        
        const translatedName = await translateText(finalName, toLang);
        const translatedPrompt = await translateText(finalPrompt, toLang);

        finalName = `${finalName} | ${translatedName}`;
        finalPrompt = `${finalPrompt}\n\n--- ${toLang === "en" ? "English Version" : "Русская версия"} ---\n\n${translatedPrompt}`;
      }

      const success = await onSave(finalName, finalPrompt, category, model, tags.trim());
      if (success) {
        onClose();
      } else {
        setError(t("errorAgentSave"));
      }
    } catch (err: any) {
      setError(err.message || t("errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              {agent ? t("modalEditAgent") : t("modalCreateAgent")}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 flex items-start gap-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("modalAgentNameLabel")}
            </label>
            <input
              type="text"
              placeholder={t("modalAgentNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("sidebarCategories")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {language === "ru" ? cat.label : cat.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {MODELS.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tags
              </label>
              <input
                type="text"
                placeholder="seo, react, chatgpt"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Translation Toggle Switch Slider */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-950 border border-indigo-900/60 flex items-center justify-center text-indigo-400">
                <Globe className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {language === "ru" ? "Переводить этот пост?" : "Translate this post?"}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {language === "ru" 
                    ? "Автоматический качественный перевод на альтернативный язык (RU <-> EN)" 
                    : "Automatic quality translation to the alternate language (RU <-> EN)"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoTranslate ? "bg-indigo-600" : "bg-slate-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoTranslate ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Prompt Area */}
          <div className="flex flex-col gap-1.5 flex-1 mt-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("modalAgentPromptLabel")}
            </label>
            <textarea
              placeholder={t("modalAgentPromptPlaceholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            >
              {t("modalCancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
            >
              {loading ? t("modalSaving") : t("modalSave")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
