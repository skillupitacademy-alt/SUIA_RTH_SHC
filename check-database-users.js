#!/usr/bin/env node

/**
 * Database User Verification Script
 * Checks if the test users exist in the correct brand databases
 * 
 * Test Credentials:
 * - RTH: ajayshah@gmail.com / testing
 * - SkillUp: student@skillupitacademy.com / testing
 */

const https = require('https');

const TEST_CREDENTIALS = [
  {
    brand: 'realtutorialhub',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'RTH User',
    expectedDatabase: 'rth_prod'
  },
  {
    brand: 'skillup', 
    email: 'student@skillupitacademy.com',
    password: 'testing',
    name: 'SkillUp User',
    expectedDatabase: 'skillup_prod'
  }
];

class DatabaseUserChecker {
  constructor() {
    this.results = [];
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'DatabaseUserChecker/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: 30000
      };

      if (options.body) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
      }

      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = {
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              body: data.length > 0 ? JSON.parse(data) : null,
              rawBody: data
            };
            resolve(response);
          } catch (error) {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              body: null,
              rawBody: data,
              parseError: error.message
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async testUserExistence(credential) {
    this.log('info', `Checking if ${credential.name} exists in ${credential.expectedDatabase}`, {
      email: credential.email,
      brand: credential.brand
    });

    // Try to get user info via the /api/auth/me endpoint after attempting login
    // This will help us understand if the user exists but password is wrong
    
    const loginPayload = {
      email: credential.email,
      password: credential.password,
      platform: credential.brand
    };

    const apiUrl = credential.brand === 'realtutorialhub' 
      ? 'https://api.realtutorialhub.com'
      : 'https://api.skillupitacademy.com';

    try {
      // First, try login to see the exact error
      const loginResponse = await this.makeRequest(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': credential.brand === 'realtutorialhub' 
            ? 'https://user.realtutorialhub.com' 
            : 'https://user.skillupitacademy.com'
        },
        body: JSON.stringify(loginPayload)
      });

      this.log('info', `Login attempt result for ${credential.name}`, {
        status: loginResponse.status,
        error: loginResponse.body?.error || loginResponse.body?.message,
        correlationId: loginResponse.headers['x-correlation-id'],
        requestId: loginResponse.headers['x-request-id']
      });

      // Try with a wrong password to see if we get a different error
      const wrongPasswordPayload = {
        ...loginPayload,
        password: 'definitely-wrong-password-12345'
      };

      const wrongPasswordResponse = await this.makeRequest(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': credential.brand === 'realtutorialhub' 
            ? 'https://user.realtutorialhub.com' 
            : 'https://user.skillupitacademy.com'
        },
        body: JSON.stringify(wrongPasswordPayload)
      });

      this.log('info', `Wrong password test for ${credential.name}`, {
        status: wrongPasswordResponse.status,
        error: wrongPasswordResponse.body?.error || wrongPasswordResponse.body?.message,
        correlationId: wrongPasswordResponse.headers['x-correlation-id'],
        sameErrorAsOriginal: (loginResponse.body?.error === wrongPasswordResponse.body?.error)
      });

      // Try with a non-existent email
      const nonExistentPayload = {
        ...loginPayload,
        email: 'definitely-does-not-exist-12345@example.com'
      };

      const nonExistentResponse = await this.makeRequest(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': credential.brand === 'realtutorialhub' 
            ? 'https://user.realtutorialhub.com' 
            : 'https://user.skillupitacademy.com'
        },
        body: JSON.stringify(nonExistentPayload)
      });

      this.log('info', `Non-existent email test for ${credential.name}`, {
        status: nonExistentResponse.status,
        error: nonExistentResponse.body?.error || nonExistentResponse.body?.message,
        correlationId: nonExistentResponse.headers['x-correlation-id'],
        sameErrorAsOriginal: (loginResponse.body?.error === nonExistentResponse.body?.error)
      });

      return {
        originalLogin: loginResponse,
        wrongPassword: wrongPasswordResponse,
        nonExistentEmail: nonExistentResponse
      };

    } catch (error) {
      this.log('error', `Database check failed for ${credential.name}`, {
        error: error.message
      });
      return { error: error.message };
    }
  }

  async testBrandResolution() {
    this.log('info', 'Testing brand resolution logic');

    // Test with different platform values to see how brand resolution works
    const testCases = [
      { platform: 'realtutorialhub', expectedBrand: 'RTH' },
      { platform: 'skillup', expectedBrand: 'SkillUp' },
      { platform: 'invalid', expectedBrand: 'Unknown' },
      { platform: undefined, expectedBrand: 'Default' }
    ];

    for (const testCase of testCases) {
      const payload = {
        email: 'test@example.com',
        password: 'test',
        platform: testCase.platform
      };

      try {
        const response = await this.makeRequest('https://api.realtutorialhub.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://user.realtutorialhub.com'
          },
          body: JSON.stringify(payload)
        });

        this.log('info', `Brand resolution test: ${testCase.platform} → ${testCase.expectedBrand}`, {
          platform: testCase.platform,
          status: response.status,
          error: response.body?.error,
          correlationId: response.headers['x-correlation-id']
        });

      } catch (error) {
        this.log('error', `Brand resolution test failed for ${testCase.platform}`, {
          error: error.message
        });
      }
    }
  }

  async runChecks() {
    this.log('info', '🔍 Starting Database User Verification');

    // Test brand resolution
    await this.testBrandResolution();

    // Test each credential
    for (const credential of TEST_CREDENTIALS) {
      this.log('info', `\n=== Checking ${credential.name} ===`);
      await this.testUserExistence(credential);
    }

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE USER VERIFICATION REPORT');
    console.log('='.repeat(60));

    console.log('\n🔍 ANALYSIS:');
    console.log('1. If all three tests (original, wrong password, non-existent email) return the same error,');
    console.log('   then the system is using a generic "Invalid credentials" message for security.');
    console.log('');
    console.log('2. If the errors are different, it indicates:');
    console.log('   - User exists but password is wrong (different error for wrong password)');
    console.log('   - User does not exist (same error as non-existent email)');
    console.log('');
    console.log('3. Check the correlation IDs to trace the requests in the backend logs.');

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Check the backend logs using the correlation IDs above');
    console.log('2. Verify database connectivity to rth_prod and skillup_prod');
    console.log('3. Check if users exist in the correct brand databases');
    console.log('4. Verify password hashing algorithm matches');
    console.log('5. Test brand resolution logic in the backend');

    console.log('\n🏁 Verification completed at', new Date().toISOString());
  }
}

// Run the checks
async function main() {
  const checker = new DatabaseUserChecker();
  
  try {
    await checker.runChecks();
  } catch (error) {
    console.error('💥 Database check script failed:', error);
    process.exit(1);
  }
}

main();