import { expect, it } from 'vitest';
import { TutorialDocumentSchema } from '../schemas/document.schema';
import { CURRENT_SCHEMA_VERSION } from '../constants';
const container = (child: unknown) => ({ id: 'container-1', type: 'two-column', content: { left: { blocks: [child] }, right: { blocks: [] } } });
const doc = (child: unknown) => ({ schemaVersion: CURRENT_SCHEMA_VERSION, blocks: [container(child)] });
it('accepts a valid nested paragraph', () => {
  expect(TutorialDocumentSchema.safeParse(doc({ id: 'child-1', type: 'paragraph', content: { text: 'Hello' } })).success).toBe(true);
});
it('rejects an unsupported document version', () => {
  expect(TutorialDocumentSchema.safeParse({ ...doc({}), schemaVersion: -1 }).success).toBe(false);
});
it('rejects malformed nested block content', () => {
  expect(TutorialDocumentSchema.safeParse(doc({ id: 'child-1', type: 'unrecognized', content: {} })).success).toBe(false);
});
