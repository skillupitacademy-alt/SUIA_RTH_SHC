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
  'THE UI': [
    'pages/CORE_APP_JOURNEY.md',
    'pages/auth/AUTH_JOURNEY.md',
    'pages/admin/ADMIN_JOURNEY.md',
    'pages/exams/EXAM_JOURNEY.md',
    'pages/admin/DOCS_VIEWER_JOURNEY.md',
    'pages/README.md',
    'pages/_PAGE_TEMPLATE.md'
  ],
  'THE STATUS': ['execution/CURRENT_STATE_REPORT.md', 'execution/TASK_HISTORY.md', 'execution/CURRENT_TASK_LOG.md'],
  'THE RULES': ['ux/UX_BASELINE.md'],
  'THE PAST': [
    'archive/EXECUTION_LOGS_ARCHIVE.md',
    'archive/WALKTHROUGH_ARCHIVE.md',
    'archive/AUDIT_REPORT_JAN24.md',
    'archive/WALKTHROUGH_DISCOVERY_ORCHESTRATOR.md'
  ],
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

