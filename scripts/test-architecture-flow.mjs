#!/usr/bin/env node

/**
 * Architecture Flow Test
 * 
 * Tests to understand how public vs protected routes flow through the system
 */

import fetch from 'node-fetch';

const RTH_BASE_URL = 'https://user.realtutorialhub.com';

console.log('🏗️  ARCHITECTURE FLOW ANALYSIS');
console.log('═'.repeat(80));

console.log('\n📋 UNDERSTANDING THE ARCHITECTURE:\n');

console.log('1️⃣  PUBLIC ROUTE (Login):');
console.log('   Browser → BFF (/api/auth/login)');
console.log('   BFF → Cloudflare Gateway (api.realtutorialhub.com/auth/login)');
console.log('   Gateway → API Server (quiz-api-server.../api/auth/login)');
console.log('   API Server → Database');
console.log('   Response ← ← ← ← back through chain');
console.log('');
console.log('   Headers sent by BFF:');
console.log('   - x-internal-secret (for BFF → Gateway auth)');
console.log('   - User cookies (forwarded from browser)');
console.log('');
console.log('   API Server checks:');
console.log('   - /api/auth/* routes are EXEMPT from x-internal-key check');
console.log('   - Route handler does its own authentication');

console.log('\n2️⃣  PROTECTED ROUTE (Dashboard → Profile):');
console.log('   Browser → BFF (/api/profile)');
console.log('   BFF validates JWT from cookie');
console.log('   BFF → API Server DIRECT (INTERNAL_API_URL/auth/profile)');
console.log('   API Server → Database');
console.log('   Response ← ← ← back');
console.log('');
console.log('   Headers sent by BFF:');
console.log('   - x-internal-secret (from createInternalHeaders)');
console.log('   - x-user-id, x-brand, etc.');
console.log('');
console.log('   API Server checks:');
console.log('   - /api/auth/* routes are EXEMPT from x-internal-key check');
console.log('   - Route handler validates user context');

console.log('\n3️⃣  PROTECTED ROUTE (Tutorial Content) - FAILING:');
console.log('   Browser → BFF (/api/tutorial/content/...)');
console.log('   BFF validates JWT from cookie');
console.log('   BFF → API Server DIRECT (INTERNAL_API_URL/api/tutorial/content/...)');
console.log('   API Server proxy.ts middleware runs:');
console.log('   - Route is NOT /api/auth/* so NOT exempt');
console.log('   - Checks for x-internal-key header');
console.log('   - BFF sent x-internal-secret instead');
console.log('   - ❌ FAILS with 401 Authentication Required');
console.log('');
console.log('   This is the BUG!');

console.log('\n4️⃣  KEY DIFFERENCES:\n');

console.log('   PUBLIC ROUTES (/api/auth/*):');
console.log('   ✅ Go through: Browser → BFF → Gateway → API Server → DB');
console.log('   ✅ Use Gateway URL (api.realtutorialhub.com)');
console.log('   ✅ Exempt from x-internal-key check in API Server');
console.log('   ✅ Send x-internal-secret (works because exempt)');

console.log('\n   PROTECTED ROUTES (/api/auth/profile, /api/auth/onboarding):');
console.log('   ✅ Go through: Browser → BFF → API Server DIRECT → DB');
console.log('   ✅ Use INTERNAL_API_URL (quiz-api-server.../)');
console.log('   ✅ Exempt from x-internal-key check (because /api/auth/*)');
console.log('   ✅ Send x-internal-secret (works because exempt)');

console.log('\n   PROTECTED ROUTES (/api/tutorial/*, /api/profile via /api/auth/profile):');
console.log('   ❌ Go through: Browser → BFF → API Server DIRECT → DB');
console.log('   ❌ Use INTERNAL_API_URL (quiz-api-server.../)');
console.log('   ❌ NOT exempt from x-internal-key check');
console.log('   ❌ Send x-internal-secret but API expects x-internal-key');
console.log('   ❌ FAILS!');

console.log('\n5️⃣  RBAC FLOW:\n');

console.log('   For ALL routes (public and protected):');
console.log('   1. BFF validates JWT and extracts roles');
console.log('   2. BFF normalizes roles (lowercase)');
console.log('   3. BFF checks if user has required role');
console.log('   4. If authorized, BFF forwards to API Server');
console.log('   5. API Server may do additional RBAC checks');

console.log('\n6️⃣  THE FIX:\n');

console.log('   Update apps/api-server/src/proxy.ts line ~95:');
console.log('');
console.log('   FROM:');
console.log('   const internalKey = request.headers.get("x-internal-key");');
console.log('   const isValidInternalKey = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;');
console.log('   const isSystemBypass = isValidInternalKey || isValidCronAuth;');
console.log('');
console.log('   TO:');
console.log('   const internalKey = request.headers.get("x-internal-key");');
console.log('   const internalSecret = request.headers.get("x-internal-secret");');
console.log('   const isValidInternalKey = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;');
console.log('   const isValidInternalSecret = internalSecret !== null && internalSecret === process.env.INTERNAL_API_SECRET;');
console.log('   const isSystemBypass = isValidInternalKey || isValidInternalSecret || isValidCronAuth;');

console.log('\n═'.repeat(80));
console.log('✅ This fix allows BFF to use x-internal-secret for ALL routes');
console.log('✅ Maintains backward compatibility (x-internal-key still works)');
console.log('✅ Does not break existing routes (they\'re exempt anyway)');
console.log('✅ Fixes tutorial routes that are currently failing');
console.log('═'.repeat(80));
