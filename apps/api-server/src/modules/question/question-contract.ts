export type BackendQuestionType = 'mcq' | 'code_mcq' | 'multi_select';
export type QuestionDisplayType = 'text' | 'code' | 'mixed';

export interface NormalizedQuestionOption {
  id: string;
  text?: string;
  code?: string;
  label?: string;
  isCorrect?: boolean;
}

type RawQuestionOption =
  | {
      id?: string;
      text?: string | null;
      code?: string | null;
      label?: string | null;
      isCorrect?: boolean;
    };

export function normalizeQuestionType(type: string | null | undefined): BackendQuestionType {
  if (type === 'code_mcq' || type === 'multi_select') {
    return type;
  }

  return 'mcq';
}

export function normalizeQuestionOptions(options: unknown): NormalizedQuestionOption[] {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option, index) => {
    const fallbackId = String(index + 1);
    const fallbackLabel = String.fromCharCode(65 + index);

    if (typeof option === 'string') {
      return {
        id: fallbackId,
        text: option,
        label: fallbackLabel,
      };
    }

    const candidate = (option !== null && typeof option === 'object' ? option : {}) as RawQuestionOption;

    return {
      id: typeof candidate.id === 'string' && candidate.id.trim() !== '' ? candidate.id : fallbackId,
      text: typeof candidate.text === 'string' && candidate.text !== '' ? candidate.text : undefined,
      code: typeof candidate.code === 'string' && candidate.code !== '' ? candidate.code : undefined,
      label: typeof candidate.label === 'string' && candidate.label !== '' ? candidate.label : fallbackLabel,
      isCorrect: candidate.isCorrect,
    };
  });
}

export function getDisplayType(question: {
  questionText?: string | null;
  codeSnippet?: string | null;
}): QuestionDisplayType {
  const hasText = typeof question.questionText === 'string' && question.questionText.trim() !== '';
  const hasCode = typeof question.codeSnippet === 'string' && question.codeSnippet.trim() !== '';

  if (hasText && hasCode) {
    return 'mixed';
  }

  if (hasCode) {
    return 'code';
  }

  return 'text';
}

export const VERSIONED_OPTION_IDS_PREFIX = 'v1:ids:';

export function escapeAnswerToken(token: string): string {
  return token.replace(/\\/g, '\\\\').replace(/,/g, '\\,');
}

export function unescapeAnswerToken(token: string): string {
  return token.replace(/\\([,\\])/g, '$1');
}

export function serializeAnswerTokens(tokens: readonly string[]): string {
  return tokens.map((token) => escapeAnswerToken(token)).join(',');
}

export function encodeVersionedOptionIds(ids: readonly string[]): string {
  const normalizedIds = ids
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return `${VERSIONED_OPTION_IDS_PREFIX}${serializeAnswerTokens(normalizedIds)}`;
}

export function isVersionedOptionIds(answer: string): boolean {
  return typeof answer === 'string' && answer.trim().startsWith(VERSIONED_OPTION_IDS_PREFIX);
}

export function parseAnswer(answer: string | readonly string[]): string[] {
  if (Array.isArray(answer)) {
    return answer
      .filter((segment): segment is string => typeof segment === 'string')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
  }

  if (typeof answer !== 'string') {
    return [];
  }

  const trimmed = answer.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const rawBody = trimmed.startsWith(VERSIONED_OPTION_IDS_PREFIX)
    ? trimmed.slice(VERSIONED_OPTION_IDS_PREFIX.length)
    : trimmed;

  if (rawBody.startsWith('[') && rawBody.endsWith(']')) {
    try {
      const parsedJson = JSON.parse(rawBody);
      if (Array.isArray(parsedJson) && parsedJson.every((item) => typeof item === 'string')) {
        return parsedJson
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 0);
      }
    } catch {
      // Fall through to delimiter-safe token splitting
    }
  }

  const segments: string[] = [];
  let current = '';
  let escaped = false;

  for (let i = 0; i < rawBody.length; i += 1) {
    const ch = rawBody[i];
    if (escaped) {
      if (ch === ',' || ch === '\\') {
        current += ch;
      } else {
        current += `\\${ch}`;
      }
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === ',') {
      const token = current.trim();
      if (token.length > 0) {
        segments.push(token);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  if (escaped) {
    current += '\\';
  }

  const finalToken = current.trim();
  if (finalToken.length > 0) {
    segments.push(finalToken);
  }

  return segments;
}

export function validateQuestionAnswerOptionIds(
  options: unknown,
  answer: string | readonly string[],
  optionsConfig?: { rejectDuplicates?: boolean; rejectUnknownIds?: boolean; strictIdOnly?: boolean }
): { valid: boolean; optionIds: string[]; reason?: string } {
  const normalizedOptions = normalizeQuestionOptions(options);
  const tokens = parseAnswer(answer);
  if (tokens.length === 0) {
    return { valid: false, optionIds: [], reason: 'empty_answer' };
  }

  const strictIdOnly =
    optionsConfig?.strictIdOnly ??
    (typeof answer === 'string' && isVersionedOptionIds(answer));

  const optionById = new Map(normalizedOptions.map((option) => [option.id.toLowerCase(), option]));
  const optionByLabel = new Map(
    normalizedOptions
      .filter((option) => typeof option.label === 'string' && option.label.trim() !== '')
      .map((option) => [option.label!.toLowerCase(), option])
  );

  const seenIds = new Set<string>();
  const resolvedIds: string[] = [];

  for (const token of tokens) {
    const key = token.toLowerCase();
    const matched = strictIdOnly
      ? optionById.get(key)
      : (optionById.get(key) ?? optionByLabel.get(key));
    if (!matched) {
      if (optionsConfig?.rejectUnknownIds !== false) {
        return { valid: false, optionIds: [], reason: 'unknown_option_id' };
      }
      continue;
    }

    const canonicalId = matched.id.toLowerCase();
    if (seenIds.has(canonicalId)) {
      if (optionsConfig?.rejectDuplicates !== false) {
        return { valid: false, optionIds: [], reason: 'duplicate_option_id' };
      }
      continue;
    }

    seenIds.add(canonicalId);
    resolvedIds.push(matched.id);
  }

  return { valid: true, optionIds: resolvedIds };
}
