import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';

const BASE_URL = process.env.SKILLHUBCORE_ADMIN_URL || 'http://localhost:3007';
const SECTION = process.env.SECTION || 'notes';
const SUBSECTION = process.env.SUBSECTION || 'concept_card';
const ARTIFACT_DIR = 'test-results/skillhubcore-admin-pipeline';

const hardTimeout = setTimeout(() => {
  console.error(JSON.stringify({ ok: false, error: 'Smoke test hard timeout exceeded.' }, null, 2));
  process.exit(124);
}, 120000);

async function fetchOk(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer(url, timeoutMs = 90000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await fetchOk(url, 3000)) return true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return false;
}

async function ensureServer() {
  if (await fetchOk(`${BASE_URL}/content-generation/global-architecture`)) return null;

  const child = spawn('pnpm', ['--filter', '@quiz/skillhubcore-admin', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'pipe',
    windowsHide: true,
  });

  const ready = await waitForServer(`${BASE_URL}/content-generation/global-architecture`);
  if (!ready) {
    child.kill();
    throw new Error(`SkillHubCore admin did not start at ${BASE_URL}`);
  }
  return child;
}

async function assertVisible(page, text, description = text) {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: 'visible', timeout: 20000 });
  return description;
}

async function selectEducationalSection(page, sectionLabel) {
  await page.locator('button').filter({ hasText: 'Educational Arch' }).click({ timeout: 20000 });
  await page.getByText(sectionLabel, { exact: true }).click({ timeout: 20000 });
}

async function main() {
  const serverProcess = await ensureServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(12000);

  const results = [];
  try {
    console.log(`Opening ${BASE_URL}/content-generation/global-architecture`);
    await page.goto(`${BASE_URL}/content-generation/global-architecture`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await assertVisible(page, 'Educational Arch');
    console.log('Selecting Notes section');
    await selectEducationalSection(page, 'Notes Section');
    results.push('Global Architecture Notes selection opens');

    console.log('Selecting Concept Card');
    await assertVisible(page, 'Concept Card');
    await page.getByText('Concept Card', { exact: false }).first().click({ timeout: 20000 });
    await assertVisible(page, 'NotesHero');
    results.push('Notes concept_card maps to NotesHero');

    console.log('Opening Renderer Mapping tab');
    await page.getByRole('button', { name: /^Renderer Mapping$/ }).click({ timeout: 20000 });
    await assertVisible(page, 'Editable Renderer Contract');
    await assertVisible(page, 'Renderer Decision Preview');
    results.push('Renderer Mapping tab opens selected component editor');

    const layoutSelect = page.locator('select').filter({ has: page.locator('option[value="grid"]') }).first();
    await layoutSelect.selectOption('grid');
    await assertVisible(page, 'Grid');
    results.push('Layout option change is visible in Renderer Decision Preview area');

    for (const [name, url] of [
      ['Visual Guide', `${BASE_URL}/tools/visual-guide?section=${SECTION}&subsection=${SUBSECTION}`],
      ['Prompt Generator', `${BASE_URL}/tools/prompt-generator?section=${SECTION}&subsection=${SUBSECTION}`],
      ['Content Manager', `${BASE_URL}/tools/content-manager?section=${SECTION}&subsection=${SUBSECTION}`],
    ]) {
      const testPage = await browser.newPage({ viewport: { width: 1366, height: 900 } });
      await testPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await testPage.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => undefined);
      await testPage.screenshot({ path: `${ARTIFACT_DIR}/${name.toLowerCase().replace(/\s+/g, '-')}-${SECTION}-${SUBSECTION}.png`, fullPage: true });
      results.push(`${name} route opens for ${SECTION}.${SUBSECTION}`);
      await testPage.close();
    }

    await page.screenshot({ path: `${ARTIFACT_DIR}/global-architecture-${SECTION}-${SUBSECTION}.png`, fullPage: true });
    process.stdout.write(`${JSON.stringify({ ok: true, baseUrl: BASE_URL, section: SECTION, subsection: SUBSECTION, results }, null, 2)}\n`);
  } catch (error) {
    await page.screenshot({ path: `${ARTIFACT_DIR}/failure-${SECTION}-${SUBSECTION}.png`, fullPage: true }).catch(() => undefined);
    console.error(JSON.stringify({ ok: false, baseUrl: BASE_URL, section: SECTION, subsection: SUBSECTION, error: error instanceof Error ? error.message : String(error), results }, null, 2));
    process.exitCode = 1;
  } finally {
    clearTimeout(hardTimeout);
    await browser.close();
    if (serverProcess) {
      if (process.platform === 'win32') {
        execFileSync('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        serverProcess.kill('SIGTERM');
      }
    }
  }
}

main();
