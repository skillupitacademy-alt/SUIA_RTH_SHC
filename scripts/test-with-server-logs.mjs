#!/usr/bin/env node
/**
 * Test Tutorial V2 and watch server logs
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://skillup.localhost:3009';

console.log('====================================');
console.log('WATCH THE SKILLUP DEV SERVER TERMINAL NOW');
console.log('====================================\n');
console.log('Logging in...');

const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@skillupitacademy.com',
    password: 'testing',
    brand: 'skillup',
  }),
});

const cookies = loginResponse.headers.raw()['set-cookie'];
const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

console.log(`Login: ${loginResponse.status}`);
console.log(`Cookies: ${cookies.length}`);
console.log('\nWait 1 second...\n');

await new Promise(resolve => setTimeout(resolve, 1000));

console.log('====================================');
console.log('NOW MAKING TUTORIAL V2 REQUEST');
console.log('WATCH FOR: [BFF_AUTH_DEBUG] [TUTORIAL_AUTH_HEADERS] [DELIVERY_TRACE]');
console.log('====================================\n');

const tutorialUrl = `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`;

const tutorialResponse = await fetch(tutorialUrl, {
  headers: { 'Cookie': cookieHeader },
});

console.log(`\nTutorial status: ${tutorialResponse.status}`);

if (tutorialResponse.status === 404) {
  const text = await tutorialResponse.text();
  console.log(`Response is ${text.length} bytes`);
  
  if (text.includes('404')) {
    console.log('Response contains "404"');
  }
  if (text.includes('This page could not be found')) {
    console.log('Response is Next.js 404 page');
  }
}
