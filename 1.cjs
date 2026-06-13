const fs = require('fs');
const path = require('path');

const cardPath = path.join(__dirname, 'src/components/AgentCard.tsx');

function applySEOPatch() {
  if (!fs.existsSync(cardPath)) {
    console.log('[ОШИБКА] Файл AgentCard.tsx не найден');
    return;
  }

  let content = fs.readFileSync(cardPath, 'utf8');

  // Избегаем повторного применения
  if (content.includes('itemProp="name"')) {
    console.log('[ПРОПУЩЕНО] SEO-разметка уже присутствует в AgentCard.tsx');
    return;
  }

  console.log('Начало внедрения семантической разметки...');

  // 1. Замена корневого div на article с указанием схемы CreativeWork
  // Ищем начало блока div, который имеет onClick и специфические классы
  const rootDivRegex = /<div\s+onClick=\{\(\)\s*=>\s*onOpenHistory\(agent\)\}\s+className="([^"]*)"\s*>/;
  content = content.replace(rootDivRegex, (match, classes) => {
    return `<article 
      itemScope 
      itemType="https://schema.org/CreativeWork" 
      onClick={() => onOpenHistory(agent)} 
      className="${classes}"
    >`;
  });

  // Заменяем закрывающий тег в самом конце функции (перед последней скобкой return)
  // Мы ищем последнюю комбинацию </div> перед последним );
  const lastDivRegex = /<\/div>\s*(\s*\);\s*\})/;
  content = content.replace(lastDivRegex, '</article>$1');

  // 2. Разметка автора
  const authorRegex = /<span\s+className="text-xs font-bold text-slate-300 truncate">(@\{agent\.username\})<\/span>/;
  content = content.replace(authorRegex, '<span itemProp="author" className="text-xs font-bold text-slate-300 truncate">$1</span>');

  // 3. Разметка названия промпта (Заголовок)
  const titleRegex = /<h3\s+className="([^"]+)">/;
  content = content.replace(titleRegex, '<h3 itemProp="name" className="$1">');

  // 4. Разметка текста промпта
  const promptRegex = /<p\s+className="whitespace-pre-wrap select-text">(\{highlight\(agent\.prompt, highlightText\)\})<\/p>/;
  content = content.replace(promptRegex, '<p itemProp="text" className="whitespace-pre-wrap select-text">$1</p>');

  // 5. Добавление скрытых мета-данных для роботов (Дата публикации)
  const metaDateAnchor = '<div className="relative z-10 flex flex-col h-full justify-between">';
  if (content.includes(metaDateAnchor)) {
    content = content.replace(metaDateAnchor, metaDateAnchor + `
        <meta itemProp="datePublished" content={new Date(agent.createdAt).toISOString()} />`);
  }

  try {
    fs.writeFileSync(cardPath, content, 'utf8');
    console.log('[УСПЕШНО] AgentCard.tsx теперь использует семантическую разметку (article + Schema.org)');
    console.log('[ИНФО] Поисковики теперь будут видеть карточки как самостоятельные публикации.');
  } catch (err) {
    console.error('[ОШИБКА] Не удалось сохранить изменения:', err.message);
  }
}

applySEOPatch();