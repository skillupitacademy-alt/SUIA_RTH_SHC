import { describe, expect, it, vi, beforeEach } from 'vitest';
import { eventBus } from '../../modules/core/event-bus';
import { DOMAIN_EVENTS } from '../../modules/core/events';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  describe('onEvent and emitEvent', () => {
    it('should call registered listeners when an event is emitted', () => {
      const listener = vi.fn();
      eventBus.onEvent(DOMAIN_EVENTS.EXAM_COMPLETED, listener);

      const payload = { examId: 'e1', userId: 'u1', score: 100 };
      const emitted = eventBus.emitEvent(DOMAIN_EVENTS.EXAM_COMPLETED, payload);

      expect(emitted).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(payload);
    });

    it('should handle multiple listeners for the same event', () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      
      eventBus.onEvent(DOMAIN_EVENTS.EXAM_COMPLETED, listenerA);
      eventBus.onEvent(DOMAIN_EVENTS.EXAM_COMPLETED, listenerB);

      eventBus.emitEvent(DOMAIN_EVENTS.EXAM_COMPLETED, { examId: 'e1', userId: 'u1', score: 100 });

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(1);
    });

    it('should not throw if a listener throws an error', async () => {
      // Because we wrapped listeners in try/catch in eventBus.onEvent
      const throwingListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener failed');
      });
      const validListener = vi.fn();

      eventBus.onEvent(DOMAIN_EVENTS.EXAM_FAILED, throwingListener);
      eventBus.onEvent(DOMAIN_EVENTS.EXAM_FAILED, validListener);

      eventBus.emitEvent(DOMAIN_EVENTS.EXAM_FAILED, { examId: 'e2', userId: 'u2', error: 'System error' });

      // We need to wait a tick because the wrapper in eventBus makes the execution async internally due to try/catch
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(throwingListener).toHaveBeenCalledTimes(1);
      // Valid listener should STILL run even though the first one threw
      expect(validListener).toHaveBeenCalledTimes(1);
    });
  });
});
