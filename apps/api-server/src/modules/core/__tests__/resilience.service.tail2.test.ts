import { describe, it, expect } from 'vitest';
import { ResilienceService } from '../resilience.service';

describe('ResilienceService tail coverage', () => {
    it('getBusyPayload: formats the correct payload (Line 49)', () => {
        const payload = ResilienceService.getBusyPayload('exam');
        expect(payload.success).toBe(false);
        expect(payload.status).toBe('load_optimization_active');
    });
});
