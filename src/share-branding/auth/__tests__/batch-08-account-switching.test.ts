import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCurrentUserState, loginUser, logoutUser } from '../authLoader';
import * as validateModule from '../validateAuthState';

/**
 * B08-H: Account-Switching & State Boundary (Transport Wrapper Controls)
 *
 * Governing Architecture: audit/FinalAechitecture.md (Client State Lifecycle, Tenant Identity)
 * Governing Task: audit/W1.2_Gemini_Batch_08_Corrections_And_Containment_Task.md (Package H)
 *
 * STATUS & QUALIFICATION DISCLOSURE:
 * -----------------------------------
 * This test file exercises transport-level client wrappers (`authLoader`, `validateAuthState` mock).
 *
 * LIVE BROWSER DOM/CACHE EVICTION QUALIFICATION: [NOT EXECUTED]
 *
 * Reason:
 * As identified in Sol's independent review (audit/W1.2_Batch_08_Sol_Review_cabe42ef.md),
 * unit mocks using MockClientContext in mocked unifiedFetch do NOT exercise actual browser DOM,
 * storage boundaries, or production state consumers.
 * Real qualification requires live browser / Playwright harness fixtures currently not mounted:
 * 1. Live browser runtime (Chromium headless context).
 * 2. Mounted React component tree with actual production state consumers (e.g., AuthProvider, SWR/React Query caches).
 * 3. Browser-enforced storage barriers (localStorage, sessionStorage, IndexedDB, CacheStorage).
 * 4. Browser cookie jar enforcing HttpOnly / SameSite lifecycle across page navigations.
 *
 * The separate jsdom test below executes a real consumer with mocked auth/transport; it
 * does not substitute for browser-enforced cookies or the full production login journey.
 *
 * SCOPE EXERCISED HERE (BOUNDARY WRAPPER CONTROLS):
 * 1. Sequential Account Switching: User A login/read -> User A logout -> User B login/read in transport wrapper.
 * 2. Transport Invariant: User A's private markers and profile state do not linger in wrapper session.
 * 3. Race condition wrapper: an unobserved delayed promise is a wrapper-only control.
 */

// Simulated client cookie jar and storage boundary for transport wrapper checks
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

describe('B08-H: Account-Switching & State Boundary (Transport Wrapper Controls)', () => {
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

  it('1. WRAPPER CONTROL: User A login establishes User A client state and private markers in transport wrapper', async () => {
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

  it('2. WRAPPER CONTROL: Logout clears User A state; subsequent state fetch returns unauthenticated in transport wrapper', async () => {
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

  it('3. WRAPPER CONTROL: Account switching (A -> Logout -> B) in transport wrapper replaces A with zero private residue', async () => {
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

    // INVARIANT: Zero User A private markers remain in wrapper client state
    expect(clientContext.currentUser?.id).not.toBe('user-a-uuid-101');
    expect(clientContext.currentUser?.name).not.toContain('Alice');
    expect(clientContext.cookies.get('accessToken')).toBe('mock-user-b-access-token');
  });

  it('4. WRAPPER CONTROL: Delayed out-of-order User A response race: User B session remains authoritative', async () => {
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

    // Verify active session remains strictly User B in transport wrapper
    const activeState = await fetchCurrentUserState();
    expect(clientContext.currentUser?.id).toBe('user-b-uuid-202');
    expect(activeState.onboardingCompleted).toBe(false);
  });
});

describe.skipIf(typeof document === 'undefined')('B08-T18 mounted learner state consumer', () => {
  beforeEach(() => {
    clientContext.reset();
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('does not commit delayed learner A progress after logout and learner B login', async () => {
    const React = await import('react');
    const { render, waitFor, cleanup, act } = await import('@testing-library/react');
    const { useQueryClient } = await import('@tanstack/react-query');
    const { QueryProvider } = await import('../../../../apps/realtutorialhub-web/src/components/providers/QueryProvider');
    const { LearnerProgressPanel } = await import('../../../../apps/realtutorialhub-web/src/components/content/LearnerProgressPanel');
    const id = '11111111-1111-4111-8111-111111111111';
    let release!: (response: Response) => void;
    const delayed = new Promise<Response>((resolve) => { release = resolve; });
    let queryClient: ReturnType<typeof useQueryClient> | undefined;
    function CaptureClient() { queryClient = useQueryClient(); return null; }
    class Observer { observe() {} unobserve() {} disconnect() {} }
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/tutorial/progress')) return delayed;
      if (url.startsWith('/api/tutorial/assignments/')) return Response.json({ data: {
        locked: true, assignments: [], tierStatus: {
          simple: {status:'not_started', isUnlocked:false}, mixed: {status:'not_started', isUnlocked:false},
          intermediate: {status:'not_started', isUnlocked:false}, expert: {status:'not_started', isUnlocked:false},
        },
      } });
      throw new Error('Unexpected outbound transport');
    }));
    try {
      await loginUser({ email: 'user-a@skillup.test', password: 'disposable', brand: 'skillup' });
      render(React.createElement(QueryProvider, null, React.createElement(React.Fragment, null,
        React.createElement(CaptureClient), React.createElement(LearnerProgressPanel, {
          subtopicId: id, subtopicName: 'Fixture', theme: { sidebarAccent: '#123456' } as never, blockOrder: ['notes'],
        }))));
      await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/tutorial/progress'), expect.anything()));
      await logoutUser();
      await loginUser({ email: 'user-b@skillup.test', password: 'disposable', brand: 'skillup' });
      expect(clientContext.currentUser?.id).toBe('user-b-uuid-202');
      await act(async () => {
        release(Response.json({ data: { blocksViewed: ['notes'], completionPercent: 100, assignmentUnlocked: true } }));
        await delayed;
      });
      const key = `tutorial-progress:${id}`;
      await waitFor(() => expect(queryClient?.getQueryState(['tutorial-progress', id])?.status).toBe('success'));
      await act(async () => {});
      expect(window.localStorage.getItem(key)).not.toContain('notes');
    } finally {
      cleanup();
    }
  });

  it('keeps B progress when A resolves after teardown and remount', async () => {
    const React = await import('react');
    const { render, waitFor, cleanup, act } = await import('@testing-library/react');
    const { QueryProvider } = await import('../../../../apps/realtutorialhub-web/src/components/providers/QueryProvider');
    const { LearnerProgressPanel } = await import('../../../../apps/realtutorialhub-web/src/components/content/LearnerProgressPanel');
    const id = '11111111-1111-4111-8111-111111111111';
    let release!: (response: Response) => void;
    const delayed = new Promise<Response>((resolve) => { release = resolve; });
    class Observer { observe() {} unobserve() {} disconnect() {} }
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/tutorial/progress')) {
        if (clientContext.currentUser?.id === 'user-a-uuid-101') return delayed;
        return Response.json({ data: { blocksViewed: ['code'], completionPercent: 50, assignmentUnlocked: false } });
      }
      if (url.startsWith('/api/tutorial/assignments/')) return Response.json({ data: {
        locked: true, assignments: [], tierStatus: {
          simple: {status:'not_started', isUnlocked:false}, mixed: {status:'not_started', isUnlocked:false},
          intermediate: {status:'not_started', isUnlocked:false}, expert: {status:'not_started', isUnlocked:false},
        },
      } });
      throw new Error('Unexpected outbound transport');
    }));
    const mount = () => render(React.createElement(QueryProvider, null, React.createElement(LearnerProgressPanel, {
      subtopicId: id, subtopicName: 'Fixture', theme: { sidebarAccent: '#123456' } as never, blockOrder: ['notes', 'code'],
    })));
    try {
      await loginUser({ email: 'user-a@skillup.test', password: 'disposable', brand: 'skillup' });
      const first = mount();
      await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/tutorial/progress'), expect.anything()));
      await logoutUser();
      first.unmount(); // Represents the TopBar's full navigation; jsdom does not navigate.
      await loginUser({ email: 'user-b@skillup.test', password: 'disposable', brand: 'skillup' });
      mount();
      const key = `tutorial-progress:${id}`;
      await waitFor(() => expect(window.localStorage.getItem(key)).toContain('code'));
      await act(async () => {
        release(Response.json({ data: { blocksViewed: ['notes'], completionPercent: 50, assignmentUnlocked: false } }));
        await delayed;
      });
      expect(window.localStorage.getItem(key)).toContain('code');
      expect(window.localStorage.getItem(key)).not.toContain('notes');
    } finally {
      cleanup();
    }
  });
});
