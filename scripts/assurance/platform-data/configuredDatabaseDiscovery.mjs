#!/usr/bin/env node

/**
 * Phase 0 Database Discovery Module
 * READ-ONLY: Discovers configured database connections from environment files
 * Does NOT connect to databases yet - only discovers configuration
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

/**
 * Parse DATABASE_URL to extract metadata without exposing credentials
 * @param {string} url - Full DATABASE_URL
 * @returns {object} Sanitized connection metadata
 */
export function parseConnectionString(url) {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Extract host fingerprint (first 10 chars after protocol)
    const hostParts = parsed.hostname.split('.');
    const hostFingerprint = hostParts[0].substring(0, 10) + '...';
    
    return {
      protocol: parsed.protocol.replace(':', ''),
      host: hostFingerprint,
      fullHost: parsed.hostname, // Keep for provider detection
      database: parsed.pathname.replace('/', ''),
      params: Object.fromEntries(parsed.searchParams),
      pooled: parsed.hostname.includes('-pooler'),
      provider: parsed.hostname.includes('neon.tech') ? 'Neon' : 'Unknown',
    };
  } catch (error) {
    return { error: error.message, raw: url.substring(0, 20) + '...' };
  }
}

/**
 * Discover database connections from .env files
 * @returns {object} Discovered connections by application
 */
export function discoverDatabaseConnections() {
  const apps = [
    'apps/api-server',
    'apps/realtutorialhub-web',
    'apps/skillup-web',
    'apps/skillhubcore-admin',
  ];
  
  const discoveries = {};
  
  for (const app of apps) {
    const envPath = join(PROJECT_ROOT, app, '.env.local');
    
    if (!existsSync(envPath)) {
      discoveries[app] = { status: 'NO_ENV_FILE' };
      continue;
    }
    
    const envContent = readFileSync(envPath, 'utf-8');
    const connections = {};
    
    // Extract all DATABASE_URL variants
    const patterns = [
      /^DATABASE_URL=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_DIRECT_URL=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_URL_TUTORIAL=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_DIRECT_URL_TUTORIAL=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_URL_PEOPLE=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_DIRECT_URL_PEOPLE=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_URL_PAYMENT=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_URL_PLACEMENT=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_URL_RTH=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_DIRECT_URL_RTH=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_URL_SKILLHUBCORE=["']?([^"'\n]+)["']?$/m,
      /^DATABASE_URL_SKILLUP=["']?([^"'\n]+)["']?$/m,
    ];
    
    for (const pattern of patterns) {
      const match = envContent.match(pattern);
      if (match) {
        const varName = match[0].split('=')[0];
        const url = match[1];
        connections[varName] = parseConnectionString(url);
      }
    }
    
    discoveries[app] = {
      status: 'FOUND',
      connections,
      envPath,
    };
  }
  
  return discoveries;
}

/**
 * Extract unique database names from discoveries
 * @param {object} discoveries - Output from discoverDatabaseConnections()
 * @returns {Array} Unique database names
 */
export function extractUniqueDatabases(discoveries) {
  const databases = new Set();
  
  for (const app in discoveries) {
    const appData = discoveries[app];
    if (appData.status !== 'FOUND') continue;
    
    for (const varName in appData.connections) {
      const conn = appData.connections[varName];
      if (conn && conn.database) {
        databases.add(conn.database);
      }
    }
  }
  
  return Array.from(databases).sort();
}

/**
 * Classify database by name convention
 * @param {string} dbName - Database name
 * @returns {string} Classification
 */
export function classifyDatabase(dbName) {
  if (dbName.includes('quiz') || dbName === 'quiz_platform_prod') return 'QUIZ_EXAM';
  if (dbName.includes('tutorial')) return 'TUTORIAL';
  if (dbName.includes('people')) return 'PEOPLE';
  if (dbName.includes('payment')) return 'PAYMENT';
  if (dbName.includes('placement')) return 'PLACEMENT';
  if (dbName.includes('rth')) return 'RTH_BRAND';
  if (dbName.includes('skillup')) return 'SKILLUP_BRAND';
  if (dbName.includes('skillhubcore')) return 'SKILLHUBCORE_BRAND';
  return 'UNKNOWN';
}

/**
 * Run database discovery and print report
 */
export function runDiscovery() {
  console.log('\n🔍 PHASE 0 - DATABASE DISCOVERY\n');
  
  const discoveries = discoverDatabaseConnections();
  const uniqueDatabases = extractUniqueDatabases(discoveries);
  
  console.log('📁 Applications Scanned:');
  for (const app in discoveries) {
    const data = discoveries[app];
    if (data.status === 'FOUND') {
      const connCount = Object.keys(data.connections).length;
      console.log(`  ✅ ${app}: ${connCount} connection(s)`);
    } else {
      console.log(`  ⚠️  ${app}: ${data.status}`);
    }
  }
  
  console.log(`\n📊 Unique Databases Discovered: ${uniqueDatabases.length}`);
  for (const db of uniqueDatabases) {
    const classification = classifyDatabase(db);
    console.log(`  • ${db} [${classification}]`);
  }
  
  console.log('\n🔐 Connection Details (credentials redacted):');
  for (const app in discoveries) {
    const data = discoveries[app];
    if (data.status !== 'FOUND') continue;
    
    console.log(`\n  ${app}:`);
    for (const varName in data.connections) {
      const conn = data.connections[varName];
      if (conn.error) {
        console.log(`    ${varName}: ERROR - ${conn.error}`);
      } else {
        const mode = conn.pooled ? 'POOLED' : 'DIRECT';
        console.log(`    ${varName}:`);
        console.log(`      Provider: ${conn.provider}`);
        console.log(`      Database: ${conn.database}`);
        console.log(`      Host: ${conn.host}`);
        console.log(`      Mode: ${mode}`);
      }
    }
  }
  
  return { discoveries, uniqueDatabases };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiscovery();
}
