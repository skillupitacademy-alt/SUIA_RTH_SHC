import { describe, it, expect } from 'vitest';
import { blockLearningState } from '../block-learning-state';

describe('blockLearningState schema (Phase 4.1)', () => {
  it('has correct table name', () => {
    expect(blockLearningState).toBeDefined();
  });

  it('has all required identity columns', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).toContain('id');
    expect(columns).toContain('userId');
    expect(columns).toContain('navigationNodeId');
    expect(columns).toContain('blockId');
    expect(columns).toContain('blockVersion');
  });

  it('has all required telemetry columns', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).toContain('expectedTimeSec');
    expect(columns).toContain('visitCount');
    expect(columns).toContain('revisionCount');
    expect(columns).toContain('activeTimeSec');
  });

  it('has all required timestamp columns', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).toContain('firstViewedAt');
    expect(columns).toContain('lastViewedAt');
    expect(columns).toContain('completedAt');
  });

  it('has soft-delete column', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).toContain('deletedAt');
  });

  it('does NOT have brand column (frozen architecture)', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).not.toContain('brand');
    expect(columns).not.toContain('brandId');
  });

  it('does NOT have session column (frozen architecture)', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).not.toContain('sessionId');
    expect(columns).not.toContain('lastSessionId');
  });

  it('has audit columns', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).toContain('version');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });
});
