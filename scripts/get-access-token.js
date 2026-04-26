#!/usr/bin/env node
/**
 * 🔐 AUTO TOKEN FETCH
 * 
 * Programmatically logs in and extracts access tokens
 * No manual cookie copying needed!
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://user.realtutorialhub.com';

// Test users for RBAC validation
// Real users from both brands for comprehensive testing
const USERS = {
  // RealTutorialHub brand users
  rth_user: {
    email: process.env.RBAC_RTH_USER_EMAIL || 'ajayshah@gmail.com',
    password: process.env.RBAC_RTH_USER_PASSWORD || 'testing',
    brand: 'realtutorialhub'
  },
  rth_admin: {
    email: process.env.RBAC_RTH_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.RBAC_RTH_ADMIN_PASSWORD || 'admin123',
    brand: 'realtutorialhub'
  },
  
  // SkillUp IT Academy brand users
  skillup_student: {
    email: process.env.RBAC_SKILLUP_STUDENT_EMAIL || 'student@skillupitacademy.com',
    password: process.env.RBAC_SKILLUP_STUDENT_PASSWORD || 'SkillUp@2025',
    brand: 'skillupitacademy'
  },
  skillup_admin: {
    email: process.env.RBAC_SKILLUP_ADMIN_EMAIL || 'admin@skillupitacademy.com',
    password: process.env.RBAC_SKILLUP_ADMIN_PASSWORD || 'SkillUpAdmin@2025',
    brand: 'skillupitacademy'
  },
  
  // Fallback test users (if above don't exist)
  test_user: {
    email: process.env.RBAC_USER_EMAIL || 'rbac-user@test.com',
    password: process.env.RBAC_USER_PASSWORD || 'RbacTest123!',
    brand: 'realtutorialhub'
  },
  test_admin: {
    email: process.env.RBAC_ADMIN_EMAIL || 'rbac-admin@test.com',
    password: process.env.RBAC_ADMIN_PASSWORD || 'RbacTest123!',
    brand: 'realtutorialhub'
  }
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RBAC-Token-Fetcher/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

function extractCookie(headers, cookieName) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  
  for (const cookie of setCookie) {
    if (cookie.startsWith(`${cookieName}=`)) {
      const match = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
      return match ? match[1] : null;
    }
  }
  return null;
}

async function login(email, password) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: { email, password }
    });

    if (response.status === 200) {
      const accessToken = extractCookie(response.headers, 'accessToken');
      if (accessToken) {
        return accessToken;
      } else {
        throw new Error('No accessToken in response');
      }
    } else {
      throw new Error(`Login failed: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Login error: ${error.message}`);
  }
}

async function fetchAllTokens() {
  console.log('🔐 Fetching access tokens...\n');

  const tokens = {};
  const errors = [];

  for (const [role, creds] of Object.entries(USERS)) {
    try {
      const token = await login(creds.email, creds.password);
      tokens[role] = token;
      console.log(`✅ ${role.toUpperCase()}: ${token.substring(0, 40)}...`);
    } catch (err) {
      errors.push({ role, error: err.message });
      console.error(`❌ ${role.toUpperCase()} failed: ${err.message}`);
    }
  }

  console.log('');

  if (errors.length > 0) {
    console.error('⚠️  Some tokens failed to fetch:');
    errors.forEach(({ role, error }) => {
      console.error(`   - ${role}: ${error}`);
    });
    console.error('\nSet environment variables:');
    console.error('  RBAC_ADMIN_EMAIL / RBAC_ADMIN_PASSWORD');
    console.error('  RBAC_STUDENT_EMAIL / RBAC_STUDENT_PASSWORD');
    console.error('  RBAC_USER_EMAIL / RBAC_USER_PASSWORD\n');
  }

  // Save to file for next script
  const fs = require('fs');
  fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2));
  console.log('💾 Tokens saved to tokens.json\n');

  return tokens;
}

// Run if called directly
if (require.main === module) {
  fetchAllTokens()
    .then(() => {
      console.log('✅ Token fetch complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { fetchAllTokens, login };
