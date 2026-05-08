#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.tutorial-test') });

const RTH_TEST_TOKEN = process.env.RTH_TEST_TOKEN || '';

console.log('\n🔍 Decoding RTH Test Token\n');
console.log('Token:', RTH_TEST_TOKEN.substring(0, 50) + '...\n');

try {
  const [header, payload, signature] = RTH_TEST_TOKEN.split('.');
  
  const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString());
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
  
  console.log('📋 Header:');
  console.log(JSON.stringify(decodedHeader, null, 2));
  console.log('\n📋 Payload:');
  console.log(JSON.stringify(decodedPayload, null, 2));
  
  console.log('\n✅ Key Fields:');
  console.log(`   User ID: ${decodedPayload.userId || decodedPayload.sub}`);
  console.log(`   Shadow User ID: ${decodedPayload.shadowUserId}`);
  console.log(`   Original User ID: ${decodedPayload.originalUserId}`);
  console.log(`   Email: ${decodedPayload.email}`);
  console.log(`   Roles: ${JSON.stringify(decodedPayload.roles)}`);
  console.log(`   Brand: ${decodedPayload.brand}`);
  console.log(`   Audience: ${decodedPayload.aud}`);
  console.log(`   Token Type: ${decodedPayload.tokenType}`);
  console.log(`   Issued At: ${new Date(decodedPayload.iat * 1000).toLocaleString()}`);
  console.log(`   Expires At: ${new Date(decodedPayload.exp * 1000).toLocaleString()}`);
  
  const now = Date.now() / 1000;
  const isExpired = decodedPayload.exp < now;
  console.log(`   Is Expired: ${isExpired ? '❌ YES' : '✅ NO'}`);
  
  if (isExpired) {
    console.log('\n⚠️  Token is EXPIRED! Generate a new one.');
  }
  
} catch (error) {
  console.error('❌ Error decoding token:', error);
}
