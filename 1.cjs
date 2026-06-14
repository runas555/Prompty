const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'src/lib/i18n.tsx');
const postModalPath = path.join(__dirname, 'src/components/PostModal.tsx');

function replaceInFile(filePath, oldStr, newStr, blockName) {
  if (!fs.existsSync(filePath)) {
    console.log(`[ПРОПУЩЕНО] Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const normalize = (str) => str.replace(/\r\n/g, '\n');
  const normalizedContent = normalize(content);
  const normalizedOld = normalize(oldStr);

  if (normalizedContent.includes(normalizedOld)) {
    const escaped = oldStr
      .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      .replace(/\s+/g, '\\s+');
    const regex = new RegExp(escaped, 'g');

    content = content.replace(regex, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[УСПЕШНО] Изменен блок "${blockName}" в ${path.basename(filePath)}`);
    return true;
  }

  console.log(`[ПРОПУЩЕНО/ОШИБКА] Блок "${blockName}" не найден в ${path.basename(filePath)}`);
  return false;
}

console.log('--- НАЧАЛО ИНТЕГРАЦИИ ПЕРЕВОДА ДЛЯ "НЕ ВЫБРАНО" ---');

// 1. Добавление ключа локализации в русский блок src/lib/i18n.tsx
const oldRuDict = `catCreative: "Творчество и ролевые",
    catProductivity: "Личная эффективность",
    catOther: "Разное"`;

const newRuDict = `catCreative: "Творчество и ролевые",
    catProductivity: "Личная эффективность",
    catOther: "Разное",
    modelNotSelected: "Не выбрано"`;

replaceInFile(i18nPath, oldRuDict, newRuDict, 'Добавление перевода "Не выбрано" (RU)');

// 2. Добавление ключа локализации в английский блок src/lib/i18n.tsx
const oldEnDict = `catCreative: "Creative & Roleplay",
    catProductivity: "Personal Productivity",
    catOther: "Other"`;

const newEnDict = `catCreative: "Creative & Roleplay",
    catProductivity: "Personal Productivity",
    catOther: "Other",
    modelNotSelected: "Not selected"`;

replaceInFile(i18nPath, oldEnDict, newEnDict, 'Добавление перевода "Not selected" (EN)');

// 3. Динамическая подстановка переведенного значения в PostModal.tsx
const oldSelectRender = `<select
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
                </select>`;

const newSelectRender = `<select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {MODELS.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.id === "any" ? t("modelNotSelected") : mod.label}
                    </option>
                  ))}
                </select>`;

replaceInFile(postModalPath, oldSelectRender, newSelectRender, 'Локализация выпадающего списка ИИ-модели');

console.log('--- ЗАВЕРШЕНО ---');