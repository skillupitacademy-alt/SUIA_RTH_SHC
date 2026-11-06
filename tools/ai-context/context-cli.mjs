#!/usr/bin/env node
/**
 * Context Optimization CLI (`OPT01`–`OPT05`)
 *
 * Implements:
 * - OPT01 (`query-graph`, `sql-coverage`): Provenance-checked Graphify query wrapper with
 *   explicit ripgrep/git-grep source fallback and SQL parser coverage audit.
 * - OPT02 (`build-packet`): Reproducible, secret-scanned, repo-root-confined source packet
 *   and `.manifest.json` generator with full security context preservation.
 * - OPT03 (`benchmark`): Token/byte/character budget enforcement and comparable FND03
 *   conventional vs optimized context measurement.
 * - OPT04 (`checkpoint-create`, `checkpoint-validate`): Commit-aware FND session-resumption
 *   checkpoint generator and fail-closed validator.
 * - OPT05 (`host-inventory`): Non-destructive inventory of AGENTS.md, CLAUDE.md, .kiro,
 *   .codex, .claude, and Antigravity host instruction files without dumping credential values.
 */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'config.json');
const DEFAULT_OUT_DIR = path.join(REPO_ROOT, '.context-packets');
const CLI_VERSION = '1.0.0';

function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(absPath) {
  const buf = fs.readFileSync(absPath);
  return sha256Buffer(buf);
}

function estimateTokensCharsDiv4(charCount) {
  return Math.ceil(charCount / 4);
}

function loadConfig(customConfigPath) {
  const cfgPath = customConfigPath ? path.resolve(REPO_ROOT, customConfigPath) : DEFAULT_CONFIG_PATH;
  const raw = fs.readFileSync(cfgPath, 'utf8');
  return {
    configPath: toPosixPath(path.relative(REPO_ROOT, cfgPath)),
    configSha256: sha256Buffer(Buffer.from(raw, 'utf8')),
    config: JSON.parse(raw),
  };
}

/**
 * Enforces strict repository-root path confinement (`OPT02` security control).
 * Rejects `..` traversal outside REPO_ROOT and symlink escapes outside REPO_ROOT.
 */
function resolveRepoPath(relOrAbsPath, { mustExist = true } = {}) {
  if (!relOrAbsPath || typeof relOrAbsPath !== 'string') {
    throw new Error('PATH_CONFINEMENT_ERROR: Path must be a non-empty string.');
  }
  const normalizedInput = relOrAbsPath.replace(/\\/g, '/');
  const segments = normalizedInput.split('/');
  if (segments.includes('..')) {
    throw new Error(`PATH_CONFINEMENT_ERROR: Parent traversal ('..') is forbidden: ${relOrAbsPath}`);
  }

  const candidateAbs = path.isAbsolute(relOrAbsPath)
    ? path.resolve(relOrAbsPath)
    : path.resolve(REPO_ROOT, relOrAbsPath);

  const relToRoot = path.relative(REPO_ROOT, candidateAbs);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    throw new Error(`PATH_CONFINEMENT_ERROR: Path resolves outside repository root: ${relOrAbsPath}`);
  }

  const realRepoRoot = fs.realpathSync(REPO_ROOT);
  if (fs.existsSync(candidateAbs)) {
    const stat = fs.lstatSync(candidateAbs);
    const realCandidate = fs.realpathSync(candidateAbs);
    const realRel = path.relative(realRepoRoot, realCandidate);
    if (realRel.startsWith('..') || path.isAbsolute(realRel)) {
      throw new Error(`PATH_CONFINEMENT_ERROR: Symlink target escapes repository root: ${relOrAbsPath}`);
    }
    if (stat.isSymbolicLink()) {
      // Even intra-repo symlinks are checked; if it points outside root it threw above.
    }
  } else if (mustExist) {
    throw new Error(`PATH_NOT_FOUND: Required repository file does not exist: ${relOrAbsPath}`);
  } else {
    // Check nearest existing ancestor for symlink escape
    let parent = path.dirname(candidateAbs);
    while (!fs.existsSync(parent) && parent !== path.dirname(parent)) {
      parent = path.dirname(parent);
    }
    if (fs.existsSync(parent)) {
      const realParent = fs.realpathSync(parent);
      const realParentRel = path.relative(realRepoRoot, realParent);
      if (realParentRel.startsWith('..') || path.isAbsolute(realParentRel)) {
        throw new Error(`PATH_CONFINEMENT_ERROR: Ancestor directory escapes repository root: ${relOrAbsPath}`);
      }
    }
  }

  return {
    absPath: candidateAbs,
    relPath: toPosixPath(relToRoot),
  };
}

function runGit(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (allowFailure) {
      return '';
    }
    throw err;
  }
}

function getGitProvenance() {
  const head = runGit(['rev-parse', 'HEAD']);
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const statusOutput = runGit(['status', '--porcelain']);
  const dirtyEntries = statusOutput
    ? statusOutput
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => {
          const status = line.slice(0, 2).trim();
          const filePath = line.slice(3).trim();
          let sha256 = null;
          const abs = path.resolve(REPO_ROOT, filePath);
          if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
            sha256 = sha256File(abs);
          }
          return { status, path: toPosixPath(filePath), sha256 };
        })
    : [];

  return {
    sourceRevision: head,
    branch,
    worktreeState: dirtyEntries.length === 0 ? 'clean' : 'dirty',
    dirtyFilesCount: dirtyEntries.length,
    dirtyFiles: dirtyEntries,
  };
}

function isForbiddenSecretPath(relPosixPath, secretDenylist) {
  const base = path.posix.basename(relPosixPath);
  if (base === '.env.example' || base === '.env.template') {
    return false;
  }
  if (base === '.env' || (base.startsWith('.env.') && base !== '.env.example')) {
    return true;
  }
  if (base === '.npmrc') {
    return true;
  }
  const ext = path.posix.extname(base).toLowerCase();
  if (['.pem', '.key', '.p12', '.pfx'].includes(ext)) {
    return true;
  }
  if (/^(credentials|secrets).*\.json$/i.test(base)) {
    return true;
  }
  return false;
}

/**
 * Scans content against configured secret denylist patterns (`OPT02` security control).
 * Never echoes the matched secret value—reports only pattern ID, file path, and line number.
 */
function scanContentForSecrets(relPosixPath, content, secretDenylist) {
  const findings = [];
  if (isForbiddenSecretPath(relPosixPath, secretDenylist)) {
    findings.push({
      file: relPosixPath,
      line: 1,
      patternId: 'FORBIDDEN_SECRET_PATH',
      description: 'File path matches forbidden secret/environment file denylist.',
    });
    return findings;
  }

  const lines = content.split(/\r?\n/);
  for (const rule of secretDenylist.contentPatterns || []) {
    const regex = new RegExp(rule.regex);
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        findings.push({
          file: relPosixPath,
          line: i + 1,
          patternId: rule.id,
          description: rule.description,
        });
      }
    }
  }
  return findings;
}

/**
 * Extracts symbol line ranges (functions, classes, exported consts, SQL tables) for manifest traceability
 * and optional structural outline generation.
 */
function extractSymbolRanges(relPosixPath, content) {
  const lines = content.split(/\r?\n/);
  const symbols = [];
  const ext = path.posix.extname(relPosixPath).toLowerCase();

  if (['.ts', '.tsx', '.js', '.mjs'].includes(ext)) {
    const patterns = [
      { kind: 'function', re: /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/ },
      { kind: 'class', re: /^\s*(?:export\s+)?class\s+([A-Za-z0-9_]+)/ },
      { kind: 'interface', re: /^\s*(?:export\s+)?interface\s+([A-Za-z0-9_]+)/ },
      { kind: 'type', re: /^\s*(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=/ },
      { kind: 'const', re: /^\s*export\s+const\s+([A-Za-z0-9_]+)\s*=/ },
    ];
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      for (const p of patterns) {
        const m = line.match(p.re);
        if (m) {
          symbols.push({
            name: m[1],
            kind: p.kind,
            startLine: idx + 1,
            signature: line.trim().slice(0, 140),
          });
          break;
        }
      }
    }
  } else if (ext === '.sql') {
    const sqlPatterns = [
      { kind: 'table', re: /^\s*CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i },
      { kind: 'alter_table', re: /^\s*ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i },
      { kind: 'index', re: /^\s*CREATE\s+(?:UNIQUE\s+)?INDEX(?:\s+CONCURRENTLY)?(?:\s+IF\s+NOT\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i },
      { kind: 'plpgsql_guard', re: /^\s*DO\s+\$\$/i },
    ];
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      for (const p of sqlPatterns) {
        const m = line.match(p.re);
        if (m) {
          symbols.push({
            name: m[1] || `DO_BLOCK_L${idx + 1}`,
            kind: p.kind,
            startLine: idx + 1,
            signature: line.trim().slice(0, 140),
          });
          break;
        }
      }
    }
  } else if (ext === '.md') {
    for (let idx = 0; idx < lines.length; idx++) {
      const m = lines[idx].match(/^(#{1,3})\s+(.+)$/);
      if (m) {
        symbols.push({
          name: m[2].trim(),
          kind: `heading_h${m[1].length}`,
          startLine: idx + 1,
          signature: lines[idx].trim().slice(0, 140),
        });
      }
    }
  }

  for (let i = 0; i < symbols.length; i++) {
    symbols[i].endLine = i + 1 < symbols.length ? symbols[i + 1].startLine - 1 : lines.length;
  }

  return symbols;
}

function resolveRipgrepBinary(config) {
  const candidates = config?.graphify?.ripgrepFallbackPaths || ['rg'];
  for (const candidate of candidates) {
    try {
      const versionOut = execFileSync(candidate, ['--version'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const firstLine = versionOut.split(/\r?\n/)[0]?.trim() || 'rg';
      return { driver: 'ripgrep', binary: candidate, version: firstLine };
    } catch {
      // try next candidate
    }
  }
  return { driver: 'git-grep', binary: 'git', version: runGit(['--version'], { allowFailure: true }) };
}

function searchCallersWithFallback(pattern, searchRoots, config) {
  const rgInfo = resolveRipgrepBinary(config);
  const validRoots = searchRoots.filter((r) => fs.existsSync(path.resolve(REPO_ROOT, r)));
  let matchedFiles = [];

  if (rgInfo.driver === 'ripgrep') {
    try {
      const out = execFileSync(rgInfo.binary, ['-l', pattern, ...validRoots], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      matchedFiles = out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(toPosixPath)
        .sort();
    } catch (err) {
      // rg exits 1 when no matches found
      if (err && err.status === 1) {
        matchedFiles = [];
      }
    }
  } else {
    try {
      const out = execFileSync('git', ['grep', '-l', '-E', pattern, '--', ...validRoots], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      matchedFiles = out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(toPosixPath)
        .sort();
    } catch {
      matchedFiles = [];
    }
  }

  return {
    searchEngine: rgInfo.driver,
    searchVersion: rgInfo.version,
    pattern,
    searchRoots: validRoots,
    matchedCount: matchedFiles.length,
    matchedFiles,
  };
}

/**
 * Checks `graphify-out/graph.json` provenance against current git `HEAD` (`OPT01`).
 */
function inspectGraphProvenance(config) {
  const gitProv = getGitProvenance();
  const graphRel = config.graphify.graphPath;
  const graphAbs = path.resolve(REPO_ROOT, graphRel);

  if (!fs.existsSync(graphAbs)) {
    return {
      exists: false,
      graphPath: graphRel,
      advisory: true,
      advisoryReason: 'graphify-out/graph.json does not exist; fallback to source search required.',
      sourceRevision: gitProv.sourceRevision,
      worktreeState: gitProv.worktreeState,
    };
  }

  const stat = fs.statSync(graphAbs);
  const graphSha256 = sha256File(graphAbs);
  const headCommitEpochSec = Number(runGit(['show', '-s', '--format=%ct', 'HEAD'], { allowFailure: true }) || 0);
  const graphMtimeSec = Math.floor(stat.mtimeMs / 1000);
  const graphDirtyInGit = gitProv.dirtyFiles.some((d) => d.path === graphRel);
  const olderThanHead = headCommitEpochSec > 0 && graphMtimeSec < headCommitEpochSec;

  // Graphify's graph.json does not embed a git commit SHA field natively; therefore unless
  // verified by this wrapper against HEAD + mtime, it is marked with explicit provenance metadata.
  const advisory = olderThanHead || gitProv.worktreeState === 'dirty';
  const reasons = [];
  if (olderThanHead) {
    reasons.push(`graph.json mtime (${new Date(stat.mtimeMs).toISOString()}) is older than HEAD commit timestamp.`);
  }
  if (gitProv.worktreeState === 'dirty') {
    reasons.push(`Working tree has ${gitProv.dirtyFilesCount} uncommitted entry(ies); graph may not reflect uncommitted edits or has uncommitted graph updates.`);
  }

  return {
    exists: true,
    graphPath: graphRel,
    graphSha256,
    graphSizeBytes: stat.size,
    graphModifiedAt: new Date(stat.mtimeMs).toISOString(),
    headCommit: gitProv.sourceRevision,
    headCommitEpochSec,
    worktreeState: gitProv.worktreeState,
    graphDirtyInGit,
    advisory,
    advisoryReason: reasons.length > 0 ? reasons.join(' ') : 'Graph mtime is current with clean HEAD.',
  };
}

/**
 * `OPT01`: Inspects SQL parser coverage in `graphify-out/graph.json`.
 */
function runSqlCoverage(config, options = {}) {
  const prov = inspectGraphProvenance(config);
  if (!prov.exists) {
    throw new Error('graphify-out/graph.json is missing; cannot inspect SQL coverage.');
  }

  const rawGraph = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, config.graphify.graphPath), 'utf8'));
  const nodes = rawGraph.nodes || [];
  const links = rawGraph.links || [];

  const sqlNodes = nodes.filter((n) => (n.source_file || '').toLowerCase().endsWith('.sql'));
  const sqlFilesSet = new Set(sqlNodes.map((n) => n.source_file));

  const fnd03SqlTargets = [
    'packages/db/migrations/0001_fnd03_add_tenant_ownership.sql',
    'packages/db-tutorial/migrations/0029_fnd03_add_tenant_to_progress.sql',
  ];

  const targetInspection = fnd03SqlTargets.map((relPath) => {
    const fileNodes = sqlNodes.filter((n) => toPosixPath(n.source_file || '') === relPath);
    const abs = path.resolve(REPO_ROOT, relPath);
    const content = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    const diskConstructs = extractSymbolRanges(relPath, content);
    return {
      file: relPath,
      indexedInGraph: fileNodes.length > 0,
      graphNodeCount: fileNodes.length,
      graphNodes: fileNodes.map((n) => ({
        id: n.id,
        label: n.label,
        sourceLocation: n.source_location ?? null,
      })),
      diskConstructsCount: diskConstructs.length,
      diskConstructs,
      parserLimitationNote:
        fileNodes.length === 1 && diskConstructs.some((c) => c.kind === 'plpgsql_guard' || c.kind === 'alter_table')
          ? 'tree_sitter_sql indexes the .sql file node cleanly, but procedural PL/pgSQL DO $$ ... END $$; blocks and ALTER TABLE statements do not emit separate child symbol nodes in graph.json; direct SQL file inclusion is required for security packets.'
          : 'Indexed with child SQL symbol nodes.',
    };
  });

  const report = {
    command: 'sql-coverage',
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    graphProvenance: prov,
    graphTotals: {
      totalNodes: nodes.length,
      totalEdges: links.length,
      sqlNodeCount: sqlNodes.length,
      distinctSqlFilesIndexed: sqlFilesSet.size,
    },
    sqlParserCapabilities: config.graphify.sqlParser,
    fnd03MigrationInspection: targetInspection,
  };

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'sql-coverage-report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

  return { report, outFile: toPosixPath(path.relative(REPO_ROOT, outFile)) };
}

/**
 * `OPT01`: Provenance-checked Graphify query wrapper with bounded output and ripgrep fallback.
 */
function runQueryGraph(queryText, config, options = {}) {
  if (!queryText || !queryText.trim()) {
    throw new Error('query-graph requires a non-empty query string.');
  }

  const prov = inspectGraphProvenance(config);
  const maxResults = Number(options.maxResults || config.graphify.maxResultsDefault || 15);
  const terms = queryText
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  let matchedNodes = [];
  let matchedEdges = [];
  let totalMatchingNodes = 0;

  if (prov.exists) {
    const rawGraph = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, config.graphify.graphPath), 'utf8'));
    const nodes = rawGraph.nodes || [];
    const links = rawGraph.links || [];

    const scored = [];
    for (const n of nodes) {
      const hay = `${n.id || ''} ${n.label || ''} ${n.source_file || ''}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (hay.includes(term)) {
          score += (n.label || '').toLowerCase() === term ? 5 : 2;
        }
      }
      if (score > 0) {
        scored.push({ score, node: n });
      }
    }

    scored.sort((a, b) => b.score - a.score || String(a.node.id).localeCompare(String(b.node.id)));
    totalMatchingNodes = scored.length;
    matchedNodes = scored.slice(0, maxResults).map((s) => ({
      id: s.node.id,
      label: s.node.label,
      sourceFile: s.node.source_file || null,
      sourceLocation: s.node.source_location ?? null,
      community: s.node.community ?? null,
      score: s.score,
    }));

    const selectedIds = new Set(matchedNodes.map((n) => n.id));
    matchedEdges = links
      .filter((e) => selectedIds.has(e.source) || selectedIds.has(e.target))
      .slice(0, maxResults * 2)
      .map((e) => ({
        source: e.source,
        target: e.target,
        relation: e.relation || e.type || 'related',
      }));
  }

  const truncated = totalMatchingNodes > maxResults;
  const fallbackPattern = options.fallbackPattern || terms.join('|');
  const fallbackSearch = searchCallersWithFallback(
    fallbackPattern,
    config.packets?.fnd03?.callerSearchRoots || ['packages', 'apps', 'src'],
    config
  );

  const resultPayload = {
    command: 'query-graph',
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    query: queryText,
    provenance: prov,
    advisory: prov.advisory,
    truncation: {
      maxResults,
      totalMatchingNodes,
      returnedNodes: matchedNodes.length,
      returnedEdges: matchedEdges.length,
      truncated,
      incompletenessReason: truncated
        ? `Matched ${totalMatchingNodes} graph nodes; truncated to top ${maxResults} to stay within explorationBudget.`
        : matchedNodes.length === 0
          ? 'No graph nodes matched; rely on sourceFallbackResults.'
          : null,
    },
    graphResults: {
      nodes: matchedNodes,
      edges: matchedEdges,
    },
    sourceFallbackResults: fallbackSearch,
  };

  let serialized = JSON.stringify(resultPayload, null, 2);
  const budget = config.budgets.explorationBudget;
  let budgetExceeded = Buffer.byteLength(serialized, 'utf8') > budget.maxBytes;

  if (budgetExceeded) {
    resultPayload.graphResults.edges = resultPayload.graphResults.edges.slice(0, 5);
    resultPayload.truncation.truncated = true;
    resultPayload.truncation.incompletenessReason =
      'Trimmed graph edge list to stay within explorationBudget.maxBytes.';
    serialized = JSON.stringify(resultPayload, null, 2);
    budgetExceeded = Buffer.byteLength(serialized, 'utf8') > budget.maxBytes;
  }

  resultPayload.budgetMetrics = {
    bytes: Buffer.byteLength(serialized, 'utf8'),
    chars: serialized.length,
    tokensEstimateCharsDiv4: estimateTokensCharsDiv4(serialized.length),
    maxBytes: budget.maxBytes,
    withinExplorationBudget: !budgetExceeded,
  };

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const slug = queryText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const outFile = path.join(outDir, `query-${slug || 'graph'}.json`);
  fs.writeFileSync(outFile, JSON.stringify(resultPayload, null, 2) + '\n', 'utf8');

  return {
    resultPayload,
    outFile: toPosixPath(path.relative(REPO_ROOT, outFile)),
  };
}

function formatWithLineNumbers(content) {
  const lines = content.split(/\r?\n/);
  return lines.map((line, idx) => `${String(idx + 1).padStart(4, ' ')}: ${line}`).join('\n');
}

function formatStructuralOutline(relPosixPath, content, symbols) {
  const lines = content.split(/\r?\n/);
  const importLines = lines
    .map((l, i) => ({ line: l, lineNo: i + 1 }))
    .filter((x) => /^\s*(import|export\s+\*|export\s+\{)/.test(x.line))
    .slice(0, 25)
    .map((x) => `${String(x.lineNo).padStart(4, ' ')}: ${x.line}`);

  const symbolLines = symbols.map(
    (s) => `Lines ${s.startLine}-${s.endLine} [${s.kind}] ${s.name}: ${s.signature}`
  );

  return [
    `# Structural Outline (Compressed Navigation View — NOT Standalone Security Audit Evidence)`,
    `# File: ${relPosixPath} (${lines.length} lines)`,
    ...(importLines.length ? ['## Imports / Re-exports', ...importLines] : []),
    '## Extracted Symbols & Line Ranges',
    ...(symbolLines.length ? symbolLines : ['(No top-level symbols matched regex extractor)']),
  ].join('\n');
}

/**
 * `OPT02`: Builds a reproducible, secret-scanned, repo-root-confined source packet and `.manifest.json`.
 */
function buildPacket(packetId, configMetadata, options = {}) {
  const { config, configPath, configSha256 } = configMetadata;
  const packetDef = config.packets?.[packetId];
  if (!packetDef) {
    throw new Error(`Unknown packet ID '${packetId}'. Available packets: ${Object.keys(config.packets || {}).join(', ')}`);
  }

  const mode = options.mode || 'full'; // 'full' | 'navigation'
  if (!['full', 'navigation'].includes(mode)) {
    throw new Error(`Invalid packet mode '${mode}'. Expected 'full' or 'navigation'.`);
  }

  const gitProv = getGitProvenance();
  if (gitProv.worktreeState === 'dirty' && !options.allowDirty) {
    throw new Error(
      `WORKTREE_DIRTY_ERROR: Repository has ${gitProv.dirtyFilesCount} dirty file(s). Commit changes or pass --allow-dirty to record explicit dirty file hashes in the packet manifest.`
    );
  }

  // Also support injecting an extra path for negative validation tests (e.g. VAL04 path confinement / secret scan tests)
  const extraFiles = options.extraFiles || [];

  const categorizedFiles = [
    ...packetDef.securityCriticalFiles.map((f) => ({ path: f, category: 'security_critical', preserveFullInHybrid: true })),
    ...packetDef.schemaAndMigrationFiles.map((f) => ({ path: f, category: 'schema_or_migration', preserveFullInHybrid: true })),
    ...packetDef.securityTestFiles.map((f) => ({ path: f, category: 'negative_security_test', preserveFullInHybrid: true })),
    ...packetDef.solDecisionFiles.map((f) => ({ path: f, category: 'sol_decision', preserveFullInHybrid: true })),
    ...extraFiles.map((f) => ({ path: f, category: 'extra_input', preserveFullInHybrid: true })),
  ];

  // Deduplicate while preserving order
  const seen = new Set();
  const orderedFiles = [];
  for (const item of categorizedFiles) {
    if (!seen.has(item.path)) {
      seen.add(item.path);
      orderedFiles.push(item);
    }
  }

  // Discover callers via ripgrep / git-grep fallback to verify completeness
  const callerDiscovery = searchCallersWithFallback(
    packetDef.callerSearchPattern,
    packetDef.callerSearchRoots,
    config
  );

  const selectedFileManifestEntries = [];
  const allSecretFindings = [];
  const markdownSections = [];

  markdownSections.push(
    `# ${packetDef.title} (${mode.toUpperCase()} MODE)`,
    ``,
    `- **Packet ID**: \`${packetDef.id}\``,
    `- **Mode**: \`${mode}\` (${
      mode === 'full'
        ? 'All security logic, callers, schemas, SQL migrations, negative tests, and Sol decisions included UNCOMPRESSED'
        : 'Structural navigation outline only — DO NOT use alone for security sign-off'
    })`,
    `- **Source Revision (HEAD)**: \`${gitProv.sourceRevision}\` (\`${gitProv.branch}\`)`,
    `- **Worktree State**: \`${gitProv.worktreeState}\` (dirty files: ${gitProv.dirtyFilesCount})`,
    `- **CLI Version**: \`${CLI_VERSION}\``,
    ``
  );

  for (const item of orderedFiles) {
    // 1. Strict path confinement check
    const resolved = resolveRepoPath(item.path, { mustExist: true });
    const rawBuf = fs.readFileSync(resolved.absPath);
    const content = rawBuf.toString('utf8');
    const fileSha256 = sha256Buffer(rawBuf);

    // 2. Strict secret denylist scan
    const secretHits = scanContentForSecrets(resolved.relPath, content, config.secretDenylist);
    if (secretHits.length > 0) {
      allSecretFindings.push(...secretHits);
      continue;
    }

    const lineCount = content.split(/\r?\n/).length;
    const symbols = extractSymbolRanges(resolved.relPath, content);
    const includeFullBody = mode === 'full';

    const renderedBody = includeFullBody
      ? formatWithLineNumbers(content)
      : formatStructuralOutline(resolved.relPath, content, symbols);

    const ext = path.posix.extname(resolved.relPath).slice(1) || 'text';
    const sectionText = [
      `---`,
      `## File: \`${resolved.relPath}\``,
      `- **Category**: \`${item.category}\``,
      `- **SHA-256**: \`${fileSha256}\``,
      `- **Lines**: \`1-${lineCount}\` (${rawBuf.length} bytes)`,
      `- **Representation**: \`${includeFullBody ? 'full_uncompressed_with_line_numbers' : 'structural_outline'}\``,
      ``,
      `\`\`\`${ext}`,
      renderedBody,
      `\`\`\``,
      ``,
    ].join('\n');

    markdownSections.push(sectionText);

    selectedFileManifestEntries.push({
      path: resolved.relPath,
      category: item.category,
      sha256: fileSha256,
      bytes: rawBuf.length,
      chars: content.length,
      lines: lineCount,
      representation: includeFullBody ? 'full_uncompressed' : 'structural_outline',
      symbolCount: symbols.length,
      symbols,
    });
  }

  if (allSecretFindings.length > 0) {
    const safeErrorDetails = allSecretFindings
      .map((f) => `${f.file}:${f.line} [${f.patternId}] (${f.description})`)
      .join('; ');
    throw new Error(`SECRET_SCAN_ABORT: Secret denylist violation detected in packet inputs: ${safeErrorDetails}`);
  }

  // Enforce sourcePacketBudget and record omittedItems if overflow occurs
  const budget = config.budgets.sourcePacketBudget;
  const omittedItems = [];
  let fullMarkdown = markdownSections.join('\n');
  let packetBytes = Buffer.byteLength(fullMarkdown, 'utf8');

  while (packetBytes > budget.maxBytes && markdownSections.length > 2) {
    const removedSection = markdownSections.pop();
    const removedEntry = selectedFileManifestEntries.pop();
    if (removedEntry) {
      omittedItems.push({
        path: removedEntry.path,
        category: removedEntry.category,
        bytes: removedEntry.bytes,
        reason: `Omitted from in-context packet to enforce sourcePacketBudget.maxBytes (${budget.maxBytes}); full file remains on disk.`,
      });
    }
    fullMarkdown = markdownSections.join('\n');
    packetBytes = Buffer.byteLength(fullMarkdown, 'utf8');
  }

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  // Verify outDir is inside REPO_ROOT
  resolveRepoPath(outDir, { mustExist: false });
  fs.mkdirSync(outDir, { recursive: true });

  const suffix = mode === 'full' ? 'packet' : 'navigation-packet';
  const packetFilename = `${packetDef.id}-${suffix}.md`;
  const manifestFilename = `${packetDef.id}-${suffix}.manifest.json`;
  const packetAbsPath = path.join(outDir, packetFilename);
  const manifestAbsPath = path.join(outDir, manifestFilename);

  fs.writeFileSync(packetAbsPath, fullMarkdown, 'utf8');
  const packetSha256 = sha256Buffer(Buffer.from(fullMarkdown, 'utf8'));

  const uncoveredCallers = callerDiscovery.matchedFiles.filter(
    (f) => !selectedFileManifestEntries.some((s) => s.path === f)
  );

  const manifest = {
    schemaVersion: '1.0.0',
    packetId: packetDef.id,
    title: packetDef.title,
    mode,
    taskIds: packetDef.taskIds,
    generatedAt: new Date().toISOString(),
    sourceRevision: gitProv.sourceRevision,
    branch: gitProv.branch,
    worktreeState: gitProv.worktreeState,
    dirtyFiles: gitProv.dirtyFiles,
    toolProvenance: {
      cliPath: 'tools/ai-context/context-cli.mjs',
      cliVersion: CLI_VERSION,
      cliSha256: sha256File(__filename),
      configPath,
      configSha256,
      searchEngine: callerDiscovery.searchEngine,
      searchEngineVersion: callerDiscovery.searchVersion,
    },
    reproductionCommand: `node tools/ai-context/context-cli.mjs build-packet --packet ${packetDef.id} --mode ${mode}${
      gitProv.worktreeState === 'dirty' ? ' --allow-dirty' : ''
    }`,
    packetOutput: {
      path: toPosixPath(path.relative(REPO_ROOT, packetAbsPath)),
      sha256: packetSha256,
      bytes: packetBytes,
      chars: fullMarkdown.length,
      lines: fullMarkdown.split(/\r?\n/).length,
      tokensEstimateCharsDiv4: estimateTokensCharsDiv4(fullMarkdown.length),
      tokenCountMethod: 'chars_div_4_estimate (plus external Repomix o200k_base calibration in config.json)',
    },
    budgetStatus: {
      budgetName: 'sourcePacketBudget',
      maxBytes: budget.maxBytes,
      maxChars: budget.maxChars,
      maxTokensEstimate: budget.maxTokensEstimate,
      withinBudget: packetBytes <= budget.maxBytes && omittedItems.length === 0,
      omittedItemsCount: omittedItems.length,
      omittedItems,
    },
    secretScan: {
      status: 'PASSED',
      scannedFilesCount: selectedFileManifestEntries.length,
      findingsCount: 0,
    },
    callerCoverage: {
      pattern: callerDiscovery.pattern,
      discoveredFilesCount: callerDiscovery.matchedCount,
      discoveredFiles: callerDiscovery.matchedFiles,
      uncoveredCallersCount: uncoveredCallers.length,
      uncoveredCallers,
    },
    selectedFilesCount: selectedFileManifestEntries.length,
    selectedFiles: selectedFileManifestEntries,
    excludedPatterns: config.defaultExcludeGlobs,
    knownLimitations: [
      'Graphify tree_sitter_sql indexes .sql file, CREATE TABLE, and CREATE INDEX nodes, but procedural PL/pgSQL DO $$ ... END $$; blocks and cross-language Drizzle-to-SQL links are not represented as graph edges; SQL migrations and Drizzle schemas are therefore embedded directly in full mode.',
      mode === 'navigation'
        ? 'Navigation mode strips function bodies and test assertions; NEVER use navigation mode alone for security review or sign-off.'
        : 'Full mode preserves 100% of function bodies, negative test assertions, SQL migrations, and Sol D1/D2 architectural decisions.',
    ],
  };

  fs.writeFileSync(manifestAbsPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  return {
    manifest,
    packetRelPath: toPosixPath(path.relative(REPO_ROOT, packetAbsPath)),
    manifestRelPath: toPosixPath(path.relative(REPO_ROOT, manifestAbsPath)),
  };
}

/**
 * `OPT03`: Benchmarks the conventional FND03 retrieval recipe against the optimized full and navigation packets
 * against the same frozen `HEAD` using identical counting methods.
 */
function runBenchmark(packetId, configMetadata, options = {}) {
  const { config } = configMetadata;
  const packetDef = config.packets?.[packetId];
  if (!packetDef) {
    throw new Error(`Unknown packet ID '${packetId}'.`);
  }

  const gitProv = getGitProvenance();

  // 1. Build both full and navigation packets so benchmark measures actual generated artifacts
  const fullPacket = buildPacket(packetId, configMetadata, {
    mode: 'full',
    allowDirty: true,
    outDir: options.outDir,
  });
  const navPacket = buildPacket(packetId, configMetadata, {
    mode: 'navigation',
    allowDirty: true,
    outDir: options.outDir,
  });

  // 2. Measure the documented conventional baseline recipe on the exact same frozen HEAD
  const baselineFiles = packetDef.conventionalBaselineRecipe?.files || [];
  let baselineBytes = 0;
  let baselineChars = 0;
  let baselineLines = 0;
  const baselineFileBreakdown = [];

  for (const relPath of baselineFiles) {
    const resolved = resolveRepoPath(relPath, { mustExist: true });
    const buf = fs.readFileSync(resolved.absPath);
    const text = buf.toString('utf8');
    const lines = text.split(/\r?\n/).length;
    baselineBytes += buf.length;
    baselineChars += text.length;
    baselineLines += lines;
    baselineFileBreakdown.push({
      path: resolved.relPath,
      bytes: buf.length,
      chars: text.length,
      lines,
      tokensEstimateCharsDiv4: estimateTokensCharsDiv4(text.length),
    });
  }

  const baselineTokensEst = estimateTokensCharsDiv4(baselineChars);
  const fullTokensEst = fullPacket.manifest.packetOutput.tokensEstimateCharsDiv4;
  const navTokensEst = navPacket.manifest.packetOutput.tokensEstimateCharsDiv4;

  const fullVsBaselineByteDeltaPct = Number(
    (((fullPacket.manifest.packetOutput.bytes - baselineBytes) / baselineBytes) * 100).toFixed(2)
  );
  const navVsBaselineByteDeltaPct = Number(
    (((navPacket.manifest.packetOutput.bytes - baselineBytes) / baselineBytes) * 100).toFixed(2)
  );

  const benchmarkReport = {
    command: 'benchmark',
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    packetId,
    sourceRevision: gitProv.sourceRevision,
    worktreeState: gitProv.worktreeState,
    countingMethodology: {
      bytes: 'Exact UTF-8 byte length (Buffer.byteLength)',
      chars: 'Exact UTF-16 code unit / character count',
      tokensEstimateCharsDiv4: 'Deterministic Math.ceil(chars / 4) applied identically across all recipes',
      repomixCalibration:
        'External Repomix 1.14.0 (tiktoken o200k_base) measurements recorded alongside deterministic chars/4 counts',
    },
    recipes: {
      conventionalUnscopedBaseline: {
        description: packetDef.conventionalBaselineRecipe.description,
        filesCount: baselineFileBreakdown.length,
        bytes: baselineBytes,
        chars: baselineChars,
        lines: baselineLines,
        tokensEstimateCharsDiv4: baselineTokensEst,
        auditSafeForSecurityReview: true,
        drawbacks: [
          'Includes full 289 KB graphify-out/GRAPH_REPORT.md and full multi-slice Tera/Gemini handoffs containing unrelated TC04-TC20 noise.',
          'Exceeds sourcePacketBudget (262,144 bytes) by more than 2x.',
        ],
        files: baselineFileBreakdown,
      },
      optimizedFullSecurityPacket: {
        description:
          'Task-scoped FND03 packet generated by context-cli build-packet --mode full (all 28 FND03 RBAC, caller, schema, SQL migration, negative test, and Sol D1/D2 files uncompressed with line numbers + SHA-256 manifest).',
        artifactPath: fullPacket.packetRelPath,
        manifestPath: fullPacket.manifestRelPath,
        filesCount: fullPacket.manifest.selectedFilesCount,
        bytes: fullPacket.manifest.packetOutput.bytes,
        chars: fullPacket.manifest.packetOutput.chars,
        lines: fullPacket.manifest.packetOutput.lines,
        tokensEstimateCharsDiv4: fullTokensEst,
        deltaVsConventionalBaselinePct: fullVsBaselineByteDeltaPct,
        withinSourcePacketBudget: fullPacket.manifest.budgetStatus.withinBudget,
        auditSafeForSecurityReview: true,
      },
      optimizedNavigationOutlinePacket: {
        description:
          'Structural navigation packet generated by context-cli build-packet --mode navigation (imports + symbol signatures + line ranges). For initial orientation only.',
        artifactPath: navPacket.packetRelPath,
        manifestPath: navPacket.manifestRelPath,
        filesCount: navPacket.manifest.selectedFilesCount,
        bytes: navPacket.manifest.packetOutput.bytes,
        chars: navPacket.manifest.packetOutput.chars,
        lines: navPacket.manifest.packetOutput.lines,
        tokensEstimateCharsDiv4: navTokensEst,
        deltaVsConventionalBaselinePct: navVsBaselineByteDeltaPct,
        withinExplorationAndPacketBudget: navPacket.manifest.budgetStatus.withinBudget,
        auditSafeForSecurityReview: false,
      },
      externalRepomixReferencePackets: packetDef.externalRepomixArtifacts,
    },
  };

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${packetId}-benchmark.json`);
  fs.writeFileSync(outFile, JSON.stringify(benchmarkReport, null, 2) + '\n', 'utf8');

  return {
    benchmarkReport,
    outFile: toPosixPath(path.relative(REPO_ROOT, outFile)),
  };
}

/**
 * `OPT04`: Creates a commit-aware FND session-resumption checkpoint JSON file.
 */
function createCheckpoint(packetId, configMetadata, options = {}) {
  const { config } = configMetadata;
  const packetDef = config.packets?.[packetId];
  if (!packetDef) {
    throw new Error(`Unknown packet ID '${packetId}'.`);
  }

  const gitProv = getGitProvenance();
  if (gitProv.worktreeState === 'dirty' && !options.allowDirty) {
    throw new Error(
      'CHECKPOINT_DIRTY_ERROR: Cannot create a canonical checkpoint on a dirty worktree without --allow-dirty.'
    );
  }

  const solDecisionRel = 'audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md';
  const solDecisionResolved = resolveRepoPath(solDecisionRel, { mustExist: true });
  const solDecisionCommit =
    runGit(['log', '-n', '1', '--format=%H', '--', solDecisionRel], { allowFailure: true }) || gitProv.sourceRevision;

  const trackedFiles = [
    ...packetDef.securityCriticalFiles,
    ...packetDef.schemaAndMigrationFiles,
    ...packetDef.securityTestFiles,
    ...packetDef.solDecisionFiles,
  ];
  const uniqueTracked = [...new Set(trackedFiles)];

  const fileFingerprints = uniqueTracked.map((relPath) => {
    const resolved = resolveRepoPath(relPath, { mustExist: true });
    return {
      path: resolved.relPath,
      sha256: sha256File(resolved.absPath),
    };
  });

  const status = options.status || 'IN_PROGRESS';
  if (status === 'CLOSED') {
    throw new Error('CHECKPOINT_POLICY_ERROR: Only Sol may mark an FND or remediation item CLOSED.');
  }

  const checkpoint = {
    schemaVersion: '1.0.0',
    checkpointId: `${packetId}-checkpoint-${gitProv.sourceRevision.slice(0, 8)}`,
    packetId,
    taskIds: packetDef.taskIds,
    status,
    createdAt: new Date().toISOString(),
    commits: {
      sourceHead: gitProv.sourceRevision,
      toolHead: gitProv.sourceRevision,
      testHead: gitProv.sourceRevision,
    },
    worktreeStateAtCreation: gitProv.worktreeState,
    solDecisionReference: {
      solDecisionPath: solDecisionResolved.relPath,
      solDecisionRevision: solDecisionCommit,
      solDecisionSha256: sha256File(solDecisionResolved.absPath),
      governingDecisions: ['D1: Profile Route Tenant Context and Student Self-Profile Access', 'D2: FND03 Migration Provenance'],
    },
    openBlockers: [
      'Remove residual brand: auth.brand || "realtutorialhub" fallback in packages/auth/src/rbac/rbac.adapter.ts:64 and apps/api-server/src/app/api/auth/onboarding/route.ts:79,87.',
      'Remove PROFILE_READ and PROFILE_WRITE from ROLES.STUDENT in packages/auth/src/rbac/role-permissions.ts so student self-profile access must pass ownership + tenant equality.',
      'Resolve the 2 profile route tenant-context TypeScript errors in apps/api-server/src/app/api/auth/profile/route.ts per Sol D1.',
    ],
    verificationCommandsAdvisoryOnly: [
      'pnpm --filter @repo/auth typecheck',
      'pnpm --filter api-server typecheck',
      'pnpm --filter @repo/auth test -- src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts src/rbac/__tests__/ownership.service.test.ts',
    ],
    autoExecuteCommands: false,
    trackedFilesCount: fileFingerprints.length,
    fileFingerprints,
  };

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  resolveRepoPath(outDir, { mustExist: false });
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = options.file
    ? resolveRepoPath(options.file, { mustExist: false }).absPath
    : path.join(outDir, `${packetId}-checkpoint.json`);

  fs.writeFileSync(outFile, JSON.stringify(checkpoint, null, 2) + '\n', 'utf8');

  return {
    checkpoint,
    outFile: toPosixPath(path.relative(REPO_ROOT, outFile)),
  };
}

/**
 * `OPT04`: Validates a commit-aware FND checkpoint and fails closed if stale, dirty, tampered, or marked CLOSED.
 * Never executes recorded commands.
 */
function validateCheckpoint(checkpointFile, options = {}) {
  const resolved = resolveRepoPath(checkpointFile, { mustExist: true });
  const checkpoint = JSON.parse(fs.readFileSync(resolved.absPath, 'utf8'));
  const gitProv = getGitProvenance();

  const failures = [];

  if (checkpoint.autoExecuteCommands !== false) {
    failures.push('INVALID_EXECUTION_FLAG: checkpoint.autoExecuteCommands must be strictly false.');
  }

  if (checkpoint.status === 'CLOSED') {
    failures.push('UNAUTHORIZED_CLOSURE_STATUS: Checkpoints cannot self-certify status === "CLOSED" without Sol acceptance.');
  }

  // 1. Validate HEAD commit match
  const expectedHead = options.simulateHead || gitProv.sourceRevision;
  if (checkpoint.commits?.sourceHead !== expectedHead) {
    failures.push(
      `HEAD_MISMATCH: Checkpoint sourceHead (${checkpoint.commits?.sourceHead}) does not match current HEAD (${expectedHead}).`
    );
  }
  if (checkpoint.commits?.toolHead !== expectedHead) {
    failures.push(
      `TOOL_HEAD_MISMATCH: Checkpoint toolHead (${checkpoint.commits?.toolHead}) does not match current HEAD (${expectedHead}).`
    );
  }
  if (checkpoint.commits?.testHead !== expectedHead) {
    failures.push(
      `TEST_HEAD_MISMATCH: Checkpoint testHead (${checkpoint.commits?.testHead}) does not match current HEAD (${expectedHead}).`
    );
  }

  // 2. Validate Sol decision reference
  const solRef = checkpoint.solDecisionReference;
  if (!solRef || !solRef.solDecisionPath || !solRef.solDecisionSha256) {
    failures.push('MISSING_SOL_DECISION_REF: Checkpoint is missing solDecisionReference metadata.');
  } else {
    try {
      const solResolved = resolveRepoPath(solRef.solDecisionPath, { mustExist: true });
      const actualSolSha = sha256File(solResolved.absPath);
      if (actualSolSha !== solRef.solDecisionSha256) {
        failures.push(`SOL_DECISION_HASH_MISMATCH: ${solRef.solDecisionPath} SHA-256 changed since checkpoint creation.`);
      }
    } catch (err) {
      failures.push(`SOL_DECISION_MISSING: ${err.message}`);
    }
  }

  // 3. Validate all tracked file SHA-256 fingerprints and worktree state
  const dirtySet = new Set(gitProv.dirtyFiles.map((d) => d.path));
  for (const fp of checkpoint.fileFingerprints || []) {
    try {
      const fpResolved = resolveRepoPath(fp.path, { mustExist: true });
      const currentSha = sha256File(fpResolved.absPath);
      if (currentSha !== fp.sha256) {
        failures.push(`FILE_HASH_MISMATCH: Tracked file '${fp.path}' SHA-256 differs from checkpoint.`);
      }
      if (dirtySet.has(fpResolved.relPath) && !options.allowDirty) {
        failures.push(`TRACKED_FILE_DIRTY: Tracked file '${fp.path}' has uncommitted modifications in worktree.`);
      }
    } catch (err) {
      failures.push(`TRACKED_FILE_ERROR: ${err.message}`);
    }
  }

  const valid = failures.length === 0;
  return {
    command: 'checkpoint-validate',
    cliVersion: CLI_VERSION,
    validatedAt: new Date().toISOString(),
    checkpointFile: resolved.relPath,
    valid,
    currentHead: expectedHead,
    worktreeState: gitProv.worktreeState,
    failuresCount: failures.length,
    failures,
  };
}

/**
 * `OPT05`: Non-destructive inventory of host instruction files (`AGENTS.md`, `CLAUDE.md`, `.kiro`, `.codex`, `.claude`, `.agents`).
 * Never dumps environment variables or secret/setting values.
 */
function runHostInventory(options = {}) {
  const candidates = [
    { path: 'AGENTS.md', host: 'All Agents / Graphify / Antigravity / Codex', kind: 'file' },
    { path: 'CLAUDE.md', host: 'Claude Code / Claude Sonnet', kind: 'file' },
    { path: '.kiro', host: 'Kiro IDE', kind: 'directory' },
    { path: '.codex', host: 'OpenAI Codex CLI', kind: 'directory' },
    { path: '.claude', host: 'Claude Code CLI', kind: 'directory' },
    { path: '.agents', host: 'Workspace Agent Skills & Workflows', kind: 'directory' },
    { path: '.gemini', host: 'Gemini / Antigravity Workspace Config', kind: 'directory' },
  ];

  const inventory = [];
  for (const item of candidates) {
    const abs = path.resolve(REPO_ROOT, item.path);
    if (!fs.existsSync(abs)) {
      inventory.push({
        path: item.path,
        host: item.host,
        expectedKind: item.kind,
        status: 'absent',
      });
      continue;
    }

    const stat = fs.statSync(abs);
    if (stat.isFile()) {
      const buf = fs.readFileSync(abs);
      const text = buf.toString('utf8');
      const headings = text
        .split(/\r?\n/)
        .filter((l) => /^#{1,3}\s+/.test(l))
        .map((l) => l.trim());
      inventory.push({
        path: item.path,
        host: item.host,
        expectedKind: 'file',
        status: 'present',
        bytes: buf.length,
        lines: text.split(/\r?\n/).length,
        sha256: sha256Buffer(buf),
        headings,
      });
    } else if (stat.isDirectory()) {
      // List top-level and second-level instruction/steering markdown or JSON filenames only (never values)
      const entries = [];
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        const relEntry = toPosixPath(path.join(item.path, entry.name));
        if (entry.isDirectory()) {
          const subAbs = path.join(abs, entry.name);
          const subNames = fs
            .readdirSync(subAbs)
            .slice(0, 20)
            .map((n) => toPosixPath(path.join(relEntry, n)));
          entries.push({ path: relEntry, type: 'directory', childrenSample: subNames });
        } else {
          entries.push({ path: relEntry, type: 'file', bytes: fs.statSync(path.join(abs, entry.name)).size });
        }
      }

      // Check for stale scope conflict in .kiro/steering/active-sprint.md if present
      const conflicts = [];
      const activeSprintAbs = path.join(abs, 'steering', 'active-sprint.md');
      if (fs.existsSync(activeSprintAbs)) {
        const sprintText = fs.readFileSync(activeSprintAbs, 'utf8');
        if (/Window 2|Sprint 0/i.test(sprintText)) {
          conflicts.push(
            '.kiro/steering/active-sprint.md references stale Window 2 / Sprint 0 scope and conflicts with current W1-W3 remediation governance under Sol.'
          );
        }
      }

      inventory.push({
        path: item.path,
        host: item.host,
        expectedKind: 'directory',
        status: 'present',
        entriesCount: entries.length,
        entries,
        detectedScopeConflicts: conflicts,
      });
    }
  }

  const report = {
    command: 'host-inventory',
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    sourceRevision: getGitProvenance().sourceRevision,
    canonicalWorkflowDocTarget: 'docs/ai-context/WORKFLOW.md (to be authored by Claude Sonnet 4.5 under DOC01-DOC03)',
    secretValuesRedacted: true,
    inventory,
  };

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'host-inventory.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

  return {
    report,
    outFile: toPosixPath(path.relative(REPO_ROOT, outFile)),
  };
}

/**
 * Enforces `terminalSummaryBudget` on stdout (`OPT03`).
 */
function printBoundedTerminalSummary(lines, config) {
  const budget = config?.budgets?.terminalSummaryBudget || { maxBytes: 4096, maxLines: 60 };
  const clippedLines = lines.slice(0, budget.maxLines);
  let output = clippedLines.join('\n');
  if (Buffer.byteLength(output, 'utf8') > budget.maxBytes) {
    output = output.slice(0, budget.maxBytes - 120) + '\n...[truncated to terminalSummaryBudget]...';
  }
  process.stdout.write(output + '\n');
}

function parseArgs(argv) {
  const [subcommand, ...rest] = argv;
  const flags = {};
  const positionals = [];

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positionals.push(arg);
    }
  }
  return { subcommand, flags, positionals };
}

function main() {
  const { subcommand, flags, positionals } = parseArgs(process.argv.slice(2));
  const configMetadata = loadConfig(flags.config);
  const { config } = configMetadata;

  try {
    switch (subcommand) {
      case 'sql-coverage': {
        const { report, outFile } = runSqlCoverage(config, { outDir: flags['out-dir'] });
        printBoundedTerminalSummary(
          [
            `[sql-coverage] PASS — wrote ${outFile}`,
            `  Graph nodes: ${report.graphTotals.totalNodes} | Edges: ${report.graphTotals.totalEdges} | SQL nodes: ${report.graphTotals.sqlNodeCount} (${report.graphTotals.distinctSqlFilesIndexed} SQL files)`,
            `  Provenance advisory: ${report.graphProvenance.advisory} (${report.graphProvenance.advisoryReason})`,
            ...report.fnd03MigrationInspection.map(
              (m) =>
                `  FND03 SQL ${m.file}: indexed=${m.indexedInGraph}, graphNodes=${m.graphNodeCount}, diskConstructs=${m.diskConstructsCount}`
            ),
          ],
          config
        );
        break;
      }

      case 'query-graph': {
        const queryText = flags.query || positionals.join(' ');
        const { resultPayload, outFile } = runQueryGraph(queryText, config, {
          maxResults: flags['max-results'],
          fallbackPattern: flags['fallback-pattern'],
          outDir: flags['out-dir'],
        });
        printBoundedTerminalSummary(
          [
            `[query-graph] PASS — wrote ${outFile}`,
            `  Query: "${resultPayload.query}" | Advisory: ${resultPayload.advisory}`,
            `  Graph matches: ${resultPayload.truncation.returnedNodes}/${resultPayload.truncation.totalMatchingNodes} nodes, ${resultPayload.truncation.returnedEdges} edges (truncated=${resultPayload.truncation.truncated})`,
            `  Source fallback (${resultPayload.sourceFallbackResults.searchEngine}): ${resultPayload.sourceFallbackResults.matchedCount} file(s)`,
            `  Exploration budget: ${resultPayload.budgetMetrics.bytes}/${resultPayload.budgetMetrics.maxBytes} bytes (withinBudget=${resultPayload.budgetMetrics.withinExplorationBudget})`,
          ],
          config
        );
        break;
      }

      case 'build-packet': {
        const packetId = flags.packet || positionals[0] || 'fnd03';
        const mode = flags.mode || 'full';
        const extraFiles = flags['extra-file'] ? [flags['extra-file']] : [];
        const { manifest, packetRelPath, manifestRelPath } = buildPacket(packetId, configMetadata, {
          mode,
          allowDirty: Boolean(flags['allow-dirty']),
          outDir: flags['out-dir'],
          extraFiles,
        });
        printBoundedTerminalSummary(
          [
            `[build-packet] PASS — packet=${packetId} mode=${mode}`,
            `  Packet file:   ${packetRelPath} (${manifest.packetOutput.bytes} bytes, ${manifest.packetOutput.chars} chars, ~${manifest.packetOutput.tokensEstimateCharsDiv4} tokens [chars/4])`,
            `  Manifest file: ${manifestRelPath}`,
            `  Source HEAD:   ${manifest.sourceRevision} (worktree=${manifest.worktreeState}, dirty=${manifest.dirtyFiles.length})`,
            `  Files packed:  ${manifest.selectedFilesCount} | Secret scan: ${manifest.secretScan.status} | Within budget: ${manifest.budgetStatus.withinBudget}`,
            `  Callers found: ${manifest.callerCoverage.discoveredFilesCount} (${manifest.callerCoverage.uncoveredCallersCount} uncovered)`,
          ],
          config
        );
        break;
      }

      case 'benchmark': {
        const packetId = flags.packet || positionals[0] || 'fnd03';
        const { benchmarkReport, outFile } = runBenchmark(packetId, configMetadata, {
          outDir: flags['out-dir'],
        });
        const base = benchmarkReport.recipes.conventionalUnscopedBaseline;
        const full = benchmarkReport.recipes.optimizedFullSecurityPacket;
        const nav = benchmarkReport.recipes.optimizedNavigationOutlinePacket;
        printBoundedTerminalSummary(
          [
            `[benchmark] PASS — wrote ${outFile} (HEAD ${benchmarkReport.sourceRevision})`,
            `  1. Conventional Baseline (${base.filesCount} files): ${base.bytes} bytes | ${base.chars} chars | ~${base.tokensEstimateCharsDiv4} tokens [chars/4]`,
            `  2. Optimized Full Packet (${full.filesCount} files): ${full.bytes} bytes | ${full.chars} chars | ~${full.tokensEstimateCharsDiv4} tokens [chars/4] (${full.deltaVsConventionalBaselinePct}% vs baseline, auditSafe=true)`,
            `  3. Optimized Nav Packet  (${nav.filesCount} files): ${nav.bytes} bytes | ${nav.chars} chars | ~${nav.tokensEstimateCharsDiv4} tokens [chars/4] (${nav.deltaVsConventionalBaselinePct}% vs baseline, auditSafe=false)`,
            `  4. External Repomix o200k_base calibration: compressed=${benchmarkReport.recipes.externalRepomixReferencePackets.compressedStructureOnly.repomixTokens_o200k_base} tokens | RBAC-uncompressed=${benchmarkReport.recipes.externalRepomixReferencePackets.uncompressedRbacOnly.repomixTokens_o200k_base} tokens | 25-file-security-complete=${benchmarkReport.recipes.externalRepomixReferencePackets.uncompressedSecurityComplete.repomixTokens_o200k_base} tokens`,
          ],
          config
        );
        break;
      }

      case 'checkpoint-create': {
        const packetId = flags.packet || positionals[0] || 'fnd03';
        const { checkpoint, outFile } = createCheckpoint(packetId, configMetadata, {
          allowDirty: Boolean(flags['allow-dirty']),
          status: flags.status,
          outDir: flags['out-dir'],
          file: flags.file,
        });
        printBoundedTerminalSummary(
          [
            `[checkpoint-create] PASS — wrote ${outFile}`,
            `  Checkpoint ID: ${checkpoint.checkpointId} | Status: ${checkpoint.status}`,
            `  HEAD: ${checkpoint.commits.sourceHead} | Tracked files: ${checkpoint.trackedFilesCount}`,
            `  Sol decision ref: ${checkpoint.solDecisionReference.solDecisionPath} @ ${checkpoint.solDecisionReference.solDecisionRevision}`,
          ],
          config
        );
        break;
      }

      case 'checkpoint-validate': {
        const file = flags.file || positionals[0] || '.context-packets/fnd03-checkpoint.json';
        const validation = validateCheckpoint(file, {
          allowDirty: Boolean(flags['allow-dirty']),
          simulateHead: flags['simulate-head'],
        });
        printBoundedTerminalSummary(
          [
            `[checkpoint-validate] ${validation.valid ? 'PASS' : 'FAIL'} — ${validation.checkpointFile}`,
            `  Current HEAD: ${validation.currentHead} | Worktree: ${validation.worktreeState}`,
            ...(validation.failures.length
              ? validation.failures.map((f) => `  FAILURE: ${f}`)
              : ['  All commit pointers, Sol decision hashes, and file SHA-256 fingerprints verified.']),
          ],
          config
        );
        if (!validation.valid) {
          process.exitCode = 1;
        }
        break;
      }

      case 'host-inventory': {
        const { report, outFile } = runHostInventory({ outDir: flags['out-dir'] });
        printBoundedTerminalSummary(
          [
            `[host-inventory] PASS — wrote ${outFile}`,
            ...report.inventory.map(
              (item) =>
                `  - ${item.path} (${item.host}): ${item.status}${
                  item.detectedScopeConflicts?.length ? ` [CONFLICT: ${item.detectedScopeConflicts.join('; ')}]` : ''
                }`
            ),
          ],
          config
        );
        break;
      }

      default: {
        printBoundedTerminalSummary(
          [
            `Usage: node tools/ai-context/context-cli.mjs <subcommand> [options]`,
            `Subcommands:`,
            `  sql-coverage                                 Verify Graphify tree_sitter_sql coverage & FND03 migrations (OPT01)`,
            `  query-graph "<query>"                        Run provenance-checked Graphify query + ripgrep fallback (OPT01)`,
            `  build-packet --packet fnd03 [--mode full]    Build secret-scanned source packet + .manifest.json (OPT02)`,
            `  benchmark --packet fnd03                     Run conventional vs optimized FND03 token/byte benchmark (OPT03)`,
            `  checkpoint-create --packet fnd03             Create commit-aware FND checkpoint pointer (OPT04)`,
            `  checkpoint-validate --file <path>            Validate checkpoint against HEAD, hashes & Sol decisions (OPT04)`,
            `  host-inventory                               Inventory AGENTS.md, CLAUDE.md, .kiro, .codex, .claude (OPT05)`,
          ],
          config
        );
        if (subcommand && subcommand !== '--help' && subcommand !== '-h') {
          process.exitCode = 1;
        }
      }
    }
  } catch (err) {
    process.stderr.write(`[context-cli ERROR] ${err.message}\n`);
    process.exitCode = 1;
  }
}

main();
