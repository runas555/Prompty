const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/page.tsx');

function repairAndPatch() {
  if (!fs.existsSync(pagePath)) {
    console.log('[ОШИБКА] Файл src/app/page.tsx не найден');
    return;
  }

  let content = fs.readFileSync(pagePath, 'utf8');

  // Шаг 1. Очистка от возможных прошлых некорректных вставок вне тегов
  // Находим и удаляем ошибочные строки вида "onSettingsClick={() => ...}"
  const corruptedLineRegex = /\s*onSettingsClick\s*=\s*\{\s*\(\s*\)\s*=>\s*[a-zA-Z0-9_]+\(true\)\s*\}\s*(?!\s*[a-zA-Z0-9_]+\s*=)/g;
  if (corruptedLineRegex.test(content)) {
    content = content.replace(corruptedLineRegex, '');
    console.log('[ОЧИСТКА] Некорректно размещенный код в page.tsx успешно удален');
  }

  // Шаг 2. Поиск переменной состояния модального окна профиля
  const profileModalMatch = content.match(/<ProfileModal[^>]*isOpen\s*=\s*\{\s*([a-zA-Z0-9_]+)\s*\}/s);
  if (!profileModalMatch) {
    console.log('[ПРОПУЩЕНО] Компонент <ProfileModal не найден в page.tsx. Автоматическая привязка не требуется.');
    fs.writeFileSync(pagePath, content, 'utf8');
    return;
  }

  const stateVar = profileModalMatch[1];
  const setterName = 'set' + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);

  if (!content.includes(setterName)) {
    console.log(`[ПРОПУЩЕНО] Сетер ${setterName} не найден в page.tsx`);
    fs.writeFileSync(pagePath, content, 'utf8');
    return;
  }

  // Шаг 3. Чистая и безопасная вставка пропса внутрь тега <Sidebar
  // Проверяем, нет ли уже корректной вставки внутри тега
  const hasCorrectProp = new RegExp(`<Sidebar[^>]*onSettingsClick\\s*=\\s*\\{\\s*\\(\\s*\\)\\s*=>\\s*${setterName}\\(true\\)\\s*\\}`, 's').test(content);

  if (!hasCorrectProp) {
    // Безопасно вставляем пропс сразу после открывающего слова "<Sidebar"
    content = content.replace(/<Sidebar(\s+)/, `<Sidebar onSettingsClick={() => ${setterName}(true)}$1`);
    fs.writeFileSync(pagePath, content, 'utf8');
    console.log('[УСПЕШНО] src/app/page.tsx успешно восстановлен и корректно пропатчен!');
  } else {
    fs.writeFileSync(pagePath, content, 'utf8');
    console.log('[ИНФО] page.tsx уже содержит корректный пропс внутри тега <Sidebar');
  }
}

try {
  repairAndPatch();
} catch (error) {
  console.error('[КРИТИЧЕСКАЯ ОШИБКА]:', error.message);
}