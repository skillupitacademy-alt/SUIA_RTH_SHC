import { describe, expect, it } from 'vitest';
import {
  getBlockVersionDefinition,
  getRegisteredBlockVersionDefinitions,
  normalizeBlockPreviewPayload,
  prepareBlockForStorage,
  parseBlockMarkdown,
  canonicalizeBlockInstance,
} from '../blockVersionDefinitions';

describe('blockVersionDefinitions', () => {
  it('registers every version currently offered by the Composer', () => {
    const versions = getRegisteredBlockVersionDefinitions().map(({ type, version }) => `${type}:${version}`);
    expect(versions).toEqual(
      expect.arrayContaining([
        'definition:D1',
        'code:C1',
        'summary:S1',
        'introduction:I1',
        'objective:O1',
        'objective:O2',
      ])
    );
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

  it('uses version-owned storage preparation without editor-specific C1 branching', () => {
    const prepared = prepareBlockForStorage({
      page: { type: 'CODE + EXPLANATION', title: 'Example', introduction: 'Intro' },
      code: { language: 'typescript', source: 'const answer = 42;' },
    }, 'code', 'C1');

    expect(prepared.payloadFormat).toBe('canonical');
    expect(prepared.content).toMatchObject({ page: { type: 'code', language: 'typescript' } });
  });

  it('preserves safe fallback behavior for unsupported future versions', () => {
    expect(getBlockVersionDefinition('code', 'C99')).toBeUndefined();
    const payload = { page: { title: 'Future block' } };
    expect(normalizeBlockPreviewPayload(payload, 'code', 'C99').content).toBe(payload);
  });

  it('does not turn Markdown into an unrelated Code payload for versions without a parser', () => {
    expect(() => parseBlockMarkdown('# Objective', 'objective', 'O1')).toThrow(
      'Markdown authoring is not available for objective O1; use JSON authoring instead.'
    );
  });

  it('preserves rich S1 data when converting the editor instance to a canonical block', () => {
    const block = canonicalizeBlockInstance({
      id: 'summary-s1',
      type: 'summary',
      version: 'v1',
      versionCode: 'S1',
      title: 'Revision',
      payloadFormat: 'legacy',
      sourceFormat: 'json',
      sourceContent: '{}',
      payload: {
        page: { title: 'Revision', introduction: 'Review' },
        summary: [{ text: 'Key point' }],
        revisionTable: {
          columns: [{ id: 'concept', title: 'Concept' }],
          rows: [{ concept: { name: 'Function' } }],
        },
      },
    });

    expect(block).toMatchObject({
      type: 'summary',
      version: 'S1',
      content: { revisionTable: { columns: [{ id: 'concept' }] } },
    });
  });
});
