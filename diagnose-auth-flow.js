#!/usr/bin/env node

/**
 * Comprehensive Authentication Flow Diagnostic Script
 * Tests the complete sign-in journey from application layer to infrastructure layer
 * 
 * Test Credentials:
 * - RTH: ajayshah@gmail.com / testing
 * - SkillUp: student@skillupitacademy.com / testing
 */

const https = require('https');
const http = require('http');

// Configuration for different environments
const ENVIRONMENTS = {
  production: {
    rth: {
      frontend: 'https://user.realtutorialhub.com',
      api: 'https://api.realtutorialhub.com',
      gateway: 'https://api.realtutorialhub.com'
    },
    skillup: {
      frontend: 'https://user.skillupitacademy.com',
      api: 'https://api.skillupitacademy.com',
      gateway: 'https://api.skillupitacademy.com'
    }
  },
  local: {
    api: 'http://localhost:3001',
    gateway: 'http://localhost:8787'
  }
};

const TEST_CREDENTIALS = [
  {
    brand: 'realtutorialhub',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'RTH User'
  },
  {
    brand: 'skillup',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    name: 'SkillUp User'
  }
];

class AuthFlowDiagnostic {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      elapsed: Date.now() - this.startTime
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
    
    this.results.push(logEntry);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'AuthFlowDiagnostic/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: 30000
      };

      if (options.body) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
      }

      const req = client.request(requestOptions, (res) => {
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

  async testHealthEndpoint(url, name) {
    this.log('info', `Testing ${name} health endpoint`);
    
    try {
      // Try multiple health endpoints
      const healthPaths = ['/api/health', '/api/healthz', '/health', '/healthz'];
      let response = null;
      
      for (const path of healthPaths) {
        try {
          response = await this.makeRequest(`${url}${path}`);
          if (response.status === 200) {
            break;
          }
        } catch (error) {
          // Continue to next path
          continue;
        }
      }
      
      if (response && response.status === 200) {
        this.log('success', `${name} is healthy`, {
          status: response.status,
          body: response.body
        });
        return true;
      } else {
        this.log('warning', `${name} health check returned non-200`, {
          status: response?.status || 'no response',
          body: response?.body || 'no body'
        });
        return false;
      }
    } catch (error) {
      this.log('error', `${name} health check failed`, {
        error: error.message
      });
      return false;
    }
  }

  async testDirectApiLogin(credential, apiUrl) {
    this.log('info', `Testing direct API login for ${credential.name}`, {
      email: credential.email,
      brand: credential.brand,
      apiUrl
    });

    const loginPayload = {
      email: credential.email,
      password: credential.password,
      platform: credential.brand
    };

    try {
      const response = await this.makeRequest(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': credential.brand === 'realtutorialhub' 
            ? 'https://quiz.realtutorialhub.com' 
            : 'https://app.skillupitacademy.com'
        },
        body: JSON.stringify(loginPayload)
      });

      if (response.status === 200) {
        this.log('success', `Direct API login successful for ${credential.name}`, {
          status: response.status,
          hasAccessToken: !!response.body?.user,
          userId: response.body?.user?.id,
          email: response.body?.user?.email
        });
        return { success: true, response };
      } else {
        this.log('error', `Direct API login failed for ${credential.name}`, {
          status: response.status,
          error: response.body?.error || response.body?.message || response.rawBody,
          headers: response.headers
        });
        return { success: false, response };
      }
    } catch (error) {
      this.log('error', `Direct API login request failed for ${credential.name}`, {
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async testGatewayLogin(credential, gatewayUrl) {
    this.log('info', `Testing gateway login for ${credential.name}`, {
      email: credential.email,
      brand: credential.brand,
      gatewayUrl
    });

    const loginPayload = {
      email: credential.email,
      password: credential.password,
      platform: credential.brand
    };

    try {
      const response = await this.makeRequest(`${gatewayUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': credential.brand === 'realtutorialhub' 
            ? 'https://quiz.realtutorialhub.com' 
            : 'https://app.skillupitacademy.com'
        },
        body: JSON.stringify(loginPayload)
      });

      if (response.status === 200) {
        this.log('success', `Gateway login successful for ${credential.name}`, {
          status: response.status,
          hasAccessToken: !!response.body?.user,
          userId: response.body?.user?.id,
          email: response.body?.user?.email
        });
        return { success: true, response };
      } else {
        this.log('error', `Gateway login failed for ${credential.name}`, {
          status: response.status,
          error: response.body?.error || response.body?.message || response.rawBody,
          headers: response.headers
        });
        return { success: false, response };
      }
    } catch (error) {
      this.log('error', `Gateway login request failed for ${credential.name}`, {
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async testFrontendLogin(credential, frontendUrl) {
    this.log('info', `Testing frontend login flow for ${credential.name}`, {
      email: credential.email,
      brand: credential.brand,
      frontendUrl
    });

    try {
      // First, get the login page to check if it's accessible
      const loginPageResponse = await this.makeRequest(`${frontendUrl}/login`);
      
      if (loginPageResponse.status !== 200) {
        this.log('error', `Frontend login page not accessible for ${credential.name}`, {
          status: loginPageResponse.status,
          url: `${frontendUrl}/login`
        });
        return { success: false, response: loginPageResponse };
      }

      this.log('info', `Frontend login page accessible for ${credential.name}`, {
        status: loginPageResponse.status
      });

      // Try to find the API endpoint from the frontend
      // This would typically be done by the frontend JavaScript
      const apiEndpoint = `${frontendUrl}/api/auth/login`;
      
      const loginPayload = {
        email: credential.email,
        password: credential.password,
        platform: credential.brand
      };

      const response = await this.makeRequest(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': frontendUrl,
          'Referer': `${frontendUrl}/login`
        },
        body: JSON.stringify(loginPayload)
      });

      if (response.status === 200) {
        this.log('success', `Frontend login successful for ${credential.name}`, {
          status: response.status,
          hasAccessToken: !!response.body?.user,
          userId: response.body?.user?.id,
          email: response.body?.user?.email
        });
        return { success: true, response };
      } else {
        this.log('error', `Frontend login failed for ${credential.name}`, {
          status: response.status,
          error: response.body?.error || response.body?.message || response.rawBody,
          headers: response.headers
        });
        return { success: false, response };
      }
    } catch (error) {
      this.log('error', `Frontend login request failed for ${credential.name}`, {
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async testEnvironmentVariables() {
    this.log('info', 'Checking environment variables');
    
    const envVars = [
      'DATABASE_URL_RTH',
      'DATABASE_URL_SKILLUP', 
      'DATABASE_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'NODE_ENV'
    ];

    const envStatus = {};
    envVars.forEach(varName => {
      envStatus[varName] = process.env[varName] ? 'SET' : 'MISSING';
    });

    this.log('info', 'Environment variables status', envStatus);
    return envStatus;
  }

  async runDiagnostics() {
    this.log('info', '🚀 Starting Authentication Flow Diagnostics');
    
    // Test environment variables
    await this.testEnvironmentVariables();

    // Test health endpoints
    this.log('info', '📊 Testing Health Endpoints');
    const healthResults = {};
    
    // Test production API
    healthResults.productionApi = await this.testHealthEndpoint(
      ENVIRONMENTS.production.rth.api, 
      'Production API Server'
    );

    // Test local API if available
    healthResults.localApi = await this.testHealthEndpoint(
      ENVIRONMENTS.local.api, 
      'Local API Server'
    );

    // Test gateways
    healthResults.rthGateway = await this.testHealthEndpoint(
      ENVIRONMENTS.production.rth.gateway, 
      'RTH Gateway'
    );

    healthResults.skillupGateway = await this.testHealthEndpoint(
      ENVIRONMENTS.production.skillup.gateway, 
      'SkillUp Gateway'
    );

    // Test authentication for each credential
    this.log('info', '🔐 Testing Authentication Flows');
    
    for (const credential of TEST_CREDENTIALS) {
      this.log('info', `\n=== Testing ${credential.name} (${credential.email}) ===`);

      // Test 1: Direct API Server Login (Production)
      if (healthResults.productionApi) {
        await this.testDirectApiLogin(credential, ENVIRONMENTS.production.rth.api);
      }

      // Test 2: Direct API Server Login (Local)
      if (healthResults.localApi) {
        await this.testDirectApiLogin(credential, ENVIRONMENTS.local.api);
      }

      // Test 3: Gateway Login
      const gatewayUrl = credential.brand === 'realtutorialhub' 
        ? ENVIRONMENTS.production.rth.gateway 
        : ENVIRONMENTS.production.skillup.gateway;
      
      if (credential.brand === 'realtutorialhub' ? healthResults.rthGateway : healthResults.skillupGateway) {
        await this.testGatewayLogin(credential, gatewayUrl);
      }

      // Test 4: Frontend Login Flow
      const frontendUrl = credential.brand === 'realtutorialhub' 
        ? ENVIRONMENTS.production.rth.frontend 
        : ENVIRONMENTS.production.skillup.frontend;
      
      await this.testFrontendLogin(credential, frontendUrl);
    }

    // Generate summary report
    this.generateSummaryReport();
  }

  generateSummaryReport() {
    this.log('info', '\n📋 DIAGNOSTIC SUMMARY REPORT');
    
    const errors = this.results.filter(r => r.level === 'error');
    const warnings = this.results.filter(r => r.level === 'warning');
    const successes = this.results.filter(r => r.level === 'success');

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY STATISTICS');
    console.log('='.repeat(60));
    console.log(`✅ Successful operations: ${successes.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⏱️  Total execution time: ${Date.now() - this.startTime}ms`);

    if (errors.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('CRITICAL ISSUES FOUND');
      console.log('='.repeat(60));
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.message}`);
        if (error.data && Object.keys(error.data).length > 0) {
          console.log(`   Details:`, JSON.stringify(error.data, null, 2));
        }
      });
    }

    if (warnings.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('WARNINGS');
      console.log('='.repeat(60));
      warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.message}`);
        if (warning.data && Object.keys(warning.data).length > 0) {
          console.log(`   Details:`, JSON.stringify(warning.data, null, 2));
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(60));

    if (errors.some(e => e.message.includes('Invalid credentials'))) {
      console.log('🔍 INVALID CREDENTIALS DETECTED:');
      console.log('   1. Check if users exist in the correct brand databases');
      console.log('   2. Verify password hashes are correct');
      console.log('   3. Check brand resolution logic');
      console.log('   4. Verify database connections are working');
    }

    if (errors.some(e => e.message.includes('health check failed'))) {
      console.log('🏥 SERVICE HEALTH ISSUES:');
      console.log('   1. Check if services are deployed and running');
      console.log('   2. Verify network connectivity');
      console.log('   3. Check service logs for errors');
    }

    if (errors.some(e => e.message.includes('timeout'))) {
      console.log('⏰ TIMEOUT ISSUES:');
      console.log('   1. Check network latency');
      console.log('   2. Verify service performance');
      console.log('   3. Consider increasing timeout values');
    }

    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS');
    console.log('='.repeat(60));
    console.log('1. Review the detailed logs above');
    console.log('2. Focus on the critical issues first');
    console.log('3. Check database connectivity and user data');
    console.log('4. Verify environment variables are set correctly');
    console.log('5. Test with a known working user account');
    
    console.log('\n🏁 Diagnostic completed at', new Date().toISOString());
  }
}

// Run the diagnostics
async function main() {
  const diagnostic = new AuthFlowDiagnostic();
  
  try {
    await diagnostic.runDiagnostics();
  } catch (error) {
    console.error('💥 Diagnostic script failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Diagnostic interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();