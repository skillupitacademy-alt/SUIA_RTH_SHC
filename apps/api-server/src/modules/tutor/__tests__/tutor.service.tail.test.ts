import { describe, it, expect, vi } from 'vitest';

import { TutorService } from '../tutor.service';

vi.mock('@/modules/core/resilience.service', () => ({
  ResilienceService: {
    isFeatureEnabled: vi.fn().mockRejectedValue(new Error('feature check fail')),
  },
}));

describe('TutorService catch block', () => {
  it('swallows errors and logs (line 139)', async () => {
    const { container } = await import('@/modules/core/container');
    const { LoggerService } = await import('@/modules/core/logger.service');
    const loggerService = container.get(LoggerService);
    const errSpy = vi.spyOn(loggerService, 'error').mockImplementation(() => {});
    await TutorService.processExamResults('exam-id');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
