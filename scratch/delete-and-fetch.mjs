import { Redis } from '@upstash/redis';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const RTH_BASE_URL = 'https://user.realtutorialhub.com';
const creds = { email: 'ajayshah@gmail.com', password: 'testing' };

async function login() {
  const response = await fetch(`${RTH_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  const setCookie = response.headers.get('set-cookie');
  const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
  return tokenMatch[1];
}

async function main() {
  const key = 'tutorial:v2:sections:whatisjavascript:simple';
  
  console.log('🗑️ Deleting Redis key:', key);
  await redis.del(key);
  console.log('✅ Deleted!');
  
  console.log('🔑 Logging in to get token...');
  const token = await login();
  
  console.log('🌐 Fetching fresh notes section from live API...');
  const url = `${RTH_BASE_URL}/api/tutorial/sections/whatisjavascript?sectionType=notes`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Cookie: `accessToken=${token}` },
  });

  const j = await res.json();
  const c = j.content;

  console.log('--- FRESH LIVE SUMMARY CARD OBJECT ---');
  console.log(JSON.stringify(c?.summaryCard, null, 2));
  
  // Inspect Redis again to see if it got populated with the image
  console.log('\n--- Checking Redis Cache state after fetch ---');
  const val = await redis.get(key);
  if (val) {
    const notes = val.sections?.notes;
    console.log('Does cached notes have image now?', !!notes?.summaryCard?.image);
    console.log('image value in cache:', JSON.stringify(notes?.summaryCard?.image, null, 2));
  } else {
    console.log('Redis key not populated yet.');
  }
}

main().catch(console.error);
