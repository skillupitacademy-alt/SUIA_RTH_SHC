import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { TUTORIAL_SECTION_CONTRACTS, TUTORIAL_SECTION_DOC_PATHS } from '@quiz/types';
import WebSocket from 'ws';

neonConfig.webSocketConstructor = WebSocket;

const ROOT = path.resolve(__dirname, '../../..');
const DOCS_ARCH_SPEC = path.join(ROOT, TUTORIAL_SECTION_DOC_PATHS.architecture);
const DOCS_UI_SPEC = path.join(ROOT, TUTORIAL_SECTION_DOC_PATHS.uiuxDetailed);
const LEGACY_ARCH_SPEC = path.join(ROOT, 'apps/skillhubcore-admin/src/data/AllSectionTutorialPage.json');
const SCHEMA_FILE = path.join(ROOT, 'packages/types/src/tutorial-content.schema.ts');
const MAPPER_FILE = path.join(ROOT, 'src/share-branding/subtopicNotesDataAPI.ts');
const PAGE_FILE = path.join(ROOT, 'src/share-branding/SubtopicNotesPage.tsx');
const SHARE_RENDERER_DIR = path.join(ROOT, 'src/share-branding/TutorialEngine/components');

function loadEnv() {
  for (const candidate of ['.env.local', '.env.tutorial-test', 'packages/db/.env']) {
    const envPath = path.join(ROOT, candidate);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false, quiet: true });
    }
  }
}

function readIfExists(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function hasAll(content: string, hints: readonly string[]): boolean {
  return hints.every((hint) => content.includes(hint));
}

function status(ok: boolean, positive = 'OK', negative = 'MISS'): string {
  return ok ? positive : negative;
}

async function loadDbSnapshot() {
  const connectionString = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_DIRECT_URL_TUTORIAL;
  if (!connectionString) {
    return null;
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  try {
    const [enumRows, sectionRows, archRows] = await Promise.all([
      pool.query<{ enumlabel: string }>(
        `select enumlabel
         from pg_enum e
         join pg_type t on t.oid = e.enumtypid
         where t.typname = 'section_type'
         order by enumsortorder`
      ),
      pool.query<{
        section_type: string;
        total: number;
        api_visible: number;
        approved: number;
        deployed: number;
      }>(
        `select section_type::text,
                count(*)::int as total,
                count(*) filter (where status in ('approved', 'deployed'))::int as api_visible,
                count(*) filter (where status = 'approved')::int as approved,
                count(*) filter (where status = 'deployed')::int as deployed
         from tutorial_sections
         where deleted_at is null
         group by section_type
         order by section_type`
      ),
      pool.query<{
        section_type: string;
        total: number;
        with_edu_arch: number;
        with_ui_arch: number;
        with_prompt: number;
      }>(
        `select section_type::text,
                count(*)::int as total,
                count(educational_architecture_id)::int as with_edu_arch,
                count(ui_architecture_id)::int as with_ui_arch,
                count(prompt_template_id)::int as with_prompt
         from tutorial_sections
         where deleted_at is null
         group by section_type
         order by section_type`
      ),
    ]);

    return {
      enumValues: new Set(enumRows.rows.map((row) => row.enumlabel)),
      sections: new Map(sectionRows.rows.map((row) => [row.section_type, row])),
      architecture: new Map(archRows.rows.map((row) => [row.section_type, row])),
    };
  } finally {
    await pool.end();
  }
}

export async function runTutorialContractAudit() {
  loadEnv();

  const docsArchSpec = readIfExists(DOCS_ARCH_SPEC);
  const docsUiSpec = readIfExists(DOCS_UI_SPEC);
  const legacyArchSpec = readIfExists(LEGACY_ARCH_SPEC);
  const schemaContent = readIfExists(SCHEMA_FILE);
  const mapperContent = readIfExists(MAPPER_FILE);
  const pageContent = readIfExists(PAGE_FILE);
  const rendererIndex = fs.existsSync(SHARE_RENDERER_DIR)
    ? fs.readdirSync(SHARE_RENDERER_DIR, { recursive: true }).join('\n')
    : '';

  const db = await loadDbSnapshot();

  console.log('========================================================');
  console.log('   TUTORIAL SECTION CONTRACT AUDIT');
  console.log('========================================================');
  console.log('Section\tJSON Spec\tTS Schema\tDB Enum\tDB Rows\tArch FK\tAPI Visible\tMapper\tRenderer');
  console.log('-------------------------------------------------------------------------------------------------------');

  let failures = 0;

  for (const section of TUTORIAL_SECTION_CONTRACTS) {
    const specContent = `${docsArchSpec}\n${docsUiSpec}\n${legacyArchSpec}`;
    const jsonOk = hasAll(specContent, [...section.architectureKeys, ...section.uiuxKeys]);
    const schemaOk = hasAll(schemaContent, section.schemaHints);
    const dbEnumOk = db ? db.enumValues.has(section.dbType) : false;
    const dbRow = db?.sections.get(section.dbType);
    const archRow = db?.architecture.get(section.dbType);
    const dbRowsOk = Boolean(dbRow && dbRow.total > 0);
    const apiVisibleOk = Boolean(dbRow && dbRow.api_visible > 0);
    const archOk = Boolean(archRow && archRow.with_edu_arch > 0 && archRow.with_ui_arch > 0);
    const mapperOk = hasAll(mapperContent, section.mapperHints);
    const rendererOk = section.rendererHints.some((hint) => rendererIndex.includes(hint) || pageContent.includes(hint));

    const rowOk = jsonOk && schemaOk && dbEnumOk && dbRowsOk && apiVisibleOk && mapperOk && rendererOk;
    if (!rowOk) {
      failures += 1;
    }

    console.log([
      section.dbType.toUpperCase().padEnd(12),
      status(jsonOk),
      status(schemaOk),
      db ? status(dbEnumOk) : 'NO_DB',
      db ? `${dbRow?.total ?? 0}` : 'NO_DB',
      db ? `${archRow?.with_edu_arch ?? 0}/${archRow?.with_ui_arch ?? 0}` : 'NO_DB',
      db ? `${dbRow?.api_visible ?? 0}` : 'NO_DB',
      status(mapperOk),
      status(rendererOk),
    ].join('\t'));
  }

  console.log('-------------------------------------------------------------------------------------------------------');
  console.log(`Audit result: ${failures === 0 ? 'PASS' : `FAIL (${failures} section rows need attention)`}`);
  console.log('Note: Arch FK is reported as educational/ui reference counts. Prompt template linkage is tracked separately and should be backfilled as content generation matures.');

  if (failures > 0) {
    process.exitCode = 1;
  }
}

runTutorialContractAudit().catch((error) => {
  console.error('Tutorial contract audit failed:', error);
  process.exitCode = 1;
});
