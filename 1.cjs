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
  console.log("=== Исправление бага с мерцанием сессии (flash of guest UI) ===");

  // --- Шаг 1: Правки в src/app/page.tsx ---

  // 1. Добавляем состояние checkingSession
  replaceAtAnchor(
    'src/app/page.tsx',
    `// Сессионные данные
  const [user, setUser] = useState<{ id: string; username: string; bio: string; avatar: string } | null>(null);`,
    `// Сессионные данные
  const [user, setUser] = useState<{ id: string; username: string; bio: string; avatar: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);`,
    "replace"
  );

  // 2. Обновляем checkSession для переключения checkingSession в false
  replaceAtAnchor(
    'src/app/page.tsx',
    `const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      fetchFeed();
    }
  };`,
    `const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingSession(false);
      fetchFeed();
    }
  };`,
    "replace"
  );

  // 3. Передаем checkingSession в Header
  replaceAtAnchor(
    'src/app/page.tsx',
    `<Header
        user={user}
        onLoginClick={() => setIsAuthOpen(true)}
        onOpenAddModal={handleOpenAddModal}
        totalAgents={agents.length}
      />`,
    `<Header
        user={user}
        onLoginClick={() => setIsAuthOpen(true)}
        onOpenAddModal={handleOpenAddModal}
        totalAgents={agents.length}
        checkingSession={checkingSession}
      />`,
    "replace"
  );

  // 4. Передаем checkingSession в Sidebar
  replaceAtAnchor(
    'src/app/page.tsx',
    `<Sidebar onSettingsClick={() => setIsProfileOpen(true)}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
        />`,
    `<Sidebar onSettingsClick={() => setIsProfileOpen(true)}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          totalPromptsCount={agents.length}
          checkingSession={checkingSession}
        />`,
    "replace"
  );

  // 5. Предотвращаем мерцание в мобильной вкладке кабинета
  replaceAtAnchor(
    'src/app/page.tsx',
    `{/* Вкладка 4: Мобильный Профиль (мобильные) */}
          <div className={\`md:hidden flex flex-col gap-4 \${mobileTab === "profile" ? "block" : "hidden"}\`}>
            {user ? (`,
    `{/* Вкладка 4: Мобильный Профиль (мобильные) */}
          <div className={\`md:hidden flex flex-col gap-4 \${mobileTab === "profile" ? "block" : "hidden"}\`}>
            {checkingSession ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 animate-pulse flex flex-col gap-4 h-[180px] glass" />
            ) : user ? (`,
    "replace"
  );


  // --- Шаг 2: Правки в src/components/Header.tsx ---

  // 1. ДобавляемcheckingSession в HeaderProps интерфейс
  replaceAtAnchor(
    'src/components/Header.tsx',
    `interface HeaderProps {
  user: { id: string; username: string; bio: string } | null;
  onLoginClick: () => void;
  onOpenAddModal: () => void;
  totalAgents: number;
}`,
    `interface HeaderProps {
  user: { id: string; username: string; bio: string } | null;
  onLoginClick: () => void;
  onOpenAddModal: () => void;
  totalAgents: number;
  checkingSession?: boolean;
}`,
    "replace"
  );

  // 2. Деструктурируем checkingSession в Header компоненте
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
  totalAgents,
  checkingSession = false
}: HeaderProps) {`,
    "replace"
  );

  // 3. Скрываем кнопку входа на мобилках во время проверки сессии
  replaceAtAnchor(
    'src/components/Header.tsx',
    `{!user && (
              <button
                onClick={onLoginClick}
                className="md:hidden flex items-center justify-center bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                {t("headerLogin")}
              </button>
            )}`,
    `{!checkingSession && !user && (
              <button
                onClick={onLoginClick}
                className="md:hidden flex items-center justify-center bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                {t("headerLogin")}
              </button>
            )}`,
    "replace"
  );


  // --- Шаг 3: Правки в src/components/Sidebar.tsx ---

  // 1. Добавляем checkingSession в SidebarProps интерфейс
  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `interface SidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  user: { id: string; username: string; bio: string; avatar: string } | null;
  totalPromptsCount: number;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}`,
    `interface SidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  user: { id: string; username: string; bio: string; avatar: string } | null;
  totalPromptsCount: number;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  checkingSession?: boolean;
}`,
    "replace"
  );

  // 2. Деструктурируем checkingSession в Sidebar компоненте
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
  onLogoutClick,
  checkingSession = false
}: SidebarProps) {`,
    "replace"
  );

  // 3. Добавляем Skeleton Loader во время загрузки сессии профиля
  replaceAtAnchor(
    'src/components/Sidebar.tsx',
    `<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">{t("sidebarProfile")}</h3>
        {user ? (`,
    `<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">{t("sidebarProfile")}</h3>
        {checkingSession ? (
          <div className="animate-pulse flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-800" />
              <div className="h-4 bg-slate-800 rounded w-24" />
            </div>
            <div className="h-3 bg-slate-800 rounded w-full" />
            <div className="h-3 bg-slate-800 rounded w-4/5" />
          </div>
        ) : user ? (`,
    "replace"
  );

  // Обновление дампа
  createDump();
}

main();