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

export function parseAnswer(answer: string): string[] {
  return answer
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}
