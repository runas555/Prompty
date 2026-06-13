const fs = require('fs');
const path = require('path');

const filesToDump = [
  'tsconfig.json'
];

const dumpFile = path.join(__dirname, 'dump.txt');

function collectTSContext() {
  let output = '';

  filesToDump.forEach(relativePath => {
    const absolutePath = path.join(__dirname, relativePath);
    output += `=== FILE: ${relativePath} ===\n`;
    if (fs.existsSync(absolutePath)) {
      try {
        const content = fs.readFileSync(absolutePath, 'utf8');
        output += content;
      } catch (err) {
        output += `[Ошибка чтения файла: ${err.message}]\n`;
      }
    } else {
      output += `[Файл не найден]\n`;
    }
    output += '\n\n';
  });

  try {
    fs.writeFileSync(dumpFile, output, 'utf8');
    console.log('[УСПЕШНО] tsconfig.json сохранен в dump.txt для анализа.');
  } catch (err) {
    console.error('[ОШИБКА] Не удалось записать dump.txt:', err.message);
  }
}

collectTSContext();