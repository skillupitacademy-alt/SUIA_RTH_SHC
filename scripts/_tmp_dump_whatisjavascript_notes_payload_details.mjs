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

function printCardKeys(name, card) {
  console.log(`${name} keys:`, keysOf(card));
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

  printCardKeys('definitionBlock', c.definitionBlock);
  printCardKeys('summaryCard', c.summaryCard);
  printCardKeys('practiceCard', c.practiceCard);
  printCardKeys('componentGrid', c.componentGrid);
  printCardKeys('warningFaq', c.warningFaq);
  printCardKeys('examplePanel', c.examplePanel);

  console.log('sections length:', c.sections?.length);
  if (c.sections?.[0]) {
    console.log('first section keys:', keysOf(c.sections[0]));
  }

  // Look for any visualization-like fields inside known cards
  const needleWords = ['flash', 'mind', 'map', 'cheat', 'sheet', 'mnemonic', 'retention', 'comparison', 'chart', 'diagram', 'table'];
  function scan(node, path = []) {
    if (node == null) return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => scan(v, [...path, String(i)]));
      return;
    }
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        const lower = k.toLowerCase();
        if (needleWords.some((n) => lower.includes(n))) {
          console.log('VISUAL MATCH:', [...path, k].join('.'));
        }
        scan(v, [...path, k]);
      }
    }
  }

  console.log('--- scanning for visualization-like keys within content ---');
  scan(c);
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e);
  process.exit(1);
});
