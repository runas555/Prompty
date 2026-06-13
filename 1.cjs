// === FILE: setup.cjs ===
const fs = require('fs');
const path = require('path');

// Помощник для экранирования регулярных выражений
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Поиск и замена блоков с игнорированием пробелов и переносов строк
function replaceAtAnchor(filePath, anchor, replacement, mode = "replace") {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[FAIL] Файл не найден: ${filePath}`);
      return false;
    }
    let fileContent = fs.readFileSync(filePath, 'utf8');

    const tokens = anchor.split(/(\s+)/);
    let regexPattern = "";
    for (const token of tokens) {
      if (/\s+/.test(token)) {
        regexPattern += "\\s*";
      } else if (token) {
        regexPattern += escapeRegExp(token);
      }
    }
    const regex = new RegExp(regexPattern, 'i');

    const match = fileContent.match(regex);
    if (!match) {
      console.log(`[FAIL] Не найден якорь в ${filePath}: "${anchor.trim().substring(0, 60)}..."`);
      return false;
    }

    const matchedString = match[0];
    let newContent;
    if (mode === "replace") {
      newContent = fileContent.replace(regex, replacement);
    } else if (mode === "after") {
      newContent = fileContent.replace(regex, matchedString + "\n" + replacement);
    } else if (mode === "before") {
      newContent = fileContent.replace(regex, replacement + "\n" + matchedString);
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`[SUCCESS] Успешная замена в: ${filePath}`);
    return true;
  } catch (err) {
    console.log(`[ERROR] Ошибка модификации ${filePath}: ${err.message}`);
    return false;
  }
}

// Функция создания дампа dump.txt
function createDump() {
  console.log("=== Создание/Обновление dump.txt ===");
  try {
    const filesToDump = [
      'package.json',
      'next.config.mjs',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/components/Header.tsx',
      'src/components/Sidebar.tsx',
      'src/components/AgentCard.tsx',
      'src/components/PostModal.tsx',
      'src/components/AuthModal.tsx',
      'src/components/DetailModal.tsx',
      'src/components/ProfileModal.tsx'
    ];

    let dumpContent = "";
    for (const relativePath of filesToDump) {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        dumpContent += `=== FILE: ${relativePath} ===\n${content}\n========================================\n\n`;
      }
    }

    fs.writeFileSync(path.join(process.cwd(), 'dump.txt'), dumpContent, 'utf8');
    console.log("[SUCCESS] Файл dump.txt успешно обновлен.");
  } catch (err) {
    console.log(`[ERROR] Не удалось обновить dump.txt: ${err.message}`);
  }
}

// Основной процесс применения изменений
function main() {
  console.log("=== Применение локализованного отображения ===");

  // Шаг 1: Обновление src/lib/i18n.tsx для включения функции getLocalizedName
  const i18nPath = path.join(process.cwd(), 'src', 'lib', 'i18n.tsx');
  const i18nContent = `"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ru" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  ru: {
    title: "PromptSocial - Социальная сеть промпт-инженеров",
    description: "Делитесь системными инструкциями, оценивайте, версионируйте и комментируйте лучшие промпты.",
    headerCatalog: "Каталог системных промптов",
    headerAgents: "агентов",
    headerShare: "Поделиться",
    headerLogin: "Войти",
    sidebarProfile: "Профиль",
    sidebarSettings: "Настройки",
    sidebarLogout: "Выйти",
    sidebarBioEmpty: "Биография не указана. Заполните её в настройках.",
    sidebarAuthPrompt: "Авторизуйтесь, чтобы публиковать свои промпты, вести обсуждения и ставить лайки.",
    sidebarCategories: "Категории",
    sidebarActivePrompts: "Активных промптов в ленте",
    sidebarOpenSource: "PromptSocial • Open-Source v1.3",
    searchPlaceholder: "Поиск по задачам, тегам (#seo, #react) или авторам...",
    tabAllPublications: "Все публикации",
    tabMyPrompts: "Мои промпты",
    tabLiked: "Мне понравилось",
    tabAllPostsMobile: "Все посты",
    tabFavoritesMobile: "Избранное",
    errorFeedLoad: "Ошибка загрузки ленты",
    errorServerConnect: "Не удалось соединиться с сервером базы данных.",
    confirmLogout: "Выйти из аккаунта?",
    confirmDelete: "Вы уверены, что хотите удалить публикацию?",
    errorDelete: "Ошибка удаления",
    notFoundTitle: "Ничего не найдено",
    notFoundDesc: "Опубликуйте первый промпт в этой вкладке!",
    mobileTabFeed: "Лента",
    mobileTabCategories: "Разделы",
    mobileTabSearch: "Поиск",
    mobileTabProfile: "Кабинет",
    agentCardCopied: "ОК",
    agentCardCopy: "Копировать",
    agentCardEdit: "Редактировать",
    modalEditAgent: "Редактирование агента",
    modalCreateAgent: "Создание нового агента",
    modalAgentNameLabel: "Имя агента (Краткое описание задачи)",
    modalAgentNamePlaceholder: "Например: Python-программист, Копирайтер текстов...",
    modalAgentPromptLabel: "Системный промпт / Инструкции",
    modalAgentPromptPlaceholder: "Вставьте сюда ваш промпт, описывающий роль ИИ, правила вывода, тон...",
    modalCancel: "Отмена",
    modalSave: "Сохранить",
    modalSaving: "Сохранение...",
    errorAgentName: "Пожалуйста, укажите имя агента",
    errorAgentPrompt: "Укажите текст промпта (системные инструкции)",
    errorAgentSave: "Возникла ошибка сохранения. Убедитесь в верности Секретного токена",
    errorNetwork: "Не удалось отправить запрос",
    authLoginTitle: "Вход в систему",
    authRegisterTitle: "Регистрация",
    authSub: "Для создания и изменения собственных промптов",
    authFillAll: "Пожалуйста, заполните все поля",
    authSuccessReg: "Аккаунт успешно создан! Теперь вы можете войти.",
    authError: "Произошла ошибка авторизации",
    authNetworkError: "Ошибка сети. Попробуйте еще раз.",
    authUsernameLabel: "Имя пользователя",
    authUsernamePlaceholder: "Никнейм",
    authPasswordLabel: "Пароль",
    authSubmitLogin: "Войти",
    authSubmitRegister: "Зарегистрироваться",
    authNoAccount: "Еще нет аккаунта?",
    authCreateProfile: "Создать профиль",
    authHaveAccount: "Уже есть аккаунт?",
    detailInstruction: "Инструкция",
    detailHistory: "История версий",
    detailDiscussion: "Обсуждение",
    detailCurrentPrompt: "Текущий системный промпт",
    detailCopyPrompt: "Скопировать промпт",
    detailCopied: "Скопировано!",
    detailLoadingHistory: "Загрузка истории...",
    detailActualVersion: "Актуальная",
    detailRestore: "Восстановить",
    detailCommentPlaceholderUser: "Обсудить этот промпт... напишите ваши тесты или предложите улучшения",
    detailCommentPlaceholderGuest: "Для публикации комментариев необходимо авторизоваться.",
    detailCommentVersionBind: "Комментарий привязывается к версии",
    detailSend: "Отправить",
    detailNoComments: "Обсуждение еще не начато. Будьте первыми!",
    detailToCommentLogin: "Войти в аккаунт",
    profileTitle: "Настройка профиля",
    profileSub: "Заполните информацию о себе и загрузите ваше фото.",
    profilePrompts: "Промптов",
    profileLikes: "Лайков",
    profileComments: "Отзывов",
    profilePhoto: "Фотография профиля",
    profilePhotoSub: "Будет сжата локально и сохранена в базу данных.",
    profileBioLabel: "О себе (Биография)",
    profileBioPlaceholder: "Ваша роль, стек ИИ-моделей или краткая визитка...",
    profileBioEmpty: "Биография не указана.",
    profileSaving: "Сохранение...",
    profileSaveSuccess: "Сохранить профиль",
    profileDbError: "Ошибка при записи профиля в базу данных.",
    profileConnectError: "Не удалось установить соединение.",
    catAll: "Все категории",
    catCoding: "Программирование",
    catWriting: "Тексты и переводы",
    catArt: "Генерация артов",
    catAudioVideo: "Аудио и видеогенерация",
    catAssistant: "Бизнес-ассистенты",
    catMarketing: "Маркетинг, SEO и SMM",
    catEducation: "Обучение и наука",
    catAgents: "Автономные агенты",
    catSecurity: "Безопасность и Jailbreak",
    catCreative: "Творчество и ролевые",
    catProductivity: "Личная эффективность",
    catOther: "Разное"
  },
  en: {
    title: "PromptSocial - Social Network for Prompt Engineers",
    description: "Share system instructions, rate, version, and comment on the best prompts.",
    headerCatalog: "System Prompts Catalog",
    headerAgents: "agents",
    headerShare: "Share",
    headerLogin: "Login",
    sidebarProfile: "Profile",
    sidebarSettings: "Settings",
    sidebarLogout: "Logout",
    sidebarBioEmpty: "Bio is not specified. Fill it in settings.",
    sidebarAuthPrompt: "Log in to publish your prompts, join discussions, and leave likes.",
    sidebarCategories: "Categories",
    sidebarActivePrompts: "Active prompts in feed",
    sidebarOpenSource: "PromptSocial • Open-Source v1.3",
    searchPlaceholder: "Search prompts, tags (#seo, #react) or authors...",
    tabAllPublications: "All publications",
    tabMyPrompts: "My prompts",
    tabLiked: "Liked by me",
    tabAllPostsMobile: "All posts",
    tabFavoritesMobile: "Favorites",
    errorFeedLoad: "Error loading feed",
    errorServerConnect: "Failed to connect to the database server.",
    confirmLogout: "Log out of your account?",
    confirmDelete: "Are you sure you want to delete this publication?",
    errorDelete: "Delete error",
    notFoundTitle: "Nothing found",
    notFoundDesc: "Publish the first prompt in this tab!",
    mobileTabFeed: "Feed",
    mobileTabCategories: "Categories",
    mobileTabSearch: "Search",
    mobileTabProfile: "Cabinet",
    agentCardCopied: "OK",
    agentCardCopy: "Copy",
    agentCardEdit: "Edit",
    modalEditAgent: "Edit Agent",
    modalCreateAgent: "Create New Agent",
    modalAgentNameLabel: "Agent Name (Short task description)",
    modalAgentNamePlaceholder: "Example: Python Developer, Content Writer...",
    modalAgentPromptLabel: "System Prompt / Instructions",
    modalAgentPromptPlaceholder: "Insert your prompt here, describing the AI role, output rules, tone...",
    modalCancel: "Cancel",
    modalSave: "Save",
    modalSaving: "Saving...",
    errorAgentName: "Please specify the agent name",
    errorAgentPrompt: "Please enter the prompt text (system instructions)",
    errorAgentSave: "An error occurred while saving. Make sure your Secret Token is correct",
    errorNetwork: "Failed to send request",
    authLoginTitle: "Sign In",
    authRegisterTitle: "Register",
    authSub: "To create and edit your own prompts",
    authFillAll: "Please fill in all fields",
    authSuccessReg: "Account successfully created! You can now log in.",
    authError: "Authorization error occurred",
    authNetworkError: "Network error. Please try again.",
    authUsernameLabel: "Username",
    authUsernamePlaceholder: "Nickname",
    authPasswordLabel: "Password",
    authSubmitLogin: "Sign In",
    authSubmitRegister: "Register",
    authNoAccount: "No account yet?",
    authCreateProfile: "Create profile",
    authHaveAccount: "Already have an account?",
    detailInstruction: "Instruction",
    detailHistory: "Version History",
    detailDiscussion: "Discussion",
    detailCurrentPrompt: "Current System Prompt",
    detailCopyPrompt: "Copy prompt",
    detailCopied: "Copied!",
    detailLoadingHistory: "Loading history...",
    detailActualVersion: "Actual",
    detailRestore: "Restore",
    detailCommentPlaceholderUser: "Discuss this prompt... write your test cases or suggest improvements",
    detailCommentPlaceholderGuest: "Please authorize to post comments.",
    detailCommentVersionBind: "Comment is bound to version",
    detailSend: "Send",
    detailNoComments: "Discussion not started yet. Be the first!",
    detailToCommentLogin: "Log in to account",
    profileTitle: "Profile Settings",
    profileSub: "Fill in your profile details and upload a photo.",
    profilePrompts: "Prompts",
    profileLikes: "Likes",
    profileComments: "Reviews",
    profilePhoto: "Profile Photo",
    profilePhotoSub: "Will be compressed locally and saved to the database.",
    profileBioLabel: "About Me (Bio)",
    profileBioPlaceholder: "Your role, AI models stack, or a short bio...",
    profileBioEmpty: "Bio is not specified.",
    profileSaving: "Saving...",
    profileSaveSuccess: "Save Profile",
    profileDbError: "Error writing profile to database.",
    profileConnectError: "Failed to establish connection.",
    catAll: "All Categories",
    catCoding: "Coding",
    catWriting: "Texts & Translations",
    catArt: "Art Generation",
    catAudioVideo: "Audio & Video Gen",
    catAssistant: "Business Assistants",
    catMarketing: "Marketing, SEO & SMM",
    catEducation: "Education & Science",
    catAgents: "Autonomous Agents",
    catSecurity: "Security & Jailbreak",
    catCreative: "Creative & Roleplay",
    catProductivity: "Personal Productivity",
    catOther: "Other"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved === "ru" || saved === "en") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    const dict = translations[language];
    return (dict as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function getLocalizedName(fullName: string, language: "ru" | "en"): string {
  if (!fullName) return "";
  const parts = fullName.split(" | ");
  if (parts.length > 1) {
    const hasCyrillic0 = /[а-яА-ЯёЁ]/.test(parts[0]);
    if (language === "ru") {
      return hasCyrillic0 ? parts[0] : parts[1];
    } else {
      return hasCyrillic0 ? parts[1] : parts[0];
    }
  }
  return fullName;
}
`;

  try {
    fs.writeFileSync(i18nPath, i18nContent, 'utf8');
    console.log(`[SUCCESS] Файл i18n.tsx успешно обновлен по пути: ${i18nPath}`);
  } catch (err) {
    console.log(`[ERROR] Ошибка записи i18n.tsx: ${err.message}`);
  }

  // Шаг 2: Создание/Обновление PostModal.tsx с чистым переводом ТОЛЬКО имени
  const postModalPath = path.join(process.cwd(), 'src', 'components', 'PostModal.tsx');
  const postModalContent = `"use client";

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
      const displayName = agent.name.includes(" | ") ? agent.name.split(" | ")[0] : agent.name;
      setName(displayName);
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
      const res = await fetch(\`https://api.mymemory.translated.net/get?q=\${encodeURIComponent(text)}&langpair=\${fromLang}|\${toLang}\`);
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
        const hasCyrillic = /[а-яА-ЯёЁ]/.test(finalName);
        const toLang = hasCyrillic ? "en" : "ru";
        
        const translatedName = await translateText(finalName, toLang);
        finalName = \`\${finalName} | \${translatedName}\`;
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
              className={\`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none \${
                autoTranslate ? "bg-indigo-600" : "bg-slate-800"
              }\`}
            >
              <span
                className={\`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out \${
                  autoTranslate ? "translate-x-5" : "translate-x-0"
                }\`}
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
`;

  try {
    fs.writeFileSync(postModalPath, postModalContent, 'utf8');
    console.log(`[SUCCESS] Файл PostModal.tsx успешно обновлен по пути: ${postModalPath}`);
  } catch (err) {
    console.log(`[ERROR] Ошибка записи PostModal.tsx: ${err.message}`);
  }

  // Шаг 3: Обновление AgentCard.tsx для вызова getLocalizedName
  replaceAtAnchor(
    'src/components/AgentCard.tsx',
    `import { useLanguage } from "@/lib/i18n";`,
    `import { useLanguage, getLocalizedName } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentCard.tsx',
    `const { t } = useLanguage();`,
    `const { t, language } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentCard.tsx',
    `<h3 itemProp="name" className="font-bold text-slate-100 text-sm truncate leading-snug mb-1">
            {highlight(agent.name, highlightText)}
          </h3>`,
    `<h3 itemProp="name" className="font-bold text-slate-100 text-sm truncate leading-snug mb-1">
            {highlight(getLocalizedName(agent.name, language), highlightText)}
          </h3>`,
    "replace"
  );

  // Шаг 4: Обновление DetailModal.tsx для вызова getLocalizedName
  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `import { useLanguage } from "@/lib/i18n";`,
    `import { useLanguage, getLocalizedName } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `const { t } = useLanguage();`,
    `const { t, language } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<h2 className="text-lg font-bold text-slate-100 truncate max-w-lg">{agent.name}</h2>`,
    `<h2 className="text-lg font-bold text-slate-100 truncate max-w-lg">{getLocalizedName(agent.name, language)}</h2>`,
    "replace"
  );

  // Обновление dump.txt
  createDump();
}

main();