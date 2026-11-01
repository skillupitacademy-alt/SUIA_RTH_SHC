#!/usr/bin/env node

/**
 * W0.2 Architecture Violation Checker - Fail-closed scanning with baseline awareness
 * 
 * 5 Architecture Gates:
 * 1. Frontend auth cookie parsing
 * 2. localStorage auth persistence
 * 3. Manual Authorization headers
 * 4. Duplicate JWT verification
 * 5. Direct DB imports in HTTP routes (baseline-aware)
 * 
 * FAIL-CLOSED POLICY:
 * - Missing scan roots → FAIL
 * - Unreadable files → FAIL
 * - Invalid baseline data → FAIL
 * - Scanner errors → FAIL (not silent PASS)
 * 
 * Exit codes:
 * - 0: All gates passed
 * - 1: Architecture violations detected
 * - 2: Scan/baseline integrity failure (fail-closed)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Fail-closed file scanner
 * Throws on missing root, unreadable files, or scan errors
 */
function scanFiles(pattern, rootPaths, fileExtensions = ['.ts', '.tsx']) {
  const results = [];
  
  for (const rootPath of rootPaths) {
    const fullPath = path.join(rootDir, rootPath);
    
    // FAIL-CLOSED: Missing scan root must fail
    if (!fs.existsSync(fullPath)) {
      throw new Error(`SCAN_ERROR: Required scan root does not exist: ${rootPath}`);
    }
    
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      throw new Error(`SCAN_ERROR: Scan root is not a directory: ${rootPath}`);
    }
    
    walkDirectory(fullPath, pattern, fileExtensions, results);
  }
  
  return results;
}

function walkDirectory(dir, pattern, extensions, results) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    // FAIL-CLOSED: Unreadable directory must fail
    throw new Error(`SCAN_ERROR: Cannot read directory ${dir}: ${error.message}`);
  }
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      walkDirectory(fullPath, pattern, extensions, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = findMatches(content, pattern, fullPath);
          if (matches.length > 0) {
            results.push(...matches.map(m => ({
              file: path.relative(rootDir, fullPath).replaceAll('\\', '/'),
              line: m.line,
              match: m.text,
            })));
          }
        } catch (error) {
          // FAIL-CLOSED: Unreadable file must fail
          throw new Error(`SCAN_ERROR: Cannot read file ${fullPath}: ${error.message}`);
        }
      }
    }
  }
}

function findMatches(content, pattern, filePath) {
  const matches = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      matches.push({
        line: i + 1,
        text: lines[i].trim(),
      });
    }
  }
  
  return matches;
}

/**
 * Load and validate baseline
 * FAIL-CLOSED: Invalid baseline must fail
 */
function loadBaseline() {
  const baselinePath = path.join(rootDir, 'audit/W0.2_Architecture_Baseline.json');
  
  if (!fs.existsSync(baselinePath)) {
    throw new Error('BASELINE_ERROR: audit/W0.2_Architecture_Baseline.json not found');
  }
  
  let baseline;
  try {
    const content = fs.readFileSync(baselinePath, 'utf8');
    baseline = JSON.parse(content);
  } catch (error) {
    throw new Error(`BASELINE_ERROR: Cannot parse baseline JSON: ${error.message}`);
  }
  
  // Validate baseline structure
  if (!baseline.baseline_commit || typeof baseline.baseline_commit !== 'string') {
    throw new Error('BASELINE_ERROR: Missing or invalid baseline_commit');
  }
  
  if (!Array.isArray(baseline.directDBRoutes)) {
    throw new Error('BASELINE_ERROR: Missing or invalid directDBRoutes array');
  }
  
  console.log(`Loaded baseline from ${baselinePath}`);
  console.log(`Baseline commit: ${baseline.baseline_commit}`);
  console.log(`Baseline exceptions: ${baseline.directDBRoutes.length} routes`);
  
  return baseline;
}

/**
 * Validate baseline routes exist
 * FAIL-CLOSED: Nonexistent baseline routes must fail
 */
function validateBaselineRoutes(baseline) {
  const missing = [];
  
  for (const route of baseline.directDBRoutes) {
    const fullPath = path.join(rootDir, route);
    if (!fs.existsSync(fullPath)) {
      missing.push(route);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`BASELINE_ERROR: ${missing.length} baseline routes do not exist:\n  ${missing.join('\n  ')}\nStale baseline must be corrected.`);
  }
  
  console.log(`Baseline validation: All ${baseline.directDBRoutes.length} routes exist`);
}

// Main execution
try {
  console.log('W0.2 Architecture Violation Checker - Fail-closed scanning\n');
  
  const baseline = loadBaseline();
  validateBaselineRoutes(baseline);
  
  const results = [];
  let totalViolations = 0;
  
  /**
   * Gate 1: Frontend auth cookie parsing
   */
  console.log('\nGate 1: Checking frontend auth cookie parsing...');
  const authCookiePattern = /cookie\(\s*['"]admin_session['"]/i;
  const clientPaths = [
    'apps/skillhubcore-admin/src/app',
    'apps/skillhubcore-admin/src/components',
  ];
  
  try {
    const cookieViolations = scanFiles(authCookiePattern, clientPaths);
    if (cookieViolations.length > 0) {
      console.error('❌ FAIL: Frontend auth cookie parsing detected:');
      cookieViolations.forEach(v => console.error(`  ${v.file}:${v.line} - ${v.match}`));
      console.error('  Rule: Auth must use server-side JWT validation, not client-side cookie parsing.\n');
      totalViolations += cookieViolations.length;
      results.push({ gate: 'auth-cookie-parsing', status: 'FAIL', violations: cookieViolations.length });
    } else {
      console.log('✅ PASS: No frontend auth cookie parsing detected.\n');
      results.push({ gate: 'auth-cookie-parsing', status: 'PASS', violations: 0 });
    }
  } catch (error) {
    console.error(`❌ SCAN FAILED: ${error.message}\n`);
    process.exit(2);
  }
  
  /**
   * Gate 2: localStorage auth persistence
   */
  console.log('Gate 2: Checking localStorage auth persistence...');
  const localStorageAuthPattern = /localStorage\.(get|set)Item\s*\(\s*['"](?:token|jwt|session|auth)/i;
  
  try {
    const storageViolations = scanFiles(localStorageAuthPattern, clientPaths);
    if (storageViolations.length > 0) {
      console.error('❌ FAIL: localStorage auth persistence detected:');
      storageViolations.forEach(v => console.error(`  ${v.file}:${v.line} - ${v.match}`));
      console.error('  Rule: Auth must use httpOnly cookies, not localStorage (XSS vulnerability).\n');
      totalViolations += storageViolations.length;
      results.push({ gate: 'localStorage-auth', status: 'FAIL', violations: storageViolations.length });
    } else {
      console.log('✅ PASS: No localStorage auth persistence detected.\n');
      results.push({ gate: 'localStorage-auth', status: 'PASS', violations: 0 });
    }
  } catch (error) {
    console.error(`❌ SCAN FAILED: ${error.message}\n`);
    process.exit(2);
  }
  
  /**
   * Gate 3: Manual Authorization headers
   */
  console.log('Gate 3: Checking manual Authorization headers...');
  const authHeaderPattern = /headers\s*:\s*\{[^}]*['"]Authorization['"]\s*:/;
  const servicePaths = [
    'apps/skillhubcore-admin/src',
    'packages/auth/src',
  ];
  
  try {
    const headerViolations = scanFiles(authHeaderPattern, servicePaths, ['.ts', '.tsx', '.js']);
    if (headerViolations.length > 0) {
      console.error('❌ FAIL: Manual Authorization headers detected:');
      headerViolations.forEach(v => console.error(`  ${v.file}:${v.line} - ${v.match}`));
      console.error('  Rule: Authorization must use packages/auth, not manual header construction.\n');
      totalViolations += headerViolations.length;
      results.push({ gate: 'manual-auth-headers', status: 'FAIL', violations: headerViolations.length });
    } else {
      console.log('✅ PASS: No manual Authorization headers detected.\n');
      results.push({ gate: 'manual-auth-headers', status: 'PASS', violations: 0 });
    }
  } catch (error) {
    console.error(`❌ SCAN FAILED: ${error.message}\n`);
    process.exit(2);
  }
  
  /**
   * Gate 4: Duplicate JWT verification
   */
  console.log('Gate 4: Checking duplicate JWT verification...');
  const jwtPattern = /jwt\.verify|jsonwebtoken/;
  const excludeAuthPaths = servicePaths.filter(p => !p.includes('packages/auth'));
  
  try {
    const jwtViolations = scanFiles(jwtPattern, excludeAuthPaths, ['.ts', '.tsx', '.js']);
    // Filter out packages/auth imports (allowed)
    const actualViolations = jwtViolations.filter(v => 
      !v.match.includes("from '@quiz/auth'") && 
      !v.match.includes('from "@quiz/auth"')
    );
    
    if (actualViolations.length > 0) {
      console.error('❌ FAIL: Duplicate JWT verification outside packages/auth detected:');
      actualViolations.forEach(v => console.error(`  ${v.file}:${v.line} - ${v.match}`));
      console.error('  Rule: JWT verification must be centralized in packages/auth.\n');
      totalViolations += actualViolations.length;
      results.push({ gate: 'duplicate-jwt-verify', status: 'FAIL', violations: actualViolations.length });
    } else {
      console.log('✅ PASS: No duplicate JWT verification detected.\n');
      results.push({ gate: 'duplicate-jwt-verify', status: 'PASS', violations: 0 });
    }
  } catch (error) {
    console.error(`❌ SCAN FAILED: ${error.message}\n`);
    process.exit(2);
  }
  
  /**
   * Gate 5: Direct DB imports in HTTP routes (baseline-aware)
   * 
   * CRITICAL DISTINCTION:
   * - @quiz/db = direct persistence coupling (VIOLATION unless baselined)
   * - @quiz/db-tutorial = intended service boundary (PERMITTED)
   * - drizzle-orm = direct ORM use (VIOLATION unless baselined)
   */
  console.log('Gate 5: Checking direct DB imports in HTTP routes...');
  console.log(`  Baseline exceptions: ${baseline.directDBRoutes.length} documented routes`);
  
  const apiDir = path.join(rootDir, 'apps/skillhubcore-admin/src/app/api');
  if (!fs.existsSync(apiDir)) {
    throw new Error(`SCAN_ERROR: API directory does not exist: ${apiDir}`);
  }
  
  const routeFiles = [];
  function walkRoutes(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkRoutes(fullPath);
      } else if (entry.name === 'route.ts') {
        routeFiles.push(path.relative(rootDir, fullPath).replaceAll('\\', '/'));
      }
    }
  }
  walkRoutes(apiDir);
  
  // Scan for direct persistence imports
  // PERMITTED: @quiz/db-tutorial (service boundary)
  // VIOLATION: @quiz/db, drizzle-orm, getDb (persistence coupling)
  const directDBImports = [];
  
  for (const routeFile of routeFiles) {
    const fullPath = path.join(rootDir, routeFile);
    let content;
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      throw new Error(`SCAN_ERROR: Cannot read ${routeFile}: ${error.message}`);
    }
    
    // Check for persistence coupling patterns
    // Match: import ... from '@quiz/db'
    // Match: import { db } from '@quiz/db'
    // Match: import ... from 'drizzle-orm'
    // Match: getDb()
    // DO NOT match: import ... from '@quiz/db-tutorial' (service boundary)
    const lines = content.split('\n');
    let hasViolation = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for direct @quiz/db imports (but not @quiz/db-tutorial)
      if (/import.*from\s+['"]@quiz\/db['"]/.test(line) && !/db-tutorial/.test(line)) {
        hasViolation = true;
        break;
      }
      
      // Check for drizzle-orm imports
      if (/import.*from\s+['"]drizzle-orm/.test(line)) {
        hasViolation = true;
        break;
      }
      
      // Check for getDb() calls
      if (/\bgetDb\s*\(/.test(line)) {
        hasViolation = true;
        break;
      }
    }
    
    if (hasViolation) {
      directDBImports.push(routeFile);
    }
  }
  
  // Filter against baseline
  const newViolations = directDBImports.filter(route => !baseline.directDBRoutes.includes(route));
  
  console.log(`  Total routes checked: ${routeFiles.length}`);
  console.log(`  Routes with direct DB imports: ${directDBImports.length}`);
  console.log(`  Baseline-permitted routes: ${directDBImports.length - newViolations.length}`);
  console.log(`  NEW violations: ${newViolations.length}`);
  
  if (newViolations.length > 0) {
    console.error('❌ FAIL: NEW direct DB imports in HTTP routes detected:');
    newViolations.forEach(v => console.error(`  ${v}`));
    console.error('  Rule: HTTP routes must not directly import @quiz/db or drizzle-orm.');
    console.error('  Use repository/service layer instead.');
    console.error('  See audit/W0.2_Architecture_Baseline.json for documented exceptions.\n');
    totalViolations += newViolations.length;
    results.push({ gate: 'direct-db-in-routes', status: 'FAIL', violations: newViolations.length });
  } else {
    console.log('✅ PASS: No NEW direct DB imports in routes (baseline exceptions permitted).\n');
    results.push({ gate: 'direct-db-in-routes', status: 'PASS', violations: 0 });
  }
  
  // Summary
  console.log('═'.repeat(70));
  console.log('ARCHITECTURE VIOLATION CHECK SUMMARY');
  console.log('═'.repeat(70));
  
  results.forEach(r => {
    const status = r.status === 'PASS' ? '✅' : '❌';
    const padding = ' '.repeat(30 - r.gate.length);
    console.log(`${status} ${r.gate}${padding}${r.violations} violations`);
  });
  
  console.log('═'.repeat(70));
  
  if (totalViolations > 0) {
    console.error(`❌ FAILED: ${totalViolations} total architecture violations detected.\n`);
    process.exit(1);
  } else {
    console.log('✅ PASSED: All architecture gates passed.\n');
    process.exit(0);
  }
  
} catch (error) {
  if (error.message.startsWith('BASELINE_ERROR:') || error.message.startsWith('SCAN_ERROR:')) {
    console.error(`\n❌ FAIL-CLOSED: ${error.message}\n`);
    process.exit(2);
  }
  throw error;
}
