#!/usr/bin/env node

/**
 * W0.2 Architecture Violation Checker - Fail-closed scanning with TypeScript parsing
 * 
 * 5 Architecture Gates:
 * 1. Frontend auth cookie parsing (document.cookie reads)
 * 2. localStorage auth persistence (accessToken/refreshToken storage)
 * 3. Manual Authorization headers
 * 4. Duplicate JWT verification (direct jose/jsonwebtoken use)
 * 5. Direct DB imports in HTTP routes (baseline-aware, multiline/side-effect safe)
 * 
 * FAIL-CLOSED POLICY:
 * - Missing scan roots → FAIL (exit 2)
 * - Unreadable files → FAIL (exit 2)
 * - Invalid baseline data → FAIL (exit 2)
 * - Scanner errors → FAIL (exit 2)
 * 
 * Exit codes:
 * - 0: All gates passed
 * - 1: Architecture violations detected
 * - 2: Scan/baseline integrity failure (fail-closed)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Fail-closed file scanner using TypeScript AST for imports
 */
function scanFilesWithTS(importTest, rootPaths, fileExtensions = ['.ts', '.tsx']) {
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
    
    walkDirectoryTS(fullPath, importTest, fileExtensions, results);
  }
  
  return results;
}

function walkDirectoryTS(dir, importTest, extensions, results) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    throw new Error(`SCAN_ERROR: Cannot read directory ${dir}: ${error.message}`);
  }
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      walkDirectoryTS(fullPath, importTest, extensions, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const source = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true);
          const violations = checkImportsWithTS(source, importTest, fullPath);
          if (violations.length > 0) {
            results.push(...violations);
          }
        } catch (error) {
          throw new Error(`SCAN_ERROR: Cannot process file ${fullPath}: ${error.message}`);
        }
      }
    }
  }
}

/**
 * Check imports using TypeScript AST
 * Handles multiline, side-effect, and subpath imports
 */
function checkImportsWithTS(source, importTest, filePath) {
  const violations = [];
  const relativePath = path.relative(rootDir, filePath).replaceAll('\\', '/');
  
  function visit(node) {
    // Check import declarations: import ... from '...'
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        if (importTest(moduleName)) {
          const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const text = node.getText(source).substring(0, 100); // Truncate for readability
          violations.push({
            file: relativePath,
            line,
            match: text,
          });
        }
      }
    }
    
    // Check dynamic imports: import('...')
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const moduleName = node.arguments[0].text;
        if (importTest(moduleName)) {
          const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const text = node.getText(source).substring(0, 100);
          violations.push({
            file: relativePath,
            line,
            match: text,
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(source);
  return violations;
}

/**
 * Pattern-based scanner for non-import patterns
 */
function scanFilesWithPattern(pattern, rootPaths, fileExtensions = ['.ts', '.tsx']) {
  const results = [];
  
  for (const rootPath of rootPaths) {
    const fullPath = path.join(rootDir, rootPath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`SCAN_ERROR: Required scan root does not exist: ${rootPath}`);
    }
    
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      throw new Error(`SCAN_ERROR: Scan root is not a directory: ${rootPath}`);
    }
    
    walkDirectoryPattern(fullPath, pattern, fileExtensions, results);
  }
  
  return results;
}

function walkDirectoryPattern(dir, pattern, extensions, results) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    throw new Error(`SCAN_ERROR: Cannot read directory ${dir}: ${error.message}`);
  }
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      walkDirectoryPattern(fullPath, pattern, extensions, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = findPatternMatches(content, pattern, fullPath);
          if (matches.length > 0) {
            results.push(...matches);
          }
        } catch (error) {
          throw new Error(`SCAN_ERROR: Cannot read file ${fullPath}: ${error.message}`);
        }
      }
    }
  }
}

function findPatternMatches(content, pattern, filePath) {
  const matches = [];
  const relativePath = path.relative(rootDir, filePath).replaceAll('\\', '/');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      matches.push({
        file: relativePath,
        line: i + 1,
        match: lines[i].trim().substring(0, 100),
      });
    }
  }
  
  return matches;
}

/**
 * Load and validate baseline
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
  
  console.log(`Baseline validation: All ${baseline.directDBRoutes.length} routes exist\n`);
}

// Main execution
try {
  console.log('W0.2 Architecture Violation Checker - Fail-closed scanning with TypeScript AST\n');
  
  const baseline = loadBaseline();
  validateBaselineRoutes(baseline);
  
  const results = [];
  let totalViolations = 0;
  
  /**
   * Gate 1: Frontend auth cookie parsing (document.cookie reads)
   */
  console.log('Gate 1: Checking frontend auth cookie parsing...');
  const cookiePattern = /document\.cookie/;
  const clientPaths = [
    'apps/skillhubcore-admin/src/app',
    'apps/skillhubcore-admin/src/components',
  ];
  
  try {
    const cookieViolations = scanFilesWithPattern(cookiePattern, clientPaths);
    if (cookieViolations.length > 0) {
      console.error('❌ FAIL: Frontend document.cookie access detected:');
      cookieViolations.forEach(v => console.error(`  ${v.file}:${v.line} - ${v.match}`));
      console.error('  Rule: Client code must not read document.cookie for auth tokens.\n');
      totalViolations += cookieViolations.length;
      results.push({ gate: 'auth-cookie-parsing', status: 'FAIL', violations: cookieViolations.length });
    } else {
      console.log('✅ PASS: No frontend document.cookie access detected.\n');
      results.push({ gate: 'auth-cookie-parsing', status: 'PASS', violations: 0 });
    }
  } catch (error) {
    console.error(`❌ SCAN FAILED: ${error.message}\n`);
    process.exit(2);
  }
  
  /**
   * Gate 2: localStorage auth persistence (accessToken/refreshToken)
   */
  console.log('Gate 2: Checking localStorage auth persistence...');
  const localStorageAuthPattern = /localStorage\.(get|set)Item\s*\(\s*['"](?:accessToken|refreshToken|token|jwt|session|auth)/i;
  
  try {
    const storageViolations = scanFilesWithPattern(localStorageAuthPattern, clientPaths);
    if (storageViolations.length > 0) {
      console.error('❌ FAIL: localStorage auth persistence detected:');
      storageViolations.forEach(v => console.error(`  ${v.file}:${v.line} - ${v.match}`));
      console.error('  Rule: Auth tokens must use httpOnly cookies, not localStorage (XSS vulnerability).\n');
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
  ];
  
  try {
    const headerViolations = scanFilesWithPattern(authHeaderPattern, servicePaths, ['.ts', '.tsx', '.js']);
    // Filter out legitimate server-side uses (e.g., in BFF/middleware)
    const actualViolations = headerViolations.filter(v => 
      !v.file.includes('middleware') && !v.file.includes('lib/auth')
    );
    
    if (actualViolations.length > 0) {
      console.error('❌ FAIL: Manual Authorization headers detected:');
      actualViolations.forEach(v => console.error(`  ${v.file}:${v.line} - ${v.match}`));
      console.error('  Rule: Authorization must use packages/auth, not manual header construction.\n');
      totalViolations += actualViolations.length;
      results.push({ gate: 'manual-auth-headers', status: 'FAIL', violations: actualViolations.length });
    } else {
      console.log('✅ PASS: No manual Authorization headers detected.\n');
      results.push({ gate: 'manual-auth-headers', status: 'PASS', violations: 0 });
    }
  } catch (error) {
    console.error(`❌ SCAN FAILED: ${error.message}\n`);
    process.exit(2);
  }
  
  /**
   * Gate 4: Duplicate JWT verification (direct jose/jsonwebtoken imports)
   */
  console.log('Gate 4: Checking duplicate JWT verification...');
  const jwtPackages = ['jose', 'jsonwebtoken'];
  const authOwnerPath = 'packages/auth';
  
  try {
    const jwtViolations = scanFilesWithTS(
      (moduleName) => jwtPackages.some(pkg => moduleName === pkg || moduleName.startsWith(pkg + '/')),
      servicePaths,
      ['.ts', '.tsx', '.js']
    );
    
    // Filter out packages/auth (authoritative owner)
    const actualViolations = jwtViolations.filter(v => !v.file.startsWith(authOwnerPath));
    
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
   * Gate 5: Direct DB imports in HTTP routes (TypeScript AST parsing)
   * 
   * DETECTION:
   * - @quiz/db and subpaths (e.g., @quiz/db/client) = VIOLATION
   * - drizzle-orm = VIOLATION
   * - getDb() calls = VIOLATION via pattern scan
   * - @quiz/db-tutorial = PERMITTED (service boundary)
   * 
   * Handles multiline, side-effect, and subpath imports via TypeScript AST
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
  
  const directDBImports = [];
  
  for (const routeFile of routeFiles) {
    const fullPath = path.join(rootDir, routeFile);
    let content;
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      throw new Error(`SCAN_ERROR: Cannot read ${routeFile}: ${error.message}`);
    }
    
    // Use TypeScript AST for import detection
    const source = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true);
    let hasViolation = false;
    
    function checkNode(node) {
      // Check import declarations
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const moduleName = node.moduleSpecifier.text;
          
          // VIOLATION: @quiz/db or @quiz/db/*
          if (moduleName === '@quiz/db' || moduleName.startsWith('@quiz/db/')) {
            // EXCEPTION: @quiz/db-tutorial is a service boundary
            if (!moduleName.startsWith('@quiz/db-tutorial')) {
              hasViolation = true;
            }
          }
          
          // VIOLATION: drizzle-orm
          if (moduleName === 'drizzle-orm' || moduleName.startsWith('drizzle-orm/')) {
            hasViolation = true;
          }
        }
      }
      
      ts.forEachChild(node, checkNode);
    }
    
    checkNode(source);
    
    // Also check for getDb() calls (pattern-based)
    if (/\bgetDb\s*\(/.test(content)) {
      hasViolation = true;
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
    console.error('  Rule: HTTP routes must not directly import @quiz/db, @quiz/db/*, or drizzle-orm.');
    console.error('  Use repository/service layer instead.');
    console.error('  Service boundary: @quiz/db-tutorial is PERMITTED.');
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
