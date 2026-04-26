#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const filesToFix = [
  'src/share-branding/auth/authLoader.ts',
  'src/share-branding/auth/useAutoRefresh.ts',
  'src/share-branding/services/userProfileClient.ts',
  'src/share-branding/ExamEngine/components/examSessionLoader.ts',
  'src/share-branding/OnboardingEngine/components/OnboardingPage.tsx',
  'src/share-branding/ProfilePage.tsx',
  'src/share-branding/ui/device-sessions.tsx',
];

const IMPORT_LINE = `import { unifiedFetch } from '@/share-branding/lib/unifiedFetch';\n`;

filesToFix.forEach(file => {
  const filePath = path.join(ROOT, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped (not found): ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if already has import
  if (content.includes('unifiedFetch')) {
    console.log(`⏭️  Skipped (already has import): ${file}`);
    return;
  }
  
  // Find first import line
  const lines = content.split('\n');
  let firstImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      firstImportIndex = i;
      break;
    }
  }
  
  if (firstImportIndex >= 0) {
    // Insert after first import
    lines.splice(firstImportIndex + 1, 0, IMPORT_LINE);
    content = lines.join('\n');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    // No imports, add at top
    content = IMPORT_LINE + content;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed (added at top): ${file}`);
  }
});

console.log('\n✅ Done!');
