import { describe, it, expect, vi } from 'vitest';

import { ResilienceManager } from '../resilience.manager';

const resetSingleton = () => {
  (ResilienceManager as unknown as { instance?: ResilienceManager }).instance = undefined;
};

describe('ResilienceManager branches', () => {
  it('toggles high load and skips heavy task', async () => {
    resetSingleton();
    const mgr = ResilienceManager.getInstance();
    mgr.setHighLoad(true);

    const task = vi.fn(async () => 'ran');
    const result = await mgr.runHeavyTask('skip-me', task);

    expect(result).toBeNull();
    expect(task).not.toHaveBeenCalled();
  });

  it('runs heavy task when not high load', async () => {
    resetSingleton();
    const mgr = ResilienceManager.getInstance();
    mgr.setHighLoad(false);

    const task = vi.fn(async () => 'ok');
    const result = await mgr.runHeavyTask('run-me', task);

    expect(result).toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });
});
