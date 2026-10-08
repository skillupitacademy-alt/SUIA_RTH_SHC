import { describe, it, expect, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  it('can create children and log', () => {
    const child = logger.child({ module: 'test' });
    expect(child).toBeDefined();
    // Verify it doesn't crash
    child.info('test log');
    child.error(new Error('test error'), 'test error message');
  });
});
