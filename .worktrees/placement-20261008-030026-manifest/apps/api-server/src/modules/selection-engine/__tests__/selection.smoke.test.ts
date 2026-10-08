import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectionService } from '../selection.service';
import { container } from '../../core/container';

describe('SelectionService smoke', () => {
    beforeEach(() => {
        container.reset();
        container.register(SelectionService, new SelectionService({} as any, {} as any));
    });

  it('instantiates correctly', () => {
    const service = container.get(SelectionService);
    expect(service).toBeDefined();
    expect(service.composeExam).toBeDefined();
  });
});
