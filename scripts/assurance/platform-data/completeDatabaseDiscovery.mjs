#!/usr/bin/env node

/**
 * Phase 0A.2.1 Complete Database Discovery
 * 
 * Discovers all 7 production databases from multiple configuration sources.
 * 
 * SECURITY: Never prints DATABASE_URL values or credentials.
 * Returns connection strings only internally for audit use.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

const DATABASE_DEFINITIONS = [
  {
    logicalName: 'quiz_platform_prod',
    envVars: ['DATABASE_URL'],
    packagePath: 'packages/db',
  },
  {
    logicalName: 'tutorial_prod',
    envVars: ['DATABASE_URL_TUTORIAL'],
    packagePath: 'packages/db-tutorial',
  },
  {
    logicalName: 'people_prod',
    envVars: ['DATABASE_URL_PEOPLE'],
    packagePath: 'packages/db-people',
  },
  {
    logicalName: 'rth_prod',
    envVars: ['DATABASE_URL_RTH'],
    packagePath: 'packages/db-rth',
  },
  {
    logicalName: 'skillup_prod',
    envVars: ['DATABASE_URL_SKILLUP'],
    packagePath: 'packages/db-skillup',
  },
  {
    logicalName: 'payment_prod',
    envVars: ['DATABASE_URL_PAYMENT'],
    packagePath: 'packages/db-payment',
  },
  {
    logicalName: 'placement_prod',
    envVars: ['DATABASE_URL_PLACEMENT'],
    packagePath: 'packages/db-placement',
  },
];

const ENV_SOURCES = [
  'infra/hostinger/env/shared/.env',
  'packages/db/.env',
];

const APP_PATHS = [
  'apps/api-server/.env.local',
  'apps/realtutorialhub-web/.env.local',
  'apps/skillup-web/.env.local',
  'apps/skillhubcore-admin/.env.local',
  'apps/skillhub-placement/.env.local',
];

function readEnvFile(relativePath) {
  const absolutePath = join(PROJECT_ROOT, relativePath);
  
  if (!existsSync(absolutePath)) {
    return null;
  }
  
  try {
    return readFileSync(absolutePath, 'utf8');
  } catch {
    return null;
  }
}

function extractVariable(content, variableName) {
  if (!content) return null;
  
  const pattern = new RegExp(
    `^\\s*${variableName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\r\\n#]*))`,
    'm'
  );
  
  const match = content.match(pattern);
  if (!match) return null;
  
  return (match[1] || match[2] || match[3] || '').trim();
}

function sanitizeConnectionString(url) {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.split('.');
    
    return {
      protocol: parsed.protocol.replace(':', ''),
      hostFingerprint: `${hostParts[0]?.substring(0, 12) || 'unknown'}...`,
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return { protocol: null, hostFingerprint: '[INVALID]', database: null };
  }
}

function discoverDatabase(dbDef) {
  const sources = [];
  let connectionString = null;
  
  // Search in order: infra config, package config, app configs
  const allSources = [...ENV_SOURCES, ...APP_PATHS];
  
  for (const sourcePath of allSources) {
    const content = readEnvFile(sourcePath);
    if (!content) continue;
    
    for (const varName of dbDef.envVars) {
      const value = extractVariable(content, varName);
      
      if (value) {
        sources.push({
          source: sourcePath,
          variableName: varName,
          metadata: sanitizeConnectionString(value),
        });
        
        // Use first found connection string
        if (!connectionString) {
          connectionString = value;
        }
      }
    }
  }
  
  const packageExists = existsSync(join(PROJECT_ROOT, dbDef.packagePath));
  
  return {
    logicalName: dbDef.logicalName,
    envVars: dbDef.envVars,
    configured: connectionString !== null,
    packageExists,
    packagePath: dbDef.packagePath,
    configurationSources: sources,
    
    // INTERNAL ONLY - never serialize to evidence
    _connectionString: connectionString,
  };
}

export function discoverAllDatabases() {
  return DATABASE_DEFINITIONS.map(discoverDatabase);
}

export function getConnectionString(database) {
  return database._connectionString || null;
}

export function sanitizeDiscovery(database) {
  const { _connectionString, ...safe } = database;
  return safe;
}

export function assertCompleteDiscovery(discovery) {
  const expected = DATABASE_DEFINITIONS.map(d => d.logicalName);
  const actual = discovery.map(d => d.logicalName);
  
  const missing = expected.filter(name => !actual.includes(name));
  
  if (missing.length > 0) {
    throw new Error(`Database discovery incomplete: ${missing.join(', ')}`);
  }
  
  return true;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const discovery = discoverAllDatabases();
  assertCompleteDiscovery(discovery);
  
  console.log('\n🔍 PHASE 0A.2.1 DATABASE DISCOVERY\n');
  
  for (const db of discovery) {
    console.log(`📊 ${db.logicalName}`);
    console.log(`   Configured: ${db.configured ? 'YES' : 'NO'}`);
    console.log(`   Package: ${db.packageExists ? 'YES' : 'NO'}`);
    console.log(`   Sources: ${db.configurationSources.length}`);
    console.log('');
  }
  
  const configured = discovery.filter(d => d.configured);
  console.log(`Total discovered: ${discovery.length}`);
  console.log(`Configured: ${configured.length}/7`);
  
  if (configured.length !== 7) {
    console.error('\n❌ Not all databases configured!');
    process.exit(1);
  }
}
