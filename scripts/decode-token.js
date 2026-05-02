#!/usr/bin/env node
/**
 * Decode JWT token to see what roles are in it
 */

const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
const userToken = tokens.rth_user;

if (!userToken) {
  console.error('❌ No user token found');
  process.exit(1);
}

// Decode JWT (just the payload, no verification)
const parts = userToken.split('.');
if (parts.length !== 3) {
  console.error('❌ Invalid JWT format');
  process.exit(1);
}

const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('🔍 JWT TOKEN PAYLOAD:\n');
console.log(JSON.stringify(payload, null, 2));

console.log('\n📊 KEY FIELDS:');
console.log('  userId:', payload.userId);
console.log('  email:', payload.email);
console.log('  roles:', payload.roles);
console.log('  rolesType:', typeof payload.roles);
console.log('  rolesIsArray:', Array.isArray(payload.roles));
console.log('  rolesLength:', payload.roles?.length);
console.log('  brand:', payload.brand);
console.log('  isAdmin:', payload.isAdmin);

if (Array.isArray(payload.roles) && payload.roles.length > 0) {
  console.log('\n✅ Token has roles:', payload.roles);
} else {
  console.log('\n❌ Token has NO roles or empty roles array!');
}
