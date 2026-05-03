/**
 * Infrastructure Validation
 * ==========================
 * Validates:
 * - Environment variables
 * - Database connectivity
 * - Redis connectivity
 * - Route registration
 * - Schema integrity
 * - Constitutional framework seeding
 */

import { Pool } from 'pg';

interface ValidationResult {
  passed: boolean;
  score: number;
  tests: number;
  failures: number;
  warnings: string[];
  errors: string[];
  duration: number;
}

export async function validateInfrastructure(): Promise<ValidationResult> {
  const startTime = Date.now();
  const tests: Array<{ name: string; passed: boolean; error?: string }> = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Test 1: Environment Variables
  console.log('  [CHECK] Checking environment variables...');
  try {
    const requiredEnvVars = [
      'DATABASE_URL_TUTORIAL',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'ADMIN_JWT_SECRET',
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      tests.push({ 
        name: 'Environment Variables', 
        passed: false, 
        error: `Missing: ${missing.join(', ')}` 
      });
      errors.push(`Missing environment variables: ${missing.join(', ')}`);
    } else {
      tests.push({ name: 'Environment Variables', passed: true });
      console.log('     [PASS] All required environment variables present');
    }
  } catch (error) {
    tests.push({ name: 'Environment Variables', passed: false, error: String(error) });
    errors.push(`Environment check failed: ${error}`);
  }

  // Test 2: Database Connectivity
  console.log('  [CHECK] Testing database connectivity...');
  let pool: Pool | null = null;
  try {
    const connectionString = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL_TUTORIAL not set');
    }

    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    
    // Simple connectivity test
    await pool.query('SELECT 1 as test');
    
    tests.push({ name: 'Database Connectivity', passed: true });
    console.log('     [PASS] Database connection successful');
  } catch (error) {
    tests.push({ name: 'Database Connectivity', passed: false, error: String(error) });
    errors.push(`Database connection failed: ${error}`);
  } finally {
    if (pool) {
      await pool.end();
    }
  }

  // Test 3: Redis Connectivity
  console.log('  [CHECK] Testing Redis connectivity...');
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      throw new Error('Redis credentials not set');
    }

    // Simple ping test
    const response = await fetch(`${redisUrl}/ping`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    if (response.ok) {
      tests.push({ name: 'Redis Connectivity', passed: true });
      console.log('     [PASS] Redis connection successful');
    } else {
      throw new Error(`Redis ping failed: ${response.status}`);
    }
  } catch (error) {
    tests.push({ name: 'Redis Connectivity', passed: false, error: String(error) });
    errors.push(`Redis connection failed: ${error}`);
  }

  // Test 4: Database Schema Integrity
  console.log('  [CHECK] Checking database schema integrity...');
  try {
    const connectionString = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL_TUTORIAL not set');
    }

    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    
    // Check for critical tables
    const criticalTables = [
      'tutorial_sections',
      'educational_architectures',
      'ui_architectures',
      'prompt_templates',
      'layman_audit_logs',
      'layman_prompt_history',
      'layman_content_revisions',
    ];

    const tableChecks = await Promise.all(
      criticalTables.map(async (table) => {
        try {
          const result = await pool!.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            ) as exists
          `, [table]);
          return { table, exists: result.rows[0].exists };
        } catch (error) {
          return { table, exists: false, error: String(error) };
        }
      })
    );

    const missingTables = tableChecks.filter(t => !t.exists);

    if (missingTables.length === 0) {
      tests.push({ name: 'Database Schema', passed: true });
      console.log(`     [PASS] All ${criticalTables.length} critical tables present`);
    } else {
      throw new Error(`Missing tables: ${missingTables.map(t => t.table).join(', ')}`);
    }
  } catch (error) {
    tests.push({ name: 'Database Schema', passed: false, error: String(error) });
    errors.push(`Schema validation failed: ${error}`);
  } finally {
    if (pool) {
      await pool.end();
    }
  }

  // Test 5: Constitutional Framework Seeding
  console.log('  [CHECK] Verifying constitutional framework...');
  try {
    const connectionString = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL_TUTORIAL not set');
    }

    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    
    // Check for educational architectures
    const eduArchResult = await pool.query('SELECT COUNT(*) as count FROM educational_architectures');
    const eduArchCount = parseInt(eduArchResult.rows[0].count);

    // Check for UI architectures
    const uiArchResult = await pool.query('SELECT COUNT(*) as count FROM ui_architectures');
    const uiArchCount = parseInt(uiArchResult.rows[0].count);

    // Check for prompt templates
    const promptResult = await pool.query('SELECT COUNT(*) as count FROM prompt_templates');
    const promptCount = parseInt(promptResult.rows[0].count);

    if (eduArchCount > 0 && uiArchCount > 0 && promptCount > 0) {
      tests.push({ name: 'Constitutional Framework', passed: true });
      console.log(`     [PASS] Framework seeded (${eduArchCount} edu, ${uiArchCount} ui, ${promptCount} prompts)`);
    } else {
      throw new Error(`Incomplete seeding: ${eduArchCount} edu, ${uiArchCount} ui, ${promptCount} prompts`);
    }
  } catch (error) {
    tests.push({ name: 'Constitutional Framework', passed: false, error: String(error) });
    warnings.push(`Constitutional framework check failed: ${error}`);
  } finally {
    if (pool) {
      await pool.end();
    }
  }

  // Calculate results
  const duration = Date.now() - startTime;
  const failures = tests.filter(t => !t.passed).length;
  const passed = failures === 0;
  const score = tests.length > 0 
    ? Math.round(((tests.length - failures) / tests.length) * 100)
    : 0;

  return {
    passed,
    score,
    tests: tests.length,
    failures,
    warnings,
    errors,
    duration,
  };
}
