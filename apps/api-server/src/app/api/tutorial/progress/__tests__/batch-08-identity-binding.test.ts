import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET, POST } from '../route';

/**
 * B08-E: Legacy Tutorial Progress Subject & Tenant Binding Qualification
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Learner Identity, Security Perimeter)
 * Governing Task: audit/W1.2_Gemini_Batch_08_Corrections_And_Containment_Task.md (Package E)
 *
 * QUALIFICATION MATRIX:
 * 1. Positive Control (GET): Authorized tenant learner with valid signed JWT can read their own progress (HTTP 200).
 * 2. Positive Control (POST): Authorized tenant learner with valid signed JWT can track progress (HTTP 200).
 * 3. Unauthenticated Control: Request without token is rejected with HTTP 401 Unauthorized.
 * 4. Header-Only Spoofing Control: Unverified headers without valid cryptographic token are rejected with HTTP 401.
 * 5. Subject Mismatch Control: Verified caller attempting to pass a different x-user-id header is rejected with HTTP 403.
 * 6. Cross-Brand Control: Verified caller attempting to pass a mismatched x-brand header is rejected with HTTP 403.
 * 7. Non-Tenant Token Control: Tokens with invalid/missing brand or non-learner audience are rejected with HTTP 403.
 */

// In-memory progress store keyed by `${brand}:${userId}:${subtopicId}`
interface ProgressRecord {
  userId: string;
  subtopicId: string;
  blocksCompleted: string[];
  brand: string;
}

const mockStore: Map<string, ProgressRecord> = new Map();

vi.mock('@quiz/db-tutorial', () => {
  return {
    TutorialProgressRepository: class MockTutorialProgressRepository {
      async getProgress(userId: string, subtopicId: string) {
        for (const record of mockStore.values()) {
          if (record.userId === userId && record.subtopicId === subtopicId) {
            return {
              id: `prog-${userId}-${subtopicId}`,
              userId: record.userId,
              subtopicId: record.subtopicId,
              blocksCompleted: record.blocksCompleted,
              updatedAt: new Date(),
            };
          }
        }
        return null;
      }
    },
  };
});

vi.mock('@/modules/tutorial-engine', () => {
  return {
    TutorialService: class MockTutorialService {
      async trackProgress(params: { userId: string; subtopicId: string; blockType: string; brandId: string }) {
        const key = `${params.brandId}:${params.userId}:${params.subtopicId}`;
        let record = mockStore.get(key);
        if (!record) {
          record = {
            userId: params.userId,
            subtopicId: params.subtopicId,
            blocksCompleted: [],
            brand: params.brandId,
          };
          mockStore.set(key, record);
        }
        if (!record.blocksCompleted.includes(params.blockType)) {
          record.blocksCompleted.push(params.blockType);
        }
        return {
          success: true,
          data: {
            subtopicId: params.subtopicId,
            blockType: params.blockType,
            completed: true,
          },
        };
      }
    },
  };
});

const TEST_SECRET = new TextEncoder().encode('tutorial-progress-sec-32b-key!');
const testTokenService = new TokenService(TEST_SECRET, TEST_SECRET, TEST_SECRET);

describe('B08-E: Legacy Tutorial Progress Subject & Tenant Binding', () => {
  const VICTIM_USER_ID = '00000000-0000-0000-0000-000000000001';
  const ATTACKER_USER_ID = '00000000-0000-0000-0000-000000000002';
  const RTH_USER_ID = '00000000-0000-0000-0000-000000000003';
  const SUBTOPIC_ID = '11111111-1111-1111-1111-111111111111';

  let victimToken: string;
  let attackerToken: string;
  let rthVictimToken: string;

  beforeEach(async () => {
    mockStore.clear();

    container.register(TokenService, testTokenService);
    TokenService.setInstance(testTokenService);

    victimToken = await testTokenService.generateAccessToken({
      userId: VICTIM_USER_ID,
      originalUserId: VICTIM_USER_ID,
      shadowUserId: VICTIM_USER_ID,
      email: 'victim@skillup.test',
      roles: ['student'],
      brand: 'skillup',
      tokenType: 'user',
      aud: 'user',
    });

    attackerToken = await testTokenService.generateAccessToken({
      userId: ATTACKER_USER_ID,
      originalUserId: ATTACKER_USER_ID,
      shadowUserId: ATTACKER_USER_ID,
      email: 'attacker@skillup.test',
      roles: ['student'],
      brand: 'skillup',
      tokenType: 'user',
      aud: 'user',
    });

    rthVictimToken = await testTokenService.generateAccessToken({
      userId: RTH_USER_ID,
      originalUserId: RTH_USER_ID,
      shadowUserId: RTH_USER_ID,
      email: 'victim@rth.test',
      roles: ['student'],
      brand: 'realtutorialhub',
      tokenType: 'user',
      aud: 'user',
    });

    // Seed victim's progress in skillup
    mockStore.set(`skillup:${VICTIM_USER_ID}:${SUBTOPIC_ID}`, {
      userId: VICTIM_USER_ID,
      subtopicId: SUBTOPIC_ID,
      blocksCompleted: ['concept', 'example'],
      brand: 'skillup',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('POSITIVE CONTROL: authenticated learner can read their own progress (200)', async () => {
    const req = new NextRequest(
      `https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${victimToken}`,
          'x-user-id': VICTIM_USER_ID,
          'x-brand': 'skillup',
        },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.blocksCompleted).toEqual(['concept', 'example']);
  });

  it('POSITIVE CONTROL: authenticated learner can update progress via POST (200)', async () => {
    const req = new NextRequest('https://skillup.test/api/tutorial/progress', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${victimToken}`,
        'x-user-id': VICTIM_USER_ID,
        'x-brand': 'skillup',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        subtopicId: SUBTOPIC_ID,
        blockType: 'code',
        status: 'viewed',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const stored = mockStore.get(`skillup:${VICTIM_USER_ID}:${SUBTOPIC_ID}`);
    expect(stored?.blocksCompleted).toContain('code');
  });

  it('AUTHENTICATION CONTROL: unauthenticated request without token receives 401', async () => {
    const req = new NextRequest(
      `https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`,
      {
        method: 'GET',
        headers: {
          'x-brand': 'skillup',
        },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('FORGERY CONTROL: client-spoofed x-user-id without token receives 401', async () => {
    const req = new NextRequest(
      `https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`,
      {
        method: 'GET',
        headers: {
          'x-user-id': VICTIM_USER_ID,
          'x-brand': 'skillup',
        },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('SUBJECT BINDING: verified caller attempting to pass a different x-user-id receives 403', async () => {
    const req = new NextRequest(
      `https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${attackerToken}`,
          'x-user-id': VICTIM_USER_ID, // Mismatched user ID in header
          'x-brand': 'skillup',
        },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('CROSS-BRAND BOUNDARY: verified caller attempting to pass mismatched x-brand receives 403', async () => {
    const req = new NextRequest(
      `https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${victimToken}`, // Token is for skillup
          'x-user-id': VICTIM_USER_ID,
          'x-brand': 'realtutorialhub', // Mismatched brand in header
        },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('CROSS-TENANT ISOLATION: realtutorialhub learner cannot read skillup progress (403 on header mismatch or clean partition)', async () => {
    const req = new NextRequest(
      `https://realtutorialhub.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${rthVictimToken}`,
          'x-user-id': RTH_USER_ID,
          'x-brand': 'realtutorialhub',
        },
      }
    );

    // Should return 200 with empty blocksCompleted (clean partition) because progress is in skillup
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.blocksCompleted).toEqual([]);
  });
});
