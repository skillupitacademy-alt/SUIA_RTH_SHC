import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';

const BASE_URL = process.env.SKILLHUBCORE_ADMIN_URL || 'http://localhost:3007';
const ARTIFACT_DIR = 'test-results/skillhubcore-notes-uiux-tabs-audit';
const TABS = [
  'Universal Architecture',
  'Section Sequence',
  'Component Details',
  'Learning Progression',
  'Prompt Management',
  'Renderer Mapping',
  'Validation Rules',
  'JSON Schema',
];

const EXPECTATIONS = {
  'Universal Architecture': ['UI/UX Architecture', 'Concept Card', 'NotesHero', 'structured_content_block'],
  'Section Sequence': ['UI/UX Architecture', 'Concept Card', 'NotesHero'],
  'Component Details': ['UI/UX Architecture', 'Concept Card', 'NotesHero', 'layout'],
  'Learning Progression': ['UI/UX Architecture', 'Concept Card', 'NotesHero'],
  'Prompt Management': ['UI/UX Architecture', 'Prompt', 'notes.concept_card'],
  'Renderer Mapping': ['UI/UX Architecture', 'Renderer Mapping', 'NotesHero', 'Concept Card'],
  'Validation Rules': ['UI/UX Architecture', 'Accessibility', 'WCAG'],
  'JSON Schema': ['UI/UX Architecture', 'concept_card', 'NotesHero', 'component_design_system'],
};

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

async function selectNotesUiux(page) {
  await page.getByText('Select Schema', { exact: true }).click();
  await page.getByText('Notes Section UI/UX', { exact: true }).click();
  await page.getByText('Concept Card', { exact: false }).first().click();
  await page.waitForTimeout(250);
}

async function auditTab(page, tab) {
  await page.getByRole('button', { name: tab }).click();
  await page.waitForTimeout(700);
  const bodyText = await page.locator('body').innerText();
  const missing = EXPECTATIONS[tab].filter((expected) => !bodyText.includes(expected));
  await page.screenshot({
    path: `${ARTIFACT_DIR}/${tab.toLowerCase().replace(/\s+/g, '-')}.png`,
    fullPage: true,
  });
  return { tab, ok: missing.length === 0, missing };
}

async function main() {
  const hardTimeout = setTimeout(() => {
    console.error(JSON.stringify({ ok: false, error: 'Notes UI/UX tabs audit hard timeout exceeded.' }, null, 2));
    process.exit(124);
  }, 150000);

  const serverProcess = await ensureServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(15000);

  try {
    await page.goto(`${BASE_URL}/content-generation/global-architecture`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await selectNotesUiux(page);
    const results = [];
    for (const tab of TABS) {
      results.push(await auditTab(page, tab));
    }
    const ok = results.every((result) => result.ok);
    console.log(JSON.stringify({ ok, baseUrl: BASE_URL, mode: 'uiux', section: 'notes', selectedComponent: 'concept_card', results }, null, 2));
    process.exitCode = ok ? 0 : 1;
  } catch (error) {
    await page.screenshot({ path: `${ARTIFACT_DIR}/failure.png`, fullPage: true }).catch(() => undefined);
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
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
