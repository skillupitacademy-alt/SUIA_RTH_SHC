import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const token = process.env.TEST_ADMIN_TOKEN;

console.log('Token loaded:', token ? 'YES' : 'NO');
console.log('Token length:', token?.length);
console.log('Token first 50 chars:', token?.substring(0, 50));

// Decode the JWT payload
if (token) {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    console.log('\nDecoded token:');
    console.log('  User ID:', decoded.userId);
    console.log('  Email:', decoded.email);
    console.log('  Issued at:', new Date(decoded.iat * 1000).toLocaleString());
    console.log('  Expires:', new Date(decoded.exp * 1000).toLocaleString());
    console.log('  Is expired:', Date.now() > decoded.exp * 1000);
  } catch (e) {
    console.log('Failed to decode token:', e);
  }
}
