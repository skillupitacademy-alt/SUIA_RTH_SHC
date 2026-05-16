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

async function main() {
  const token = await login();

  const url = `${RTH_BASE_URL}/api/tutorial/sections/whatisjavascript?sectionType=visual`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Cookie: `accessToken=${token}` },
  });

  console.log('URL:', url);
  console.log('Status:', res.status, res.statusText);

  const j = await res.json();
  const c = j.content;

  const keys = [
    'summaryHeroInfographic',
    'conceptMemoryMap',
    'cheatSheetSVG',
    'flashcardVisualSystem',
    'comparisonSummaryChart',
    'mnemonicRetentionGraphic',
  ];

  console.log('Top content keys:', c ? Object.keys(c) : []);
  for (const k of keys) {
    console.log(`has content.${k}?`, !!c && k in c);
  }
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e);
  process.exit(1);
});
