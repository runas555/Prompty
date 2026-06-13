const fs = require('fs');
const path = require('path');

console.log('=== ЗАПУСК ОПЕРАТИВНОГО ИСПРАВЛЕНИЯ ИМПОРТА ===\n');

try {
  const filePath = path.resolve('src/components/AgentCard.tsx');

  if (!fs.existsSync(filePath)) {
    throw new Error('Файл src/components/AgentCard.tsx не найден. Убедитесь, что запускаете патч в корне проекта.');
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Исходная строка импорта
  const oldImport = 'import { Heart, MessageSquare, Copy, Check, History, Trash2, Calendar } from "lucide-react";';
  
  // Новая строка импорта с добавлением Edit
  const newImport = 'import { Heart, MessageSquare, Copy, Check, History, Edit, Trash2, Calendar } from "lucide-react";';

  if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[ИСПРАВЛЕНО] Иконка Edit успешно импортирована в src/components/AgentCard.tsx.');
  } else if (content.includes('History, Edit, Trash2')) {
    console.log('[ПРОПУЩЕНО] Иконка Edit уже присутствует в импортах.');
  } else {
    // Резервный вариант замены на случай небольших расхождений в форматировании
    content = content.replace(
      /import\\s+{[^}]+}\\s+from\\s+"lucide-react";/,
      'import { Heart, MessageSquare, Copy, Check, History, Edit, Trash2, Calendar } from "lucide-react";'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[ИСПРАВЛЕНО] Импорты перезаписаны по резервному паттерну.');
  }

  console.log('\nСборка восстановлена. Вы можете продолжать работу с проектом.');

} catch (error) {
  console.error('\n[Ошибка выполнения патча]:', error.message);
  process.exit(1);
}