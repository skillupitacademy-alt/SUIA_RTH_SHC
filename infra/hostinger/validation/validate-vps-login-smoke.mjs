import { chromium } from "playwright";

const VPS_IP = process.env.HOSTINGER_VPS_IP || "72.61.115.49";

const checks = [
  {
    name: "RealTutorialHub user",
    homeUrl: "https://user.realtutorialhub.com/",
    loginUrl: "https://user.realtutorialhub.com/login",
    username: process.env.RTH_USER_EMAIL,
    password: process.env.RTH_USER_PASSWORD,
  },
  {
    name: "SkillUp user",
    homeUrl: "https://user.skillupitacademy.com/",
    loginUrl: "https://user.skillupitacademy.com/login",
    username: process.env.SKILLUP_USER_EMAIL,
    password: process.env.SKILLUP_USER_PASSWORD,
  },
  {
    name: "SkillHub admin",
    homeUrl: "https://admin.skillhubcore.in/login",
    loginUrl: "https://admin.skillhubcore.in/login",
    username: process.env.SKILLHUB_ADMIN_EMAIL,
    password: process.env.SKILLHUB_ADMIN_PASSWORD,
  },
];

const missing = checks.flatMap((check) => {
  const missingForCheck = [];
  if (!check.username) missingForCheck.push(`${check.name} username`);
  if (!check.password) missingForCheck.push(`${check.name} password`);
  return missingForCheck;
});

if (missing.length > 0) {
  console.error(`Missing required credentials: ${missing.join(", ")}`);
  process.exit(2);
}

const hostResolverRules = [
  "MAP user.realtutorialhub.com " + VPS_IP,
  "MAP user.skillupitacademy.com " + VPS_IP,
  "MAP admin.skillhubcore.in " + VPS_IP,
].join(",");

const browser = await chromium.launch({
  headless: true,
  args: [`--host-resolver-rules=${hostResolverRules}`],
});

async function fillLoginForm(page, username, password) {
  const emailInput = page
    .locator(
      'input[type="email"], input[name*="email" i], input[id*="email" i], input[autocomplete="username"], input[type="text"]',
    )
    .first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await passwordInput.waitFor({ state: "visible", timeout: 15000 });

  await emailInput.fill(username);
  await passwordInput.fill(password);

  const submit = page
    .locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")')
    .first();

  await Promise.allSettled([
    page.waitForURL((url) => !url.pathname.toLowerCase().includes("/login"), { timeout: 20000 }),
    page.waitForLoadState("networkidle", { timeout: 20000 }),
    submit.click(),
  ]);
}

async function runCheck(check) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  const homeResponse = await page.goto(check.homeUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  const homeStatus = homeResponse?.status() ?? 0;

  await page.goto(check.loginUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  await fillLoginForm(page, check.username, check.password);
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  const title = await page.title();
  const stillOnLogin = new URL(currentUrl).pathname.toLowerCase().includes("/login");
  const visibleError = await page
    .locator('[role="alert"], .error, .text-red-500, .text-destructive')
    .first()
    .textContent({ timeout: 2000 })
    .catch(() => "");

  await context.close();

  return {
    name: check.name,
    homeStatus,
    loginSucceeded: !stillOnLogin,
    finalUrl: currentUrl.replace(/[?#].*$/, ""),
    title,
    visibleError: visibleError?.trim() || "",
  };
}

const results = [];

try {
  for (const check of checks) {
    results.push(await runCheck(check));
  }
} finally {
  await browser.close();
}

let hasFailure = false;

for (const result of results) {
  const ok = result.homeStatus >= 200 && result.homeStatus < 400 && result.loginSucceeded;
  if (!ok) hasFailure = true;
  console.log(
    [
      ok ? "PASS" : "FAIL",
      result.name,
      `home=${result.homeStatus}`,
      `login=${result.loginSucceeded ? "ok" : "failed"}`,
      `final=${result.finalUrl}`,
      result.visibleError ? `error=${result.visibleError}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
  );
}

process.exit(hasFailure ? 1 : 0);
