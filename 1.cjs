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
  console.log("=== Локализация слов 'Автор' и 'Версия' в DetailModal.tsx ===");

  // Шаг 1: Обновление src/lib/i18n.tsx с новыми ключами detailAuthor и detailVersion
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
`;

  try {
    fs.writeFileSync(i18nPath, i18nContent, 'utf8');
    console.log(`[SUCCESS] Файл i18n.tsx успешно обновлен по пути: ${i18nPath}`);
  } catch (err) {
    console.log(`[ERROR] Ошибка записи i18n.tsx: ${err.message}`);
  }

  // Шаг 2: Модификация вывода "Автор" и "Версия" в DetailModal.tsx
  const targetLabelLine = `<p className="text-xs text-slate-500">Автор: @{agent.username} &bull; Версия v{agent.version}</p>`;
  const fixedLabelLine = `<p className="text-xs text-slate-500">{t("detailAuthor")}: @{agent.username} &bull; {t("detailVersion")} v{agent.version}</p>`;

  replaceAtAnchor('src/components/DetailModal.tsx', targetLabelLine, fixedLabelLine, "replace");

  // Обновление дампа
  createDump();
}

main();