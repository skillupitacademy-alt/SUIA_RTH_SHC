#!/usr/bin/env node

/**
 * Phase 0A.2.1 PostgreSQL Catalog Auditor
 * 
 * READ-ONLY catalog inspection for ALL 7 production databases.
 * Verifies database identity matches expected logical name.
 * 
 * NO INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/TRUNCATE
 */

import { neon } from '@neondatabase/serverless';
import { getConnectionString } from './completeDatabaseDiscovery.mjs';

async function query(sql, statement) {
  try {
    return await sql(statement);
  } catch (error) {
    throw new Error(`PostgreSQL query failed: ${error.message}`);
  }
}

async function getMetadata(sql) {
  const rows = await query(sql, `
    SELECT
      current_database() AS database_name,
      current_schema() AS current_schema,
      version() AS postgres_version,
      pg_database_size(current_database()) AS database_size_bytes
  `);
  
  const row = rows[0];
  if (!row) {
    throw new Error('PostgreSQL returned no metadata');
  }
  
  const sizeBytes = Number(row.database_size_bytes);
  
  return {
    databaseName: row.database_name,
    currentSchema: row.current_schema,
    postgresVersion: String(row.postgres_version).split(',')[0].trim(),
    databaseSizeBytes: sizeBytes,
    databaseSizeMB: Math.round((sizeBytes / 1024 / 1024) * 100) / 100,
  };
}

async function getSchemas(sql) {
  const rows = await query(sql, `
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      AND schema_name NOT LIKE 'pg_toast%'
      AND schema_name NOT LIKE 'pg_temp%'
    ORDER BY schema_name
  `);
  
  return rows.map(r => r.schema_name);
}

async function getTables(sql) {
  const rows = await query(sql, `
    SELECT
      t.table_schema,
      t.table_name,
      t.table_type,
      COALESCE(c.reltuples::bigint, 0) AS estimated_row_count,
      pg_relation_size(c.oid) AS table_size_bytes,
      pg_indexes_size(c.oid) AS indexes_size_bytes,
      pg_total_relation_size(c.oid) AS total_size_bytes
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);
  
  return rows.map(r => ({
    schema: r.table_schema,
    table: r.table_name,
    tableType: r.table_type,
    estimatedRowCount: Number(r.estimated_row_count) || 0,
    tableSizeBytes: Number(r.table_size_bytes) || 0,
    indexesSizeBytes: Number(r.indexes_size_bytes) || 0,
    totalSizeBytes: Number(r.total_size_bytes) || 0,
    columns: [],
  }));
}

async function getColumns(sql) {
  const rows = await query(sql, `
    SELECT
      table_schema, table_name, column_name, ordinal_position,
      data_type, udt_name, is_nullable, column_default,
      character_maximum_length, numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  
  return rows;
}

async function getPrimaryKeys(sql) {
  const rows = await query(sql, `
    SELECT
      tc.table_name, tc.constraint_name,
      string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `);
  
  return rows.map(r => ({
    table: r.table_name,
    constraintName: r.constraint_name,
    columns: r.columns.split(','),
  }));
}

async function getForeignKeys(sql) {
  const rows = await query(sql, `
    SELECT
      tc.table_name, tc.constraint_name, kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule, rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  
  return rows.map(r => ({
    table: r.table_name,
    constraintName: r.constraint_name,
    column: r.column_name,
    foreignSchema: r.foreign_table_schema,
    foreignTable: r.foreign_table_name,
    foreignColumn: r.foreign_column_name,
    updateRule: r.update_rule,
    deleteRule: r.delete_rule,
  }));
}

async function getUniqueConstraints(sql) {
  const rows = await query(sql, `
    SELECT
      tc.table_name, tc.constraint_name,
      string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `);
  
  return rows.map(r => ({
    table: r.table_name,
    constraintName: r.constraint_name,
    columns: r.columns.split(','),
  }));
}

async function getCheckConstraints(sql) {
  const rows = await query(sql, `
    SELECT tc.table_name, tc.constraint_name, cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `);
  
  return rows.map(r => ({
    table: r.table_name,
    constraintName: r.constraint_name,
    checkClause: r.check_clause,
  }));
}

async function getIndexes(sql) {
  const rows = await query(sql, `
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  
  return rows.map(r => ({
    schema: r.schemaname,
    table: r.tablename,
    indexName: r.indexname,
    definition: r.indexdef,
  }));
}

function attachColumns(tables, columns) {
  const tableMap = new Map();
  tables.forEach(t => tableMap.set(`${t.schema}.${t.table}`, t));
  
  columns.forEach(col => {
    const table = tableMap.get(`${col.table_schema}.${col.table_name}`);
    if (!table) return;
    
    table.columns.push({
      name: col.column_name,
      ordinal: col.ordinal_position,
      dataType: col.data_type,
      udtName: col.udt_name,
      nullable: col.is_nullable === 'YES',
      default: col.column_default,
      maxLength: col.character_maximum_length,
      numericPrecision: col.numeric_precision,
      numericScale: col.numeric_scale,
    });
  });
  
  return tables;
}

export async function auditDatabase(discoveredDatabase) {
  const logicalName = discoveredDatabase.logicalName;
  const connectionString = getConnectionString(discoveredDatabase);
  
  const result = {
    logicalName,
    configured: discoveredDatabase.configured,
    packageExists: discoveredDatabase.packageExists,
    reachable: false,
    audited: false,
    databaseIdentityMatch: false,
    metadata: null,
    schemas: [],
    tables: [],
    primaryKeys: [],
    foreignKeys: [],
    uniqueConstraints: [],
    checkConstraints: [],
    indexes: [],
    error: null,
  };
  
  if (!connectionString) {
    result.error = {
      code: 'CONNECTION_STRING_NOT_FOUND',
      message: 'No connection string resolved',
    };
    return result;
  }
  
  try {
    const sql = neon(connectionString);
    
    console.log(`\n🔍 Auditing ${logicalName}...`);
    
    // Get metadata and verify database identity
    result.metadata = await getMetadata(sql);
    result.reachable = true;
    
    if (result.metadata.databaseName !== logicalName) {
      result.error = {
        code: 'DATABASE_IDENTITY_MISMATCH',
        expected: logicalName,
        actual: result.metadata.databaseName,
        message: `Expected ${logicalName} but PostgreSQL returned ${result.metadata.databaseName}`,
      };
      console.error(`  ❌ Identity mismatch: expected ${logicalName}, got ${result.metadata.databaseName}`);
      return result;
    }
    
    result.databaseIdentityMatch = true;
    
    // Audit catalog
    result.schemas = await getSchemas(sql);
    result.tables = await getTables(sql);
    const columns = await getColumns(sql);
    result.tables = attachColumns(result.tables, columns);
    result.primaryKeys = await getPrimaryKeys(sql);
    result.foreignKeys = await getForeignKeys(sql);
    result.uniqueConstraints = await getUniqueConstraints(sql);
    result.checkConstraints = await getCheckConstraints(sql);
    result.indexes = await getIndexes(sql);
    
    result.audited = true;
    
    console.log(`  ✅ Connected: ${result.metadata.databaseName}`);
    console.log(`     PostgreSQL: ${result.metadata.postgresVersion}`);
    console.log(`     Size: ${result.metadata.databaseSizeMB} MB`);
    console.log(`     Tables: ${result.tables.length}`);
    console.log(`     PKs: ${result.primaryKeys.length}`);
    console.log(`     FKs: ${result.foreignKeys.length}`);
    console.log(`     Unique: ${result.uniqueConstraints.length}`);
    console.log(`     Indexes: ${result.indexes.length}`);
    
  } catch (error) {
    result.error = {
      code: 'CATALOG_AUDIT_FAILED',
      message: error.message,
      type: error.constructor.name,
    };
    console.error(`  ❌ ${logicalName}: ${error.message}`);
  }
  
  return result;
}

export async function auditAllDatabases(discovery) {
  const results = [];
  
  for (const database of discovery) {
    const result = await auditDatabase(database);
    results.push(result);
  }
  
  return results;
}
