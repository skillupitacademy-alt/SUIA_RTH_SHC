import { describe, expect, it } from 'vitest';
import { SummaryS1AuthorContentSchema } from '../content-blocks.schema';

const validRichSummary = {
  page: {
    badge: 'REVISION',
    title: 'JavaScript Review',
    introduction: 'Key concepts to retain.',
  },
  summary: [{ text: 'Functions are reusable.' }],
  revisionTable: {
    columns: [{ id: 'concept', title: 'Concept' }],
    rows: [{
      concept: { name: 'Function' },
      keyPoint: { title: 'Reusable logic', description: 'Encapsulates a task.' },
    }],
  },
  quickTips: [{ text: 'Name functions clearly.' }],
  finalTip: { title: 'Practice', text: 'Write one function today.' },
};

describe('SummaryS1AuthorContentSchema', () => {
  it('accepts the rich S1 contract used by the Composer renderer', () => {
    expect(SummaryS1AuthorContentSchema.safeParse(validRichSummary).success).toBe(true);
  });

  it('rejects incomplete rich table rows rather than passing malformed AI output through', () => {
    const malformed = {
      ...validRichSummary,
      revisionTable: {
        ...validRichSummary.revisionTable,
        rows: [{ keyPoint: { title: 'Missing description' } }],
      },
    };

    expect(SummaryS1AuthorContentSchema.safeParse(malformed).success).toBe(false);
  });

  it('rejects unexpected executable-style fields in the rich contract', () => {
    expect(SummaryS1AuthorContentSchema.safeParse({
      ...validRichSummary,
      script: '<script>alert(1)</script>',
    }).success).toBe(false);
  });
});
