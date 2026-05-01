import { normalizeSearchValue } from './search';

export interface ExerciseSearchField {
  value: string;
  weight: number;
}

export interface ExerciseSearchDocument {
  fields: ExerciseSearchField[];
}

interface PreparedSearchField {
  normalizedValue: string;
  tokens: string[];
  weight: number;
}

interface PreparedSearchDocument {
  fields: PreparedSearchField[];
}

const MIN_RELEVANT_SCORE = 10;
const stopWords = new Set([
  'a',
  'acima',
  'and',
  'ao',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'em',
  'for',
  'na',
  'no',
  'of',
  'on',
  'para',
  'the',
  'to',
  'with'
]);

const tokenSynonyms: Record<string, string[]> = {
  agachamento: ['squat'],
  barra: ['barbell'],
  barbell: ['barra'],
  braco: ['arm'],
  cabeca: ['overhead'],
  cabo: ['cable'],
  cable: ['cabo'],
  corda: ['rope'],
  dumbbell: ['halter', 'halteres'],
  extensao: ['extension'],
  extension: ['extensao'],
  frances: ['triceps', 'overhead', 'extension'],
  halter: ['dumbbell'],
  halteres: ['dumbbell'],
  overhead: ['acima', 'cabeca'],
  rope: ['corda'],
  squat: ['agachamento'],
  tricep: ['triceps'],
  triceps: ['tricep'],
  unilateral: ['one', 'arm', 'single']
};

export function getExerciseSearchTokens(value: string): string[] {
  return normalizeSearchValue(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function expandToken(token: string): string[] {
  return [token, ...(tokenSynonyms[token] ?? [])];
}

function getExpandedTokenSet(tokens: string[]): string[] {
  return Array.from(new Set(tokens.flatMap(expandToken)));
}

function prepareDocument(document: ExerciseSearchDocument): PreparedSearchDocument {
  return {
    fields: document.fields
      .map((field) => {
        const tokens = getExpandedTokenSet(getExerciseSearchTokens(field.value));

        return {
          normalizedValue: normalizeSearchValue(field.value),
          tokens,
          weight: field.weight
        };
      })
      .filter((field) => field.normalizedValue.length > 0 && field.tokens.length > 0)
  };
}

function getTokenDistance(left: string, right: string): number {
  if (left === right) return 0;

  const distances = Array.from({ length: left.length + 1 }, (_, index) => index);

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let previous = distances[0];
    distances[0] = rightIndex;

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = distances[leftIndex];
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      distances[leftIndex] = Math.min(
        distances[leftIndex] + 1,
        distances[leftIndex - 1] + 1,
        previous + substitutionCost
      );
      previous = current;
    }
  }

  return distances[left.length];
}

function getFuzzyTokenScore(queryToken: string, fieldToken: string): number {
  if (queryToken === fieldToken) return 3;
  if (fieldToken.startsWith(queryToken) || queryToken.startsWith(fieldToken)) return 2;

  const shortestLength = Math.min(queryToken.length, fieldToken.length);

  if (shortestLength < 5) return 0;

  const distance = getTokenDistance(queryToken, fieldToken);
  const allowedDistance = shortestLength >= 8 ? 2 : 1;

  return distance <= allowedDistance ? 1 : 0;
}

function getBestTokenScore(queryToken: string, fieldTokens: string[]): number {
  return fieldTokens.reduce((bestScore, fieldToken) => (
    Math.max(bestScore, getFuzzyTokenScore(queryToken, fieldToken))
  ), 0);
}

function getMatchedQueryTokenCount(queryTokens: string[], document: PreparedSearchDocument): number {
  return queryTokens.filter((queryToken) => {
    const alternatives = expandToken(queryToken);

    return document.fields.some((field) => (
      alternatives.some((alternative) => getBestTokenScore(alternative, field.tokens) > 0)
    ));
  }).length;
}

function getRequiredMatchCount(queryTokenCount: number): number {
  if (queryTokenCount <= 2) return 1;
  if (queryTokenCount <= 4) return 2;
  return Math.ceil(queryTokenCount * 0.55);
}

export function getExerciseSearchScore(query: string, document: ExerciseSearchDocument): number {
  const normalizedQuery = normalizeSearchValue(query);
  const queryTokens = getExerciseSearchTokens(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return -1;
  }

  const preparedDocument = prepareDocument(document);

  if (preparedDocument.fields.length === 0) {
    return -1;
  }

  const matchedQueryTokenCount = getMatchedQueryTokenCount(queryTokens, preparedDocument);
  const requiredMatchCount = getRequiredMatchCount(queryTokens.length);

  if (matchedQueryTokenCount < requiredMatchCount) {
    return -1;
  }

  const expandedQueryTokens = getExpandedTokenSet(queryTokens);
  const tokenScore = preparedDocument.fields.reduce((totalScore, field) => {
    const fieldScore = expandedQueryTokens.reduce((fieldTotal, queryToken) => (
      fieldTotal + getBestTokenScore(queryToken, field.tokens) * field.weight
    ), 0);
    const phraseScore = field.normalizedValue === normalizedQuery
      ? 12 * field.weight
      : field.normalizedValue.includes(normalizedQuery)
        ? 7 * field.weight
        : 0;

    return totalScore + fieldScore + phraseScore;
  }, 0);
  const coverageMultiplier = matchedQueryTokenCount / queryTokens.length;
  const finalScore = tokenScore * (0.65 + coverageMultiplier);

  return finalScore >= MIN_RELEVANT_SCORE ? finalScore : -1;
}
