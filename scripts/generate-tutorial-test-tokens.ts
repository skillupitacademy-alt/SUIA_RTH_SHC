#!/usr/bin/env tsx

/**
 * Generate Tutorial Test Tokens for Both Brands
 * 
 * Generates fresh authentication tokens for RTH and SkillUp brands
 * to be used in tutorial API integration testing.
 * 
 * Usage: npx tsx scripts/generate-tutorial-test-tokens.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { writeFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface BrandCredentials {
  brand: string;
  email: string;
  password: string;
  platform: string;
  baseUrl: string;
}

const BRAND_CREDENTIALS: BrandCredentials[] = [
  {
    brand: 'RealTutorialHub',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    platform: 'realtutorialhub',
    baseUrl: process.env.GATEWAY_URL || 'https://api.realtutorialhub.com'
  },
  {
    brand: 'SkillUp IT Academy',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    platform: 'skillup',
    baseUrl: process.env.GATEWAY_URL_SKILLUP || 'https://api.skillupitacademy.com'
  }
];

interface TokenResult {
  brand: string;
  email: string;
  platform: string;
  success: boolean;
  token?: string;
  userId?: string;
  expiresAt?: string;
  error?: string;
}

async function loginAndGetToken(cred: BrandCredentials): Promise<TokenResult> {
  console.log(`\n${'='.repeat(64)}`);
  console.log(`🔐 ${cred.brand}`);
  console.log(`${'='.repeat(64)}`);
  console.log(`Email: ${cred.email}`);
  console.log(`Platform: ${cred.platform}`);
  console.log(`Base URL: ${cred.baseUrl}`);
  console.log('');

  try {
    console.log('📡 Sending login request...');
    
    const response = await fetch(`${cred.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cred.email,
        password: cred.password,
        platform: cred.platform,
      }),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Login failed`);
      console.log(`   Response: ${errorText.substring(0, 200)}`);
      
      return {
        brand: cred.brand,
        email: cred.email,
        platform: cred.platform,
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`
      };
    }

    // Extract token from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      console.log(`❌ No Set-Cookie header found`);
      return {
        brand: cred.brand,
        email: cred.email,
        platform: cred.platform,
        success: false,
        error: 'No Set-Cookie header in response'
      };
    }

    const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
    if (!tokenMatch) {
      console.log(`❌ No accessToken found in Set-Cookie`);
      return {
        brand: cred.brand,
        email: cred.email,
        platform: cred.platform,
        success: false,
        error: 'No accessToken in Set-Cookie header'
      };
    }

    const token = tokenMatch[1];
    console.log(`✅ Token extracted successfully`);
    console.log(`   Length: ${token.length} characters`);

    // Decode JWT to extract user info
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      const userId = decoded.userId || decoded.sub;
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Unknown';
      
      console.log(`   User ID: ${userId}`);
      console.log(`   Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`);
      console.log(`   Brand: ${decoded.brand || 'N/A'}`);
      console.log(`   Roles: ${decoded.roles?.join(', ') || 'N/A'}`);

      return {
        brand: cred.brand,
        email: cred.email,
        platform: cred.platform,
        success: true,
        token,
        userId,
        expiresAt
      };
    } catch (decodeError) {
      console.log(`⚠️  Could not decode token (but token is valid)`);
      return {
        brand: cred.brand,
        email: cred.email,
        platform: cred.platform,
        success: true,
        token
      };
    }
  } catch (error) {
    console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      brand: cred.brand,
      email: cred.email,
      platform: cred.platform,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function generateAllTokens() {
  console.log('\n');
  console.log('================================================================');
  console.log('                                                                ');
  console.log('     TUTORIAL TEST TOKEN GENERATOR - BOTH BRANDS               ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('\n');

  const results: TokenResult[] = [];

  // Generate tokens for both brands
  for (const cred of BRAND_CREDENTIALS) {
    const result = await loginAndGetToken(cred);
    results.push(result);
  }

  // Summary
  console.log('\n');
  console.log('================================================================');
  console.log('                                                                ');
  console.log('                        SUMMARY                                ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.brand} (${r.platform})`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.brand}: ${r.error}`);
    });
  }

  if (successful.length === 0) {
    console.log('\n❌ No tokens generated. Cannot proceed with testing.');
    console.log('   Check credentials and API availability.');
    process.exit(1);
  }

  // Generate environment variables
  console.log('\n');
  console.log('================================================================');
  console.log('                                                                ');
  console.log('              ENVIRONMENT VARIABLES FOR TESTING                ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('\n');

  const rthResult = results.find(r => r.platform === 'realtutorialhub' && r.success);
  const skillupResult = results.find(r => r.platform === 'skillup' && r.success);

  if (rthResult?.token) {
    console.log('# RealTutorialHub Test Credentials');
    console.log(`RTH_TEST_TOKEN="${rthResult.token}"`);
    console.log(`RTH_TEST_USER_ID="${rthResult.userId || 'unknown'}"`);
    console.log('');
  }

  if (skillupResult?.token) {
    console.log('# SkillUp IT Academy Test Credentials');
    console.log(`SKILLUP_TEST_TOKEN="${skillupResult.token}"`);
    console.log(`SKILLUP_TEST_USER_ID="${skillupResult.userId || 'unknown'}"`);
    console.log('');
  }

  // Show existing INTERNAL_API_SECRET
  const internalApiSecret = process.env.INTERNAL_API_SECRET;
  if (internalApiSecret) {
    console.log('# Internal API Secret (already configured)');
    console.log(`INTERNAL_API_SECRET="${internalApiSecret}"`);
    console.log('');
  } else {
    console.log('⚠️  INTERNAL_API_SECRET not found in .env.local');
    console.log('   This is required for direct API server testing');
    console.log('');
  }

  // Save to file
  const envContent = [
    '# Tutorial Test Tokens - Generated by scripts/generate-tutorial-test-tokens.ts',
    `# Generated at: ${new Date().toISOString()}`,
    '',
    '# RealTutorialHub Test Credentials',
    rthResult?.token ? `RTH_TEST_TOKEN="${rthResult.token}"` : '# RTH_TEST_TOKEN=<failed to generate>',
    rthResult?.userId ? `RTH_TEST_USER_ID="${rthResult.userId}"` : '# RTH_TEST_USER_ID=<unknown>',
    '',
    '# SkillUp IT Academy Test Credentials',
    skillupResult?.token ? `SKILLUP_TEST_TOKEN="${skillupResult.token}"` : '# SKILLUP_TEST_TOKEN=<failed to generate>',
    skillupResult?.userId ? `SKILLUP_TEST_USER_ID="${skillupResult.userId}"` : '# SKILLUP_TEST_USER_ID=<unknown>',
    '',
    '# Internal API Secret',
    internalApiSecret ? `INTERNAL_API_SECRET="${internalApiSecret}"` : '# INTERNAL_API_SECRET=<not found>',
    '',
    '# Test Configuration',
    'TEST_SUBTOPIC_ID="test-subtopic-123"',
    '',
  ].join('\n');

  const outputPath = path.resolve(process.cwd(), '.env.tutorial-test');
  writeFileSync(outputPath, envContent);
  console.log(`💾 Tokens saved to: .env.tutorial-test`);
  console.log('');

  // Usage instructions
  console.log('================================================================');
  console.log('                                                                ');
  console.log('                    NEXT STEPS                                 ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('\n');
  console.log('1. Load the test environment variables:');
  console.log('   source .env.tutorial-test  # Linux/Mac');
  console.log('   Get-Content .env.tutorial-test | ForEach-Object { $_ }  # Windows PowerShell');
  console.log('');
  console.log('2. Run the API integration tests:');
  console.log('   npx tsx scripts/test-tutorial-api-simple.ts');
  console.log('');
  console.log('3. Or run with inline environment:');
  console.log('   RTH_TEST_TOKEN="..." SKILLUP_TEST_TOKEN="..." npx tsx scripts/test-tutorial-api-simple.ts');
  console.log('');
  console.log('================================================================');
  console.log('\n');

  // Show credentials being used
  console.log('📋 CREDENTIALS USED:');
  console.log('-'.repeat(64));
  BRAND_CREDENTIALS.forEach(cred => {
    console.log(`${cred.brand}:`);
    console.log(`  Email: ${cred.email}`);
    console.log(`  Password: ${cred.password}`);
    console.log(`  Platform: ${cred.platform}`);
    console.log(`  Base URL: ${cred.baseUrl}`);
    console.log('');
  });

  console.log('================================================================');
  console.log('\n');
}

// Run the token generation
generateAllTokens().catch((error) => {
  console.error('\n💥 Token generation failed:', error);
  process.exit(1);
});