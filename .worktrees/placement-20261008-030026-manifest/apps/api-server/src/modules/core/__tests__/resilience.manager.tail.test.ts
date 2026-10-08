import { describe, it, expect } from 'vitest';
import { ResilienceManager } from '../resilience.manager';

describe('ResilienceManager tail coverage', () => {
    it('getInstance: bypasses initialization when instance already exists (Line 12)', () => {
        // Calling it twice guarantees the if (instance === undefined) evaluates to false
        const instance1 = ResilienceManager.getInstance();
        const instance2 = ResilienceManager.getInstance();
        
        expect(instance1).toBe(instance2);
    });
});
