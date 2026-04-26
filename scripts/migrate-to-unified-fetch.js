#!/usr/bin/env node

/**
 * 🔄 MIGRATE TO UNIFIED FETCH
 * 
 * Automatically replaces raw fetch() calls with unifiedFetch()
 * 
 * Strategy:
 * - Only replaces internal API calls
 * - Skips external URLs
 * - Adds import if missing
 * - Preserves existing options
 * 
 * Safety:
 * - Creates backup before modifying
 * - Dry-run mode available
 * - Reports all changes
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGET_DIR = 'src/share-branding';
const DRY_RUN = process.argv.includes('--dry-run');

const IMPORT_STATEMENT = `import { unifiedFetch } from '@/share-branding/lib/unifiedFetch';\n`;

let filesModified = 0;
let fetchCallsReplaced = 0;

/**
 * Check if a fetch call is to an internal API
 */
function isInternalApiCall(args) {
  // Skip external URLs (third-party APIs)
  if (args.includes('https://') && 
      !args.includes('process.env') &&
      !args.includes('API_URL') &&
      !args.includes('GATEWAY_URL')) {
    return false;
  }
  
  // Skip http:// external URLs
  if (args.includes('http://') && 
      !args.includes('localhost') &&
      !args.includes('127.0.0.1')) {
    return false;
  }
  
  // Internal patterns
  const internalPatterns = [
    '/api/',
    'process.env',
    'GATEWAY_URL',
    'API_URL',
    'INTERNAL_API',
    '${url}',
    '${targetUrl}',
    '${fallbackUrl}',
    'INTERNAL_API_URL',
  ];
  
  return internalPatterns.some(pattern => args.includes(pattern));
}

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  // Skip node_modules, .next, dist
  if (filePath.includes('node_modules') || 
      filePath.includes('.next') || 
      filePath.includes('dist')) {
    return false;
  }
  
  // Only process TS/TSX files
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

/**
 * Process a single file
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if no fetch calls
  if (!content.includes('fetch(')) {
    return;
  }
  
  // Skip if already using unifiedFetch
  if (content.includes('unifiedFetch')) {
    console.log(`⏭️  Skipped (already using unifiedFetch): ${filePath}`);
    return;
  }
  
  const originalContent = content;
  let modified = false;
  let replacements = 0;
  
  // Replace fetch calls
  // Match: await fetch(...) or fetch(...)
  const fetchRegex = /(await\s+)?fetch\s*\(([^)]+)\)/g;
  
  content = content.replace(fetchRegex, (match, awaitPrefix, args) => {
    // Only replace internal API calls
    if (!isInternalApiCall(args)) {
      return match; // Keep external calls as-is
    }
    
    modified = true;
    replacements++;
    
    const prefix = awaitPrefix || '';
    return `${prefix}unifiedFetch(${args})`;
  });
  
  // Add import if modified
  if (modified && !content.includes('unifiedFetch')) {
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      // Insert after last import
      lines.splice(lastImportIndex + 1, 0, IMPORT_STATEMENT);
      content = lines.join('\n');
    } else {
      // No imports found, add at top
      content = IMPORT_STATEMENT + content;
    }
  }
  
  if (modified) {
    if (!DRY_RUN) {
      // Create backup
      const backupPath = filePath + '.backup';
      fs.writeFileSync(backupPath, originalContent, 'utf-8');
      
      // Write modified file
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    
    console.log(`✅ ${DRY_RUN ? '[DRY-RUN] ' : ''}Modified: ${filePath.replace(ROOT, '')}`);
    console.log(`   Replaced ${replacements} fetch call(s)`);
    
    filesModified++;
    fetchCallsReplaced += replacements;
  }
}

/**
 * Walk directory recursively
 */
function walkDirectory(dir) {
  const fullPath = path.join(ROOT, dir);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Directory not found: ${fullPath}`);
    return;
  }
  
  const entries = fs.readdirSync(fullPath);
  
  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry);
    const stat = fs.statSync(entryPath);
    
    if (stat.isDirectory()) {
      walkDirectory(path.join(dir, entry));
    } else if (shouldProcessFile(entryPath)) {
      processFile(entryPath);
    }
  }
}

// ----------------------------------
// MAIN
// ----------------------------------

console.log('🔄 MIGRATE TO UNIFIED FETCH\n');
console.log('====================================');

if (DRY_RUN) {
  console.log('🔍 DRY-RUN MODE (no files will be modified)');
}

console.log(`📁 Target: ${TARGET_DIR}`);
console.log('====================================\n');

walkDirectory(TARGET_DIR);

console.log('\n====================================');
console.log('📊 SUMMARY');
console.log('====================================');
console.log(`Files modified:       ${filesModified}`);
console.log(`Fetch calls replaced: ${fetchCallsReplaced}`);

if (filesModified > 0 && !DRY_RUN) {
  console.log('\n💾 Backups created with .backup extension');
  console.log('   To restore: rm *.ts && mv *.backup *.ts');
}

if (DRY_RUN) {
  console.log('\n🔍 This was a dry-run. Run without --dry-run to apply changes.');
}

console.log('\n✅ Done!\n');

// Exit code
process.exit(0);
