import fs from 'fs';
import path from 'path';

const BASE_DIR = 'd:\\onlinewebsites\\quiz-platform\\src\\share-branding\\TutorialEngine\\components';

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Remove brandConfig from typescript interfaces
  content = content.replace(/brandConfig\s*:\s*\{[\s\S]*?\};?/g, '');
  content = content.replace(/brandConfig\s*:\s*any;?/g, '');

  // 2. Remove brandConfig from destructured props
  content = content.replace(/,\s*brandConfig/g, '');
  content = content.replace(/brandConfig,\s*/g, '');
  content = content.replace(/\{ brandConfig \}/g, '{}');

  // 3. Add useBrand hook import
  const importString = "import { useBrand } from '../../PostLandingPage/app/context/BrandContext';\n";
  if (!content.includes('useBrand')) {
    content = importString + content;
  }

  // 4. Inject const brandConfig = useBrand(); inside functional components.
  // We match "export const ComponentName: React.FC<Props> = ({...}) => {"
  // Or "export function ComponentName({...}) {"
  
  content = content.replace(/(export const [a-zA-Z0-9_]+\s*:\s*React\.FC<[^>]+>\s*=\s*\([^)]*\)\s*=>\s*\{)/g, "$1\n  const brandConfig = useBrand();\n");
  content = content.replace(/(export function [a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/g, "$1\n  const brandConfig = useBrand();\n");

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Refactored ${filePath}`);
}

async function main() {
  const files = fs.readdirSync(BASE_DIR).filter(f => f.endsWith('.tsx'));
  for (const file of files) {
    refactorFile(path.join(BASE_DIR, file));
  }
}

main().catch(console.error);
