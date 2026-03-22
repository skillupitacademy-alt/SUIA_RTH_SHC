import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TutorialContentJSON } from '@quiz/types';
import { ZodError } from 'zod';

import { tutorialContentAudit } from '../../schema/tutorial-content-audit';
import { tutorialContentVersions } from '../../schema/tutorial-content-versions';

const mocks = vi.hoisted(() => ({
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
}));

vi.mock('@quiz/db', () => ({
  withTimeout: mocks.withTimeout,
  STANDARD_QUERY_TIMEOUT: 15_000,
  REPORT_QUERY_TIMEOUT: 30_000,
}));

import { TutorialContentRepository } from '../tutorial-content.repository';

const makeRow = (overrides: Record<string, unknown> = {}) => {
  const content: TutorialContentJSON = {
    notes: { markdown: 'Notes' },
    layman: {
      simpleExplanation: 'Explain it simply.',
      analogyOrStory: 'Like a queue at a shop.',
      example1: { company: 'Zomato', content: 'Food order' },
      example2: { company: 'Uber', content: 'Ride request' },
    },
    real_life: {
      title: 'Real life',
      scenario: 'A scenario',
      bullets: [],
      tip: 'Tip',
    },
    technical: { markdown: 'Tech', bullets: [], tip: 'Tip' },
    code: { language: 'javascript', intro: 'Intro', code: 'console.log(1)', steps: [] },
    ai_tutor: { greeting: 'Hello', qa_pairs: [] },
  };

  return {
    id: 'content-1',
    subtopicId: 'subtopic-1',
    difficulty: 'simple',
    contentType: 'standard',
    content,
    version: 1,
    language: 'en',
    isPublished: false,
    generatedByAi: false,
    aiModelUsed: null,
    generationJobId: null,
    adminApprovedBy: null,
    adminApprovedAt: null,
    qualityScore: null,
    regenerationCount: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
};

const createDbMock = (row = makeRow()) => {
  const where = vi.fn(async () => [row]);
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where,
    })),
  }));

  const returning = vi.fn(async () => [row]);
  const onConflictDoUpdate = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));

  const updateWhere = vi.fn(async () => [row]);
  const set = vi.fn(() => ({ where: vi.fn(() => ({ returning: updateWhere })) }));
  const update = vi.fn(() => ({ set }));

  return {
    row,
    select,
    where,
    insert,
    values,
    onConflictDoUpdate,
    returning,
    update,
    set,
    updateWhere,
  } as const;
};

const makeVersionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'version-1',
  contentId: 'content-1',
  version: 1,
  content: makeRow().content,
  savedBy: 'admin-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const makeAuditRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'audit-1',
  contentId: 'content-1',
  userId: 'admin-1',
  action: 'created',
  diff: { after: makeRow().content },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const createVersionAuditDbMock = (
  versionRows = [makeVersionRow()],
  auditRows = [makeAuditRow()]
) => {
  const select = vi.fn(() => ({
    from: vi.fn((table: unknown) => {
      const rows = table === tutorialContentVersions
        ? versionRows
        : table === tutorialContentAudit
          ? auditRows
          : [];

      const makeResult = async (selectedRows = rows) => selectedRows as never;
      return {
        where: vi.fn(async () => rows as never),
        orderBy: vi.fn(() => ({
          limit: vi.fn((limit: number) => ({
            offset: vi.fn(async (offset: number) => rows.slice(offset, offset + limit) as never),
          })),
          offset: vi.fn(async (offset: number) => rows.slice(offset) as never),
        })),
        limit: vi.fn((limit: number) => ({
          offset: vi.fn(async (offset: number) => rows.slice(offset, offset + limit) as never),
        })),
        offset: vi.fn(async (offset: number) => rows.slice(offset) as never),
        returning: vi.fn(async () => rows as never),
        makeResult,
      };
    }),
  }));

  const insert = vi.fn((table: unknown) => ({
    values: vi.fn(() => ({
      returning: vi.fn(async () => [
        table === tutorialContentVersions ? versionRows[0] : auditRows[0],
      ] as never),
    })),
  }));

  return {
    select,
    insert,
  } as const;
};

describe('TutorialContentRepository', () => {
  beforeEach(() => {
    mocks.withTimeout.mockClear();
  });

  it('findById filters deleted rows and uses the standard timeout', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.findById('content-1')).resolves.toEqual(db.row);
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(db.where).toHaveBeenCalledTimes(1);
    expect(mocks.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      15_000,
      'TutorialContentRepository.findById'
    );
  });

  it('findBySubtopicId returns rows for a subtopic', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.findBySubtopicId('subtopic-1', 'simple')).resolves.toEqual([db.row]);
    expect(mocks.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      15_000,
      'TutorialContentRepository.findBySubtopicId'
    );
  });

  it('findBySubtopicId works without a difficulty filter', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.findBySubtopicId('subtopic-1')).resolves.toEqual([db.row]);
  });

  it('withDb returns a cloned repository instance', () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);
    const cloned = repo.withDb(db as never);

    expect(cloned).toBeInstanceOf(TutorialContentRepository);
    expect(cloned).not.toBe(repo);
  });

  it('getPublished returns published rows', async () => {
    const published = makeRow({ isPublished: true });
    const db = createDbMock(published);
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.getPublished('subtopic-1', 'simple')).resolves.toEqual([published]);
  });

  it('getPublished works without a difficulty filter', async () => {
    const published = makeRow({ isPublished: true });
    const db = createDbMock(published);
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.getPublished('subtopic-1')).resolves.toEqual([published]);
  });

  it('upsertBlocks inserts with defaults and returns the saved row', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    const result = await repo.upsertBlocks({
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      content: db.row.content,
    });

    expect(result).toEqual(db.row);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        contentType: 'standard',
        language: 'en',
        isPublished: false,
        generatedByAi: false,
        regenerationCount: 0,
        deletedAt: null,
      })
    );
  });

  it('valid JSON inserts successfully', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    await expect(
      repo.upsertBlocks({
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: db.row.content,
      })
    ).resolves.toEqual(db.row);
  });

  it('invalid JSON throws ZodError, no DB write', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    await expect(
      repo.upsertBlocks({
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: { nope: true } as never,
      })
    ).rejects.toBeInstanceOf(ZodError);

    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('missing layman block throws ZodError', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);
    const invalidContent = {
      notes: { markdown: 'Notes' },
      real_life: {
        title: 'Real life',
        scenario: 'A scenario',
        bullets: [],
        tip: 'Tip',
      },
      technical: { markdown: 'Tech', bullets: [], tip: 'Tip' },
      code: { language: 'javascript', intro: 'Intro', code: 'console.log(1)', steps: [] },
      ai_tutor: { greeting: 'Hello', qa_pairs: [] },
    } as never;

    await expect(
      repo.upsertBlocks({
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: invalidContent,
      })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('image with both svgKey and url set throws ZodError', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    const invalidContent = {
      ...db.row.content,
      layman: {
        ...db.row.content.layman,
        image: {
          type: 'svg_standard',
          svgKey: 'promise-chain',
          url: 'https://cdn.realtutorialhub.com/content/abc.png',
          alt: 'Promise state transitions showing pending moving to fulfilled or rejected',
          caption: 'Promise lifecycle',
          position: 'right',
          width: 180,
        },
      },
    } as never;

    await expect(
      repo.upsertBlocks({
        subtopicId: 'subtopic-1',
        difficulty: 'simple',
        content: invalidContent,
      })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('updateById updates the row returning the new record', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    const result = await repo.updateById('content-1', {
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      content: db.row.content,
      language: 'fr',
    });

    expect(result).toEqual(db.row);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'fr',
      })
    );
  });

  it('publish updates the row without hard deleting it', async () => {
    const db = createDbMock(makeRow({ isPublished: true }));
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.publish('content-1')).resolves.toEqual(db.row);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublished: true,
        deletedAt: null,
      })
    );
  });

  it('getVersionHistory uses the report timeout path', async () => {
    const db = createDbMock();
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.getVersionHistory('content-1')).resolves.toEqual([db.row]);
    expect(mocks.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      30_000,
      'TutorialContentRepository.getVersionHistory'
    );
  });

  it('softDelete stamps deletedAt instead of removing the row', async () => {
    const db = createDbMock(makeRow({ deletedAt: null }));
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.softDelete('content-1')).resolves.toEqual(db.row);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublished: false,
      deletedAt: expect.any(Date),
      })
    );
  });

  it('creates a version snapshot', async () => {
    const db = createVersionAuditDbMock();
    const repo = new TutorialContentRepository(db as never);
    const versionRow = makeVersionRow();

    await expect(
      repo.createVersionSnapshot({
        contentId: versionRow.contentId as string,
        version: versionRow.version as number,
        content: versionRow.content as TutorialContentJSON,
        savedBy: versionRow.savedBy as string,
      })
    ).resolves.toEqual(versionRow);
  });

  it('returns version snapshots ordered by created date', async () => {
    const rows = [
      makeVersionRow({ id: 'version-2', version: 2, createdAt: new Date('2026-01-02T00:00:00.000Z') }),
      makeVersionRow({ id: 'version-1', version: 1, createdAt: new Date('2026-01-01T00:00:00.000Z') }),
    ];
    const db = createVersionAuditDbMock(rows);
    const repo = new TutorialContentRepository(db as never);

    await expect(repo.getVersionSnapshots('content-1')).resolves.toEqual(rows);
  });

  it('creates an audit entry', async () => {
    const db = createVersionAuditDbMock();
    const repo = new TutorialContentRepository(db as never);
    const auditRow = makeAuditRow();

    await expect(
      repo.createAuditEntry({
        contentId: auditRow.contentId as string,
        userId: auditRow.userId as string,
        action: 'created',
        diff: auditRow.diff as Record<string, unknown>,
      })
    ).resolves.toEqual(auditRow);
  });

  it('returns audit entries with filters and pagination', async () => {
    const rows = [
      makeAuditRow({ id: 'audit-2', action: 'published', createdAt: new Date('2026-01-02T00:00:00.000Z') }),
      makeAuditRow({ id: 'audit-1', action: 'created', createdAt: new Date('2026-01-01T00:00:00.000Z') }),
    ];
    const db = createVersionAuditDbMock([], rows);
    const repo = new TutorialContentRepository(db as never);

    await expect(
      repo.getAuditEntries({
        contentId: 'content-1',
        action: 'created',
        limit: 1,
        offset: 0,
      })
    ).resolves.toEqual([rows[0]]);
  });
});
