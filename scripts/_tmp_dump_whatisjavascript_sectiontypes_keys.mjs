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

function summarizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj).slice(0, 60)) {
    if (Array.isArray(v)) out[k] = { type: 'array', length: v.length };
    else if (v && typeof v === 'object') out[k] = { type: 'object', keys: Object.keys(v).slice(0, 30) };
    else out[k] = typeof v;
  }
  return out;
}

async function fetchSectionType(token, sectionType) {
  const url = `${RTH_BASE_URL}/api/tutorial/sections/whatisjavascript?sectionType=${encodeURIComponent(sectionType)}`;
  const res = await fetch(url, { headers: { Cookie: `accessToken=${token}` } });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }

  return { url, status: res.status, statusText: res.statusText, json, rawPrefix: text.slice(0, 200) };
}

async function main() {
  const token = await login();

  const sectionTypesToCheck = ['notes', 'layman', 'summary', 'technical', 'code', 'practice', 'quiz', 'real_life', 'visual', 'project', 'assignment', 'interview', 'ai_tutor'];

  for (const st of sectionTypesToCheck) {
    const { url, status, statusText, json, rawPrefix } = await fetchSectionType(token, st);
    console.log('\n===', st, '===');
    console.log('URL:', url);
    console.log('Status:', status, statusText);

    if (!json) {
      console.log('Non-JSON response prefix:', rawPrefix);
      continue;
    }

    const content = json.content;
    if (!content) {
      console.log('No json.content');
      continue;
    }

    const ckeys = keysOf(content);
    console.log('content keys:', ckeys);

    if (content.definitionBlock) console.log('definitionBlock keys:', keysOf(content.definitionBlock));
    if (content.summaryCard) console.log('summaryCard keys:', keysOf(content.summaryCard));
    if (content.laymanExplanation) console.log('laymanExplanation keys:', keysOf(content.laymanExplanation));
    if (content.sections) console.log('sections length:', content.sections?.length);

    // Print a light-weight summary of content
    console.log('content (summary):', JSON.stringify(summarizeObj(content), null, 2));
  }
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e);
  process.exit(1);
});
