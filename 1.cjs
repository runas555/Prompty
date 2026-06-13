const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/page.tsx');

function removeModelFilter() {
  if (!fs.existsSync(pagePath)) {
    console.log('[ОШИБКА] Файл src/app/page.tsx не найден');
    return;
  }

  let content = fs.readFileSync(pagePath, 'utf8');

  console.log('Начало удаления фильтра моделей...');

  // 1. Удаление константы MODELS
  const modelsConstRegex = /const\s+MODELS\s*=\s*\[[\s\S]*?\];/;
  if (modelsConstRegex.test(content)) {
    content = content.replace(modelsConstRegex, '');
    console.log('[УСПЕШНО] Константа MODELS удалена');
  }

  // 2. Удаление блока фильтра в Desktop версии
  // Ищем контейнер с MODELS.map внутри десктопной части
  const desktopFilterRegex = /<div className="flex items-center gap-1\.5 overflow-x-auto pb-1 -mt-1 select-none hide-scrollbar">[\s\S]*?\{MODELS\.map[\s\S]*?<\/div>/;
  if (desktopFilterRegex.test(content)) {
    content = content.replace(desktopFilterRegex, '');
    console.log('[УСПЕШНО] Фильтр удален из десктопной версии');
  }

  // 3. Удаление блока фильтра в Mobile версии (вкладка поиска)
  const mobileFilterRegex = /<div className="flex items-center gap-1\.5 overflow-x-auto pb-2 select-none hide-scrollbar">[\s\S]*?\{MODELS\.map[\s\S]*?<\/div>/;
  if (mobileFilterRegex.test(content)) {
    content = content.replace(mobileFilterRegex, '');
    console.log('[УСПЕШНО] Фильтр удален из мобильной версии');
  }

  // 4. Очистка лишних пустых строк, которые могли остаться после удаления
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  try {
    fs.writeFileSync(pagePath, content, 'utf8');
    console.log('[ЗАВЕРШЕНО] Файл page.tsx успешно очищен от фильтра моделей.');
  } catch (err) {
    console.error('[ОШИБКА] Не удалось сохранить файл:', err.message);
  }
}

removeModelFilter();