import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DrizzleBlueprintRepository } from '../drizzle-blueprint.repository';

describe('DrizzleBlueprintRepository', () => {
  let db: any;

  beforeEach(() => {
    db = {
      query: {
        examBlueprints: {
          findMany: vi.fn(),
        },
      },
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ count: 2 }]),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'bp-new' }]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'bp-updated' }]),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'bp-deleted' }]),
        })),
      })),
    };
  });

  it('findAll applies cursor/search filters and returns nextCursor when paginated', async () => {
    const repo = new DrizzleBlueprintRepository(db);
    const first = { id: 'bp1', createdAt: new Date('2024-01-01T00:00:00.000Z') };
    const second = { id: 'bp2', createdAt: new Date('2023-12-31T00:00:00.000Z') };

    db.query.examBlueprints.findMany.mockResolvedValue([first, second]);

    const result = await repo.findAll('2024-02-01T00:00:00.000Z', 1, { search: 'math' });

    expect(result.data).toHaveLength(1);
    expect(result.nextCursor).toBe(first.createdAt.toISOString());
    expect(result.total).toBe(2);
  });

  it('findAll returns no nextCursor when results fit within limit', async () => {
    const repo = new DrizzleBlueprintRepository(db);
    const only = { id: 'bp1', createdAt: new Date('2024-01-01T00:00:00.000Z') };

    db.query.examBlueprints.findMany.mockResolvedValue([only]);

    const result = await repo.findAll(null, 5);

    expect(result.data).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
    expect(result.total).toBe(2);
  });

  it('creates, updates, and deletes blueprints via db helpers', async () => {
    const repo = new DrizzleBlueprintRepository(db);

    await expect(repo.create({ name: 'New' } as any)).resolves.toEqual({ id: 'bp-new' });
    await expect(repo.update('bp1', { name: 'Updated' } as any)).resolves.toEqual({ id: 'bp-updated' });
    await expect(repo.delete('bp1')).resolves.toEqual({ id: 'bp-deleted' });
  });
});
