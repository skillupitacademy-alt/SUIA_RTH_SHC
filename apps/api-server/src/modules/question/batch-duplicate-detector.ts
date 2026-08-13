import {
  computeCodeHash,
  computeQuestionHash,
  normalizeConceptKey,
  normalizeObjectiveKey,
} from './question-hash';

export type BatchDuplicateLevel = 'batch_exact' | 'batch_concept_objective' | 'batch_code_objective';

export interface BatchDuplicateInput {
  questionText: string;
  codeSnippet?: string | null;
  conceptKey?: string | null;
  objectiveKey?: string | null;
  type?: string | null;
  correctAnswer?: string | null;
}

export interface BatchDuplicateDetail {
  index: number;
  status: 'duplicate';
  level: BatchDuplicateLevel;
  reason: string;
  similarity: number;
  originalId: null;
  existingQuestionText: string | null;
  existingQuestionCode: string | null;
  isDuplicate: true;
  batchOriginalIndex: number;
}

type BatchKeyRecord = {
  index: number;
  questionText: string;
  codeSnippet: string | null;
};

function firstText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function makeDetail(
  index: number,
  original: BatchKeyRecord,
  level: BatchDuplicateLevel,
  reason: string,
): BatchDuplicateDetail {
  return {
    index,
    status: 'duplicate',
    level,
    reason,
    similarity: 1,
    originalId: null,
    existingQuestionText: original.questionText,
    existingQuestionCode: original.codeSnippet,
    isDuplicate: true,
    batchOriginalIndex: original.index,
  };
}

export function findBatchDuplicateDetails(items: BatchDuplicateInput[]): BatchDuplicateDetail[] {
  const details: BatchDuplicateDetail[] = [];
  const flaggedIndices = new Set<number>();

  const exactSeen = new Map<string, BatchKeyRecord>();
  items.forEach((item, index) => {
    const questionText = firstText(item.questionText);
    if (questionText === '') return;

    const key = computeQuestionHash(questionText);
    const existing = exactSeen.get(key);
    if (existing !== undefined) {
      flaggedIndices.add(index);
      details.push(makeDetail(index, existing, 'batch_exact', `Same question text as staged Q${existing.index + 1}.`));
      return;
    }

    exactSeen.set(key, {
      index,
      questionText,
      codeSnippet: firstText(item.codeSnippet) || null,
    });
  });

  const conceptObjectiveSeen = new Map<string, BatchKeyRecord>();
  items.forEach((item, index) => {
    if (flaggedIndices.has(index)) return;

    const conceptKey = firstText(item.conceptKey);
    const objectiveKey = firstText(item.objectiveKey);
    if (conceptKey === '' || objectiveKey === '') return;

    const key = `${normalizeConceptKey(conceptKey)}:${normalizeObjectiveKey(objectiveKey)}`;
    const existing = conceptObjectiveSeen.get(key);
    if (existing !== undefined) {
      flaggedIndices.add(index);
      details.push(
        makeDetail(
          index,
          existing,
          'batch_concept_objective',
          `Same conceptKey and objectiveKey as staged Q${existing.index + 1}.`,
        ),
      );
      return;
    }

    conceptObjectiveSeen.set(key, {
      index,
      questionText: firstText(item.questionText),
      codeSnippet: firstText(item.codeSnippet) || null,
    });
  });

  const codeObjectiveSeen = new Map<string, BatchKeyRecord>();
  items.forEach((item, index) => {
    if (flaggedIndices.has(index)) return;

    const codeSnippet = firstText(item.codeSnippet);
    const objectiveKey = firstText(item.objectiveKey);
    if (codeSnippet === '' || objectiveKey === '') return;

    const codeHash = computeCodeHash(codeSnippet);
    if (codeHash === null) return;

    const key = `${codeHash}:${normalizeObjectiveKey(objectiveKey)}`;
    const existing = codeObjectiveSeen.get(key);
    if (existing !== undefined) {
      flaggedIndices.add(index);
      details.push(
        makeDetail(
          index,
          existing,
          'batch_code_objective',
          `Same code snippet and objectiveKey as staged Q${existing.index + 1}.`,
        ),
      );
      return;
    }

    codeObjectiveSeen.set(key, {
      index,
      questionText: firstText(item.questionText),
      codeSnippet,
    });
  });

  return details.sort((a, b) => a.index - b.index);
}
