const fs = require('fs');
const path = require('path');

const pageFilePath = path.join(__dirname, 'src', 'app', 'page.tsx');
const backupsDir = path.join(__dirname, '.setup_backups');

function applyPatch() {
  console.log('Начало процесса исправления типизации...');

  // 1. Проверка наличия файла
  if (!fs.existsSync(pageFilePath)) {
    console.error('[ОШИБКА] Файл src/app/page.tsx не найден.');
    return;
  }

  try {
    const originalContent = fs.readFileSync(pageFilePath, 'utf8');

    // Проверяем, не было ли изменение внесено ранее
    if (originalContent.includes('setUser({ ...userData, bio: "", avatar: "" })')) {
      console.log('[ПРОПУЩЕНО] Исправление типизации уже применено.');
      return;
    }

    // 2. Создание резервной копии
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    const timestamp = Date.now();
    const backupPath = path.join(backupsDir, `page.tsx.${timestamp}.bak`);
    fs.writeFileSync(backupPath, originalContent, 'utf8');
    console.log(`[УСПЕШНО] Создана резервная копия: .setup_backups/page.tsx.${timestamp}.bak`);

    // 3. Замена с помощью регулярного выражения
    // Ищет onSuccess={(userData) => { ... setUser(userData);
    const regex = /onSuccess\s*=\s*{\s*\(\s*userData\s*\)\s*=>\s*{\s*setUser\s*\(\s*userData\s*\)\s*;/g;

    if (regex.test(originalContent)) {
      const updatedContent = originalContent.replace(
        regex, 
        'onSuccess={(userData) => {\n          setUser({ ...userData, bio: "", avatar: "" });'
      );
      fs.writeFileSync(pageFilePath, updatedContent, 'utf8');
      console.log('[УСПЕШНО] Типизация onSuccess в src/app/page.tsx обновлена.');
    } else {
      // Запасной более прямой вариант поиска, если форматирование сильно отличается
      const targetStr = 'setUser(userData);';
      if (originalContent.includes(targetStr) && originalContent.includes('onSuccess={(userData) => {')) {
        const updatedContent = originalContent.replace(targetStr, 'setUser({ ...userData, bio: "", avatar: "" });');
        fs.writeFileSync(pageFilePath, updatedContent, 'utf8');
        console.log('[УСПЕШНО] Применен альтернативный вариант замены.');
      } else {
        console.error('[ОШИБКА] Не удалось надежно найти целевой блок для автозамены в файле.');
      }
    }

  } catch (error) {
    console.error('[КРИТИЧЕСКАЯ ОШИБКА] Не удалось применить патч:', error.message);
  }
}

applyPatch();