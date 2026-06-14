"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, AlertCircle, Globe, FileText, Check, Copy, Maximize2, Minimize2, Hash, Play, HelpCircle, GitCommit, GitCompare, RotateCcw, Eye } from "lucide-react";
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
  const [loading, setLoading] = useState(false);  const [isFullscreen, setIsFullscreen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [activeRightTab, setActiveRightTab] = useState<"settings" | "versions">("settings");
  const [selectedCompareVersion, setSelectedCompareVersion] = useState<any | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);  useEffect(() => {
    if (agent) {
      const displayName = agent.name.includes(" | ") ? agent.name.split(" | ")[0] : agent.name;
      setName(displayName);
      setPrompt(agent.prompt);
      setCategory(agent.category || "coding");
      setModel(agent.model || "any");
      setTags(agent.tags || "");
      setAutoTranslate(agent.name.includes(" | "));
      fetchVersions();
    } else {
      setName("");
      setPrompt("");
      setCategory("coding");
      setModel("any");
      setTags("");
      setAutoTranslate(false);
      setVersions([]);
    }
    setError("");
    setSelectedCompareVersion(null);
    setActiveRightTab("settings");
  }, [agent?.id, isOpen]);

  const fetchVersions = async () => {
    if (!agent) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error("Error fetching versions in PostModal:", err);
    }
  };

  const handleCommitSnapshot = async () => {
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
        const hasCyrillic = /[а-яА-ЯёЁ]/.test(finalName);
        const toLang = hasCyrillic ? "en" : "ru";
        const translatedName = await translateTextWithContext(finalName, finalPrompt, toLang);
        finalName = `${finalName} | ${translatedName}`;
      }
      const success = await onSave(finalName, finalPrompt, category, model, tags.trim());
      if (success) {
        await fetchVersions();
        setError("Слепок успешно зафиксирован в истории!");
        setTimeout(() => setError(""), 3000);
      } else {
        setError(t("errorAgentSave"));
      }
    } catch (err: any) {
      setError(err.message || t("errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Динамическое определение переменных промпта
  const detectVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}|\[([^\]]+)\]/g;
    const vars: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const variableName = (match[1] || match[2]).trim();
      if (variableName && !vars.includes(variableName)) {
        vars.push(variableName);
      }
    }
    return vars;
  };

  const variables = detectVariables(prompt);

  // Спецификация расчетных метрик
  const characterCount = prompt.length;
  const wordCount = prompt.trim() === "" ? 0 : prompt.trim().split(/\s+/).length;
  const estimatedTokens = Math.round(characterCount / 3.8);

  // Синхронизация прокрутки номеров строк с текстовым полем
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = prompt.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Быстрая вставка шаблонов разметки
  const insertTemplate = (prefix: string, suffix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end) || "text";
    
    const newPrompt = `${before}${prefix}${selected}${suffix}${after}`;
    setPrompt(newPrompt);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + prefix.length + selected.length + suffix.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  async function translateTextWithContext(nameText: string, promptText: string, toLang: "en" | "ru"): Promise<string> {
    try {
      const fromLang = toLang === "en" ? "ru" : "en";
      const cleanPrompt = promptText.replace(/[\r\n]+/g, " ").trim();
      const maxPromptLen = 480 - nameText.length - 10;
      const promptSlice = cleanPrompt.substring(0, Math.max(50, maxPromptLen));
      const textToTranslate = `${promptSlice} ||| ${nameText}`;
      
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${fromLang}|${toLang}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          const translatedText = data.responseData.translatedText;
          const parts = translatedText.split("|||");
          if (parts.length > 1) {
            return parts[parts.length - 1].trim();
          }
          return translatedText.trim();
        }
      }
    } catch (err) {
      console.error("Context translation API error:", err);
    }
    return nameText;
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
        const hasCyrillic = /[а-яА-ЯёЁ]/.test(finalName);
        const toLang = hasCyrillic ? "en" : "ru";
        const translatedName = await translateTextWithContext(finalName, finalPrompt, toLang);
        finalName = `${finalName} | ${translatedName}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />
      
      <div className={`relative bg-slate-900 border border-slate-800 rounded-2xl w-full overflow-hidden shadow-2xl z-10 transition-all duration-300 flex flex-col ${
        isFullscreen ? "h-[96vh] max-w-[98vw]" : "max-h-[92vh] max-w-5xl"
      }`}>
        
        {/* Шапка Студии */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/75 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">
                  Prompt Studio
                </h2>
                <span className="text-[10px] font-bold bg-indigo-950/60 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded-full">
                  v2.0 Beta
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Специализированная среда проектирования LLM-инструкций</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="text-slate-500 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-800/80 transition-all"
              title={isFullscreen ? "Свернуть окно" : "Развернуть на весь экран"}
            >
              {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-800/80 transition-all">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Форма Студии */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Левая Панель: Редактор Промпта */}
          <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950/15 overflow-hidden">
            
            {/* Панель быстрых кнопок разметки */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/70 bg-slate-950/30 select-none">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mr-2">Форматирование:</span>
              <button
                type="button"
                onClick={() => insertTemplate('{{', '}}')}
                className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded hover:text-indigo-400 hover:border-indigo-500/50 transition-all"
                title="Вставить системную переменную"
              >
                {"{{ Переменная }}"}
              </button>
              <button
                type="button"
                onClick={() => insertTemplate('[', ']')}
                className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
              >
                {"[ Тэг ]"}
              </button>
              <button
                type="button"
                onClick={() => insertTemplate('### SYSTEM\n', '')}
                className="text-[10px] font-semibold text-slate-500 bg-slate-900/60 border border-slate-850 px-2 py-1 rounded hover:text-slate-200 hover:border-slate-700 transition-all"
              >
                System Block
              </button>
              <button
                type="button"
                onClick={() => insertTemplate('### USER\n', '')}
                className="text-[10px] font-semibold text-slate-500 bg-slate-900/60 border border-slate-850 px-2 py-1 rounded hover:text-slate-200 hover:border-slate-700 transition-all"
              >
                User Block
              </button>
            </div>            {/* Поле редактирования с номерами строк */}
            {selectedCompareVersion ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 select-text font-mono text-xs">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-indigo-950/20">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 select-none">
                    <GitCompare className="h-4 w-4 animate-pulse" />
                    Сравнение: Слепок v{selectedCompareVersion.version} (слева) ↔ Текущая версия (справа)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCompareVersion(null)}
                    className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded transition-all select-none"
                  >
                    Закрыть сравнение
                  </button>
                </div>
                <div className="flex-1 flex overflow-hidden font-mono text-xs select-text">
                  <div className="flex-1 border-r border-slate-800 flex flex-col overflow-hidden">
                    <div className="bg-slate-900/80 px-3 py-1.5 text-[10px] text-slate-500 font-bold border-b border-slate-850 select-none">
                      СЛЕПОК v{selectedCompareVersion.version}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 leading-relaxed bg-red-950/5 font-mono select-text">
                      {selectedCompareVersion.prompt.split("\n").map((line: string, i: number) => {
                        const currentLines = prompt.split("\n");
                        const isDiff = line !== currentLines[i];
                        return (
                          <div key={i} className={`whitespace-pre-wrap py-0.5 px-1 rounded font-mono ${isDiff ? "bg-red-950/20 text-red-300 border-l-2 border-red-500" : "text-slate-400"}`}>
                            <span className="text-slate-600 select-none mr-2 inline-block w-6 text-right font-mono">{i + 1}</span>
                            {line || " "}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-slate-900/80 px-3 py-1.5 text-[10px] text-slate-500 font-bold border-b border-slate-850 select-none">
                      ТЕКУЩЕЕ СОСТОЯНИЕ В РЕДАКТОРЕ
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 leading-relaxed bg-emerald-950/5 font-mono select-text">
                      {prompt.split("\n").map((line: string, i: number) => {
                        const oldLines = selectedCompareVersion.prompt.split("\n");
                        const isDiff = line !== oldLines[i];
                        return (
                          <div key={i} className={`whitespace-pre-wrap py-0.5 px-1 rounded font-mono ${isDiff ? "bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500" : "text-slate-200"}`}>
                            <span className="text-slate-600 select-none mr-2 inline-block w-6 text-right font-mono">{i + 1}</span>
                            {line || " "}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-slate-950 border-t border-slate-850 flex justify-end gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(selectedCompareVersion.prompt);
                      setSelectedCompareVersion(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Восстановить этот слепок в редактор
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex relative overflow-hidden font-mono text-sm bg-slate-950/70 select-text">
                {/* Линейка номеров строк */}
                <div 
                  ref={lineNumbersRef}
                  className="w-11 bg-slate-950/90 py-4 select-none border-r border-slate-900 text-slate-600 text-[10px] text-right pr-2.5 overflow-hidden font-mono leading-relaxed"
                >
                  {lineNumbers.map(num => (
                    <div key={num} className="h-[21px]">{num}</div>
                  ))}
                </div>

                {/* Текстовый редактор */}
                <textarea
                  ref={textareaRef}
                  placeholder={t("modalAgentPromptPlaceholder")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onScroll={handleScroll}
                  disabled={loading}
                  className="flex-1 bg-transparent py-4 px-4 text-slate-200 placeholder-slate-700 focus:outline-none resize-none overflow-y-auto leading-relaxed h-full scroll-smooth select-text"
                  spellCheck="false"
                />
              </div>
            )}

            {/* Статистика и метрики редактора */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/40 text-[10px] font-semibold text-slate-500 font-mono">
              <div className="flex items-center gap-4">
                <span>CHARS: <strong className="text-slate-300">{characterCount}</strong></span>
                <span>WORDS: <strong className="text-slate-300">{wordCount}</strong></span>
                <span className="hidden sm:inline">EST. TOKENS: <strong className="text-indigo-400">{estimatedTokens}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE IDE</span>
              </div>
            </div>

          </div>          {/* Правая Панель: Метаданные и Инструменты Студии */}
          <div className="w-full md:w-[350px] bg-slate-900 p-6 flex flex-col justify-between gap-4 overflow-y-auto select-none">
            <div className="flex flex-col gap-4">
              
              {error && (
                <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Табы в правой панели для переключения параметров и истории */}
              {agent && (
                <div className="flex border border-slate-800 bg-slate-950/40 rounded-xl overflow-hidden p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("settings")}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                      activeRightTab === "settings" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Параметры
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRightTab("versions");
                      fetchVersions();
                    }}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                      activeRightTab === "versions" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Слепки ({versions.length})
                  </button>
                </div>
              )}

              {activeRightTab === "settings" ? (
                <>
                  {/* Название промпта */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {t("modalAgentNameLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("modalAgentNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Модель ИИ */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Назначенная модель ИИ
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {MODELS.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Категория публикации */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {t("sidebarCategories")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {CATEGORIES_LIST.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {language === "ru" ? cat.label : cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Теги */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Теги публикации
                </label>
                <input
                  type="text"
                  placeholder="seo, react, prompt"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Детектор Переменных */}
              <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Промпт-Переменные</span>
                  <span className="text-[9px] text-slate-600 font-mono font-bold">DETECTED: {variables.length}</span>
                </div>
                {variables.length === 0 ? (
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Переменные не обнаружены. Используйте синтаксис {"{{name}}"} или {"[name]"} для выделения изменяемых параметров.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto">
                    {variables.map((v, i) => (
                      <span key={i} className="text-[9px] font-mono font-bold bg-indigo-950/50 text-indigo-300 border border-indigo-900/60 px-2 py-0.5 rounded-md">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>              {/* Перевод поста */}
              <div className="bg-slate-950/30 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-300">Мультиязычный перевод</p>
                    <p className="text-[8px] text-slate-500">Автоматический дубликат (RU/EN)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTranslate(!autoTranslate)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoTranslate ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoTranslate ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300">Быстрый слепок</h4>
                      <p className="text-[9px] text-slate-500">Зафиксировать текущий код</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCommitSnapshot}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <GitCommit className="h-3.5 w-3.5" />
                      Зафиксировать
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {versions.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-6 italic">История слепков пуста</p>
                    ) : (
                      versions.map((ver, idx) => (
                        <div key={ver.id} className="border border-slate-800 rounded-xl bg-slate-950/40 p-3 flex flex-col gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-400">
                              Слепок v{ver.version} {idx === 0 && <span className="text-[9px] text-emerald-400 font-sans ml-1">(тек.)</span>}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(ver.createdAt).toLocaleDateString()} {new Date(ver.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-400 truncate font-mono bg-slate-950/50 p-1.5 rounded border border-slate-900">
                            {ver.prompt}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedCompareVersion(ver)}
                              className="flex-1 py-1 px-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-[10px] flex items-center justify-center gap-1 font-semibold"
                            >
                              <GitCompare className="h-3.5 w-3.5" />
                              Сравнить
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPrompt(ver.prompt);
                                setError(`Загружен слепок v${ver.version}`);
                                setTimeout(() => setError(""), 2500);
                              }}
                              className="flex-1 py-1 px-2 rounded bg-indigo-900/40 border border-indigo-800/50 hover:bg-indigo-900 text-indigo-200 hover:text-white transition-all text-[10px] flex items-center justify-center gap-1 font-semibold"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Применить
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Кнопки Действия Студии */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                {t("modalCancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 active:scale-95 flex items-center gap-1.5"
              >
                {loading ? t("modalSaving") : (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    <span>Сохранить в Студии</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
