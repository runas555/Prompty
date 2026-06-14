const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/PostModal.tsx');

if (!fs.existsSync(targetFile)) {
  console.error(`[ОШИБКА] Целевой файл не найден: ${targetFile}`);
  process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

// Безопасная функция замены с поддержкой нормализации пробелов и переносов строк
function replaceExact(oldStr, newStr, blockName) {
  if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    console.log(`[УСПЕШНО] Исправлен блок: ${blockName}`);
    return true;
  }
  
  const normalize = (str) => str.replace(/\r\n/g, '\n');
  const normalizedCode = normalize(code);
  const normalizedOld = normalize(oldStr);
  
  if (normalizedCode.includes(normalizedOld)) {
    const escaped = oldStr
      .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      .replace(/\s+/g, '\\s+');
    const regex = new RegExp(escaped, 'g');
    
    code = code.replace(regex, newStr);
    console.log(`[УСПЕШНО] Исправлен блок (с нормализацией): ${blockName}`);
    return true;
  }

  console.log(`[ПРОПУЩЕНО/ОШИБКА] Блок "${blockName}" не найден в исходном коде.`);
  return false;
}

console.log('--- НАЧАЛО ИСПРАВЛЕНИЙ В POST-МОДАЛЕ ---');

// 1. Исправление отображения знака доллара в названии вкладки
const oldTab = 'Слепки (${versions.length})';
const newTab = 'Слепки ({versions.length})';
replaceExact(oldTab, newTab, 'Знак доллара в названии вкладки');

// 2. Добавление времени к дате создания в списке слепков
const oldDateBlock = `<span className="text-[9px] text-slate-500">
                              {new Date(ver.createdAt).toLocaleDateString()}
                            </span>`;

const newDateBlock = `<span className="text-[9px] text-slate-500">
                              {new Date(ver.createdAt).toLocaleDateString()} {new Date(ver.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>`;

replaceExact(oldDateBlock, newDateBlock, 'Добавление времени создания слепка');

// Сохранение исправлений
try {
  fs.writeFileSync(targetFile, code, 'utf8');
  console.log('--- ИСПРАВЛЕНИЯ ЗАПИСАНЫ УСПЕШНО ---');
} catch (err) {
  console.error('[ОШИБКА] Не удалось перезаписать файл:', err.message);
}