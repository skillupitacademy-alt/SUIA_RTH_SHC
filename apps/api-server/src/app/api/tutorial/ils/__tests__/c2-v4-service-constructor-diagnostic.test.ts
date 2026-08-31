/**
 * A4-C2-V4 SERVICE CONSTRUCTOR DIAGNOSTIC
 * 
 * Purpose: Verify mocked LearningProgressService constructor is observable
 * 
 * RULES:
 * - Use VALID UUIDs (schema requires them)
 * - Mock @quiz/db-tutorial ONLY
 * - Do NOT mock validateRequest()
 * - Track constructor invocations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Track constructor calls at module level (before hoisting)
let constructorCallCount = 0;
let lastConstructedService: any = null;

// Mock service/repositories
vi.mock('@quiz/db-tutorial', async () => {
  const actual = await vi.importActual('@quiz/db-tutorial');
  
  return {
    ...actual,
    LearningProgressService: vi.fn().mockImplementation(() => {
      constructorCallCount++;
      const service = {
        recordActiveTime: vi.fn().mockResolvedValue({
          navigationNodeId: '550e8400-e29b-41d4-a716-446655440001',
          sectionId: null,
          subtopicId: '550e8400-e29b-41d4-a716-446655440002',
          userId: 'authenticated-user',
          brand: 'realtutorialhub',
          lastVisitedAt: new Date().toISOString(),
          progressPercent: 0,
          isCompleted: false,
          completedAt: null,
          activeTimeSeconds: 30,
          visitCount: 1,
        }),
      };
      lastConstructedService = service;
      return service;
    }),
    TutorialNavigationProgressRepository: vi.fn().mockImplementation(() => ({})),
    TutorialSectionRepository: vi.fn().mockImplementation(() => ({})),
  };
});

describe('C2-V4 Service Constructor Diagnostic', () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    constructorCallCount = 0;
    lastConstructedService = null;
    
    originalSecret = process.env.INTERNAL_API_SECRET;
    process.env.INTERNAL_API_SECRET = 'test-internal-secret-c2v2';
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.INTERNAL_API_SECRET = originalSecret;
    } else {
      delete process.env.INTERNAL_API_SECRET;
    }
  });

  it('DIAGNOSTIC: Service constructor observable with valid UUIDs', async () => {
    const request = new NextRequest('http://localhost/api/tutorial/ils/active-time', {
      method: 'POST',
      headers: {
        'X-Internal-Secret': 'test-internal-secret-c2v2',
        'X-User-ID': 'authenticated-user',
        'X-Brand': 'realtutorialhub',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        navigationNodeId: '550e8400-e29b-41d4-a716-446655440001', // VALID UUID
        subtopicId: '550e8400-e29b-41d4-a716-446655440002', // VALID UUID
        incrementSeconds: 30,
      }),
    });

    const { POST } = await import('../active-time/route');
    const response = await POST(request);

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    const diagnostic = {
      responseStatus: response.status,
      responseBody: parsed,
      constructorCallCount,
      serviceObserved: lastConstructedService !== null,
      recordActiveTimeCalled: lastConstructedService?.recordActiveTime?.mock?.calls?.length ?? 0,
    };

    // DELIBERATELY FAIL to expose diagnostic info
    expect(diagnostic).toEqual({
      responseStatus: 200,
      responseBody: expect.objectContaining({ data: expect.any(Object) }),
      constructorCallCount: 1,
      serviceObserved: true,
      recordActiveTimeCalled: 1,
    });
  });
});
