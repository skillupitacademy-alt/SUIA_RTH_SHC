import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock metrics
vi.mock('@/lib/metrics', () => ({
  recordCounter: vi.fn(),
  recordTimer: vi.fn(),
}));

// Mock tracer
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn() })),
}));

import { METRICS } from '@quiz/observability';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { SelectionService } from '../selection.service';

describe('SelectionService Metrics', () => {
  let service: SelectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SelectionService({ query: { examBlueprints: { findFirst: vi.fn() } } } as any, { get: vi.fn(), set: vi.fn() } as any);
  });

  it('records metrics for static selection', async () => {
    const blueprint = { id: 'b1', questionIds: ['q1'] };
    (service as any).resolveBlueprint = vi.fn().mockResolvedValue(blueprint);
    (service as any).fetchStaticQuestions = vi.fn().mockResolvedValue({ questions: [] });

    await service.composeExam('u1', 'b1', 'i1');

    expect(recordCounter).toHaveBeenCalledWith(METRICS.CORE.SELECTION + '.success', 1, { type: 'static' });
    expect(recordTimer).toHaveBeenCalledWith(METRICS.CORE.SELECTION + '.duration', expect.any(Number));
  });

  it('records metrics for dynamic selection', async () => {
    const blueprint = { id: 'b1', questionIds: [] };
    (service as any).resolveBlueprint = vi.fn().mockResolvedValue(blueprint);
    (service as any).resolveSelectionCriteria = vi.fn().mockResolvedValue({});
    (service as any).executeDynamicSelection = vi.fn().mockResolvedValue([]);

    await service.composeExam('u1', 'b1', 'i1');

    expect(recordCounter).toHaveBeenCalledWith(METRICS.CORE.SELECTION + '.success', 1, { type: 'dynamic' });
    expect(recordTimer).toHaveBeenCalledWith(METRICS.CORE.SELECTION + '.duration', expect.any(Number));
  });

  it('records failure metrics on selection error', async () => {
    (service as any).resolveBlueprint = vi.fn().mockRejectedValue(new Error('Selection Failed'));

    await expect(service.composeExam('u1', 'b1', 'i1')).rejects.toThrow();

    expect(recordCounter).toHaveBeenCalledWith(METRICS.CORE.SELECTION + '.failure', 1, expect.objectContaining({ error: 'Selection Failed' }));
    expect(recordTimer).toHaveBeenCalledWith(METRICS.CORE.SELECTION + '.duration', expect.any(Number));
  });
});
