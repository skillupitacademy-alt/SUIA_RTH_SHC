const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

const ENV_PATH = path.join(process.cwd(), '.env.local');
const SQL_DIR = path.join(process.cwd(), 'scripts', 'sql');

const DATABASES = {
  quiz_platform_prod: {
    envKey: 'DATABASE_DIRECT_URL',
    fix: '20260404_role_case_fix_quiz_platform_prod.sql',
    rollback: '20260404_role_case_rollback_quiz_platform_prod.sql',
  },
  rth_prod: {
    envKey: 'DATABASE_DIRECT_URL_RTH',
    fix: '20260404_role_case_fix_rth_prod.sql',
    rollback: '20260404_role_case_rollback_rth_prod.sql',
  },
  skillup_prod: {
    envKey: 'DATABASE_DIRECT_URL_SKILLUP',
    fix: '20260404_role_case_fix_skillup_prod.sql',
    rollback: '20260404_role_case_rollback_skillup_prod.sql',
  },
};

const VERIFY_SQL = '20260404_role_case_verify.sql';

function parseArgs(argv) {
  const args = {
    action: undefined,
    target: undefined,
    yes: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--yes') {
      args.yes = true;
      continue;
    }
    if (args.action === undefined) {
      args.action = value;
      continue;
    }
    if (args.target === undefined) {
      args.target = value;
      continue;
    }
  }

  return args;
}

function printUsage() {
  console.log([
    'Usage: node scripts/run-role-case-migrations.js <fix|verify|rollback> <quiz_platform_prod|rth_prod|skillup_prod|all> [--yes]',
    '',
    'Examples:',
    '  node scripts/run-role-case-migrations.js verify all',
    '  node scripts/run-role-case-migrations.js fix quiz_platform_prod --yes',
    '  node scripts/run-role-case-migrations.js rollback rth_prod --yes',
  ].join('\n'));
}

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`Missing env file: ${ENV_PATH}`);
  }
  return dotenv.parse(fs.readFileSync(ENV_PATH));
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingle && !inDouble && dollarTag === null && char === '-' && next === '-') {
      current += char + next;
      index += 1;
      inLineComment = true;
      continue;
    }

    if (!inSingle && !inDouble && dollarTag === null && char === '/' && next === '*') {
      current += char + next;
      index += 1;
      inBlockComment = true;
      continue;
    }

    if (!inSingle && !inDouble && char === '$') {
      const rest = sql.slice(index);
      const match = rest.match(/^\$[A-Za-z0-9_]*\$/);
      if (match !== null) {
        const tag = match[0];
        current += tag;
        index += tag.length - 1;
        if (dollarTag === null) {
          dollarTag = tag;
        } else if (dollarTag === tag) {
          dollarTag = null;
        }
        continue;
      }
    }

    if (dollarTag === null && !inDouble && char === '\'' && sql[index - 1] !== '\\') {
      inSingle = !inSingle;
      current += char;
      continue;
    }

    if (dollarTag === null && !inSingle && char === '"' && sql[index - 1] !== '\\') {
      inDouble = !inDouble;
      current += char;
      continue;
    }

    if (char === ';' && !inSingle && !inDouble && dollarTag === null) {
      const statement = current.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }

  return statements;
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function printRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('  (no rows)');
    return;
  }

  const columns = Object.keys(rows[0]);
  const widths = columns.map((column) =>
    Math.max(column.length, ...rows.map((row) => formatValue(row[column]).length)),
  );

  const render = (values) =>
    values
      .map((value, index) => formatValue(value).padEnd(widths[index], ' '))
      .join(' | ');

  console.log(`  ${render(columns)}`);
  console.log(`  ${widths.map((width) => '-'.repeat(width)).join('-|-')}`);
  for (const row of rows) {
    console.log(`  ${render(columns.map((column) => row[column]))}`);
  }
}

async function executeSqlFile(client, filename, { printResults }) {
  const sql = fs.readFileSync(path.join(SQL_DIR, filename), 'utf8');
  const statements = splitSqlStatements(sql);

  for (const statement of statements) {
    const result = await client.query(statement);
    if (printResults && statement.trim().toUpperCase().startsWith('SELECT')) {
      printRows(result.rows);
      console.log('');
    }
  }
}

async function runForDatabase(env, action, name) {
  const db = DATABASES[name];
  if (db === undefined) {
    throw new Error(`Unsupported database target: ${name}`);
  }

  const connectionString = env[db.envKey];
  if (typeof connectionString !== 'string' || connectionString.trim() === '') {
    throw new Error(`Missing ${db.envKey} in .env.local`);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`\n=== ${action.toUpperCase()} ${name} ===`);
  await client.connect();

  try {
    if (action === 'verify') {
      await executeSqlFile(client, VERIFY_SQL, { printResults: true });
      return;
    }

    if (action === 'fix') {
      await executeSqlFile(client, db.fix, { printResults: false });
      console.log('  fix applied');
      await executeSqlFile(client, VERIFY_SQL, { printResults: true });
      return;
    }

    if (action === 'rollback') {
      await executeSqlFile(client, db.rollback, { printResults: false });
      console.log('  rollback applied');
      await executeSqlFile(client, VERIFY_SQL, { printResults: true });
      return;
    }

    throw new Error(`Unsupported action: ${action}`);
  } finally {
    await client.end();
  }
}

async function main() {
  const { action, target, yes } = parseArgs(process.argv.slice(2));
  if (!action || !target || !['fix', 'verify', 'rollback'].includes(action)) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if ((action === 'fix' || action === 'rollback') && !yes) {
    console.error('Refusing to run a mutating action without --yes');
    process.exitCode = 1;
    return;
  }

  const env = loadEnv();
  const targets =
    target === 'all'
      ? Object.keys(DATABASES)
      : [target];

  for (const name of targets) {
    await runForDatabase(env, action, name);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
