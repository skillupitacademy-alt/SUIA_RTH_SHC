import { describe, expect, it, vi } from 'vitest';

import { eventBus } from '../event-bus';

describe('eventBus', () => {
  it('emits events and logs with examId when present', () => {
    const infoSpy = vi.spyOn((eventBus as any).log, 'info').mockImplementation(() => undefined);
    const handler = vi.fn();
    eventBus.on('EXAM_COMPLETED', handler);

    eventBus.emit('EXAM_COMPLETED', { examId: 'e1', userId: 'u1', score: 80 });

    expect(handler).toHaveBeenCalledWith({ examId: 'e1', userId: 'u1', score: 80 });
    expect(infoSpy).toHaveBeenCalledWith({ event: 'EXAM_COMPLETED', examId: 'e1' }, 'Emitting event');
    infoSpy.mockRestore();
  });

  it('logs undefined examId when payload does not include examId shape', () => {
    const infoSpy = vi.spyOn((eventBus as any).log, 'info').mockImplementation(() => undefined);

    eventBus.emit('EXAM_STARTED' as any, { userId: 'u1' } as any);

    expect(infoSpy).toHaveBeenCalledWith({ event: 'EXAM_STARTED', examId: undefined }, 'Emitting event');
    infoSpy.mockRestore();
  });
});
