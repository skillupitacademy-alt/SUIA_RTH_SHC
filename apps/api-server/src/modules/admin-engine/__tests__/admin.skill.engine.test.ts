import { describe, expect, it, vi } from 'vitest';

import { AdminSkillEngine } from '../admin.skill.engine';

describe('AdminSkillEngine', () => {
  const repository = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteBatch: vi.fn(),
    getTopicSkills: vi.fn(),
    getSkillsByTopic: vi.fn(),
    mapTopicToSkills: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const engine = new AdminSkillEngine(repository as any, audit as any);

  it('delegates all repository operations and audit logging', async () => {
    repository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    repository.create.mockResolvedValue({ id: 's1' });
    repository.update.mockResolvedValue({ id: 's1', name: 'Updated' });
    repository.delete.mockResolvedValue({ id: 's1' });
    repository.deleteBatch.mockResolvedValue([{ id: 's1' }]);
    repository.getTopicSkills.mockResolvedValue([{ id: 'ts1' }]);
    repository.getSkillsByTopic.mockResolvedValue([{ id: 's1' }]);
    repository.mapTopicToSkills.mockResolvedValue(undefined);

    await expect(engine.getSkills(1, 10, { search: 'js' })).resolves.toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    await expect(engine.createSkill({ name: 'Skill 1' } as any, 'admin-1')).resolves.toEqual({ id: 's1' });
    await expect(engine.updateSkill('s1', { name: 'Updated' } as any, 'admin-1')).resolves.toEqual({ id: 's1', name: 'Updated' });
    await expect(engine.deleteSkill('s1', 'admin-1')).resolves.toEqual({ id: 's1' });
    await expect(engine.deleteSkillsBatch(['s1'], 'admin-1')).resolves.toEqual([{ id: 's1' }]);
    await expect(engine.getTopicSkills(1, 20)).resolves.toEqual([{ id: 'ts1' }]);
    await expect(engine.getSkillsByTopic('t1')).resolves.toEqual([{ id: 's1' }]);
    await expect(engine.mapTopicToSkills('t1', ['s1'], 'admin-1')).resolves.toBeUndefined();

    expect(audit.log).toHaveBeenCalledTimes(5);
  });
});
