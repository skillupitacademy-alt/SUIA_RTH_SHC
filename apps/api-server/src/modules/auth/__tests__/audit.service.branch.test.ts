import { describe, it, expect, vi } from 'vitest';

import { auditLogs, db } from '@quiz/db';
import { logger } from '@/lib/logger';
import { AuditService } from '../audit.service';

describe('AuditService catch branch', () => {
  it('logs error when insert fails', async () => {
    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('db down')),
    } as any);
    const errSpy = vi.spyOn(logger, 'child').mockReturnValue({
      error: vi.fn(),
    } as any);

    await AuditService.log({ userId: 'u1', action: 'test' });

    expect(errSpy).toHaveBeenCalled();
  });
});
