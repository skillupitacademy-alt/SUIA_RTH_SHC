import fetch from 'node-fetch';

const RTH_BASE_URL = 'https://user.realtutorialhub.com';
const creds = { email: 'ajayshah@gmail.com', password: 'testing' };

async function login() {
  const response = await fetch(`${RTH_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Login failed: ${response.status} ${errorText}`);
  }

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('No set-cookie header from login');

  const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
  if (!tokenMatch) throw new Error('No accessToken in set-cookie');

  return tokenMatch[1];
}

function keysOf(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj);
}

async function main() {
  const token = await login();
  const url = `${RTH_BASE_URL}/api/tutorial/sections/whatisjavascript?sectionType=notes`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Cookie: `accessToken=${token}` },
  });

  console.log('URL:', url);
  console.log('Status:', res.status, res.statusText);

  const j = await res.json();
  const c = j.content;

  console.log('Top content keys:', keysOf(c));

  const candidateCards = ['definitionBlock', 'summaryCard', 'practiceCard', 'componentGrid', 'warningFaq', 'examplePanel', 'sections'];
  for (const k of candidateCards) {
    console.log(`${k} keys:`, keysOf(c?.[k]));
  }

  // Check for “visual architecture” fields under content (if admin saved them)
  const visualNeedles = [
    'summaryHeroInfographic',
    'conceptMemoryMap',
    'cheatSheetSVG',
    'flashcardVisualSystem',
    'comparisonSummaryChart',
    'mnemonicRetentionGraphic',
  ];
  for (const n of visualNeedles) {
    console.log(`has content.${n}?`, n in (c ?? {}));
  }

  // Also scan within definitionBlock for any visualization-like fields quickly
  const def = c?.definitionBlock;
  if (def) {
    const defKeys = keysOf(def);
    console.log('definitionBlock keys:', defKeys);
    const visualInDef = defKeys.filter((k) => /mind|map|cheat|flash|mnemonic|diagram|chart|retention|comparison/i.test(k));
    console.log('visual-like keys in definitionBlock:', visualInDef);
  }
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e);
  process.exit(1);
});
