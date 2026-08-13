import { describe, expect, it } from 'vitest';

import { findBatchDuplicateDetails } from '../batch-duplicate-detector';

describe('findBatchDuplicateDetails', () => {
  it('flags exact duplicate question text inside the same batch', () => {
    const details = findBatchDuplicateDetails([
      { questionText: 'What does list[0] return?' },
      { questionText: '  What does list[0] return?  ' },
    ]);

    expect(details).toMatchObject([
      {
        index: 1,
        level: 'batch_exact',
        batchOriginalIndex: 0,
        isDuplicate: true,
      },
    ]);
  });

  it('flags repeated concept and objective keys inside the same batch', () => {
    const details = findBatchDuplicateDetails([
      {
        questionText: 'Question one',
        conceptKey: 'python_list_access',
        objectiveKey: 'identify_index_access',
      },
      {
        questionText: 'Question two',
        conceptKey: 'Python List Access',
        objectiveKey: 'Identify Index Access',
      },
    ]);

    expect(details).toMatchObject([
      {
        index: 1,
        level: 'batch_concept_objective',
        batchOriginalIndex: 0,
      },
    ]);
  });

  it('flags repeated code and objective keys inside the same batch', () => {
    const details = findBatchDuplicateDetails([
      {
        questionText: 'Predict the output',
        codeSnippet: 'items = [1, 2, 3]\nprint(items[1])',
        objectiveKey: 'predict_list_index_output',
      },
      {
        questionText: 'What is printed?',
        codeSnippet: 'items = [1, 2, 3]\nprint(items[1])',
        objectiveKey: 'predict_list_index_output',
      },
    ]);

    expect(details).toMatchObject([
      {
        index: 1,
        level: 'batch_code_objective',
        batchOriginalIndex: 0,
      },
    ]);
  });
});
