import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '../route';

/**
 * B08-E: Legacy Tutorial Progress Subject & Tenant Binding Qualification
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Learner Identity, Security Perimeter)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-E)
 *
 * SCOPE:
 * 1. Positive Control: Legitimate learner context with matching subtopic progress returns 200.
 * 2. Positive Control: POST tracking block progress returns 200 and records to store.
 * 3. Cross-Tenant Brand Isolation: Forged x-brand header routing into foreign brand context.
 * 4. SECURITY INVARIANT (FAILING): Cryptographic User Identity Attestation.
 *    The API route MUST verify that x-user-id is cryptographically bound to a valid session / JWT,
 *    and MUST reject unauthenticated requests or client-spoofed x-user-id headers with HTTP 401.
 *    
 *    REAL SOURCE DEFECT EXPOSED:
 *    apps/api-server/src/app/api/tutorial/progress/route.ts extracts `x-user-id` directly from
 *    raw request headers without validating an Authorization Bearer token or session cookie.
 *    Furthermore, apps/api-server/src/proxy.ts exempts /api/tutorial from gateway token validation
 *    via `isGatewayExemptRoute`.
 *    Consequently, any unauthenticated client can forge `x-user-id: victim-user-id` and read/mutate
 *    another user's tutorial progress.
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

describe('B08-E: Legacy Tutorial Progress Subject & Tenant Binding', () => {
  const VICTIM_USER_ID = '00000000-0000-0000-0000-000000000001';
  const ATTACKER_USER_ID = '00000000-0000-0000-0000-000000000002';
  const SUBTOPIC_ID = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockStore.clear();

    // Seed victim's progress in skillup
    mockStore.set(`skillup:${VICTIM_USER_ID}:${SUBTOPIC_ID}`, {
      userId: VICTIM_USER_ID,
      subtopicId: SUBTOPIC_ID,
      blocksCompleted: ['concept', 'example'],
      brand: 'skillup',
    });
  });

  it('POSITIVE CONTROL: legitimate user can read their own progress', async () => {
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
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.blocksCompleted).toEqual(['concept', 'example']);
  });

  it('POSITIVE CONTROL: legitimate user can update progress via POST', async () => {
    const req = new NextRequest('https://skillup.test/api/tutorial/progress', {
      method: 'POST',
      headers: {
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

  it('MISSING IDENTITY CONTROL: request without x-user-id is rejected with 401', async () => {
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
    const body = await res.json();
    expect(body.error).toBe('User ID required');
  });

  /**
   * SECURITY INVARIANT: Cryptographic User Attestation Required
   *
   * PRECONDITION: An attacker without valid session credentials sends a forged x-user-id.
   * EXPECTED CONTRACT (audit/FinalAechitecture.md): The route MUST reject forged or unverified
   * identity headers with HTTP 401 Unauthorized unless verified against a valid cryptographic JWT.
   *
   * REAL SOURCE DEFECT REPRODUCTION:
   * route.ts trusts request.headers.get('x-user-id') directly, and proxy.ts exempts /api/tutorial.
   * Therefore, an unauthenticated attacker successfully reads the victim's private progress!
   *
   * In accordance with B08-E instructions:
   * "If authenticated header reconstruction is missing, retain the failing security assertion
   *  and document the exact exploit preconditions and bounded fix scope. No runtime fix is authorized."
   */
  it('SECURITY INVARIANT (DEFECT EXPOSED): unauthenticated request with forged x-user-id must NOT access victim progress', async () => {
    // Attacker crafts an unauthenticated request with victim's user ID in x-user-id header,
    // without supplying any Authorization token or verified cookie.
    const attackerReq = new NextRequest(
      `https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`,
      {
        method: 'GET',
        headers: {
          'x-user-id': VICTIM_USER_ID, // FORGED IDENTITY
          'x-brand': 'skillup',
          // NO Authorization header!
          // NO cookie!
        },
      }
    );

    const res = await GET(attackerReq);

    // SECURITY REQUIREMENT: Must be rejected with 401 Unauthorized because the caller has not
    // proven possession of the private key / JWT session for VICTIM_USER_ID.
    // Under the unfixed route.ts, this returns 200, exposing the victim's data to the attacker.
    expect(res.status).toBe(401);
  });
});
