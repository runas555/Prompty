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
      'src/components/ProfileModal.tsx',
      'src/components/PublicProfileModal.tsx',
      'README.md'
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
  console.log("=== Исправление деструктуризации onOpenProfile в DetailModal.tsx ===");

  const targetDestructuring = `export default function DetailModal({
  isOpen,
  onClose,
  agent,
  currentUser,
  onRestore,
  onTriggerLogin
}: DetailModalProps) {`;

  const fixedDestructuring = `export default function DetailModal({
  isOpen,
  onClose,
  agent,
  currentUser,
  onRestore,
  onTriggerLogin,
  onOpenProfile
}: DetailModalProps) {`;

  replaceAtAnchor('src/components/DetailModal.tsx', targetDestructuring, fixedDestructuring, "replace");

  // Обновление дампа
  createDump();
}

main();