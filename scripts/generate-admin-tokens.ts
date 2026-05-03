/**
 * Generate Admin Tokens for Both Brands
 * ======================================
 * Obtains admin JWT tokens via login API for validation testing
 * 
 * Usage:
 *   npx tsx scripts/generate-admin-tokens.ts
 * 
 * Output:
 *   Displays TEST_ADMIN_TOKEN_RTH and TEST_ADMIN_TOKEN_SKILLUP
 *   to add to .env.local
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      isAdmin: boolean;
    };
  };
  error?: {
    message: string;
  };
}

async function loginAndGetToken(
  baseUrl: string,
  email: string,
  password: string,
  platform: string
): Promise<string | null> {
  try {
    console.log(`  [CHECK] Attempting login for ${email}...`);
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        platform,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  [FAIL] Login failed (${response.status}): ${errorText.substring(0, 200)}`);
      return null;
    }

    // Extract token from Set-Cookie header
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse accessToken from cookie
      const accessTokenMatch = setCookieHeader.match(/accessToken=([^;]+)/);
      if (accessTokenMatch) {
        const token = accessTokenMatch[1];
        
        // Verify it's an admin token by decoding (without verification)
        try {
          const [, payload] = token.split('.');
          const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
          
          if (decoded.isAdmin === true || decoded.tokenType === 'admin') {
            console.log(`  [PASS] Admin token obtained`);
            console.log(`     User ID: ${decoded.userId || decoded.sub}`);
            console.log(`     Token Type: ${decoded.tokenType || 'admin'}`);
            console.log(`     Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`);
            return token;
          } else {
            console.log(`  [FAIL] Token is not an admin token`);
            console.log(`     Token Type: ${decoded.tokenType}`);
            console.log(`     Is Admin: ${decoded.isAdmin}`);
            return null;
          }
        } catch (decodeError) {
          console.log(`  [WARNING] Could not decode token, but returning it anyway`);
          return token;
        }
      }
    }

    // Try to get token from response body
    const data: LoginResponse = await response.json();
    if (data.success && data.data) {
      console.log(`  [PASS] Login successful`);
      console.log(`     User: ${data.data.user.email}`);
      console.log(`     Is Admin: ${data.data.user.isAdmin}`);
      console.log(`  [WARNING] Token not found in Set-Cookie header`);
      console.log(`     Check if cookies are being set properly`);
    }

    return null;
  } catch (error) {
    console.log(`  [FAIL] Login request failed: ${error}`);
    return null;
  }
}

async function generateAdminTokens() {
  console.log('\n================================================================');
  console.log('     ADMIN TOKEN GENERATOR');
  console.log('     Phase 2B Validation Testing');
  console.log('================================================================\n');

  const baseUrl = process.env.GATEWAY_URL || 'https://api.realtutorialhub.com';
  
  // RTH Admin Credentials
  const rthEmail = 'admin@realtutorialhub.com';
  const rthPassword = 'admin123';
  const rthPlatform = 'realtutorialhub';

  // SkillUp Admin Credentials
  const skillupEmail = 'admin@skillupitacademy.com';
  const skillupPassword = 'admin123';
  const skillupPlatform = 'skillup';

  console.log('[BRAND] RealTutorialHub');
  console.log('----------------------------------------------------------------');
  console.log(`  Gateway: ${baseUrl}`);
  console.log(`  Email: ${rthEmail}`);
  console.log(`  Platform: ${rthPlatform}\n`);

  const rthToken = await loginAndGetToken(baseUrl, rthEmail, rthPassword, rthPlatform);
  console.log('');

  console.log('[BRAND] SkillUp IT Academy');
  console.log('----------------------------------------------------------------');
  console.log(`  Gateway: ${baseUrl}`);
  console.log(`  Email: ${skillupEmail}`);
  console.log(`  Platform: ${skillupPlatform}\n`);

  const skillupToken = await loginAndGetToken(baseUrl, skillupEmail, skillupPassword, skillupPlatform);
  console.log('');

  // Display results
  console.log('================================================================');
  console.log('     RESULTS');
  console.log('================================================================\n');

  if (rthToken) {
    console.log('[PASS] RealTutorialHub Admin Token Generated');
    console.log(`Token Length: ${rthToken.length} characters\n`);
  } else {
    console.log('[FAIL] RealTutorialHub Admin Token NOT Generated\n');
  }

  if (skillupToken) {
    console.log('[PASS] SkillUp Admin Token Generated');
    console.log(`Token Length: ${skillupToken.length} characters\n`);
  } else {
    console.log('[FAIL] SkillUp Admin Token NOT Generated\n');
  }

  // Generate .env.local additions
  console.log('================================================================');
  console.log('     ADD TO .env.local');
  console.log('================================================================\n');

  if (rthToken || skillupToken) {
    console.log('# Phase 2B Validation Tokens');
    if (rthToken) {
      console.log(`TEST_ADMIN_TOKEN_RTH="${rthToken}"`);
    }
    if (skillupToken) {
      console.log(`TEST_ADMIN_TOKEN_SKILLUP="${skillupToken}"`);
    }
    console.log('');
    console.log('# Use RTH token as default for validation');
    if (rthToken) {
      console.log(`TEST_ADMIN_TOKEN="${rthToken}"`);
    } else if (skillupToken) {
      console.log(`TEST_ADMIN_TOKEN="${skillupToken}"`);
    }
    console.log('');
  } else {
    console.log('[FAIL] No tokens generated');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Verify admin users exist: npx tsx scripts/check-admin-credentials.ts');
    console.log('2. Verify passwords are correct (default: "testing")');
    console.log('3. Check gateway URL is accessible');
    console.log('4. Check API server is running');
    console.log('');
  }

  console.log('================================================================');
  console.log('     NEXT STEPS');
  console.log('================================================================\n');
  console.log('1. Copy the tokens above to .env.local');
  console.log('2. Run full validation: npm run validate:phase2b');
  console.log('3. Or run quick test: npx tsx scripts/quick-validate-phase2b.ts');
  console.log('');
  console.log('================================================================\n');
}

generateAdminTokens();
