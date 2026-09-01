#!/usr/bin/env node
/**
 * Test what cookies are set by login
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://skillup.localhost:3009';
const CREDENTIALS = {
  email: 'student@skillupitacademy.com',
  password: 'testing',
  brand: 'skillup',
};

console.log('Testing login cookies...\n');

const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(CREDENTIALS),
});

console.log(`Login status: ${loginResponse.status}\n`);

const cookies = loginResponse.headers.raw()['set-cookie'];
console.log('Cookies received:', cookies?.length ?? 0);
console.log('\nCookie details:');
cookies?.forEach((cookie, i) => {
  const name = cookie.split('=')[0];
  const value = cookie.split(';')[0].split('=')[1];
  console.log(`  ${i + 1}. ${name} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
});

const body = await loginResponse.json();
console.log('\nResponse body keys:', Object.keys(body));
console.log('Has accessToken:', !!body.accessToken);
console.log('Has user:', !!body.user);
console.log('Has user.id:', !!body.user?.id);

// Now test with proper cookie header
console.log('\n\nTesting Tutorial V2 with ALL cookies...');
const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
console.log('Cookie header:', cookieHeader.substring(0, 100) + '...');

const tutorialUrl = 'http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';

const tutorialResponse = await fetch(tutorialUrl, {
  headers: { 'Cookie': cookieHeader },
  redirect: 'manual',
});

console.log(`\nTutorial V2 status: ${tutorialResponse.status}`);

if ([301, 302, 303, 307, 308].includes(tutorialResponse.status)) {
  console.log(`Redirects to: ${tutorialResponse.headers.get('location')}`);
}
