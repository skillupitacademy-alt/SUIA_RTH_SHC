/**
 * PHASE 11.19A — NEXT.JS SSR DATABASE TEST
 * Mimics the exact database access pattern during RTH Tutorial SSR
 * Uses the same @quiz/db package and query structure
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';
import { isNull } from 'drizzle-orm';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Neon for Node.js (same as packages/db/src/index.ts)
neonConfig.webSocketConstructor = WebSocket;

// Import schema directly - raw SQL will be used
import { domains as shcDomains } from '../../packages/db/src/schema/domain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load RTH environment (same as SSR)
const rthEnvPath = resolve(__dirname, '../../apps/realtutorialhub-web/.env.local');
dotenv.config({ path: rthEnvPath });

console.log('\n🔬 PHASE 11.19A — NEXT.JS SSR DATABASE TEST');
console.log('════════════════════════════════════════════════════════\n');
console.log('Testing exact pattern used in tutorialSidebarDelivery.ts\n');

async function testSSRPattern() {
  try {
    console.log('═══ TEST: Exact SSR Query Pattern ═══\n');
    
    // Create singleton pool (mimics getDb() behavior)
    console.log('[1] Creating database pool...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      query_timeout: 30000,
      statement_timeout: 30000,
    });
    
    const db = drizzle(pool);
    console.log('✅ Pool created (matches getDb() configuration)');
    
    console.log('\n[2] Executing domains query...');
    console.log('    SELECT * FROM domains WHERE deleted_at IS NULL');
    
    const startTime = Date.now();
    const domainRows = await db
      .select()
      .from(shcDomains)
      .where(isNull(shcDomains.deletedAt));
    const duration = Date.now() - startTime;
    
    console.log(`✅ Query successful (${duration}ms)`);
    console.log(`✅ Domains found: ${domainRows.length}`);
    
    if (domainRows.length > 0) {
      console.log(`\nSample domains:`);
      domainRows.slice(0, 3).forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.name} (${d.slug || d.id})`);
      });
    }
    
    console.log('\n═══ TEST PASSED ═══');
    console.log('\n✅ The exact SSR database pattern works in isolation');
    console.log('\nConclusion:');
    console.log('  - @neondatabase/serverless driver: WORKING');
    console.log('  - Drizzle ORM: WORKING');
    console.log('  - Pool configuration: WORKING');
    console.log('  - domains query: WORKING');
    console.log('  - Connection pool: HEALTHY\n');
    console.log('The failure in Next.js SSR suggests:');
    console.log('  - Next.js HMR/compilation context issue');
    console.log('  - Stale connection during long compilation');
    console.log('  - Module evaluation timing problem');
    console.log('  - Connection timeout during first render\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(`\nError: ${error.message}`);
    console.error(`Code: ${error.code || 'none'}`);
    console.error(`Name: ${error.name}`);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.log('\n════════════════════════════════════════════════════════');
    console.log('⚠️  SSR pattern test failed');
    console.log('This indicates a fundamental issue with the database');
    console.log('client or environment configuration.\n');
    
    process.exit(1);
  } finally {
    // Ensure pool cleanup
    try {
      if (pool) await pool.end();
    } catch {}
  }
}

testSSRPattern();
