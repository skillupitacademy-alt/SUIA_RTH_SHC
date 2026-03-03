import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { cacheService } from '@/modules/core/cache.service'
import { SelectionService } from '@/modules/selection-engine/selection.service'

describe('SelectionService phase 3 coverage', () => {
  it('composes exam at topic level (simple, 10 questions)', async () => {
    const blueprint = {
      id: 'bp-static',
      questionIds: [],
      status: 'active',
      name: 'Static',
      totalQuestions: 10,
      timeLimit: 10,
      domains: ['fullstack'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'u1',
    } as any

    vi.spyOn(cacheService, 'get').mockResolvedValue(null)
    ;(db.query as any).examBlueprints = { findFirst: vi.fn().mockResolvedValue(blueprint) }
    const chainForCriteria: any = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(Promise.resolve([{ topicId: 'javascript', subjectId: 'front-end' }])),
      }),
    }

    const chainForFetch: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        { id: 'q0', questionText: 'Q0', options: [], type: 'mcq', difficulty: 'simple', subjectId: 'front-end', topicId: 'javascript', subtopicId: null }
      ]),
    }

    const selectMock = vi.fn()
      // first two calls used by resolveSelectionCriteria (subtopics -> topics, topics -> subjects)
      .mockReturnValueOnce(chainForCriteria)
      .mockReturnValueOnce(chainForCriteria)
      // subsequent calls used by executeDynamicSelection's fetchFromPool
      .mockReturnValue(chainForFetch)

    ;(db as any).select = selectMock
    ;(db.query as any).topics = { findMany: vi.fn().mockResolvedValue([{ id: 'javascript', subjectId: 'front-end' }]) }
    ;(db.query as any).subjects = { findMany: vi.fn().mockResolvedValue([{ id: 'front-end', domainId: 'fullstack' }]) }
    ;(db.query as any).questions = {
      findMany: vi.fn().mockResolvedValue(
        Array.from({ length: 10 }).map((_, i) => ({
          id: `q${i}`,
          questionText: `Q${i}`,
          options: [],
          status: 'active',
          type: 'mcq',
          difficulty: 'simple',
          subjectId: 'front-end',
          topicId: 'javascript',
          subtopicId: null,
        }))
      )
    }
    ;(db.query as any).topics = { findMany: vi.fn().mockResolvedValue([]) }
    ;(db.query as any).subjects = { findMany: vi.fn().mockResolvedValue([]) }

    const result = await SelectionService.composeExam('u1', 'fullstack', 'idem-topic', {
      topicIds: ['javascript'],
      questionCount: 10,
      difficulty: 'simple',
    })

    expect(result.questions).toHaveLength(10)
    expect(result.blueprint.id).toBe('bp-static')
  })

  it('returns static questions when blueprint carries questionIds', async () => {
    const blueprint = {
      id: 'bp-static',
      questionIds: ['q1'],
      status: 'active',
      name: 'Static',
      totalQuestions: 1,
      timeLimit: 5,
      domains: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'u1',
    } as any

    vi.spyOn(cacheService, 'get').mockResolvedValue(blueprint as any)
    ;(db.query as any).questions = { findMany: vi.fn().mockResolvedValue([{ id: 'q1', questionText: 'static', options: [], status: 'active', type: 'mcq' }]) }

    const result = await SelectionService.composeExam('u1', 'bp-static', 'idem-1')
    expect(result.questions[0].id).toBe('q1')
    expect(result.blueprint.id).toBe('bp-static')
  })

  it('creates transient blueprint when none found and returns dynamic selection result shape', async () => {
    // Force cache miss and DB miss; then short-circuit internals with spies
    vi.spyOn(cacheService, 'get').mockRejectedValue(new Error('cache down'))
    const transient = {
      id: 'transient',
      questionIds: [],
      totalQuestions: 2,
      timeLimit: 3,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'u1',
      domains: [],
    } as any

    vi.spyOn(SelectionService as any, 'resolveBlueprint').mockResolvedValue(transient)
    vi.spyOn(SelectionService as any, 'resolveSelectionCriteria').mockResolvedValue({
      domainId: 'd1',
      finalSubtopicIds: [],
      actualTopicIds: [],
      actualSubjectIds: [],
      requestedTotal: 2,
      difficultyPref: 'simple',
    })
    vi.spyOn(SelectionService as any, 'executeDynamicSelection').mockResolvedValue([
      { id: 'dyn1', questionText: 'Q', options: [], type: 'mcq' },
      { id: 'dyn2', questionText: 'Q2', options: [], type: 'mcq' },
    ])

    const result = await SelectionService.composeExam('u1', 'domain-x', 'idem-2', { questionCount: 2, difficulty: 'simple' })
    expect(result.blueprint.id).toBe('transient')
    expect(result.questions).toHaveLength(2)
  })

  it('composes exam at subtopic level (mixed, 10 questions)', async () => {
    const transient = {
      id: 'transient',
      questionIds: [],
      totalQuestions: 10,
      timeLimit: 15,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'u1',
      domains: ['fullstack'],
    } as any

    vi.spyOn(SelectionService as any, 'resolveBlueprint').mockResolvedValue(transient)
    vi.spyOn(SelectionService as any, 'resolveSelectionCriteria').mockResolvedValue({
      domainId: 'fullstack',
      finalSubtopicIds: ['variables', 'looping', 'type-coercion', 'conditional-construct'],
      actualTopicIds: ['javascript'],
      actualSubjectIds: ['front-end'],
      requestedTotal: 10,
      difficultyPref: 'mixed',
    })
    vi.spyOn(SelectionService as any, 'executeDynamicSelection').mockResolvedValue(
      Array.from({ length: 10 }).map((_, i) => ({ id: `dyn${i}`, questionText: `Q${i}`, options: [], type: 'mcq' }))
    )

    const result = await SelectionService.composeExam('u1', 'fullstack', 'idem-subtopics', {
      topicIds: ['javascript'],
      subtopicIds: ['variables', 'looping', 'type-coercion', 'conditional-construct'],
      questionCount: 10,
      difficulty: 'mixed',
    })

    expect(result.questions).toHaveLength(10)
    expect(result.blueprint.id).toBe('transient')
  })
})
