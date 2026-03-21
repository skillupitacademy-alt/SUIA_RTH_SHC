import { describe, expect, it } from 'vitest';

import { db, dbDirect, getTutorialDb, schema } from '../index';

describe('db-tutorial package', () => {
  it('exports the tutorial schema bundle', () => {
    expect(schema).toHaveProperty('tutorialContent');
    expect(schema).toHaveProperty('tutorialProgress');
    expect(schema).toHaveProperty('tutorialProjectSubmissions');
    expect(schema).toHaveProperty('remediationTriggers');
  });

  it('falls back to a test database stub when env vars are missing', () => {
    const client = getTutorialDb();
    expect(typeof client.select).toBe('function');
    expect(typeof db.select).toBe('function');
    expect(typeof dbDirect.select).toBe('function');
  });
});
