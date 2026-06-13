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

    // Очистка и разбиение анкора для построения гибкого регулярного выражения
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

// Рекурсивный обход директорий для генерации дампа
function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== 'cache') {
        walkDir(filePath, fileList);
      }
    } else {
      // Исключаем бинарные файлы и логи
      if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.ico') && file !== 'dump.txt') {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
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
      'src/components/AgentModal.tsx',
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
  createDump();

  console.log("\n=== Применение изменений локализации ===");

  // Шаг 1: Создание файла i18n.tsx
  const i18nPath = path.join(process.cwd(), 'src', 'lib', 'i18n.tsx');
  const i18nDir = path.dirname(i18nPath);
  if (!fs.existsSync(i18nDir)) {
    fs.mkdirSync(i18nDir, { recursive: true });
  }

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
`;

  fs.writeFileSync(i18nPath, i18nContent, 'utf8');
  console.log(`[SUCCESS] Создан файл конфигурации перевода: ${i18nPath}`);

  // Шаг 2: Модификация src/app/layout.tsx для интеграции провайдера
  replaceAtAnchor(
    'src/app/layout.tsx',
    `import "./globals.css";`,
    `import "./globals.css";\nimport { LanguageProvider } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/layout.tsx',
    `return (
    <html lang="ru">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-300">
        {children}
      </body>
    </html>
  );`,
    `return (
    <html lang="ru">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-300">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );`,
    "replace"
  );

  // Шаг 3: Модификация Header.tsx
  replaceAtAnchor(
    'src/components/Header.tsx',
    `import { Terminal } from "lucide-react";`,
    `import { Terminal, Globe } from "lucide-react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Header.tsx',
    `export default function Header({
  user,
  onLoginClick,
  onOpenAddModal,
  totalAgents
}: HeaderProps) {`,
    `export default function Header({
  user,
  onLoginClick,
  onOpenAddModal,
  totalAgents
}: HeaderProps) {\n  const { language, setLanguage, t } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Header.tsx',
    `<p className="hidden sm:block text-[10px] text-slate-500 font-medium">
                Каталог системных промптов ({totalAgents} агентов)
              </p>`,
    `<p className="hidden sm:block text-[10px] text-slate-500 font-medium">
                {t("headerCatalog")} ({totalAgents} {t("headerAgents")})
              </p>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Header.tsx',
    `<button
              onClick={user ? onOpenAddModal : onLoginClick}
              className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95"
            >
              Поделиться
            </button>
            
            {!user && (
              <button
                onClick={onLoginClick}
                className="md:hidden flex items-center justify-center bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                Войти
              </button>
            )}`,
    `<button
              onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all mr-1"
              title={language === "ru" ? "Switch to English" : "Переключить на русский"}
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>{language === "ru" ? "RU" : "EN"}</span>
            </button>

            <button
              onClick={user ? onOpenAddModal : onLoginClick}
              className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all duration-200 active:scale-95"
            >
              {t("headerShare")}
            </button>
            
            {!user && (
              <button
                onClick={onLoginClick}
                className="md:hidden flex items-center justify-center bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                {t("headerLogin")}
              </button>
            )}`,
    "replace"
  );

  // Шаг 4: Модификация Sidebar.tsx
  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `import React from "react";`,
    `import React from "react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `export default function Sidebar({
  activeCategory,
  setActiveCategory,
  user,
  totalPromptsCount,
  onSettingsClick,
  onLogoutClick
}: SidebarProps) {`,
    `export default function Sidebar({
  activeCategory,
  setActiveCategory,
  user,
  totalPromptsCount,
  onSettingsClick,
  onLogoutClick
}: SidebarProps) {
  const { t } = useLanguage();
  const catLabelMap = {
    all: "catAll",
    coding: "catCoding",
    writing: "catWriting",
    art: "catArt",
    "audio-video": "catAudioVideo",
    assistant: "catAssistant",
    marketing: "catMarketing",
    education: "catEducation",
    agents: "catAgents",
    security: "catSecurity",
    creative: "catCreative",
    productivity: "catProductivity",
    other: "catOther"
  };`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">Профиль</h3>`,
    `<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">{t("sidebarProfile")}</h3>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `{user.bio || "Биография не указана. Заполните её в настройках."}`,
    `{user.bio || t("sidebarBioEmpty")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<Settings className="h-3.5 w-3.5" />
                Настройки`,
    `<Settings className="h-3.5 w-3.5" />
                {t("sidebarSettings")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<LogOut className="h-3.5 w-3.5" />
                Выйти`,
    `<LogOut className="h-3.5 w-3.5" />
                {t("sidebarLogout")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<p className="text-xs text-slate-400 relative z-10 leading-relaxed">
            Авторизуйтесь, чтобы публиковать свои промпты, вести обсуждения и ставить лайки.
          </p>`,
    `<p className="text-xs text-slate-400 relative z-10 leading-relaxed">
            {t("sidebarAuthPrompt")}
          </p>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Категории</h3>`,
    `<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">{t("sidebarCategories")}</h3>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<span className="truncate">{cat.label}</span>`,
    `<span className="truncate">{t(catLabelMap[cat.id] || cat.id)}</span>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<div className="text-xs text-slate-500 px-4">
        <p>Активных промптов в ленте: {totalPromptsCount}</p>
        <p className="mt-1">PromptSocial &bull; Open-Source v1.3</p>
      </div>`,
    `<div className="text-xs text-slate-500 px-4">
        <p>{t("sidebarActivePrompts")}: {totalPromptsCount}</p>
        <p className="mt-1">{t("sidebarOpenSource")}</p>
      </div>`,
    "replace"
  );

  // Шаг 5: Модификация AgentCard.tsx
  replaceAtAnchor(
    'src/components/AgentCard.tsx',
    `import React, { useState } from "react";`,
    `import React, { useState } from "react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentCard.tsx',
    `export default function AgentCard({
  agent,
  currentUser,
  onEdit,
  onOpenHistory,
  onDelete,
  onLikeToggle,
  highlightText = ""
}: AgentCardProps) {`,
    `export default function AgentCard({
  agent,
  currentUser,
  onEdit,
  onOpenHistory,
  onDelete,
  onLikeToggle,
  highlightText = ""
}: AgentCardProps) {\n  const { t } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentCard.tsx',
    `title="Редактировать"`,
    `title={t("agentCardEdit")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentCard.tsx',
    `{copied ? "ОК" : "Копировать"}`,
    `{copied ? t("agentCardCopied") : t("agentCardCopy")}`,
    "replace"
  );

  // Шаг 6: Модификация AgentModal.tsx
  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `import React, { useState, useEffect } from "react";`,
    `import React, { useState, useEffect } from "react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  agent
}: AgentModalProps) {`,
    `export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  agent
}: AgentModalProps) {\n  const { t } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `{agent ? "Редактирование агента" : "Создание нового агента"}`,
    `{agent ? t("modalEditAgent") : t("modalCreateAgent")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `setError("Пожалуйста, укажите имя агента");`,
    `setError(t("errorAgentName"));`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `setError("Укажите текст промпта (системные инструкции)");`,
    `setError(t("errorAgentPrompt"));`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `setError("Возникла ошибка сохранения. Убедитесь в верности Секретного токена");`,
    `setError(t("errorAgentSave"));`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `setError(err.message || "Не удалось отправить запрос");`,
    `setError(err.message || t("errorNetwork"));`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `<label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Имя агента (Краткое описание задачи)
            </label>
            <input
              type="text"
              placeholder="Например: Python-программист, Копирайтер текстов..."`,
    `<label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("modalAgentNameLabel")}
            </label>
            <input
              type="text"
              placeholder={t("modalAgentNamePlaceholder")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `<label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Системный промпт / Инструкции
            </label>
            <textarea
              placeholder="Вставьте сюда ваш промпт, описывающий роль ИИ, правила вывода, тон..."`,
    `<label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("modalAgentPromptLabel")}
            </label>
            <textarea
              placeholder={t("modalAgentPromptPlaceholder")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AgentModal.tsx',
    `<button
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
            </button>`,
    `<button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              {t("modalCancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-55 disabled:cursor-not-allowed text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/10 active:scale-95 transition-all duration-200"
            >
              {loading ? t("modalSaving") : t("modalSave")}
            </button>`,
    "replace"
  );

  // Шаг 7: Модификация AuthModal.tsx
  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `import React, { useState } from "react";`,
    `import React, { useState } from "react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {`,
    `export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {\n  const { t } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `setError("Пожалуйста, заполните все поля");`,
    `setError(t("authFillAll"));`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `{mode === "login" ? "Вход в систему" : "Регистрация"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Для создания и изменения собственных промптов`,
    `{mode === "login" ? t("authLoginTitle") : t("authRegisterTitle")}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t("authSub")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `if (mode === "login") {
          onSuccess(data.user);
          onClose();
        } else {
          alert("Аккаунт успешно создан! Теперь вы можете войти.");
          setMode("login");
          setPassword("");
        }
      } else {
        setError(data.error || "Произошла ошибка авторизации");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуйте еще раз.");`,
    `if (mode === "login") {
          onSuccess(data.user);
          onClose();
        } else {
          alert(t("authSuccessReg"));
          setMode("login");
          setPassword("");
        }
      } else {
        setError(data.error || t("authError"));
      }
    } catch (err) {
      setError(t("authNetworkError"));`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Имя пользователя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Никнейм"`,
    `<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {t("authUsernameLabel")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder={t("authUsernamePlaceholder")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Пароль
            </label>`,
    `<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {t("authPasswordLabel")}
            </label>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `<button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all duration-200"
          >
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>`,
    `<button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all duration-200"
          >
            {loading ? "..." : mode === "login" ? t("authSubmitLogin") : t("authSubmitRegister")}
          </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/AuthModal.tsx',
    `<div className="mt-6 text-center text-xs">
          {mode === "login" ? (
            <p className="text-slate-500">
              Еще нет аккаунта?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-cyan-400 font-semibold hover:underline">
                Создать профиль
              </button>
            </p>
          ) : (
            <p className="text-slate-500">
              Уже есть аккаунт?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-cyan-400 font-semibold hover:underline">
                Войти
              </button>
            </p>
          )}
        </div>`,
    `<div className="mt-6 text-center text-xs">
          {mode === "login" ? (
            <p className="text-slate-500">
              {t("authNoAccount")}{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-cyan-400 font-semibold hover:underline">
                {t("authCreateProfile")}
              </button>
            </p>
          ) : (
            <p className="text-slate-500">
              {t("authHaveAccount")}{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-cyan-400 font-semibold hover:underline">
                {t("authSubmitLogin")}
              </button>
            </p>
          )}
        </div>`,
    "replace"
  );

  // Шаг 8: Модификация DetailModal.tsx
  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `import React, { useState, useEffect } from "react";`,
    `import React, { useState, useEffect } from "react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `export default function DetailModal({
  isOpen,
  onClose,
  agent,
  currentUser,
  onRestore,
  onTriggerLogin
}: DetailModalProps) {`,
    `export default function DetailModal({
  isOpen,
  onClose,
  agent,
  currentUser,
  onRestore,
  onTriggerLogin
}: DetailModalProps) {\n  const { t } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<button
            onClick={() => setTab("read")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "read" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            Инструкция
          </button>
          <button
            onClick={() => setTab("versions")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "versions" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            История версий ({versions.length})
          </button>
          <button
            onClick={() => setTab("comments")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "comments" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            Обсуждение ({comments.length})
          </button>`,
    `<button
            onClick={() => setTab("read")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "read" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            {t("detailInstruction")}
          </button>
          <button
            onClick={() => setTab("versions")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "versions" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            {t("detailHistory")} ({versions.length})
          </button>
          <button
            onClick={() => setTab("comments")}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-all \${
              tab === "comments" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }\`}
          >
            {t("detailDiscussion")} ({comments.length})
          </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Текущий системный промпт</span>
                <button
                  onClick={() => handleCopy(agent.prompt, "current")}
                  className={\`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all \${
                    copiedId === "current" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }\`}
                >
                  {copiedId === "current" ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === "current" ? "Скопировано!" : "Скопировать промпт"}</span>
                </button>`,
    `<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("detailCurrentPrompt")}</span>
                <button
                  onClick={() => handleCopy(agent.prompt, "current")}
                  className={\`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all \${
                    copiedId === "current" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }\`}
                >
                  {copiedId === "current" ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === "current" ? t("detailCopied") : t("detailCopyPrompt")}</span>
                </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500" />
                  <p className="text-xs text-slate-500">Загрузка истории...</p>`,
    `<div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500" />
                  <p className="text-xs text-slate-500">{t("detailLoadingHistory")}</p>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-indigo-400">
                          v{ver.version} {idx === 0 && "(Актуальная)"}
                        </span>`,
    `<span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-indigo-400">
                          v{ver.version} {idx === 0 && "(" + t("detailActualVersion") + ")"}
                        </span>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<button
                            onClick={() => handleRestore(ver.prompt)}
                            disabled={actionLoading}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            Восстановить
                          </button>`,
    `<button
                            onClick={() => handleRestore(ver.prompt)}
                            disabled={actionLoading}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            {t("detailRestore")}
                          </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<textarea
                  placeholder={currentUser ? "Обсудить этот промпт... напишите ваши тесты или предложите улучшения" : "Для публикации комментариев необходимо авторизоваться."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser || actionLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  rows={3}
                />`,
    `<textarea
                  placeholder={currentUser ? t("detailCommentPlaceholderUser") : t("detailCommentPlaceholderGuest")}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser || actionLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  rows={3}
                />`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<span className="text-[11px] text-slate-500 font-medium">Комментарий привязывается к версии v{agent.version}</span>
                  {currentUser ? (
                    <button
                      type="submit"
                      disabled={actionLoading || !commentText.trim()}
                      className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Отправить
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onTriggerLogin}
                      className="text-xs text-indigo-400 font-semibold hover:underline"
                    >
                      Войти в аккаунт
                    </button>
                  )}`,
    `<span className="text-[11px] text-slate-500 font-medium">{t("detailCommentVersionBind")} v{agent.version}</span>
                  {currentUser ? (
                    <button
                      type="submit"
                      disabled={actionLoading || !commentText.trim()}
                      className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {t("detailSend")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onTriggerLogin}
                      className="text-xs text-indigo-400 font-semibold hover:underline"
                    >
                      {t("detailToCommentLogin")}
                    </button>
                  )}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/DetailModal.tsx',
    `<p className="text-center text-xs text-slate-500">Обсуждение еще не начато. Будьте первыми!</p>`,
    `<p className="text-center text-xs text-slate-500">{t("detailNoComments")}</p>`,
    "replace"
  );

  // Шаг 9: Модификация ProfileModal.tsx
  replaceAtAnchor(
    'src/components/ProfileModal.tsx',
    `import React, { useState, useEffect } from "react";`,
    `import React, { useState, useEffect } from "react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/ProfileModal.tsx',
    `export default function ProfileModal({ isOpen, onClose, onSave, currentBio, currentAvatar }: ProfileModalProps) {`,
    `export default function ProfileModal({ isOpen, onClose, onSave, currentBio, currentAvatar }: ProfileModalProps) {\n  const { t } = useLanguage();`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/ProfileModal.tsx',
    `<h3 className="text-lg font-bold text-slate-100 mb-2">Настройка профиля</h3>
        <p className="text-xs text-slate-500 mb-5">Заполните информацию о себе и загрузите ваше фото.</p>

        {/* Секция статистики */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/50 border border-slate-850 p-3 rounded-xl mb-5 text-center">
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.promptsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Промптов</div>
          </div>
          <div>
            <div className="text-sm font-bold text-cyan-400">{stats.likesReceived}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Лайков</div>
          </div>
          <div>
            <div className="text-sm font-bold text-indigo-400">{stats.commentsCount}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Отзывов</div>
          </div>
        </div>`,
    `<h3 className="text-lg font-bold text-slate-100 mb-2">{t("profileTitle")}</h3>
        <p className="text-xs text-slate-500 mb-5">{t("profileSub")}</p>

        {/* Секция статистики */}
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
        </div>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/ProfileModal.tsx',
    `<div>
              <p className="text-xs font-bold text-slate-300">Фотография профиля</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Будет сжата локально и сохранена в базу данных.</p>
            </div>`,
    `<div>
              <p className="text-xs font-bold text-slate-300">{t("profilePhoto")}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{t("profilePhotoSub")}</p>
            </div>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/ProfileModal.tsx',
    `<div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">О себе (Биография)</label>
            <textarea
              placeholder="Ваша роль, стек ИИ-моделей или краткая визитка..."`,
    `<div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("profileBioLabel")}</label>
            <textarea
              placeholder={t("profileBioPlaceholder")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/ProfileModal.tsx',
    `<button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all"
            >
              {loading ? "Сохранение..." : "Сохранить профиль"}
            </button>`,
    `<button
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
            </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/components/ProfileModal.tsx',
    `const success = await onSave(bio.trim(), avatar);
      if (success) {
        onClose();
      } else {
        setError("Ошибка при записи профиля в базу данных.");
      }
    } catch (err: any) {
      setError("Не удалось установить соединение.");
    }`,
    `const success = await onSave(bio.trim(), avatar);
      if (success) {
        onClose();
      } else {
        setError(t("profileDbError"));
      }
    } catch (err: any) {
      setError(t("profileConnectError"));
    }`,
    "replace"
  );

  // Шаг 10: Модификация page.tsx
  replaceAtAnchor(
    'src/app/page.tsx',
    `import React, { useState, useEffect } from "react";`,
    `import React, { useState, useEffect } from "react";\nimport { useLanguage } from "@/lib/i18n";`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `export default function Home() {`,
    `export default function Home() {
  const { t } = useLanguage();
  const catLabelMap = {
    all: "catAll",
    coding: "catCoding",
    writing: "catWriting",
    art: "catArt",
    "audio-video": "catAudioVideo",
    assistant: "catAssistant",
    marketing: "catMarketing",
    education: "catEducation",
    agents: "catAgents",
    security: "catSecurity",
    creative: "catCreative",
    productivity: "catProductivity",
    other: "catOther"
  };`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `} else {
        const errData = await res.json();
        setError(errData.error || "Ошибка загрузки ленты");
      }
    } catch (err) {
      setError("Не удалось соединиться с сервером базы данных.");`,
    `} else {
        const errData = await res.json();
        setError(errData.error || t("errorFeedLoad"));
      }
    } catch (err) {
      setError(t("errorServerConnect"));`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `const handleLogout = async () => {
    if (!confirm("Выйти из аккаунта?")) return;`,
    `const handleLogout = async () => {
    if (!confirm(t("confirmLogout"))) return;`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Вы уверены, что хотите удалить публикацию?")) return;`,
    `const handleDeleteAgent = async (agentId: string) => {
    if (!confirm(t("confirmDelete"))) return;`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `} else {
        const errData = await res.json();
        alert(errData.error || "Ошибка удаления");
      }`,
    `} else {
        const errData = await res.json();
        alert(errData.error || t("errorDelete"));
      }`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<input
                type="text"
                placeholder="Поиск по задачам, тегам (#seo, #react) или авторам..."`,
    `<input
                type="text"
                placeholder={t("searchPlaceholder")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<button
                  onClick={() => setFeedMode("all")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  Все публикации
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  Мои промпты
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  Мне понравилось
                </button>`,
    `<button
                  onClick={() => setFeedMode("all")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  {t("tabAllPublications")}
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  {t("tabMyPrompts")}
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={\`px-5 py-2.5 text-sm font-bold border-b-2 transition-all \${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  }\`}
                >
                  {t("tabLiked")}
                </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<button
                  onClick={() => setFeedMode("all")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  Все посты
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  Мои промпты
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  Избранное
                </button>`,
    `<button
                  onClick={() => setFeedMode("all")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "all" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  {t("tabAllPostsMobile")}
                </button>
                <button
                  onClick={() => setFeedMode("my")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "my" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  {t("tabMyPrompts")}
                </button>
                <button
                  onClick={() => setFeedMode("liked")}
                  className={\`px-4 py-2 text-xs font-bold border-b-2 shrink-0 transition-all \${
                    feedMode === "liked" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500"
                  }\`}
                >
                  {t("tabFavoritesMobile")}
                </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<h3 className="text-lg font-bold text-slate-200">Ничего не найдено</h3>
                <p className="text-sm text-slate-500 mt-1">Опубликуйте первый промпт в этой вкладке!</p>`,
    `<h3 className="text-lg font-bold text-slate-200">{t("notFoundTitle")}</h3>
                <p className="text-sm text-slate-500 mt-1">{t("notFoundDesc")}</p>`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Выберите категорию</h3>`,
    `<h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">{t("sidebarCategories")}</h3>`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setMobileTab("feed");
                    }}
                    className={\`flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all active:scale-98 \${
                      isActive
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-950/40 text-slate-300 border border-slate-800/50 hover:bg-slate-800/50"
                    }\`}
                  >
                    <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );`,
    `return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setMobileTab("feed");
                    }}
                    className={\`flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all active:scale-98 \${
                      isActive
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-950/40 text-slate-300 border border-slate-800/50 hover:bg-slate-800/50"
                    }\`}
                  >
                    <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>{t(catLabelMap[cat.id] || cat.id)}</span>
                  </button>
                );`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<div className={\`md:hidden flex flex-col gap-4 \${mobileTab === "search" ? "block" : "hidden"}\`}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по тегам, задачам или авторам..."`,
    `<div className={\`md:hidden flex flex-col gap-4 \${mobileTab === "search" ? "block" : "hidden"}\`}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<button
              onClick={() => setMobileTab("feed")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm"
            >
              Перейти к результатам ({filteredAgents.length})
            </button>`,
    `<button
              onClick={() => setMobileTab("feed")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm"
            >
              {t("tabAllPostsMobile")} ({filteredAgents.length})
            </button>`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<p className="text-xs text-slate-400 italic leading-relaxed break-words bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  {user.bio || "Биография не указана."}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                    Настройки
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-950/20 text-red-400 py-3 rounded-xl text-xs font-bold border border-red-900/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>`,
    `<p className="text-xs text-slate-400 italic leading-relaxed break-words bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  {user.bio || t("profileBioEmpty")}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                    {t("sidebarSettings")}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-950/20 text-red-400 py-3 rounded-xl text-xs font-bold border border-red-900/40"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("sidebarLogout")}
                  </button>
                </div>`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center glass">
                <p className="text-sm text-slate-400 mb-4">Войдите в личный профиль для публикации и оценки промптов.</p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Авторизоваться
                </button>
              </div>`,
    `<div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center glass">
                <p className="text-sm text-slate-400 mb-4">{t("sidebarAuthPrompt")}</p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  {t("headerLogin")}
                </button>
              </div>`,
    "replace"
  );

  replaceAtAnchor(
    'src/app/page.tsx',
    `<button
            onClick={() => setMobileTab("feed")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "feed" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Terminal className="h-5 w-5" />
            <span>Лента</span>
          </button>

          <button
            onClick={() => setMobileTab("categories")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "categories" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Compass className="h-5 w-5" />
            <span>Разделы</span>
          </button>

          {user && (
            <button
              onClick={handleOpenAddModal}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-indigo-400 hover:text-indigo-300 transition-all active:scale-95"
            >
              <PlusCircle className="h-7 w-7 fill-indigo-950" />
            </button>
          )}

          <button
            onClick={() => setMobileTab("search")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "search" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Search className="h-5 w-5" />
            <span>Поиск</span>
          </button>

          <button
            onClick={() => setMobileTab("profile")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "profile" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <User className="h-5 w-5" />
            <span>Кабинет</span>
          </button>`,
    `<button
            onClick={() => setMobileTab("feed")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "feed" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Terminal className="h-5 w-5" />
            <span>{t("mobileTabFeed")}</span>
          </button>

          <button
            onClick={() => setMobileTab("categories")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "categories" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Compass className="h-5 w-5" />
            <span>{t("mobileTabCategories")}</span>
          </button>

          {user && (
            <button
              onClick={handleOpenAddModal}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-indigo-400 hover:text-indigo-300 transition-all active:scale-95"
            >
              <PlusCircle className="h-7 w-7 fill-indigo-950" />
            </button>
          )}

          <button
            onClick={() => setMobileTab("search")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "search" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <Search className="h-5 w-5" />
            <span>{t("mobileTabSearch")}</span>
          </button>

          <button
            onClick={() => setMobileTab("profile")}
            className={\`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold transition-all \${
              mobileTab === "profile" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }\`}
          >
            <User className="h-5 w-5" />
            <span>{t("mobileTabProfile")}</span>
          </button>`,
    "replace"
  );

  console.log("\n=== Завершено успешно ===");
}

main();