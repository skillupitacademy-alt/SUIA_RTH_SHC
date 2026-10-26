import { describe, expect, it } from 'vitest';
import {
  getBlockVersionDefinition,
  getRegisteredBlockVersionDefinitions,
  normalizeBlockPreviewPayload,
  parseBlockMarkdown,
} from '../blockVersionDefinitions';

describe('blockVersionDefinitions', () => {
  it('registers every version currently offered by the Composer', () => {
    expect(getRegisteredBlockVersionDefinitions().map(({ type, version }) => `${type}:${version}`)).toEqual([
      'definition:D1',
      'code:C1',
      'summary:S1',
      'introduction:I1',
      'objective:O1',
      'objective:O2',
    ]);
  });

  it('normalizes partial D1 and I1 drafts without changing their UI contracts', () => {
    const definition = normalizeBlockPreviewPayload({ title: 'Draft Definition' }, 'definition', 'D1');
    const introduction = normalizeBlockPreviewPayload({ page: { title: 'Draft Introduction' } }, 'introduction', 'I1');

    expect(definition.content).toMatchObject({ page: { title: 'Draft Definition' } });
    expect(introduction.content).toMatchObject({ page: { title: 'Draft Introduction', motto: { lines: expect.any(Array) } } });
  });

  it('uses version-owned Markdown parsing', () => {
    expect(parseBlockMarkdown('# Variable\nIntro\nDefinition', 'definition', 'D1')).toMatchObject({
      page: { title: 'Variable', definition: 'Definition' },
    });
    expect(parseBlockMarkdown('# Overview', 'introduction', 'I1')).toMatchObject({
      page: { title: 'Overview', motto: { lines: expect.any(Array) } },
    });
  });

  it('preserves safe fallback behavior for unsupported future versions', () => {
    expect(getBlockVersionDefinition('code', 'C99')).toBeUndefined();
    const payload = { page: { title: 'Future block' } };
    expect(normalizeBlockPreviewPayload(payload, 'code', 'C99').content).toBe(payload);
  });
});
