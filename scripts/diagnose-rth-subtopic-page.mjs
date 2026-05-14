#!/usr/bin/env node

/**
 * Diagnose a live RealTutorialHub subtopic page.
 *
 * Usage:
 *   SUBTOPIC_SLUG=whatisjavascript node scripts/diagnose-rth-subtopic-page.mjs
 *
 * Optional env:
 *   BFF_BASE_URL=https://user.realtutorialhub.com
 *   TEST_EMAIL=...
 *   TEST_PASSWORD=...
 */

import fetch from 'node-fetch';

const CONFIG = {
  baseUrl: process.env.BFF_BASE_URL || 'https://user.realtutorialhub.com',
  email: process.env.TEST_EMAIL || 'ajayshah@gmail.com',
  password: process.env.TEST_PASSWORD || 'testing',
  subtopicSlug: process.env.SUBTOPIC_SLUG || 'whatisjavascript',
};

function header(title) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(title);
  console.log('='.repeat(80));
}

function extractCookies(response) {
  const raw = typeof response.headers.raw === 'function'
    ? response.headers.raw()['set-cookie'] || []
    : [response.headers.get('set-cookie')].filter(Boolean);

  return raw
    .flatMap((value) => String(value).split(/,(?=\s*[^;,]+=)/))
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

function preview(text, limit = 1200) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function findSnippet(text, patterns, radius = 500) {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    const index = lower.indexOf(pattern.toLowerCase());
    if (index !== -1) {
      const start = Math.max(0, index - radius);
      const end = Math.min(text.length, index + pattern.length + radius);
      return text.slice(start, end).replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

function extractDigestMarkers(text) {
  const markers = new Set();
  const regexes = [
    /digest["'\\: ]+([A-Za-z0-9_-]{6,})/gi,
    /"digest"\s*:\s*"([^"]+)"/gi,
    /digest:?\s*([0-9]{6,})/gi,
  ];

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      markers.add(match[1]);
    }
  }

  return [...markers];
}

async function request(name, url, options = {}) {
  const started = Date.now();
  const response = await fetch(url, {
    redirect: 'manual',
    ...options,
    headers: {
      'User-Agent': 'RTH live subtopic diagnostic/1.0',
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  const duration = Date.now() - started;

  console.log(`\n${name}`);
  console.log(`URL: ${url}`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Time: ${duration}ms`);
  console.log(`Content-Type: ${response.headers.get('content-type') || 'none'}`);
  const location = response.headers.get('location');
  if (location) console.log(`Location: ${location}`);

  return { response, body, duration, location };
}

async function main() {
  header('LIVE RTH SUBTOPIC PAGE DIAGNOSTIC');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Subtopic: ${CONFIG.subtopicSlug}`);
  console.log(`Email: ${CONFIG.email}`);

  header('1. LOGIN');
  const login = await request('POST /api/auth/login', `${CONFIG.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: CONFIG.email,
      password: CONFIG.password,
    }),
  });

  if (!login.response.ok) {
    console.log(`Login body: ${preview(login.body)}`);
    throw new Error(`Login failed with HTTP ${login.response.status}`);
  }

  const cookies = extractCookies(login.response);
  const accessToken = cookies.match(/accessToken=([^;]+)/)?.[1];

  console.log(`Cookies received: ${cookies ? 'yes' : 'no'}`);
  console.log(`Access token: ${accessToken ? `${accessToken.slice(0, 24)}...` : 'missing'}`);

  if (!cookies || !accessToken) {
    throw new Error('Login succeeded but auth cookies/accessToken were not returned');
  }

  const authHeaders = { Cookie: cookies };

  header('2. AUTH CONTROL');
  const me = await request('GET /api/auth/me', `${CONFIG.baseUrl}/api/auth/me`, {
    headers: authHeaders,
  });
  console.log(`Body preview: ${preview(me.body, 600)}`);

  header('3. SECTIONS API');
  const sections = await request(
    `GET /api/tutorial/sections/${CONFIG.subtopicSlug}`,
    `${CONFIG.baseUrl}/api/tutorial/sections/${CONFIG.subtopicSlug}`,
    { headers: authHeaders }
  );

  let sectionsJson = null;
  try {
    sectionsJson = JSON.parse(sections.body);
  } catch {}

  if (sectionsJson?.sections) {
    console.log(`Subtopic name: ${sectionsJson.subtopicName || sectionsJson.subtopicId}`);
    console.log(`Total sections: ${sectionsJson.totalSections}`);
    console.log(`Section keys: ${Object.keys(sectionsJson.sections).join(', ')}`);
  } else {
    console.log(`Body preview: ${preview(sections.body)}`);
  }

  header('4. PAGE REQUEST');
  const pagePath = `/start-learning/subtopic/${CONFIG.subtopicSlug}`;
  const page = await request(`GET ${pagePath}`, `${CONFIG.baseUrl}${pagePath}`, {
    headers: {
      ...authHeaders,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const hasBlockedMessage = page.body.includes('Tutorial Overview Blocked');
  const hasProductionServerError = page.body.includes('An error occurred in the Server Components render');
  const hasRetry = page.body.includes('Retry');
  const digestMarkers = extractDigestMarkers(page.body);
  const blockedSnippet = findSnippet(page.body, [
    'Tutorial Overview Blocked',
    'An error occurred in the Server Components render',
    'digest',
    'Retry',
  ]);

  console.log(`Page bytes: ${page.body.length}`);
  console.log(`Has "Tutorial Overview Blocked": ${hasBlockedMessage}`);
  console.log(`Has production RSC error text: ${hasProductionServerError}`);
  console.log(`Has Retry: ${hasRetry}`);
  console.log(`Digest markers: ${digestMarkers.length ? digestMarkers.join(', ') : 'none found in HTML'}`);
  if (blockedSnippet) {
    console.log('\nError snippet:');
    console.log(blockedSnippet);
  } else {
    console.log('\nPage preview:');
    console.log(preview(page.body));
  }

  header('5. RESULT');
  if (page.response.ok && hasBlockedMessage) {
    console.log('FAIL: live page returns HTTP 200 but renders the tutorial overview error boundary.');
    process.exitCode = 1;
    return;
  }

  if (!page.response.ok) {
    console.log(`FAIL: live page request failed with HTTP ${page.response.status}.`);
    process.exitCode = 1;
    return;
  }

  console.log('PASS: live page request did not expose the tutorial overview blocked state in HTML.');
}

main().catch((error) => {
  console.error(`\nFatal: ${error.message}`);
  process.exit(1);
});
