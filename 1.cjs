const fs = require('fs');
const path = require('path');

const postModalPath = path.join(__dirname, 'src/components/PostModal.tsx');
const agentCardPath = path.join(__dirname, 'src/components/AgentCard.tsx');

// Универсальная функция замены блоков с логами
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
    console.log(`[УСПЕШНО] Исправлен блок "${blockName}" в ${path.basename(filePath)}`);
    return true;
  }

  console.log(`[ПРОПУЩЕНО/ОШИБКА] Блок "${blockName}" не найден в ${path.basename(filePath)}`);
  return false;
}

console.log('--- НАЧАЛО ОБНОВЛЕНИЯ МОДЕЛЕЙ И ОТОБРАЖЕНИЯ НА КАРТОЧКАХ ---');

// 1. Изменение "Any" на "Не выбрано" в PostModal.tsx
const oldPostModalModel = `const MODELS = [
  { id: "any", label: "Any" },`;

const newPostModalModel = `const MODELS = [
  { id: "any", label: "Не выбрано" },`;

replaceInFile(postModalPath, oldPostModalModel, newPostModalModel, 'Переименование модели в Any -> Не выбрано (PostModal)');

// 2. Изменение labels в AgentCard.tsx
const oldAgentCardModelLabels = `const MODEL_LABELS: Record<string, string> = {
  any: "Any",`;

const newAgentCardModelLabels = `const MODEL_LABELS: Record<string, string> = {
  any: "Не выбрано",`;

replaceInFile(agentCardPath, oldAgentCardModelLabels, newAgentCardModelLabels, 'Переименование метки Any -> Не выбрано (AgentCard)');

// 3. Условный рендеринг бейджа модели в AgentCard.tsx (скрытие, если выбрано "any")
const oldBadgeRender = `<span className="inline-flex items-center text-[8px] font-extrabold text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 px-1.5 py-0.5 rounded uppercase">
                {MODEL_LABELS[agent.model] || "Model"}
              </span>`;

const newBadgeRender = `{agent.model && agent.model !== "any" && (
                <span className="inline-flex items-center text-[8px] font-extrabold text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 px-1.5 py-0.5 rounded uppercase">
                  {MODEL_LABELS[agent.model] || "Model"}
                </span>
              )}`;

replaceInFile(agentCardPath, oldBadgeRender, newBadgeRender, 'Скрытие бейджа модели, если она не выбрана');

console.log('--- ЗАВЕРШЕНО ---');