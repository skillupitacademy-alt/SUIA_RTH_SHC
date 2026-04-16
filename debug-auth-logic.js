#!/usr/bin/env node

/**
 * Debug Authentication Logic Script
 * 
 * This script tests the specific authentication logic path to identify
 * where the production authentication is failing despite users existing
 * in the databases with correct passwords.
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const TEST_CASES = [
  {
    brand: 'realtutorialhub',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    dbUrl: process.env.DATABASE_URL_RTH,
    expectedRoles: ['user']
  },
  {
    brand: 'skillup',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    dbUrl: process.env.DATABASE_URL_SKILLUP,
    expectedRoles: ['student']
  }
];

class AuthLogicDebugger {
  constructor() {
    this.results = {};
  }

  log(section, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${section}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async testBrandDatabaseBinding(testCase) {
    this.log('BRAND_DB', `🔍 Testing brand database binding for ${testCase.brand}`);
    
    const client = new Client({
      connectionString: testCase.dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      this.log('BRAND_DB', `✅ Connected to ${testCase.brand} database`);

      // Test the exact query that the backend uses
      const userQuery = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.email_verified,
          u.is_blocked,
          u.created_at,
          u.updated_at,
          u.shadow_user_id,
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'professional_status', p.professional_status,
              'education_level', p.education_level
            )
          ) FILTER (WHERE p.id IS NOT NULL) as profile,
          json_agg(
            json_build_object(
              'role', json_build_object(
                'id', r.id,
                'name', r.name
              )
            )
          ) FILTER (WHERE r.id IS NOT NULL) as user_roles
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1
        GROUP BY u.id, u.email, u.password_hash, u.email_verified, u.is_blocked, u.created_at, u.updated_at, u.shadow_user_id
      `;

      const userResult = await client.query(userQuery, [testCase.email]);

      if (userResult.rows.length === 0) {
        this.log('BRAND_DB', `❌ User not found with backend query`);
        this.results[`${testCase.brand}_backend_query`] = {
          found: false,
          email: testCase.email
        };
        return false;
      }

      const user = userResult.rows[0];
      this.log('BRAND_DB', `✅ User found with backend query`);

      // Test password verification
      const passwordMatch = await bcrypt.compare(testCase.password, user.password_hash);
      this.log('BRAND_DB', `Password verification: ${passwordMatch ? '✅ MATCH' : '❌ NO MATCH'}`);

      // Check if user is blocked
      if (user.is_blocked) {
        this.log('BRAND_DB', `❌ User is blocked`);
      }

      // Check email verification
      if (!user.email_verified) {
        this.log('BRAND_DB', `⚠️  Email not verified`);
      }

      // Parse roles
      const roles = user.user_roles || [];
      const roleNames = roles.map(ur => ur.role?.name).filter(name => name);

      this.results[`${testCase.brand}_backend_query`] = {
        found: true,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_verified,
          isBlocked: user.is_blocked,
          shadowUserId: user.shadow_user_id,
          profile: user.profile,
          roles: roleNames,
          passwordMatch: passwordMatch,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      };

      return passwordMatch && !user.is_blocked;

    } catch (error) {
      this.log('BRAND_DB', `❌ Database error: ${error.message}`);
      this.results[`${testCase.brand}_backend_query`] = {
        found: false,
        error: error.message
      };
      return false;
    } finally {
      try {
        await client.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async testEnvironmentVariables() {
    this.log('ENV', '🔍 Testing environment variables...');

    const requiredEnvVars = [
      'DATABASE_URL_RTH',
      'DATABASE_URL_SKILLUP',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'NODE_ENV'
    ];

    const envResults = {};

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      envResults[envVar] = {
        exists: !!value,
        length: value ? value.length : 0,
        preview: value ? `${value.substring(0, 20)}...` : null
      };

      if (value) {
        this.log('ENV', `✅ ${envVar}: Set (${value.length} chars)`);
      } else {
        this.log('ENV', `❌ ${envVar}: Missing`);
      }
    }

    this.results.environment_variables = envResults;
  }

  async testBrandResolution() {
    this.log('BRAND', '🔍 Testing brand resolution logic...');

    const brandTests = [
      { platform: 'realtutorialhub', expected: 'realtutorialhub' },
      { platform: 'skillup', expected: 'skillup' },
      { platform: null, expected: null },
      { platform: 'invalid', expected: null }
    ];

    const brandResults = {};

    for (const test of brandTests) {
      // Simulate the brand resolution logic from the backend
      let resolvedBrand = null;
      
      if (test.platform === 'realtutorialhub' || test.platform === 'skillup') {
        resolvedBrand = test.platform;
      }

      const passed = resolvedBrand === test.expected;
      brandResults[`platform_${test.platform || 'null'}`] = {
        input: test.platform,
        expected: test.expected,
        resolved: resolvedBrand,
        passed: passed
      };

      this.log('BRAND', `Platform "${test.platform}" → "${resolvedBrand}" ${passed ? '✅' : '❌'}`);
    }

    this.results.brand_resolution = brandResults;
  }

  async testPasswordHashing() {
    this.log('PASSWORD', '🔍 Testing password hashing consistency...');

    const testPassword = 'testing';
    const saltRounds = 12;

    try {
      // Generate new hash
      const newHash = await bcrypt.hash(testPassword, saltRounds);
      
      // Test verification
      const verificationResult = await bcrypt.compare(testPassword, newHash);
      
      this.log('PASSWORD', `✅ Password hashing test: ${verificationResult ? 'PASS' : 'FAIL'}`);

      // Test against known hashes from database
      for (const testCase of TEST_CASES) {
        if (this.results[`${testCase.brand}_backend_query`]?.user?.passwordMatch !== undefined) {
          const dbResult = this.results[`${testCase.brand}_backend_query`].user.passwordMatch;
          this.log('PASSWORD', `${testCase.brand} DB hash verification: ${dbResult ? '✅ PASS' : '❌ FAIL'}`);
        }
      }

      this.results.password_hashing = {
        saltRounds: saltRounds,
        newHashGeneration: verificationResult,
        testPassword: testPassword
      };

    } catch (error) {
      this.log('PASSWORD', `❌ Password hashing error: ${error.message}`);
      this.results.password_hashing = {
        error: error.message
      };
    }
  }

  async testSecurityChecks() {
    this.log('SECURITY', '🔍 Testing security checks...');

    // Test if there are any login attempts or security locks
    for (const testCase of TEST_CASES) {
      const client = new Client({
        connectionString: testCase.dbUrl,
        ssl: { rejectUnauthorized: false }
      });

      try {
        await client.connect();

        // Check login attempts
        const attemptsQuery = `
          SELECT 
            email,
            ip_address,
            success,
            created_at,
            COUNT(*) as attempt_count
          FROM login_attempts 
          WHERE email = $1 
            AND created_at > NOW() - INTERVAL '1 hour'
          GROUP BY email, ip_address, success, created_at
          ORDER BY created_at DESC
          LIMIT 10
        `;

        const attemptsResult = await client.query(attemptsQuery, [testCase.email]);
        
        this.results[`${testCase.brand}_login_attempts`] = {
          recentAttempts: attemptsResult.rows.length,
          attempts: attemptsResult.rows
        };

        if (attemptsResult.rows.length > 0) {
          this.log('SECURITY', `${testCase.brand}: ${attemptsResult.rows.length} recent login attempts`);
        } else {
          this.log('SECURITY', `${testCase.brand}: No recent login attempts`);
        }

        await client.end();

      } catch (error) {
        this.log('SECURITY', `❌ Security check error for ${testCase.brand}: ${error.message}`);
        this.results[`${testCase.brand}_login_attempts`] = {
          error: error.message
        };
        try {
          await client.end();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  generateSummary() {
    this.log('SUMMARY', '📊 Generating debug summary...');

    const summary = {
      database_queries: 'unknown',
      environment_variables: 'unknown',
      brand_resolution: 'unknown',
      password_hashing: 'unknown',
      security_checks: 'unknown',
      likely_issues: []
    };

    // Check database queries
    let dbQueriesPass = 0;
    for (const testCase of TEST_CASES) {
      const result = this.results[`${testCase.brand}_backend_query`];
      if (result?.found && result?.user?.passwordMatch) {
        dbQueriesPass++;
      }
    }
    summary.database_queries = dbQueriesPass === TEST_CASES.length ? 'pass' : 'fail';

    // Check environment variables
    const envResult = this.results.environment_variables;
    const requiredVars = ['DATABASE_URL_RTH', 'DATABASE_URL_SKILLUP', 'JWT_SECRET'];
    const envPass = requiredVars.every(varName => envResult?.[varName]?.exists);
    summary.environment_variables = envPass ? 'pass' : 'fail';

    // Check brand resolution
    const brandResult = this.results.brand_resolution;
    const brandPass = Object.values(brandResult || {}).every(test => test.passed);
    summary.brand_resolution = brandPass ? 'pass' : 'fail';

    // Check password hashing
    const passwordResult = this.results.password_hashing;
    summary.password_hashing = passwordResult?.newHashGeneration ? 'pass' : 'fail';

    // Check security
    let securityIssues = 0;
    for (const testCase of TEST_CASES) {
      const attempts = this.results[`${testCase.brand}_login_attempts`];
      if (attempts?.error) {
        securityIssues++;
      }
    }
    summary.security_checks = securityIssues === 0 ? 'pass' : 'issues';

    // Identify likely issues
    if (summary.database_queries === 'fail') {
      summary.likely_issues.push('Database query structure mismatch');
    }
    if (summary.environment_variables === 'fail') {
      summary.likely_issues.push('Missing or incorrect environment variables in production');
    }
    if (summary.brand_resolution === 'fail') {
      summary.likely_issues.push('Brand resolution logic error');
    }
    if (summary.password_hashing === 'fail') {
      summary.likely_issues.push('Password hashing/verification inconsistency');
    }

    // If all local tests pass, the issue is likely in production environment
    if (summary.database_queries === 'pass' && 
        summary.environment_variables === 'pass' && 
        summary.brand_resolution === 'pass' && 
        summary.password_hashing === 'pass') {
      summary.likely_issues.push('Production environment configuration mismatch');
      summary.likely_issues.push('Production database connection using different credentials');
      summary.likely_issues.push('Production brand database binding not working');
    }

    this.results.summary = summary;

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 AUTHENTICATION LOGIC DEBUG SUMMARY');
    console.log('='.repeat(80));
    console.log(`Database Queries: ${summary.database_queries.toUpperCase()}`);
    console.log(`Environment Variables: ${summary.environment_variables.toUpperCase()}`);
    console.log(`Brand Resolution: ${summary.brand_resolution.toUpperCase()}`);
    console.log(`Password Hashing: ${summary.password_hashing.toUpperCase()}`);
    console.log(`Security Checks: ${summary.security_checks.toUpperCase()}`);
    console.log('\nLikely Issues:');
    summary.likely_issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    console.log('='.repeat(80));
  }

  async run() {
    console.log('🚀 Starting Authentication Logic Debug');
    console.log('This will test the backend authentication logic components');
    console.log('');

    try {
      await this.testEnvironmentVariables();
      console.log('');

      await this.testBrandResolution();
      console.log('');

      await this.testPasswordHashing();
      console.log('');

      for (const testCase of TEST_CASES) {
        await this.testBrandDatabaseBinding(testCase);
        console.log('');
      }

      await this.testSecurityChecks();
      console.log('');

      this.generateSummary();

      // Save results
      const fs = require('fs');
      const resultsFile = `auth-logic-debug-results-${Date.now()}.json`;
      fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Detailed results saved to: ${resultsFile}`);

    } catch (error) {
      console.error('❌ Debug failed:', error);
      process.exit(1);
    }
  }
}

// Run the debugger
if (require.main === module) {
  const authDebugger = new AuthLogicDebugger();
  authDebugger.run().catch(console.error);
}

module.exports = AuthLogicDebugger;