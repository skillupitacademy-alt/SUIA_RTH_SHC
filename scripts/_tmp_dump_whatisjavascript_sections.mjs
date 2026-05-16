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
    const error = await response.text().catch(() => '');
    throw new Error(`Login failed: ${response.status} ${error}`);
  }

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('No set-cookie header from login');

  const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
  if (!tokenMatch) throw new Error('No accessToken in set-cookie');
  return tokenMatch[1];
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function summarizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj).slice(0, 50)) {
    if (Array.isArray(v)) out[k] = { type: 'array', length: v.length };
    else if (v && typeof v === 'object') out[k] = { type: 'object', keys: Object.keys(v).slice(0, 20) };
    else out[k] = v;
  }
  return out;
}

async function main() {
  const subtopicId = 'whatisjavascript';
  const token = await login();

  const url = `${RTH_BASE_URL}/api/tutorial/sections/${subtopicId}?sectionType=notes`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Cookie: `accessToken=${token}` },
  });

  console.log('URL:', url);
  console.log('Status:', res.status, res.statusText);

  const text = await res.text();
  const json = safeJsonParse(text);

  if (!json) {
    console.log('Non-JSON response (first 500 chars):', text.slice(0, 500));
    process.exit(1);
  }

  console.log('Top-level keys:', Object.keys(json));
  console.log('--- sectionType payload summary ---');
  console.log(JSON.stringify(summarizeObj(json), null, 2));

  // Try to locate which fields might contain flashcards/mindmap/cheatsheet/chart-like blocks
  const needles = [
    'flash', 'card', 'carousel', 'mind', 'map', 'cheat', 'sheet',
    'mnemonic', 'retention', 'comparison', 'chart', 'summary', 'table', 'diagram',
  ];

  function walk(node, path = []) {
    if (node == null) return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, path.concat(String(i))));
      return;
    }
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        const lower = k.toLowerCase();
        if (needles.some(n => lower.includes(n))) {
          console.log('MATCH key:', [...path, k].join('.'), '=> type:', Array.isArray(v) ? 'array' : typeof v);
        }
        walk(v, path.concat(k));
      }
    }
  }

  console.log('--- searching for likely visualization fields ---');
  walk(json);
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e);
  process.exit(1);
});
