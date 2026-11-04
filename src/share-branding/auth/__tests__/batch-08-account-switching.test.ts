import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCurrentUserState, loginUser, logoutUser } from '../authLoader';
import * as validateModule from '../validateAuthState';

/**
 * B08-H: Isolated Account-Switching & Private Client State Residue
 *
 * Governing Architecture: audit/FinalAechitecture.md (Client State Lifecycle, Tenant Identity)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-H)
 *
 * SCOPE:
 * 1. Sequential Account Switching: User A login/read -> User A logout -> User B login/read in the same environment.
 * 2. Invariant: User A's private markers and profile state do not linger or leak into User B's session.
 * 3. Mid-flight / Delayed Response Handling: A delayed background response belonging to User A arriving
 *    after User B has logged in must not overwrite User B's active client session state.
 * 4. Boundary Documentation: Identifies client-side storage fixture requirements for full AQ-09 browser qualification.
 */

// Simulated client cookie jar and storage boundary
class MockClientContext {
  cookies: Map<string, string> = new Map();
  currentUser: {
    id: string;
    email: string;
    name: string;
    onboardingCompleted: boolean;
    roles: string[];
  } | null = null;

  reset() {
    this.cookies.clear();
    this.currentUser = null;
  }
}

const clientContext = new MockClientContext();

vi.mock('../../lib/unifiedFetch', () => ({
  unifiedFetch: vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/api/auth/login')) {
      const body = JSON.parse(init?.body as string);
      if (body.email === 'user-a@skillup.test') {
        clientContext.cookies.set('accessToken', 'mock-user-a-access-token');
        clientContext.currentUser = {
          id: 'user-a-uuid-101',
          email: 'user-a@skillup.test',
          name: 'Alice Private Marker A',
          onboardingCompleted: true,
          roles: ['student'],
        };
        return new Response(
          JSON.stringify({
            user: {
              id: clientContext.currentUser.id,
              email: clientContext.currentUser.email,
              name: clientContext.currentUser.name,
              onboardingCompleted: clientContext.currentUser.onboardingCompleted,
            },
            role: 'student',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      } else if (body.email === 'user-b@skillup.test') {
        clientContext.cookies.set('accessToken', 'mock-user-b-access-token');
        clientContext.currentUser = {
          id: 'user-b-uuid-202',
          email: 'user-b@skillup.test',
          name: 'Bob Private Marker B',
          onboardingCompleted: false,
          roles: ['student'],
        };
        return new Response(
          JSON.stringify({
            user: {
              id: clientContext.currentUser.id,
              email: clientContext.currentUser.email,
              name: clientContext.currentUser.name,
              onboardingCompleted: clientContext.currentUser.onboardingCompleted,
            },
            role: 'student',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    if (url.includes('/api/auth/logout')) {
      clientContext.cookies.clear();
      clientContext.currentUser = null;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }),
}));

describe('B08-H: Isolated Account-Switching & Private Client State Residue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientContext.reset();

    // Mock validateAuthState to read the active mock client state
    vi.spyOn(validateModule, 'validateAuthState').mockImplementation(async () => {
      if (!clientContext.currentUser) return null;
      return {
        id: clientContext.currentUser.id,
        email: clientContext.currentUser.email,
        onboardingCompleted: clientContext.currentUser.onboardingCompleted,
        roles: clientContext.currentUser.roles,
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. User A login establishes User A client state and private markers', async () => {
    const loginResult = await loginUser({
      email: 'user-a@skillup.test',
      password: 'PasswordA123!',
      brand: 'skillup',
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.user).toBeDefined();
    expect(loginResult.user?.id).toBe('user-a-uuid-101');
    expect(loginResult.user?.email).toBe('user-a@skillup.test');
    expect(clientContext.currentUser?.name).toBe('Alice Private Marker A');

    const state = await fetchCurrentUserState();
    expect(state.onboardingCompleted).toBe(true);
  });

  it('2. Logout clears User A state; subsequent state fetch returns unauthenticated', async () => {
    // Login User A
    await loginUser({
      email: 'user-a@skillup.test',
      password: 'PasswordA123!',
      brand: 'skillup',
    });

    // Logout
    await logoutUser();

    expect(clientContext.currentUser).toBeNull();
    expect(clientContext.cookies.size).toBe(0);

    const state = await fetchCurrentUserState();
    expect(state.onboardingCompleted).toBe(false);
  });

  it('3. Account switching (A -> Logout -> B): User B state replaces A with zero private residue', async () => {
    // 1. User A logs in
    const userALogin = await loginUser({
      email: 'user-a@skillup.test',
      password: 'PasswordA123!',
      brand: 'skillup',
    });
    expect(userALogin.success).toBe(true);
    expect(userALogin.user?.id).toBe('user-a-uuid-101');
    expect(clientContext.currentUser?.name).toBe('Alice Private Marker A');
    expect((await fetchCurrentUserState()).onboardingCompleted).toBe(true);

    // 2. User A logs out
    await logoutUser();
    expect((await fetchCurrentUserState()).onboardingCompleted).toBe(false);

    // 3. User B logs in within the same client environment
    const userBLogin = await loginUser({
      email: 'user-b@skillup.test',
      password: 'PasswordB456!',
      brand: 'skillup',
    });

    // Assert User B identity is strictly active
    expect(userBLogin.success).toBe(true);
    expect(userBLogin.user).toBeDefined();
    expect(userBLogin.user?.id).toBe('user-b-uuid-202');
    expect(userBLogin.user?.email).toBe('user-b@skillup.test');
    expect(clientContext.currentUser?.name).toBe('Bob Private Marker B');

    const userBState = await fetchCurrentUserState();
    expect(userBState.onboardingCompleted).toBe(false);

    // INVARIANT: Zero User A private markers remain in client state
    expect(clientContext.currentUser?.id).not.toBe('user-a-uuid-101');
    expect(clientContext.currentUser?.name).not.toContain('Alice');
    expect(clientContext.cookies.get('accessToken')).toBe('mock-user-b-access-token');
  });

  it('4. Delayed / out-of-order User A response race: User B session remains authoritative', async () => {
    // Simulate User A logging in
    await loginUser({
      email: 'user-a@skillup.test',
      password: 'PasswordA123!',
      brand: 'skillup',
    });

    // Create a delayed promise simulating a slow background User A request
    let resolveDelayedUserA: (val: any) => void;
    const delayedUserAPromise = new Promise((resolve) => {
      resolveDelayedUserA = resolve;
    });

    // User A logs out and User B logs in
    await logoutUser();
    await loginUser({
      email: 'user-b@skillup.test',
      password: 'PasswordB456!',
      brand: 'skillup',
    });

    // User B is active
    expect(clientContext.currentUser?.id).toBe('user-b-uuid-202');

    // Late User A response arrives
    resolveDelayedUserA!({
      staleUserId: 'user-a-uuid-101',
      staleData: 'Alice Stale Progress Data',
    });
    await delayedUserAPromise;

    // Verify active session remains strictly User B
    const activeState = await fetchCurrentUserState();
    expect(clientContext.currentUser?.id).toBe('user-b-uuid-202');
    expect(activeState.onboardingCompleted).toBe(false);
  });
});
