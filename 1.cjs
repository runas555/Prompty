const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/PostModal.tsx');

if (!fs.existsSync(targetFile)) {
  console.error(`[ОШИБКА] Целевой файл не найден: ${targetFile}`);
  process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

function replaceExact(oldStr, newStr, blockName) {
  const normalize = (str) => str.replace(/\r\n/g, '\n');
  const normalizedCode = normalize(code);
  const normalizedOld = normalize(oldStr);
  
  if (normalizedCode.includes(normalizedOld)) {
    const escaped = oldStr
      .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      .replace(/\s+/g, '\\s+');
    const regex = new RegExp(escaped, 'g');
    
    code = code.replace(regex, newStr);
    console.log(`[УСПЕШНО] Исправлен блок: ${blockName}`);
    return true;
  }

  console.log(`[ПРОПУЩЕНО/ОШИБКА] Блок "${blockName}" не найден.`);
  return false;
}

console.log('--- ОПТИМИЗАЦИЯ СОХРАНЕНИЯ СОСТОЯНИЯ ФОРМЫ И ПЕРЕВОДА ---');

const oldEffectBlock = `  useEffect(() => {
    if (agent) {
      const displayName = agent.name.includes(" | ") ? agent.name.split(" | ")[0] : agent.name;
      setName(displayName);
      setPrompt(agent.prompt);
      setCategory(agent.category || "coding");
      setModel(agent.model || "any");
      setTags(agent.tags || "");
      fetchVersions();
    } else {
      setName("");
      setPrompt("");
      setCategory("coding");
      setModel("any");
      setTags("");
      setVersions([]);
    }
    setError("");
    setAutoTranslate(false);
    setSelectedCompareVersion(null);
    setActiveRightTab("settings");
  }, [agent, isOpen]);`;

const newEffectBlock = `  useEffect(() => {
    if (agent) {
      const displayName = agent.name.includes(" | ") ? agent.name.split(" | ")[0] : agent.name;
      setName(displayName);
      setPrompt(agent.prompt);
      setCategory(agent.category || "coding");
      setModel(agent.model || "any");
      setTags(agent.tags || "");
      setAutoTranslate(agent.name.includes(" | "));
      fetchVersions();
    } else {
      setName("");
      setPrompt("");
      setCategory("coding");
      setModel("any");
      setTags("");
      setAutoTranslate(false);
      setVersions([]);
    }
    setError("");
    setSelectedCompareVersion(null);
    setActiveRightTab("settings");
  }, [agent?.id, isOpen]);`;

replaceExact(oldEffectBlock, newEffectBlock, 'Оптимизация сброса состояния формы и автоперевода');

try {
  fs.writeFileSync(targetFile, code, 'utf8');
  console.log('--- ИСПРАВЛЕНИЯ ЗАПИСАНЫ УСПЕШНО ---');
} catch (err) {
  console.error('[ОШИБКА] Не удалось перезаписать файл:', err.message);
}