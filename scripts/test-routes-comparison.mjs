#!/usr/bin/env node
/**
 * Test different routes to see which ones work
 */

import fetch from 'node-fetch';

const BASE = 'http://skillup.localhost:3009';

const routes = [
  '/start-learning',
  '/dashboard',
  '/tutorial-v2',
  '/tutorial-v2/full-stack-development',
  '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava',
];

for (const route of routes) {
  try {
    const res = await fetch(BASE + route, { redirect: 'manual' });
    console.log(`${route.padEnd(80)} → ${res.status}`);
  } catch (e) {
    console.log(`${route.padEnd(80)} → ERROR: ${e.message}`);
  }
}
