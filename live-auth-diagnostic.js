#!/usr/bin/env node

/**
 * Live Authentication Diagnostic Script
 * 
 * This script performs a comprehensive test of the authentication flow
 * from application layer to infrastructure layer to identify why
 * test users are getting "Invalid credentials" errors.
 * 
 * Test Users:
 * - RTH: ajayshah@gmail.com / testing
 * - SkillUp: student@skillupitacademy.com / testing
 * 
 * URLs:
 * - RTH: https://user.realtutorialhub.com/login
 * - SkillUp: https://user.skillupitacademy.com/login
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Import fetch for Node.js
let fetch;
(async () => {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
})();

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const TEST_USERS = {
  rth: {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    loginUrl: 'https://user.realtutorialhub.com/login',
    apiUrl: 'https://api.realtutorialhub.com/api/auth/login',
    brand: 'realtutorialhub',
    dbUrl: process.env.DATABASE_URL_RTH,
    expectedDashboard: 'https://user.realtutorialhub.com/dashboard'
  },
  skillup: {
    email: 'student@skillupitacademy.com',
    password: 'testing',
    loginUrl: 'https://user.skillupitacademy.com/login',
    apiUrl: 'https://api.skillupitacademy.com/api/auth/login',
    brand: 'skillup',
    dbUrl: process.env.DATABASE_URL_SKILLUP,
    expectedDashboard: 'https://user.skillupitacademy.com/dashboard'
  }
};

class LiveAuthDiagnostic {
  constructor() {
    this.results = {
      infrastructure: {},
      database: {},
      authentication: {},
      summary: {}
    };
  }

  log(section, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${section.toUpperCase()}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async testInfrastructure() {
    this.log('INFRA', '🔍 Testing Infrastructure Layer...');
    
    // Ensure fetch is available
    if (!fetch) {
      const { default: nodeFetch } = await import('node-fetch');
      fetch = nodeFetch;
    }
    
    for (const [brandKey, config] of Object.entries(TEST_USERS)) {
      this.log('INFRA', `Testing ${brandKey.toUpperCase()} infrastructure`);
      
      try {
        // Test login page accessibility
        const loginPageResponse = await fetch(config.loginUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'LiveAuthDiagnostic/1.0'
          }
        });
        
        this.results.infrastructure[`${brandKey}_login_page`] = {
          status: loginPageResponse.status,
          accessible: loginPageResponse.ok,
          headers: Object.fromEntries(loginPageResponse.headers.entries())
        };
        
        // Test API endpoint accessibility
        const apiResponse = await fetch(config.apiUrl, {
          method: 'OPTIONS',
          headers: {
            'Origin': config.loginUrl.replace('/login', ''),
            'User-Agent': 'LiveAuthDiagnostic/1.0'
          }
        });
        
        this.results.infrastructure[`${brandKey}_api_endpoint`] = {
          status: apiResponse.status,
          accessible: apiResponse.ok || apiResponse.status === 405, // OPTIONS might not be allowed
          headers: Object.fromEntries(apiResponse.headers.entries())
        };
        
        this.log('INFRA', `✅ ${brandKey.toUpperCase()} infrastructure check completed`);
        
      } catch (error) {
        this.log('INFRA', `❌ ${brandKey.toUpperCase()} infrastructure error: ${error.message}`);
        this.results.infrastructure[`${brandKey}_error`] = error.message;
      }
    }
  }

  async testDatabaseConnectivity() {
    this.log('DATABASE', '🔍 Testing Database Layer...');
    
    for (const [brandKey, config] of Object.entries(TEST_USERS)) {
      this.log('DATABASE', `Testing ${brandKey.toUpperCase()} database connectivity`);
      
      const client = new Client({
        connectionString: config.dbUrl,
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        await client.connect();
        this.log('DATABASE', `✅ Connected to ${brandKey.toUpperCase()} database`);
        
        // Test basic connectivity
        const versionResult = await client.query('SELECT version()');
        this.results.database[`${brandKey}_connection`] = {
          connected: true,
          version: versionResult.rows[0].version.substring(0, 50) + '...'
        };
        
        // Check if user exists
        const userQuery = `
          SELECT 
            u.id,
            u.email,
            u.password_hash,
            u.email_verified,
            u.is_blocked,
            u.created_at,
            p.name as profile_name,
            array_agg(r.name) as roles
          FROM users u
          LEFT JOIN user_profiles p ON u.id = p.user_id
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.email = $1
          GROUP BY u.id, u.email, u.password_hash, u.email_verified, u.is_blocked, u.created_at, p.name
        `;
        
        const userResult = await client.query(userQuery, [config.email]);
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          this.log('DATABASE', `✅ User found in ${brandKey.toUpperCase()} database`);
          
          // Test password verification
          const passwordMatch = await bcrypt.compare(config.password, user.password_hash);
          
          this.results.database[`${brandKey}_user`] = {
            exists: true,
            id: user.id,
            email: user.email,
            emailVerified: user.email_verified,
            isBlocked: user.is_blocked,
            profileName: user.profile_name,
            roles: user.roles.filter(r => r !== null),
            passwordMatch: passwordMatch,
            createdAt: user.created_at
          };
          
          this.log('DATABASE', `Password verification: ${passwordMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
          
        } else {
          this.log('DATABASE', `❌ User NOT found in ${brandKey.toUpperCase()} database`);
          this.results.database[`${brandKey}_user`] = {
            exists: false,
            email: config.email
          };
        }
        
        // Check roles table
        const rolesResult = await client.query('SELECT id, name FROM roles ORDER BY name');
        this.results.database[`${brandKey}_roles`] = rolesResult.rows;
        
        await client.end();
        
      } catch (error) {
        this.log('DATABASE', `❌ ${brandKey.toUpperCase()} database error: ${error.message}`);
        this.results.database[`${brandKey}_error`] = error.message;
        try {
          await client.end();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  async testAuthentication() {
    this.log('AUTH', '🔍 Testing Authentication Layer...');
    
    // Ensure fetch is available
    if (!fetch) {
      const { default: nodeFetch } = await import('node-fetch');
      fetch = nodeFetch;
    }
    
    for (const [brandKey, config] of Object.entries(TEST_USERS)) {
      this.log('AUTH', `Testing ${brandKey.toUpperCase()} authentication flow`);
      
      const correlationId = crypto.randomUUID();
      
      try {
        // Prepare authentication request
        const authPayload = {
          email: config.email,
          password: config.password,
          platform: config.brand
        };
        
        this.log('AUTH', `Sending authentication request with correlation ID: ${correlationId}`);
        
        const authResponse = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': config.loginUrl.replace('/login', ''),
            'Referer': config.loginUrl,
            'User-Agent': 'LiveAuthDiagnostic/1.0',
            'X-Correlation-ID': correlationId,
            'Accept': 'application/json'
          },
          body: JSON.stringify(authPayload)
        });
        
        const responseText = await authResponse.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { raw: responseText };
        }
        
        this.results.authentication[`${brandKey}_request`] = {
          correlationId: correlationId,
          status: authResponse.status,
          statusText: authResponse.statusText,
          headers: Object.fromEntries(authResponse.headers.entries()),
          response: responseData,
          success: authResponse.ok
        };
        
        if (authResponse.ok) {
          this.log('AUTH', `✅ ${brandKey.toUpperCase()} authentication SUCCESS`);
          
          // Check if we got expected response structure
          if (responseData.data && responseData.data.user) {
            this.log('AUTH', `✅ Valid user data received`);
            this.results.authentication[`${brandKey}_user_data`] = responseData.data.user;
          }
          
          // Check cookies
          const setCookieHeaders = authResponse.headers.get('set-cookie');
          if (setCookieHeaders) {
            this.log('AUTH', `✅ Authentication cookies set`);
            this.results.authentication[`${brandKey}_cookies`] = setCookieHeaders;
          }
          
        } else {
          this.log('AUTH', `❌ ${brandKey.toUpperCase()} authentication FAILED: ${authResponse.status} ${authResponse.statusText}`);
          this.log('AUTH', `Response: ${JSON.stringify(responseData, null, 2)}`);
        }
        
      } catch (error) {
        this.log('AUTH', `❌ ${brandKey.toUpperCase()} authentication error: ${error.message}`);
        this.results.authentication[`${brandKey}_error`] = {
          correlationId: correlationId,
          error: error.message,
          stack: error.stack
        };
      }
    }
  }

  async testWithWrongCredentials() {
    this.log('AUTH', '🔍 Testing with wrong credentials for comparison...');
    
    // Ensure fetch is available
    if (!fetch) {
      const { default: nodeFetch } = await import('node-fetch');
      fetch = nodeFetch;
    }
    
    for (const [brandKey, config] of Object.entries(TEST_USERS)) {
      const correlationId = crypto.randomUUID();
      
      try {
        const authPayload = {
          email: config.email,
          password: 'wrong-password',
          platform: config.brand
        };
        
        const authResponse = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': config.loginUrl.replace('/login', ''),
            'X-Correlation-ID': correlationId,
            'Accept': 'application/json'
          },
          body: JSON.stringify(authPayload)
        });
        
        const responseData = await authResponse.json().catch(() => ({}));
        
        this.results.authentication[`${brandKey}_wrong_password`] = {
          correlationId: correlationId,
          status: authResponse.status,
          response: responseData
        };
        
        this.log('AUTH', `Wrong password test for ${brandKey.toUpperCase()}: ${authResponse.status}`);
        
      } catch (error) {
        this.log('AUTH', `Wrong password test error for ${brandKey.toUpperCase()}: ${error.message}`);
      }
    }
  }

  generateSummary() {
    this.log('SUMMARY', '📊 Generating diagnostic summary...');
    
    const summary = {
      infrastructure_status: 'unknown',
      database_status: 'unknown',
      authentication_status: 'unknown',
      root_cause: 'unknown',
      recommendations: []
    };
    
    // Check infrastructure
    const infraIssues = [];
    for (const [key, result] of Object.entries(this.results.infrastructure)) {
      if (key.includes('_error') || (result.accessible === false)) {
        infraIssues.push(key);
      }
    }
    summary.infrastructure_status = infraIssues.length === 0 ? 'healthy' : 'issues';
    
    // Check database
    const dbIssues = [];
    const usersExist = [];
    const passwordMatches = [];
    
    for (const [key, result] of Object.entries(this.results.database)) {
      if (key.includes('_error')) {
        dbIssues.push(key);
      } else if (key.includes('_user')) {
        if (result.exists) {
          usersExist.push(key);
          if (result.passwordMatch) {
            passwordMatches.push(key);
          }
        }
      }
    }
    
    summary.database_status = dbIssues.length === 0 ? 'healthy' : 'issues';
    summary.users_exist = usersExist.length;
    summary.passwords_match = passwordMatches.length;
    
    // Check authentication
    const authSuccesses = [];
    const authFailures = [];
    
    for (const [key, result] of Object.entries(this.results.authentication)) {
      if (key.includes('_request')) {
        if (result.success) {
          authSuccesses.push(key);
        } else {
          authFailures.push(key);
        }
      }
    }
    
    summary.authentication_status = authSuccesses.length > 0 ? 'working' : 'failing';
    summary.auth_successes = authSuccesses.length;
    summary.auth_failures = authFailures.length;
    
    // Determine root cause
    if (summary.users_exist === 0) {
      summary.root_cause = 'users_missing';
      summary.recommendations.push('Create test users in brand databases');
      summary.recommendations.push('Use provided SQL statements from AUTHENTICATION_ISSUE_REPORT.md');
    } else if (summary.passwords_match === 0) {
      summary.root_cause = 'password_mismatch';
      summary.recommendations.push('Update password hashes for test users');
      summary.recommendations.push('Verify bcrypt salt rounds (should be 12)');
    } else if (summary.infrastructure_status === 'issues') {
      summary.root_cause = 'infrastructure_issues';
      summary.recommendations.push('Fix infrastructure connectivity issues');
    } else if (summary.auth_failures > 0) {
      summary.root_cause = 'authentication_logic';
      summary.recommendations.push('Check backend authentication logic');
      summary.recommendations.push('Verify environment variables in production');
      summary.recommendations.push('Check brand resolution logic');
    } else {
      summary.root_cause = 'unknown';
      summary.recommendations.push('Manual investigation required');
    }
    
    this.results.summary = summary;
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(80));
    console.log(`Infrastructure: ${summary.infrastructure_status.toUpperCase()}`);
    console.log(`Database: ${summary.database_status.toUpperCase()}`);
    console.log(`Users Exist: ${summary.users_exist}/2`);
    console.log(`Passwords Match: ${summary.passwords_match}/2`);
    console.log(`Authentication: ${summary.authentication_status.toUpperCase()}`);
    console.log(`Auth Successes: ${summary.auth_successes}/2`);
    console.log(`Auth Failures: ${summary.auth_failures}/2`);
    console.log(`\nRoot Cause: ${summary.root_cause.toUpperCase()}`);
    console.log('\nRecommendations:');
    summary.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    console.log('='.repeat(80));
  }

  async run() {
    console.log('🚀 Starting Live Authentication Diagnostic');
    console.log('Testing URLs:');
    console.log('- RTH: https://user.realtutorialhub.com/login');
    console.log('- SkillUp: https://user.skillupitacademy.com/login');
    console.log('');
    
    try {
      await this.testInfrastructure();
      console.log('');
      
      await this.testDatabaseConnectivity();
      console.log('');
      
      await this.testAuthentication();
      console.log('');
      
      await this.testWithWrongCredentials();
      console.log('');
      
      this.generateSummary();
      
      // Save detailed results
      const fs = require('fs');
      const resultsFile = `live-auth-diagnostic-results-${Date.now()}.json`;
      fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
      
      // Print correlation IDs for backend log investigation
      console.log('\n🔍 CORRELATION IDs FOR BACKEND LOGS:');
      for (const [key, result] of Object.entries(this.results.authentication)) {
        if (result.correlationId) {
          console.log(`${key}: ${result.correlationId}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      process.exit(1);
    }
  }
}

// Run the diagnostic
if (require.main === module) {
  const diagnostic = new LiveAuthDiagnostic();
  diagnostic.run().catch(console.error);
}

module.exports = LiveAuthDiagnostic;