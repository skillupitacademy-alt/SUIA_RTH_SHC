#!/usr/bin/env node
/**
 * Progressive Tutorial V2 Route Test
 * Tests each segment of the Tutorial V2 URL to determine where routing fails
 */

const BASE_URL = 'http://skillup.localhost:3009';

const segments = [
  '/tutorial-v2',
  '/tutorial-v2/full-stack-development',
  '/tutorial-v2/full-stack-development/backend-development',
  '/tutorial-v2/full-stack-development/backend-development/java',
  '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1',
  '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava',
];

// Use authenticated cookie from E2E test
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Will be set by actual test

console.log('Testing Tutorial V2 Route Segments:');
console.log('=====================================\n');

for (const path of segments) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`Testing: ${path}`);
    
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Progressive-Route-Test/1.0',
      },
    });
    
    console.log(`  Status: ${response.status}`);
    
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      console.log(`  Redirect: ${location}`);
    }
    
    console.log();
  } catch (error) {
    console.log(`  Error: ${error.message}\n`);
  }
}
