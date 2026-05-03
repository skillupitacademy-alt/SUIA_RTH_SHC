#!/usr/bin/env tsx
/**
 * Phase 2B Validation with Fresh Token Generation
 * ================================================
 * Generates a fresh admin token and immediately runs validation
 * to avoid token expiration issues
 */

import { spawn } from 'child_process';

async function loginAndGetToken(): Promise<string | null> {
  const baseUrl = 'https://api.realtutorialhub.com';
  const email = 'admin@realtutorialhub.com';
  const password = 'admin123';
  const platform = 'realtutorialhub';

  try {
    console.log('🔐 Generating fresh admin token...');
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, platform }),
    });

    if (!response.ok) {
      console.log('❌ Login failed:', response.status);
      return null;
    }

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const accessTokenMatch = setCookieHeader.match(/accessToken=([^;]+)/);
      if (accessTokenMatch) {
        const token = accessTokenMatch[1];
        console.log('✅ Fresh token generated');
        
        // Decode to show expiration
        const [, payload] = token.split('.');
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        console.log(`   Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`);
        
        return token;
      }
    }

    console.log('❌ Token not found in response');
    return null;
  } catch (error) {
    console.log('❌ Login error:', error);
    return null;
  }
}

async function runValidation(token: string): Promise<number> {
  return new Promise((resolve) => {
    console.log('\n🚀 Running Phase 2B validation...\n');
    
    const child = spawn('npx', ['tsx', 'scripts/validate-phase2b.ts'], {
      env: {
        ...process.env,
        TEST_ADMIN_TOKEN: token,
      },
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      resolve(code || 0);
    });

    child.on('error', (error) => {
      console.error('❌ Validation process error:', error);
      resolve(1);
    });
  });
}

async function main() {
  const token = await loginAndGetToken();
  
  if (!token) {
    console.log('\n❌ Failed to generate admin token');
    console.log('   Cannot proceed with validation');
    process.exit(1);
  }

  const exitCode = await runValidation(token);
  process.exit(exitCode);
}

main();
