import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

interface LearnerTarget {
  id: 'suia' | 'rth';
  label: string;
  brand: 'skillup' | 'realtutorialhub';
  baseUrl: string;
}

const targets: LearnerTarget[] = [
  {
    id: 'suia',
    label: 'SUIA',
    brand: 'skillup',
    baseUrl: (process.env.SKILLUP_URL ?? 'http://skillup.localhost:3009').replace(/\/+$/, ''),
  },
  {
    id: 'rth',
    label: 'RTH',
    brand: 'realtutorialhub',
    baseUrl: (process.env.RTH_URL ?? 'http://realtutorialhub.localhost:3003').replace(/\/+$/, ''),
  },
];

const screenshots = path.join(process.cwd(), '.evidence', 'screenshots', 'v5-20261112');
const canaryName = 'V5 Synthetic Learner';
const canaryEmail = 'v5-learner-fixture@example.invalid';
const canaryPassword = 'v5-never-valid-password-canary';
const diagnosticCanary = 'private-diagnostic-canary-v5';

test.use({ viewport: { width: 1440, height: 900 } });
test.setTimeout(180000);

function observeCredentialAndDiagnosticExposure(page: Page) {
  const failures: string[] = [];
  const hasSensitiveCanary = (value: string) =>
    [canaryEmail, canaryPassword, diagnosticCanary].some((canary) =>
      [canary, encodeURIComponent(canary)].some((candidate) => value.includes(candidate)),
    );

  page.on('request', (request) => {
    const url = new URL(request.url());
    const referrer = request.headers().referer ?? '';
    if (
      url.searchParams.has('password') ||
      url.searchParams.has('email') ||
      url.searchParams.has('name')
    ) {
      failures.push(`credential query parameter in ${url.pathname}`);
    }
    if ([url.href, referrer].some(hasSensitiveCanary)) {
      failures.push(`canary in request URL or referrer (${url.pathname})`);
    }
  });

  page.on('console', (message) => {
    if (hasSensitiveCanary(message.text())) {
      failures.push(`canary in browser console: ${message.type()}`);
    }
  });

  page.on('pageerror', (error) => {
    if (hasSensitiveCanary(error.message)) {
      failures.push('canary in browser pageerror');
    }
  });

  page.on('framenavigated', (frame) => {
    if (hasSensitiveCanary(frame.url())) {
      failures.push('canary in frame navigation URL');
    }
  });

  return failures;
}

for (const target of targets) {
  test.describe(`${target.label} (${target.brand}) shared learner auth security`, () => {
    test(`${target.label}: blocks login without JavaScript and declares safe native POST /login`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      const exposure = observeCredentialAndDiagnosticExposure(page);
      let postLoadRequests = 0;

      try {
        await page.goto(`${target.baseUrl}/login`, {
          waitUntil: 'load',
          timeout: 180000,
        });

        await expect(page.locator('form')).toBeVisible();
        await expect(page.locator('form')).toHaveAttribute('method', /post/i);
        await expect(page.locator('form')).toHaveAttribute('action', '/login');
        await expect(page.locator('#email')).toBeDisabled();
        await expect(page.locator('#password')).toBeDisabled();
        await expect(page.locator('button[type="submit"]')).toBeDisabled();

        page.on('request', (request) => {
          if (request.isNavigationRequest() || request.method() !== 'GET') {
            postLoadRequests += 1;
          }
        });
        await page.keyboard.press('Enter');
        expect(postLoadRequests).toBe(0);

        fs.mkdirSync(screenshots, { recursive: true });
        await page.screenshot({
          path: path.join(screenshots, `${target.id}-login-no-js.png`),
          fullPage: true,
        });
        expect(exposure).toEqual([]);
      } finally {
        await context.close();
      }
    });

    test(`${target.label}: keeps login controls disabled while hydration scripts are delayed`, async ({
      page,
    }) => {
      const exposure = observeCredentialAndDiagnosticExposure(page);
      let releaseScripts!: () => void;
      const scriptsReady = new Promise<void>((resolve) => {
        releaseScripts = resolve;
      });
      let delayedScripts = 0;

      await page.route('**/*', async (route) => {
        if (route.request().resourceType() === 'script') {
          delayedScripts += 1;
          await scriptsReady;
        }
        await route.continue();
      });

      try {
        await page.goto(`${target.baseUrl}/login`, { waitUntil: 'commit', timeout: 180000 });
        await expect(page.locator('form')).toBeVisible();
        await expect(page.locator('#email')).toBeDisabled();
        await expect(page.locator('#password')).toBeDisabled();
        await expect(page.locator('button[type="submit"]')).toBeDisabled();
        await expect.poll(() => delayedScripts).toBeGreaterThan(0);

        await page.keyboard.press('Enter');
        expect(new URL(page.url()).pathname).toBe('/login');

        fs.mkdirSync(screenshots, { recursive: true });
        await page.screenshot({
          path: path.join(screenshots, `${target.id}-login-before-hydration.png`),
          fullPage: true,
        });
      } finally {
        releaseScripts();
      }

      await expect(page.locator('#email')).toBeEnabled({ timeout: 60000 });
      await expect(page.locator('#password')).toBeEnabled();
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
      expect(exposure).toEqual([]);
    });

    test(`${target.label}: forced native login submission is a body-only POST to /login`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      const exposure = observeCredentialAndDiagnosticExposure(page);
      let nativeSubmissions = 0;

      await page.route('**/login', async (route) => {
        if (route.request().method() === 'GET') {
          await route.continue();
          return;
        }
        nativeSubmissions += 1;
        expect(route.request().method()).toBe('POST');
        expect(new URL(route.request().url()).search).toBe('');
        const body = new URLSearchParams(route.request().postData() ?? '');
        expect(body.get('email')).toBe(canaryEmail);
        expect(body.get('password')).toBe(canaryPassword);
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<p>Intercepted synthetic native login POST</p>',
        });
      });

      try {
        await page.goto(`${target.baseUrl}/login`, {
          waitUntil: 'domcontentloaded',
          timeout: 180000,
        });
        await expect(page.locator('#password')).toBeDisabled();

        const posted = page.waitForRequest(
          (request) =>
            request.method() === 'POST' && new URL(request.url()).pathname === '/login',
        );

        await page.evaluate(
          ({ email, password }) => {
            const emailInput = document.querySelector<HTMLInputElement>('#email')!;
            const passwordInput = document.querySelector<HTMLInputElement>('#password')!;
            emailInput.disabled = false;
            passwordInput.disabled = false;
            emailInput.value = email;
            passwordInput.value = password;
            document.querySelector<HTMLFormElement>('form')!.requestSubmit();
          },
          { email: canaryEmail, password: canaryPassword },
        );

        await posted;
        await expect(page.getByText('Intercepted synthetic native login POST')).toBeVisible();
        expect(nativeSubmissions).toBe(1);
        expect(exposure).toEqual([]);
      } finally {
        await context.close();
      }
    });

    for (const submission of ['click', 'Enter'] as const) {
      test(`${target.label}: hydrated ${submission} sends one JSON POST /api/auth/login with brand=${target.brand} and honors sanitized redirect`, async ({
        page,
      }) => {
        const exposure = observeCredentialAndDiagnosticExposure(page);
        let loginSubmissions = 0;

        await page.route('**/api/auth/login', async (route) => {
          loginSubmissions += 1;
          expect(route.request().method()).toBe('POST');
          expect(route.request().postDataJSON()).toEqual({
            email: canaryEmail,
            password: canaryPassword,
            platform: target.brand,
          });
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'synthetic-learner-id',
                email: canaryEmail,
                onboardingCompleted: true,
                roles: ['student'],
              },
            }),
          });
        });

        await page.route('**/api/profile', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'synthetic-learner-id',
              email: canaryEmail,
              onboardingCompleted: true,
              roles: ['student'],
            }),
          });
        });

        await page.route('**/dashboard**', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<main>Synthetic Dashboard Destination</main>',
          });
        });

        await page.goto(
          `${target.baseUrl}/login?redirect=${encodeURIComponent('/dashboard?tab=active#today')}`,
          { waitUntil: 'networkidle', timeout: 180000 },
        );
        await expect(page.locator('#email')).toBeEnabled();
        await page.locator('#email').fill(canaryEmail);
        await page.locator('#password').fill(canaryPassword);

        const redirectRequest = page.waitForRequest((request) => {
          const parsed = new URL(request.url());
          return parsed.pathname === '/dashboard' && parsed.search === '?tab=active';
        });

        if (submission === 'click') {
          await page.locator('button[type="submit"]').click();
        } else {
          await page.locator('#password').press('Enter');
        }

        await redirectRequest;
        await expect(page.getByText('Synthetic Dashboard Destination')).toBeVisible();
        expect(loginSubmissions).toBe(1);
        expect(exposure).toEqual([]);
      });
    }

    test(`${target.label}: rejects external, protocol-relative, backslash, and auth-loop redirects to /dashboard`, async ({
      page,
    }) => {
      const exposure = observeCredentialAndDiagnosticExposure(page);
      const unsafeRedirects = [
        'https://evil.example/phish',
        '//evil.example/phish',
        '/\\evil.example',
        '/login',
        '/signup',
        '/%2f/evil.example',
      ];

      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'synthetic-learner-id',
              email: canaryEmail,
              onboardingCompleted: true,
              roles: ['student'],
            },
          }),
        });
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'synthetic-learner-id',
            email: canaryEmail,
            onboardingCompleted: true,
            roles: ['student'],
          }),
        });
      });

      await page.route('**/dashboard', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<main>Safe Fallback Dashboard</main>',
        });
      });

      for (const unsafe of unsafeRedirects) {
        await page.goto(`${target.baseUrl}/login?redirect=${encodeURIComponent(unsafe)}`, {
          waitUntil: 'networkidle',
          timeout: 180000,
        });
        await expect(page.locator('#email')).toBeEnabled();
        await page.locator('#email').fill(canaryEmail);
        await page.locator('#password').fill(canaryPassword);

        const safeNav = page.waitForRequest(
          (req) =>
            new URL(req.url()).origin === new URL(target.baseUrl).origin &&
            new URL(req.url()).pathname === '/dashboard',
        );
        await page.locator('button[type="submit"]').click();
        await safeNav;
        await expect(page.getByText('Safe Fallback Dashboard')).toBeVisible();
      }

      expect(exposure).toEqual([]);
    });

    test(`${target.label}: hides upstream diagnostic strings on 500 and 401 login failures`, async ({
      page,
    }) => {
      const exposure = observeCredentialAndDiagnosticExposure(page);
      let nextStatus = 500;

      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: nextStatus,
          contentType: 'application/json',
          body: JSON.stringify({
            error: diagnosticCanary,
            message: diagnosticCanary,
            _error: diagnosticCanary,
          }),
        });
      });

      await page.goto(`${target.baseUrl}/login`, { waitUntil: 'networkidle', timeout: 180000 });
      await expect(page.locator('#email')).toBeEnabled();
      await page.locator('#email').fill(canaryEmail);
      await page.locator('#password').fill(canaryPassword);
      await page.locator('button[type="submit"]').click();

      await expect(
        page.getByText('Authentication service is temporarily unavailable.'),
      ).toBeVisible();
      await expect(page.getByText(diagnosticCanary)).toHaveCount(0);

      nextStatus = 401;
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText('Invalid email or password.')).toBeVisible();
      await expect(page.getByText(diagnosticCanary)).toHaveCount(0);

      await page.locator('#email').clear();
      await page.locator('#password').clear();
      fs.mkdirSync(screenshots, { recursive: true });
      await page.screenshot({
        path: path.join(screenshots, `${target.id}-safe-login-error.png`),
        fullPage: true,
      });
      expect(exposure).toEqual([]);
    });

    test(`${target.label}: signup enforces SSR disabled controls, safe native POST /signup, and single hydrated POST /api/auth/signup`, async ({
      browser,
      page,
    }) => {
      // 1. JS-disabled SSR check + forced native POST interception on /signup
      const noJsContext = await browser.newContext({ javaScriptEnabled: false });
      const noJsPage = await noJsContext.newPage();
      const noJsExposure = observeCredentialAndDiagnosticExposure(noJsPage);
      let nativeSignupPosts = 0;

      await noJsPage.route('**/signup', async (route) => {
        if (route.request().method() === 'GET') {
          await route.continue();
          return;
        }
        nativeSignupPosts += 1;
        expect(route.request().method()).toBe('POST');
        expect(new URL(route.request().url()).search).toBe('');
        const body = new URLSearchParams(route.request().postData() ?? '');
        expect(body.get('name')).toBe(canaryName);
        expect(body.get('email')).toBe(canaryEmail);
        expect(body.get('password')).toBe(canaryPassword);
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<p>Intercepted synthetic native signup POST</p>',
        });
      });

      try {
        await noJsPage.goto(`${target.baseUrl}/signup`, {
          waitUntil: 'domcontentloaded',
          timeout: 180000,
        });
        await expect(noJsPage.locator('form')).toHaveAttribute('method', /post/i);
        await expect(noJsPage.locator('form')).toHaveAttribute('action', '/signup');
        await expect(noJsPage.locator('#full-name')).toBeDisabled();
        await expect(noJsPage.locator('#email')).toBeDisabled();
        await expect(noJsPage.locator('#password')).toBeDisabled();
        await expect(noJsPage.locator('button[type="submit"]')).toBeDisabled();

        const posted = noJsPage.waitForRequest(
          (req) => req.method() === 'POST' && new URL(req.url()).pathname === '/signup',
        );
        await noJsPage.evaluate(
          ({ name, email, password }) => {
            const nameInput = document.querySelector<HTMLInputElement>('#full-name')!;
            const emailInput = document.querySelector<HTMLInputElement>('#email')!;
            const passwordInput = document.querySelector<HTMLInputElement>('#password')!;
            nameInput.disabled = false;
            emailInput.disabled = false;
            passwordInput.disabled = false;
            nameInput.value = name;
            emailInput.value = email;
            passwordInput.value = password;
            document.querySelector<HTMLFormElement>('form')!.requestSubmit();
          },
          { name: canaryName, email: canaryEmail, password: canaryPassword },
        );
        await posted;
        await expect(noJsPage.getByText('Intercepted synthetic native signup POST')).toBeVisible();
        expect(nativeSignupPosts).toBe(1);
        expect(noJsExposure).toEqual([]);
      } finally {
        await noJsContext.close();
      }

      // 2. Hydrated signup submission + synchronous double-submit lock
      const exposure = observeCredentialAndDiagnosticExposure(page);
      let signupCalls = 0;

      await page.route('**/api/auth/signup', async (route) => {
        signupCalls += 1;
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toEqual({
          name: canaryName,
          email: canaryEmail,
          password: canaryPassword,
          platform: target.brand,
        });
        await new Promise((resolve) => setTimeout(resolve, 150));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'synthetic-new-learner',
              email: canaryEmail,
              onboardingCompleted: false,
              roles: ['student'],
            },
          }),
        });
      });

      await page.route('**/api/profile', async (route) => {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      });

      await page.route('**/onboarding', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<main>Synthetic Onboarding Flow</main>',
        });
      });

      await page.goto(`${target.baseUrl}/signup`, { waitUntil: 'networkidle', timeout: 180000 });
      await expect(page.locator('#full-name')).toBeEnabled();
      await page.locator('#full-name').fill(canaryName);
      await page.locator('#email').fill(canaryEmail);
      await page.locator('#password').fill(canaryPassword);

      const onboardingNav = page.waitForRequest(
        (req) => new URL(req.url()).pathname === '/onboarding',
      );

      // Dispatch two rapid submit events to verify synchronous submittingRef lock
      await page.evaluate(() => {
        const form = document.querySelector<HTMLFormElement>('form')!;
        form.requestSubmit();
        form.requestSubmit();
      });

      await onboardingNav;
      await expect(page.getByText('Synthetic Onboarding Flow')).toBeVisible();
      expect(signupCalls).toBe(1);
      expect(exposure).toEqual([]);
    });
  });
}

test.describe('RTH /learn route retirement and canonical route preservation', () => {
  const rthBaseUrl = (process.env.RTH_URL ?? 'http://realtutorialhub.localhost:3003').replace(/\/+$/, '');
  const suiaBaseUrl = (process.env.SKILLUP_URL ?? 'http://skillup.localhost:3009').replace(/\/+$/, '');

  test('RTH: keeps /start-learning and /tutorial reachable and returns 404 for all retired /learn URLs', async ({
    request,
  }) => {
    const startLearningRes = await request.get(`${rthBaseUrl}/start-learning`, {
      maxRedirects: 0,
    });
    expect(startLearningRes.status()).toBe(200);

    const tutorialRes = await request.get(`${rthBaseUrl}/tutorial`, {
      maxRedirects: 0,
    });
    expect(tutorialRes.status()).toBe(200);

    const retiredPaths = [
      '/learn',
      '/learn/remediation',
      '/learn/full-stack/javascript/async-programming/promises',
      '/learn/full-stack/javascript/async-programming/promises/notes',
      '/learn/full-stack/javascript/async-programming/promises/assignments',
    ];

    for (const retiredPath of retiredPaths) {
      const response = await request.get(`${rthBaseUrl}${retiredPath}`, {
        maxRedirects: 0,
      });
      expect(response.status(), `Expected 404 for retired RTH path ${retiredPath}`).toBe(404);
    }

    // Preserved re-homed routes are protected by learner auth (307 to /login when unauthenticated, never 404/500)
    const remediationRes = await request.get(`${rthBaseUrl}/remediation`, {
      maxRedirects: 0,
    });
    expect(remediationRes.status()).toBe(307);
    expect(remediationRes.headers()['location']).toContain('/login?redirect=%2Fremediation');

    const assignmentsRes = await request.get(
      `${rthBaseUrl}/tutorial/assignments/full-stack/javascript/async-programming/promises`,
      { maxRedirects: 0 },
    );
    expect(assignmentsRes.status()).toBe(307);
    expect(assignmentsRes.headers()['location']).toContain(
      '/login?redirect=%2Ftutorial%2Fassignments%2Ffull-stack%2Fjavascript%2Fasync-programming%2Fpromises',
    );

    const rthTutorialV2Res = await request.get(
      `${rthBaseUrl}/tutorial-v2/full-stack/javascript/async-programming/promises/node-1`,
      { maxRedirects: 0 },
    );
    expect(rthTutorialV2Res.status()).toBe(307);
    expect(rthTutorialV2Res.headers()['location']).toContain('/login?redirect=%2Ftutorial-v2%2F');

    const suiaTutorialV2Res = await request.get(
      `${suiaBaseUrl}/tutorial-v2/full-stack/javascript/async-programming/promises/node-1`,
      { maxRedirects: 0 },
    );
    expect(suiaTutorialV2Res.status()).toBe(307);
    expect(suiaTutorialV2Res.headers()['location']).toContain('/login?redirect=%2Ftutorial-v2%2F');
  });
});
