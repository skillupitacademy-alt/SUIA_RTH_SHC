import fs from 'fs';
import path from 'path';

const BASE_DIR = 'd:\\onlinewebsites\\quiz-platform\\src\\share-branding\\ExamLaunch\\components';

function refactorFile(filePath, level) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Calculate relative path to BrandContext
  const contextPath = level === 1 
    ? "../../PostLandingPage/app/context/BrandContext" 
    : "../../../PostLandingPage/app/context/BrandContext";

  // Strip arbitrary ../config/brandConfig or similar
  content = content.replace(/import\s+\{\s*brandConfig\s*\}\s*from\s+['"][^'"]*brandConfig['"];?/g, '');
  
  // Add our useBrand hook
  if (!content.includes('useBrand')) {
    content = `import { useBrand } from '${contextPath}';\n` + content;
  }

  // Inject const brand = useBrand(); inside component blocks.
  // We match "export function ComponentName() {" and insert our hook.
  content = content.replace(/(export function [a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/g, "$1\n  const brandConfig = useBrand();\n");

  // Since we assign it as brandConfig = useBrand(), we don't need to change `brandConfig.primaryColor` to `brand.primaryColor` everywhere!
  // It will naturally grab it from the context exactly as the dummy object was shaped!

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Refactored ${filePath}`);
}

async function main() {
  // Process root (LaunchEvaluation.tsx)
  const rootFiles = fs.readdirSync(BASE_DIR).filter(f => f.endsWith('.tsx'));
  for (const file of rootFiles) {
    refactorFile(path.join(BASE_DIR, file), 1);
  }

  // Process subfolder (evaluation/*.tsx)
  const evalDir = path.join(BASE_DIR, 'evaluation');
  if (fs.existsSync(evalDir)) {
    const evalFiles = fs.readdirSync(evalDir).filter(f => f.endsWith('.tsx'));
    for (const file of evalFiles) {
      refactorFile(path.join(evalDir, file), 2);
    }
  }
}

main().catch(console.error);
