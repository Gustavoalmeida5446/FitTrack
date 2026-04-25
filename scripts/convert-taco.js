import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputPath = path.join(projectRoot, 'src', 'data', 'taco-foods.json');

function normalizeText(value) {
  return value
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .trim();
}

function parseValue(value) {
  const normalized = normalizeText(value);

  if (!normalized || normalized === 'NA') return null;
  if (normalized === 'Tr') return 0;

  const numericValue = Number(normalized.replace(',', '.'));
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return normalized;
}

function splitCsvLine(line) {
  return line.split(';').map((part) => part.trim());
}

function findTacoCsv(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const nestedResult = findTacoCsv(fullPath);
      if (nestedResult) return nestedResult;
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.csv')) {
      continue;
    }

    const lowerName = entry.name.toLowerCase();
    if (lowerName.includes('taco') || lowerName.includes('alimento') || lowerName.includes('food')) {
      return fullPath;
    }
  }

  return null;
}

function getColumnIndex(headers, columnName) {
  return headers.findIndex((header) => normalizeText(header).toLowerCase() === columnName.toLowerCase());
}

function mapRowToFood(columns, indexes, rowIndex) {
  const codigo = parseValue(columns[indexes.codigo]);
  const nome = parseValue(columns[indexes.nome]);
  const categoria = parseValue(columns[indexes.categoria]);

  if (typeof codigo !== 'number' || typeof nome !== 'string' || typeof categoria !== 'string') {
    return null;
  }

  return {
    id: rowIndex + 1,
    codigo,
    nome,
    categoria,
    kcal: parseValue(columns[indexes.kcal]),
    proteina: parseValue(columns[indexes.proteina]),
    carboidrato: parseValue(columns[indexes.carboidrato]),
    gordura: parseValue(columns[indexes.gordura]),
    fibra: parseValue(columns[indexes.fibra]),
    porcaoBase: '100 g'
  };
}

function main() {
  const csvPath = findTacoCsv(projectRoot);

  if (!csvPath) {
    throw new Error('Nenhum arquivo CSV da TACO foi encontrado no projeto.');
  }

  const rawContent = fs.readFileSync(csvPath);
  const csvContent = rawContent.toString('utf8');
  const lines = csvContent
    .split('\n')
    .map((line) => line.replace(/\r/g, ''))
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error('O CSV da TACO nao possui linhas suficientes para conversao.');
  }

  const headers = splitCsvLine(lines[0]);
  const indexes = {
    codigo: getColumnIndex(headers, 'Número do Alimento'),
    categoria: getColumnIndex(headers, 'Categoria do alimento'),
    nome: getColumnIndex(headers, 'Descrição dos alimentos'),
    kcal: getColumnIndex(headers, 'Energia (kcal)'),
    proteina: getColumnIndex(headers, 'Proteína (g)'),
    carboidrato: getColumnIndex(headers, 'Carboidrato (g)'),
    gordura: getColumnIndex(headers, 'Lipídeos (g)'),
    fibra: getColumnIndex(headers, 'Fibra Alimentar (g)')
  };

  const missingColumns = Object.entries(indexes)
    .filter(([, value]) => value < 0)
    .map(([key]) => key);

  if (missingColumns.length > 0) {
    throw new Error(`Colunas obrigatorias ausentes no CSV: ${missingColumns.join(', ')}`);
  }

  const foods = lines
    .slice(1)
    .map(splitCsvLine)
    .filter((columns) => columns.some((value) => value.trim()))
    .map((columns, index) => mapRowToFood(columns, indexes, index))
    .filter(Boolean);

  fs.writeFileSync(outputPath, JSON.stringify(foods, null, 2) + '\n');

  console.log(`CSV encontrado em: ${path.relative(projectRoot, csvPath)}`);
  console.log(`JSON gerado em: ${path.relative(projectRoot, outputPath)}`);
  console.log(`Alimentos convertidos: ${foods.length}`);
}

main();
