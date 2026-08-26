#!/usr/bin/env node

/**
 * Phase 0A PostgreSQL Catalog Audit
 * READ-ONLY: Connects to actual PostgreSQL databases and inspects catalog metadata
 * 
 * Uses Neon serverless driver for HTTP-based queries
 * NO WRITES - Only SELECT queries against pg_catalog and information_schema
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

/**
 * Read DATABASE_URL from multiple possible locations
 * Priority: app .env.local > infra shared .env
 */
function readConnectionString(appPath, varName) {
  // Try app-specific .env.local first
  const appEnvPath = join(PROJECT_ROOT, appPath, '.env.local');
  try {
    const content = readFileSync(appEnvPath, 'utf-8');
    const pattern = new RegExp(`^${varName}=["']?([^"'\\n]+)["']?$`, 'm');
    const match = content.match(pattern);
    if (match) return match[1];
  } catch {
    // Continue to next source
  }
  
  // Try infra/hostinger/env/shared/.env (deployment config)
  const infraEnvPath = join(PROJECT_ROOT, 'infra', 'hostinger', 'env', 'shared', '.env');
  try {
    const content = readFileSync(infraEnvPath, 'utf-8');
    const pattern = new RegExp(`^${varName}=["']?([^"'\\n]+)["']?$`, 'm');
    const match = content.match(pattern);
    if (match) return match[1];
  } catch {
    // Continue to next source
  }
  
  // Try packages/db/.env (package-level config)
  const pkgEnvPath = join(PROJECT_ROOT, 'packages', 'db', '.env');
  try {
    const content = readFileSync(pkgEnvPath, 'utf-8');
    const pattern = new RegExp(`^${varName}=["']?([^"'\\n]+)["']?$`, 'm');
    const match = content.match(pattern);
    if (match) return match[1];
  } catch {
    // No source found
  }
  
  return null;
}

/**
 * Sanitize connection string for safe logging
 * @param {string} url - Full DATABASE_URL
 * @returns {string} Sanitized version
 */
function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.split('.')[0].substring(0, 10) + '...';
    return `${parsed.protocol}//${host}/${parsed.pathname.substring(1, 20)}`;
  } catch {
    return '[INVALID_URL]';
  }
}

/**
 * Execute safe metadata query
 * @param {Function} sql - Neon SQL function
 * @param {string} query - SQL query
 * @returns {Promise<Array>} Query results
 */
async function safeQuery(sql, query) {
  try {
    return await sql(query);
  } catch (error) {
    throw new Error(`Query failed: ${error.message}`);
  }
}

/**
 * Probe database and get basic metadata
 * @param {string} connectionString - DATABASE_URL
 * @returns {Promise<object>} Database metadata
 */
export async function probeDatabaseMetadata(connectionString) {
  const sql = neon(connectionString);
  
  const [metadata] = await safeQuery(sql, `
    SELECT
      current_database() as database_name,
      current_schema() as current_schema,
      version() as postgres_version,
      pg_database_size(current_database()) as database_size_bytes
  `);
  
  return {
    databaseName: metadata.database_name,
    currentSchema: metadata.current_schema,
    postgresVersion: metadata.postgres_version.split(',')[0].trim(),
    databaseSizeBytes: parseInt(metadata.database_size_bytes, 10),
    databaseSizeMB: Math.round(parseInt(metadata.database_size_bytes, 10) / 1024 / 1024 * 100) / 100,
  };
}

/**
 * Get list of application schemas (excluding system schemas)
 * @param {Function} sql - Neon SQL function
 * @returns {Promise<Array>} Schema list
 */
export async function getSchemas(sql) {
  const schemas = await safeQuery(sql, `
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name
  `);
  
  return schemas.map(s => s.schema_name);
}

/**
 * Get table inventory for a schema
 * @param {Function} sql - Neon SQL function
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} Table list with metadata
 */
export async function getTables(sql, schema) {
  const tables = await safeQuery(sql, `
    SELECT
      t.table_schema,
      t.table_name,
      t.table_type,
      pg_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) as table_size_bytes,
      pg_indexes_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) as indexes_size_bytes,
      pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) as total_size_bytes,
      c.reltuples::bigint as estimated_row_count
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = '${schema}'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);
  
  return tables.map(t => ({
    schema: t.table_schema,
    table: t.table_name,
    tableType: t.table_type,
    estimatedRowCount: parseInt(t.estimated_row_count, 10) || 0,
    tableSizeBytes: parseInt(t.table_size_bytes, 10),
    indexesSizeBytes: parseInt(t.indexes_size_bytes, 10),
    totalSizeBytes: parseInt(t.total_size_bytes, 10),
  }));
}

/**
 * Get columns for a table
 * @param {Function} sql - Neon SQL function
 * @param {string} schema - Schema name
 * @param {string} table - Table name
 * @returns {Promise<Array>} Column list
 */
export async function getColumns(sql, schema, table) {
  const columns = await safeQuery(sql, `
    SELECT
      column_name,
      ordinal_position,
      data_type,
      udt_name,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = '${schema}'
      AND table_name = '${table}'
    ORDER BY ordinal_position
  `);
  
  return columns.map(c => ({
    name: c.column_name,
    ordinal: c.ordinal_position,
    dataType: c.data_type,
    udtName: c.udt_name,
    nullable: c.is_nullable === 'YES',
    default: c.column_default,
    maxLength: c.character_maximum_length,
    numericPrecision: c.numeric_precision,
    numericScale: c.numeric_scale,
  }));
}

/**
 * Get primary key constraints
 * @param {Function} sql - Neon SQL function
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} Primary key list
 */
export async function getPrimaryKeys(sql, schema) {
  const pks = await safeQuery(sql, `
    SELECT
      tc.table_name,
      tc.constraint_name,
      string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) as columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = '${schema}'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `);
  
  return pks.map(pk => ({
    table: pk.table_name,
    constraintName: pk.constraint_name,
    columns: pk.columns.split(','),
  }));
}

/**
 * Get foreign key constraints
 * @param {Function} sql - Neon SQL function
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} Foreign key list
 */
export async function getForeignKeys(sql, schema) {
  const fks = await safeQuery(sql, `
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = '${schema}'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  
  return fks.map(fk => ({
    table: fk.table_name,
    constraintName: fk.constraint_name,
    column: fk.column_name,
    foreignSchema: fk.foreign_table_schema,
    foreignTable: fk.foreign_table_name,
    foreignColumn: fk.foreign_column_name,
    updateRule: fk.update_rule,
    deleteRule: fk.delete_rule,
  }));
}

/**
 * Get unique constraints
 * @param {Function} sql - Neon SQL function
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} Unique constraint list
 */
export async function getUniqueConstraints(sql, schema) {
  const uniques = await safeQuery(sql, `
    SELECT
      tc.table_name,
      tc.constraint_name,
      string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) as columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = '${schema}'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `);
  
  return uniques.map(u => ({
    table: u.table_name,
    constraintName: u.constraint_name,
    columns: u.columns.split(','),
  }));
}

/**
 * Get check constraints
 * @param {Function} sql - Neon SQL function
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} Check constraint list
 */
export async function getCheckConstraints(sql, schema) {
  const checks = await safeQuery(sql, `
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
      AND tc.constraint_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK'
      AND tc.table_schema = '${schema}'
    ORDER BY tc.table_name
  `);
  
  return checks.map(c => ({
    table: c.table_name,
    constraintName: c.constraint_name,
    checkClause: c.check_clause,
  }));
}

/**
 * Get indexes
 * @param {Function} sql - Neon SQL function
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} Index list
 */
export async function getIndexes(sql, schema) {
  const indexes = await safeQuery(sql, `
    SELECT
      t.tablename as table_name,
      i.indexname as index_name,
      i.indexdef as index_definition,
      pg_relation_size(quote_ident(i.schemaname) || '.' || quote_ident(i.indexname)) as index_size_bytes
    FROM pg_indexes i
    JOIN pg_tables t ON i.tablename = t.tablename AND i.schemaname = t.schemaname
    WHERE i.schemaname = '${schema}'
    ORDER BY t.tablename, i.indexname
  `);
  
  return indexes.map(idx => ({
    table: idx.table_name,
    indexName: idx.index_name,
    definition: idx.index_definition,
    sizeBytes: parseInt(idx.index_size_bytes, 10),
  }));
}

/**
 * Audit a single database
 * @param {string} logicalName - Database logical name
 * @param {string} connectionString - DATABASE_URL
 * @returns {Promise<object>} Complete audit result
 */
export async function auditDatabase(logicalName, connectionString) {
  const result = {
    logicalName,
    reachable: false,
    sanitizedUrl: sanitizeUrl(connectionString),
    metadata: null,
    schemas: [],
    tables: [],
    error: null,
  };
  
  try {
    const sql = neon(connectionString);
    
    // Step 1: Basic metadata
    result.metadata = await probeDatabaseMetadata(connectionString);
    result.reachable = true;
    
    // Step 2: Schemas
    const schemas = await getSchemas(sql);
    result.schemas = schemas;
    
    // Step 3: Tables (for public schema only for now)
    const publicTables = await getTables(sql, 'public');
    
    // Step 4: For each table, get detailed info
    for (const table of publicTables) {
      const columns = await getColumns(sql, table.schema, table.table);
      
      table.columns = columns;
      result.tables.push(table);
    }
    
    // Step 5: Constraints
    const primaryKeys = await getPrimaryKeys(sql, 'public');
    const foreignKeys = await getForeignKeys(sql, 'public');
    const uniqueConstraints = await getUniqueConstraints(sql, 'public');
    const checkConstraints = await getCheckConstraints(sql, 'public');
    
    result.primaryKeys = primaryKeys;
    result.foreignKeys = foreignKeys;
    result.uniqueConstraints = uniqueConstraints;
    result.checkConstraints = checkConstraints;
    
    // Step 6: Indexes
    const indexes = await getIndexes(sql, 'public');
    result.indexes = indexes;
    
  } catch (error) {
    result.error = {
      message: error.message,
      type: error.constructor.name,
    };
  }
  
  return result;
}

/**
 * Audit all configured databases
 * @returns {Promise<Array>} Array of audit results
 */
export async function auditAllDatabases() {
  const databases = [
    { name: 'quiz_platform_prod', app: 'apps/api-server', var: 'DATABASE_URL' },
    { name: 'tutorial_prod', app: 'apps/skillhubcore-admin', var: 'DATABASE_URL_TUTORIAL' },
    { name: 'people_prod', app: 'apps/skillhubcore-admin', var: 'DATABASE_URL_PEOPLE' },
    { name: 'rth_prod', app: 'apps/api-server', var: 'DATABASE_URL_RTH' },
    { name: 'skillup_prod', app: 'apps/api-server', var: 'DATABASE_URL_SKILLUP' },
    { name: 'payment_prod', app: 'apps/api-server', var: 'DATABASE_URL_PAYMENT' },
    { name: 'placement_prod', app: 'apps/api-server', var: 'DATABASE_URL_PLACEMENT' },
  ];
  
  const results = [];
  
  for (const db of databases) {
    console.log(`\n🔍 Auditing ${db.name}...`);
    
    const connectionString = readConnectionString(db.app, db.var);
    
    if (!connectionString) {
      console.log(`  ⚠️  Connection string not found for ${db.var}`);
      results.push({
        logicalName: db.name,
        reachable: false,
        error: { message: 'Connection string not configured' },
      });
      continue;
    }
    
    const audit = await auditDatabase(db.name, connectionString);
    results.push(audit);
    
    if (audit.reachable) {
      console.log(`  ✅ Connected: ${audit.metadata.databaseName}`);
      console.log(`     PostgreSQL: ${audit.metadata.postgresVersion}`);
      console.log(`     Size: ${audit.metadata.databaseSizeMB} MB`);
      console.log(`     Tables: ${audit.tables.length}`);
    } else {
      console.log(`  ❌ Failed: ${audit.error.message}`);
    }
  }
  
  return results;
}
