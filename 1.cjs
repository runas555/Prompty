// === FILE: setup.cjs ===
const fs = require('fs');
const path = require('path');

// Помощник для экранирования регулярных выражений
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Поиск и точечная замена блоков с игнорированием пробелов и переносов строк
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

function main() {
  console.log("=== Добавление выбора профессии и перевода роли 'Промпт-инженер' ===");

  // --- Шаг 1: Полное обновление src/lib/i18n.tsx с ключами профессий и функцией parseBio ---
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
    detailAuthor: "Автор",
    detailVersion: "Версия",
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
    profileProfessionLabel: "Профессия / Роль",
    prof_prompt_engineer: "Промпт-инженер",
    prof_developer: "Разработчик",
    prof_copywriter: "Копирайтер",
    prof_designer: "Дизайнер",
    prof_marketer: "Маркетолог",
    prof_data_scientist: "Data Scientist",
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
    detailAuthor: "Author",
    detailVersion: "Version",
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
    profileProfessionLabel: "Profession / Role",
    prof_prompt_engineer: "Prompt Engineer",
    prof_developer: "Developer",
    prof_copywriter: "Copywriter",
    prof_designer: "Designer",
    prof_marketer: "Marketer",
    prof_data_scientist: "Data Scientist",
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
    } else {
      try {
        const systemLang = navigator.language || (navigator as any).userLanguage;
        if (systemLang) {
          const parsedLang = systemLang.toLowerCase().startsWith("ru") ? "ru" : "en";
          setLanguageState(parsedLang);
        }
      } catch (e) {
        console.error("System language detection error:", e);
      }
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

export function parseBio(fullBio: string): { profession: string; bioText: string } {
  if (!fullBio) return { profession: "prompt_engineer", bioText: "" };
  const parts = fullBio.split("|||");
  if (parts.length > 1) {
    return { profession: parts[0], bioText: parts[1] };
  }
  return { profession: "prompt_engineer", bioText: fullBio };
}
`;

  try {
    fs.writeFileSync(i18nPath, i18nContent, 'utf8');
    console.log(`[SUCCESS] Файл i18n.tsx успешно обновлен по пути: ${i18nPath}`);
  } catch (err) {
    console.log(`[ERROR] Ошибка записи i18n.tsx: ${err.message}`);
  }


  // --- Шаг 2: Изменение Sidebar.tsx для красивого вывода локализованной роли ---
  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `import React from "react";
import { useLanguage } from "@/lib/i18n";`,
    `import React from "react";
import { useLanguage, parseBio } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<p className="text-sm font-bold text-slate-200">@{user.username}</p>
            </div>
            <p className="text-xs text-slate-400 italic leading-relaxed break-words line-clamp-4">
              {user.bio || t("sidebarBioEmpty")}
            </p>`,
    `<p className="text-sm font-bold text-slate-200">@{user.username}</p>
            </div>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider relative z-10 -mt-1.5">
              {t("prof_" + parseBio(user.bio).profession)}
            </p>
            <p className="text-xs text-slate-400 italic leading-relaxed break-words line-clamp-4">
              {parseBio(user.bio).bioText || t("sidebarBioEmpty")}
            </p>`,
    "replace"
  );


  // --- Шаг 3: Изменение app/page.tsx для отображения локализованной роли на смартфонах ---
  replaceAtAnchor(
    'src/app/page.tsx',
    `import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";`,
    `import React, { useState, useEffect } from "react";
import { useLanguage, parseBio } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<div>
                    <p className="text-base font-bold text-slate-200">@{user.username}</p>
                    <p className="text-xs text-slate-500">Промпт-инженер</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic leading-relaxed break-words bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  {user.bio || t("profileBioEmpty")}
                </p>`,
    `<div>
                    <p className="text-base font-bold text-slate-200">@{user.username}</p>
                    <p className="text-xs text-slate-500">{t("prof_" + parseBio(user.bio).profession)}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic leading-relaxed break-words bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  {parseBio(user.bio).bioText || t("profileBioEmpty")}
                </p>`,
    "replace"
  );


  // --- Шаг 4: Полное обновление ProfileModal.tsx с добавлением Dropdown выбора профессий ---
  const profileModalPath = path.join(process.cwd(), 'src', 'components', 'ProfileModal.tsx');
  const profileModalContent = `"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, Camera } from "lucide-react";
import { useLanguage, parseBio } from "@/lib/i18n";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bio: string, avatar: string) => Promise<boolean>;
  currentBio: string;
  currentAvatar: string;
}

const PROFESSIONS = [
  { id: "prompt_engineer", label: "Промпт-инженер", labelEn: "Prompt Engineer" },
  { id: "developer", label: "Разработчик", labelEn: "Developer" },
  { id: "copywriter", label: "Копирайтер", labelEn: "Copywriter" },
  { id: "designer", label: "Дизайнер", labelEn: "Designer" },
  { id: "marketer", label: "Маркетолог", labelEn: "Marketer" },
  { id: "data_scientist", label: "Data Scientist", labelEn: "Data Scientist" }
];

export default function ProfileModal({ isOpen, onClose, onSave, currentBio, currentAvatar }: ProfileModalProps) {
  const { t, language } = useLanguage();
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("prompt_engineer");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ promptsCount: 0, commentsCount: 0, likesReceived: 0 });

  useEffect(() => {
    if (isOpen) {
      const parsed = parseBio(currentBio);
      setBio(parsed.bioText);
      setProfession(parsed.profession || "prompt_engineer");
      setAvatar(currentAvatar);
      setError("");
      fetchStats();
    }
  }, [currentBio, currentAvatar, isOpen]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {}
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите файл изображения (png/jpg/webp).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setAvatar(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const serializedBio = \`\${profession}|||\${bio.trim()}\`;
      const success = await onSave(serializedBio, avatar);
      if (success) {
        onClose();
      } else {
        setError(t("profileDbError"));
      }
    } catch (err: any) {
      setError(t("profileConnectError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 overflow-hidden bottom-0 sm:bottom-auto absolute sm:relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 mb-2">{t("profileTitle")}</h3>
        <p className="text-xs text-slate-500 mb-5">{t("profileSub")}</p>

        {/* Statistics Section */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/50 border border-slate-850 p-3 rounded-xl mb-5 text-center">
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.promptsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{t("profilePrompts")}</div>
          </div>
          <div>
            <div className="text-sm font-bold text-cyan-400">{stats.likesReceived}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{t("profileLikes")}</div>
          </div>
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.commentsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{t("profileComments")}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900 p-3 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar Loader */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar Preview" 
                  className="h-16 w-16 rounded-xl object-cover border border-slate-850 shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-600">
                  <Camera className="h-6 w-6" />
                </div>
              )}
              <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center cursor-pointer transition-opacity">
                <Camera className="h-5 w-5 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">{t("profilePhoto")}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{t("profilePhotoSub")}</p>
            </div>
          </div>

          {/* Profession Dropdown Selector */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("profileProfessionLabel")}</label>
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {PROFESSIONS.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {language === "ru" ? prof.label : prof.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Bio text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("profileBioLabel")}</label>
            <textarea
              placeholder={t("profileBioPlaceholder")}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              maxLength={150}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold"
            >
              {t("modalCancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all"
            >
              {loading ? t("profileSaving") : t("profileSaveSuccess")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

  try {
    fs.writeFileSync(profileModalPath, profileModalContent, 'utf8');
    console.log(`[SUCCESS] Файл ProfileModal.tsx успешно обновлен по пути: ${profileModalPath}`);
  } catch (err) {
    console.log(`[ERROR] Ошибка записи ProfileModal.tsx: ${err.message}`);
  }

  // Обновление дампа
  createDump();
}

main();