import fs from 'fs/promises';
import path from 'path';

export type DocCategory = 'THE LAW' | 'THE LOGIC' | 'THE UI' | 'THE STATUS' | 'THE RULES' | 'THE PAST';

export interface DocFile {
  name: string;
  path: string;
  category: DocCategory;
}

const CATEGORY_MAP: Record<DocCategory, string[]> = {
  'THE LAW': ['architecture/PROJECT_MANIFESTO.md', 'architecture/SYSTEM_ARCHITECTURE.md', '../../.agent/AGENT_CONSTITUTION.md'],
  'THE LOGIC': ['specs/CORE_PLATFORM_SPEC.md', 'specs/ADMIN_PLATFORM_SPEC.md', 'specs/INFRASTRUCTURE_SPEC.md'],
  'THE UI': ['pages/CORE_APP_JOURNEY.md', 'pages/auth/AUTH_JOURNEY.md', 'pages/admin/ADMIN_JOURNEY.md', 'pages/exams/EXAM_JOURNEY.md'],
  'THE STATUS': ['execution/CURRENT_STATE_REPORT.md', 'execution/TASK_HISTORY.md', 'execution/CURRENT_TASK_LOG.md'],
  'THE RULES': ['ux/UX_BASELINE.md'],
  'THE PAST': ['archive/EXECUTION_LOGS_ARCHIVE.md', 'archive/WALKTHROUGH_ARCHIVE.md', 'archive/AUDIT_REPORT_JAN24.md'],
};

export async function getDocsStructure(): Promise<Record<DocCategory, DocFile[]>> {
  const structure: Record<DocCategory, DocFile[]> = {
    'THE LAW': [],
    'THE LOGIC': [],
    'THE UI': [],
    'THE STATUS': [],
    'THE RULES': [],
    'THE PAST': [],
  };

  for (const [category, files] of Object.entries(CATEGORY_MAP)) {
    structure[category as DocCategory] = files.map(f => ({
      name: path.basename(f).replace('.md', ''),
      path: f,
      category: category as DocCategory,
    }));
  }

  return structure;
}

export async function getDocContent(filePath: string): Promise<string> {
  // Security check: only allow paths defined in CATEGORY_MAP
  const allAllowedPaths = Object.values(CATEGORY_MAP).flat();
  if (!allAllowedPaths.includes(filePath)) {
    throw new Error('Unauthorized access to file path');
  }

  // Path resolution: docs are at root, apps/admin-app is at apps/admin-app
  // We use process.cwd() which usually points to app root in Next.js
  // In monorepo, if running from root, it might be different. 
  // But usually in Vercel it's the app dir.
  
  const rootDir = path.join(process.cwd(), '../../');
  const fullPath = path.join(rootDir, 'docs', filePath.startsWith('../../') ? filePath.replace('../../', '../') : filePath);
  
  // Correction for the agent path: it's in .agent at root
  let finalPath = '';
  if (filePath.includes('.agent')) {
      finalPath = path.join(rootDir, '.agent', path.basename(filePath));
  } else {
      finalPath = path.join(rootDir, 'docs', filePath);
  }

  try {
    const content = await fs.readFile(finalPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read file: ${finalPath}`, error);
    return `Error: Could not load documentation content for ${filePath}`;
  }
}
