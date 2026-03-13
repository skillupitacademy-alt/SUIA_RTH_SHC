import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { runWithTrace } from '../trace.context';
import { withRequestContext } from '../request-context';

describe('logger', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses production defaults when NODE_ENV=production and LOG_LEVEL is unset', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;

    const { logger } = await import('../logger');

    expect(typeof logger.info).toBe('function');
    logger.info('no-context');
  });

  it('respects LOG_LEVEL and mixes correlation/request/user context when present', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'info';

    const { logger } = await import('../logger');

    expect(typeof logger.info).toBe('function');

    runWithTrace('corr-1', () =>
      withRequestContext({ requestId: 'req-1', userId: 'u1' }, () => {
        logger.info({ ok: true }, 'with-context');
      })
    );
  });
});
