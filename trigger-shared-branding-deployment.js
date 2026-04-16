#!/usr/bin/env node

/**
 * Trigger deployment of shared branding web services
 * 
 * This script will trigger a GitHub Actions workflow to redeploy the web services
 * with the latest shared branding code.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Triggering deployment of shared branding web services...\n');

// Check if we're in a git repository
try {
  execSync('git status', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: Not in a git repository');
  process.exit(1);
}

// Check current branch
const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
console.log(`📍 Current branch: ${currentBranch}`);

// Check if there are uncommitted changes
try {
  execSync('git diff --quiet', { stdio: 'ignore' });
  execSync('git diff --cached --quiet', { stdio: 'ignore' });
} catch (error) {
  console.log('⚠️  Warning: You have uncommitted changes. Consider committing them first.');
}

console.log('\n🔍 Checking shared branding files...');

// Verify shared branding files exist
const sharedBrandingFiles = [
  'src/share-branding/RTHLanding.tsx',
  'src/share-branding/SkillUpLanding.tsx', 
  'src/share-branding/LandingPage.tsx',
  'src/share-branding/brandConfig.ts',
  'apps/realtutorialhub-web/src/app/page.tsx',
  'apps/skillup-web/src/app/page.tsx'
];

for (const file of sharedBrandingFiles) {
  try {
    const fs = require('fs');
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - NOT FOUND`);
    }
  } catch (error) {
    console.log(`❌ ${file} - ERROR: ${error.message}`);
  }
}

console.log('\n📋 Deployment Options:');
console.log('1. Deploy both RTH and SkillUp web services (recommended)');
console.log('2. Deploy only RTH web service');
console.log('3. Deploy only SkillUp web service');
console.log('4. Check current deployment status');

// For now, let's provide instructions since we can't directly trigger GitHub Actions
console.log('\n🔧 To deploy the shared branding updates:');
console.log('\n📝 Option 1: Manual GitHub Actions Trigger');
console.log('   1. Go to: https://github.com/your-org/quiz-platform/actions/workflows/deploy-cloudrun.yml');
console.log('   2. Click "Run workflow"');
console.log('   3. Select scope:');
console.log('      - "tutorial" for RTH (user.realtutorialhub.com)');
console.log('      - "skillup" for SkillUp (user.skillupitacademy.com)'); 
console.log('      - "all" for both services');
console.log('   4. Click "Run workflow"');

console.log('\n📝 Option 2: Push a commit to trigger auto-deployment');
console.log('   1. Make a small change to trigger deployment:');
console.log('      echo "# Trigger shared branding deployment" >> apps/realtutorialhub-web/README.md');
console.log('      git add apps/realtutorialhub-web/README.md');
console.log('      git commit -m "Deploy shared branding updates for RTH"');
console.log('      git push origin main');
console.log('');
console.log('   2. For SkillUp:');
console.log('      echo "# Trigger shared branding deployment" >> apps/skillup-web/README.md');
console.log('      git add apps/skillup-web/README.md');
console.log('      git commit -m "Deploy shared branding updates for SkillUp"');
console.log('      git push origin main');

console.log('\n📝 Option 3: Use GitHub CLI (if installed)');
console.log('   gh workflow run deploy-cloudrun.yml --field scope=tutorial  # For RTH');
console.log('   gh workflow run deploy-cloudrun.yml --field scope=skillup   # For SkillUp');
console.log('   gh workflow run deploy-cloudrun.yml --field scope=all       # For both');

console.log('\n⏱️  Expected deployment time: 15-20 minutes per service');
console.log('\n🔍 After deployment, verify the changes at:');
console.log('   - RTH: https://user.realtutorialhub.com/');
console.log('   - SkillUp: https://user.skillupitacademy.com/');

console.log('\n✨ The shared branding system should now be live!');