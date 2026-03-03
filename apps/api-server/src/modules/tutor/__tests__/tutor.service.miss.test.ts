import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { TutorService } from '@/modules/tutor/tutor.service'

describe('TutorService processExamResults edge', () => {
  it('resolves without throwing when exam not found (logs only)', async () => {
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(undefined) }
    await expect(TutorService.processExamResults('missing')).resolves.toBeUndefined()
  })
})
