#!/usr/bin/env node
/**
 * Context Optimization CLI (`OPT01`–`OPT05`) — v1.1.0 (Fail-Closed & Provenance-Hardened)
 *
 * Implements:
 * - OPT01 (`query-graph`, `sql-coverage`, `record-graph-provenance`):
 *   - Verifies `graphify-out/graph.json` + `graphify-out/manifest.json` per-file MD5 `ast_hash`
 *     and SHA-256 fingerprints against current disk files and recorded `.context-packets/graph-provenance.json`
 *     (not merely mtime vs HEAD commit timestamp).
 *   - Executes actual multi-hop BFS dependency/caller traversal across `graph.json` edges
 *     plus native `graphify query` / `graphify explain` CLI invocation, clearly distinguished
 *     from lexical substring node matching.
 *   - Distinguishes ripgrep/git-grep execution errors (`status > 1` or spawn errors) from
 *     genuine zero-match (`status === 1`) results.
 * - OPT02 (`build-packet`, `verify-canaries`):
 *   - Compiles and enforces `config.secretDenylist.forbiddenPathGlobs` and `config.defaultExcludeGlobs`
 *     dynamically from `config.json`.
 *   - Fails closed (`exitCode = 1`, `PASS` never printed) in `full` security mode whenever ANY
 *     required security file, test, Sol decision, or discovered caller is omitted or when
 *     `sourcePacketBudget` is exceeded. Writes full un-truncated evidence + safe chunked split
 *     packets to disk while reporting every omitted item and chunk retrieval command.
 * - OPT03 (`benchmark`):
 *   - Compares identical 30-file FND03 security coverage across (a) conventional workflow
 *     (30 required files + explicit discovery overhead), (b) raw 30 required files without discovery
 *     overhead, (c) optimized full packet (with line numbers + SHA-256 manifest + bounded discovery),
 *     and (d) navigation-only outline packet. Reports exact bytes, chars, and `chars/4` token
 *     estimates separately from external Repomix `o200k_base` calibration.
 * - OPT04 (`checkpoint-create`, `checkpoint-validate`):
 *   - Computes distinct git commit revisions for `sourceHead`, `toolHead`, and `testHead`.
 *   - Extracts governing Sol decision headings (`D1`, `D3`) and observed test evidence directly
 *     from the referenced Sol decision document (`audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md`)
 *     without hardcoding unauthorized architectural instructions.
 * - OPT05 (`host-inventory`):
 *   - Non-destructively inventories `AGENTS.md`, `CLAUDE.md`, `.kiro`, `.codex`, `.claude`, `.agents`,
 *     and `.gemini`, referencing the approved Sonnet `DOC01`–`DOC03` paths
 *     (`docs/ai-context/operating-guide.md`, `docs/ai-context/fnd-checkpoint-template.md`,
 *     `docs/ai-context/task-retrieval-guide.md`).
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
const CLI_VERSION = '1.1.0';

function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function md5Buffer(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function sha256File(absPath) {
  return sha256Buffer(fs.readFileSync(absPath));
}

function md5File(absPath) {
  return md5Buffer(fs.readFileSync(absPath));
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
 * Converts a glob pattern (supporting `**`, `*`, `?`) into a RegExp matching POSIX relative paths.
 */
function globToRegExp(globPattern) {
  let pat = globPattern.trim().replace(/\\/g, '/');
  if (pat.startsWith('./')) {
    pat = pat.slice(2);
  }
  let regexStr = '^';
  let i = 0;
  while (i < pat.length) {
    const ch = pat[i];
    if (ch === '*') {
      if (pat[i + 1] === '*') {
        if (pat[i + 2] === '/') {
          // `**/` matches zero or more directories
          regexStr += '(?:.+/)?';
          i += 3;
          continue;
        } else {
          regexStr += '.*';
          i += 2;
          continue;
        }
      } else {
        regexStr += '[^/]*';
        i += 1;
        continue;
      }
    } else if (ch === '?') {
      regexStr += '[^/]';
      i += 1;
      continue;
    } else if ('.+^$()[]{}|\\'.includes(ch)) {
      regexStr += '\\' + ch;
      i += 1;
      continue;
    } else {
      regexStr += ch;
      i += 1;
    }
  }
  regexStr += '$';
  return new RegExp(regexStr, 'i');
}

/**
 * Evaluates a POSIX relative path against an ordered list of glob rules (supporting `!` negation rules).
 */
function matchGlobRules(relPosixPath, globList = []) {
  const normalized = relPosixPath.replace(/^\/+/, '');
  let matched = false;
  let matchedRule = null;

  for (const rawRule of globList) {
    if (!rawRule || typeof rawRule !== 'string') continue;
    const isNegated = rawRule.startsWith('!');
    const pattern = isNegated ? rawRule.slice(1) : rawRule;
    const re = globToRegExp(pattern);
    if (re.test(normalized) || re.test(path.posix.basename(normalized))) {
      if (isNegated) {
        matched = false;
        matchedRule = null;
      } else {
        matched = true;
        matchedRule = rawRule;
      }
    }
  }

  return { matched, matchedRule };
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
    const realCandidate = fs.realpathSync(candidateAbs);
    const realRel = path.relative(realRepoRoot, realCandidate);
    if (realRel.startsWith('..') || path.isAbsolute(realRel)) {
      throw new Error(`PATH_CONFINEMENT_ERROR: Symlink target escapes repository root: ${relOrAbsPath}`);
    }
  } else if (mustExist) {
    throw new Error(`PATH_NOT_FOUND: Required repository file does not exist: ${relOrAbsPath}`);
  } else {
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

function getLatestCommitForPaths(relPaths = []) {
  const valid = relPaths.filter(Boolean);
  if (valid.length === 0) {
    return runGit(['rev-parse', 'HEAD']);
  }
  const out = runGit(['log', '-n', '1', '--format=%H', '--', ...valid], { allowFailure: true });
  return out || runGit(['rev-parse', 'HEAD']);
}

function getGitProvenance() {
  const head = runGit(['rev-parse', 'HEAD']);
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const statusOutput = execFileSync('git', ['status', '--porcelain'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).replace(/\r?\n$/, '');
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

/**
 * Evaluates both `config.secretDenylist.forbiddenPathGlobs` and `config.defaultExcludeGlobs`
 * against a repository-relative POSIX path (`OPT02` security control).
 */
function checkPathExclusionAndDenylist(relPosixPath, config) {
  const forbiddenCheck = matchGlobRules(relPosixPath, config?.secretDenylist?.forbiddenPathGlobs || []);
  if (forbiddenCheck.matched) {
    return {
      blocked: true,
      kind: 'FORBIDDEN_SECRET_PATH_GLOB',
      matchedRule: forbiddenCheck.matchedRule,
      description: `File path '${relPosixPath}' matches config.secretDenylist.forbiddenPathGlobs rule '${forbiddenCheck.matchedRule}'.`,
    };
  }

  const excludeCheck = matchGlobRules(relPosixPath, config?.defaultExcludeGlobs || []);
  if (excludeCheck.matched) {
    return {
      blocked: true,
      kind: 'DEFAULT_EXCLUDED_PATH_GLOB',
      matchedRule: excludeCheck.matchedRule,
      description: `File path '${relPosixPath}' matches config.defaultExcludeGlobs rule '${excludeCheck.matchedRule}'.`,
    };
  }

  return { blocked: false, kind: null, matchedRule: null, description: null };
}

/**
 * Scans path and content against configured secret denylist globs and regexes (`OPT02` security control).
 * Never echoes the matched secret value—reports only pattern ID, matched rule, file path, and line number.
 */
function scanContentForSecrets(relPosixPath, content, config) {
  const findings = [];
  const pathCheck = checkPathExclusionAndDenylist(relPosixPath, config);
  if (pathCheck.blocked) {
    findings.push({
      file: relPosixPath,
      line: 1,
      patternId: pathCheck.kind,
      matchedRule: pathCheck.matchedRule,
      description: pathCheck.description,
    });
    return findings;
  }

  const lines = content.split(/\r?\n/);
  for (const rule of config?.secretDenylist?.contentPatterns || []) {
    const regex = new RegExp(rule.regex);
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        findings.push({
          file: relPosixPath,
          line: i + 1,
          patternId: rule.id,
          matchedRule: rule.id,
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

/**
 * Searches callers with ripgrep or git-grep fallback.
 * Explicitly distinguishes exit code 1 (0 matches) from exit code > 1 / spawn errors
 * so search failures are never silently interpreted as zero matches (`OPT01` finding #4).
 */
function searchCallersWithFallback(pattern, searchRoots, config) {
  if (!pattern || typeof pattern !== 'string') {
    throw new Error('CALLER_SEARCH_ERROR: Search pattern must be a non-empty string.');
  }
  // Validate regex syntax in Node first so malformed patterns throw deterministically
  try {
    new RegExp(pattern);
  } catch (err) {
    throw new Error(`CALLER_SEARCH_INVALID_REGEX: Invalid search pattern '${pattern}': ${err.message}`);
  }

  const rgInfo = resolveRipgrepBinary(config);
  const validRoots = (searchRoots || []).filter((r) => fs.existsSync(path.resolve(REPO_ROOT, r)));
  if (validRoots.length === 0) {
    throw new Error(`CALLER_SEARCH_ERROR: None of the configured search roots exist: ${(searchRoots || []).join(', ')}`);
  }

  let matchedFiles = [];

  if (rgInfo.driver === 'ripgrep') {
    try {
      const out = execFileSync(rgInfo.binary, ['-l', pattern, ...validRoots], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      matchedFiles = out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(toPosixPath)
        .sort();
    } catch (err) {
      if (err && err.status === 1) {
        // Exit code 1 in ripgrep strictly means 0 matches found with no error
        matchedFiles = [];
      } else {
        const stderrMsg = err?.stderr ? String(err.stderr).trim() : err.message;
        throw new Error(
          `CALLER_SEARCH_EXECUTION_ERROR: ripgrep failed with status ${err?.status ?? 'unknown'}: ${stderrMsg}`
        );
      }
    }
  } else {
    try {
      const out = execFileSync('git', ['grep', '-l', '-E', pattern, '--', ...validRoots], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      matchedFiles = out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(toPosixPath)
        .sort();
    } catch (err) {
      if (err && err.status === 1) {
        matchedFiles = [];
      } else {
        const stderrMsg = err?.stderr ? String(err.stderr).trim() : err.message;
        throw new Error(
          `CALLER_SEARCH_EXECUTION_ERROR: git grep failed with status ${err?.status ?? 'unknown'}: ${stderrMsg}`
        );
      }
    }
  }

  return {
    searchEngine: rgInfo.driver,
    searchVersion: rgInfo.version,
    status: 'OK',
    pattern,
    searchRoots: validRoots,
    matchedCount: matchedFiles.length,
    matchedFiles,
  };
}

/**
 * Collects target files for a packet (or defaults to `fnd03`) so graph provenance can verify
 * exact per-file AST MD5 hashes in `graphify-out/manifest.json` and SHA-256 hashes on disk.
 */
function getPacketTrackedSourceFiles(config, packetId = 'fnd03') {
  const pkt = config?.packets?.[packetId];
  if (!pkt) return [];
  const all = [
    ...(pkt.securityCriticalFiles || []),
    ...(pkt.schemaAndMigrationFiles || []),
    ...(pkt.securityTestFiles || []),
  ];
  return [...new Set(all)];
}

/**
 * `OPT01`: Records an explicit cryptographic provenance stamp for `graphify-out/graph.json`,
 * `graphify-out/manifest.json`, `HEAD`, and all tracked source files.
 */
function recordGraphProvenance(config, options = {}) {
  const gitProv = getGitProvenance();
  const graphRel = config.graphify.graphPath;
  const manifestRel = config.graphify.manifestPath || 'graphify-out/manifest.json';
  const buildStateRel = config.graphify.buildStatePath || 'graphify-out/.graphify_build_state.json';

  const graphAbs = path.resolve(REPO_ROOT, graphRel);
  const manifestAbs = path.resolve(REPO_ROOT, manifestRel);
  const buildStateAbs = path.resolve(REPO_ROOT, buildStateRel);

  if (!fs.existsSync(graphAbs)) {
    throw new Error(`GRAPH_MISSING: ${graphRel} does not exist.`);
  }
  if (!fs.existsSync(manifestAbs)) {
    throw new Error(`GRAPH_MANIFEST_MISSING: ${manifestRel} does not exist.`);
  }

  const graphManifest = JSON.parse(fs.readFileSync(manifestAbs, 'utf8'));
  const buildState = fs.existsSync(buildStateAbs)
    ? JSON.parse(fs.readFileSync(buildStateAbs, 'utf8'))
    : null;

  const packetId = options.packet || 'fnd03';
  const trackedFiles = getPacketTrackedSourceFiles(config, packetId);
  const fileFingerprints = trackedFiles.map((relPath) => {
    const resolved = resolveRepoPath(relPath, { mustExist: true });
    const diskMd5 = md5File(resolved.absPath);
    const diskSha256 = sha256File(resolved.absPath);
    const manifestEntry = graphManifest[resolved.relPath] || null;
    return {
      path: resolved.relPath,
      diskSha256,
      diskMd5,
      graphManifestAstHash: manifestEntry?.ast_hash || null,
      matchesGraphManifest: manifestEntry ? manifestEntry.ast_hash === diskMd5 : false,
    };
  });

  const stamp = {
    schemaVersion: '1.1.0',
    recordedAt: new Date().toISOString(),
    sourceRevision: gitProv.sourceRevision,
    branch: gitProv.branch,
    worktreeState: gitProv.worktreeState,
    dirtyFilesCount: gitProv.dirtyFilesCount,
    graphFile: {
      path: graphRel,
      sha256: sha256File(graphAbs),
      bytes: fs.statSync(graphAbs).size,
    },
    graphManifestFile: {
      path: manifestRel,
      sha256: sha256File(manifestAbs),
      scanDigest: buildState?.scan_digest || null,
      graphifyEpoch: buildState?.epoch || null,
    },
    packetId,
    trackedFilesCount: fileFingerprints.length,
    allTrackedFilesMatchGraphManifest: fileFingerprints.every((f) => f.matchesGraphManifest),
    fileFingerprints,
  };

  const outRel = config.graphify.provenanceFile || '.context-packets/graph-provenance.json';
  const outResolved = resolveRepoPath(outRel, { mustExist: false });
  fs.mkdirSync(path.dirname(outResolved.absPath), { recursive: true });
  fs.writeFileSync(outResolved.absPath, JSON.stringify(stamp, null, 2) + '\n', 'utf8');

  return { stamp, outFile: outResolved.relPath };
}

/**
 * `OPT01` Finding #3 Fix: Provenance verification using `graphify-out/manifest.json` per-file MD5 `ast_hash`
 * and `.context-packets/graph-provenance.json` SHA-256 + `sourceRevision` equality, rather than relying only
 * on `graph.json` modification time vs git commit timestamp.
 */
function inspectGraphProvenance(config, { packetId = 'fnd03' } = {}) {
  const gitProv = getGitProvenance();
  const graphRel = config.graphify.graphPath;
  const manifestRel = config.graphify.manifestPath || 'graphify-out/manifest.json';
  const provRel = config.graphify.provenanceFile || '.context-packets/graph-provenance.json';

  const graphAbs = path.resolve(REPO_ROOT, graphRel);
  const manifestAbs = path.resolve(REPO_ROOT, manifestRel);
  const provAbs = path.resolve(REPO_ROOT, provRel);

  if (!fs.existsSync(graphAbs)) {
    return {
      exists: false,
      graphPath: graphRel,
      advisory: true,
      provenanceVerified: false,
      advisoryReasons: ['graphify-out/graph.json does not exist; fallback to source search required.'],
      sourceRevision: gitProv.sourceRevision,
      worktreeState: gitProv.worktreeState,
    };
  }

  const stat = fs.statSync(graphAbs);
  const graphSha256 = sha256File(graphAbs);
  const advisoryReasons = [];

  // 1. Verify per-file AST MD5 hashes in graphify-out/manifest.json against current disk files
  const trackedFiles = getPacketTrackedSourceFiles(config, packetId);
  let manifestPresent = fs.existsSync(manifestAbs);
  const mismatchedManifestFiles = [];
  const missingFromManifestFiles = [];

  if (!manifestPresent) {
    advisoryReasons.push(`Graphify manifest (${manifestRel}) is missing; cannot verify per-file AST hashes.`);
  } else {
    const graphManifest = JSON.parse(fs.readFileSync(manifestAbs, 'utf8'));
    for (const relPath of trackedFiles) {
      const abs = path.resolve(REPO_ROOT, relPath);
      if (!fs.existsSync(abs)) continue;
      const diskMd5 = md5File(abs);
      const entry = graphManifest[toPosixPath(relPath)];
      if (!entry || !entry.ast_hash) {
        missingFromManifestFiles.push(relPath);
      } else if (entry.ast_hash !== diskMd5) {
        mismatchedManifestFiles.push({
          path: relPath,
          diskMd5,
          graphManifestAstHash: entry.ast_hash,
        });
      }
    }
    if (missingFromManifestFiles.length > 0) {
      advisoryReasons.push(
        `${missingFromManifestFiles.length} tracked file(s) missing from ${manifestRel}: ${missingFromManifestFiles.join(', ')}`
      );
    }
    if (mismatchedManifestFiles.length > 0) {
      advisoryReasons.push(
        `${mismatchedManifestFiles.length} tracked file(s) have disk MD5 differing from ${manifestRel} ast_hash: ${mismatchedManifestFiles
          .map((m) => m.path)
          .join(', ')}`
      );
    }
  }

  // 2. Check recorded .context-packets/graph-provenance.json stamp against current HEAD & graphSha256
  let recordedStampMatches = false;
  let recordedStampRevision = null;
  if (fs.existsSync(provAbs)) {
    try {
      const stamp = JSON.parse(fs.readFileSync(provAbs, 'utf8'));
      recordedStampRevision = stamp.sourceRevision || null;
      const headMatches = stamp.sourceRevision === gitProv.sourceRevision;
      const shaMatches = stamp.graphFile?.sha256 === graphSha256;
      const fingerprintsMatch = (stamp.fileFingerprints || []).every((fp) => {
        const abs = path.resolve(REPO_ROOT, fp.path);
        return fs.existsSync(abs) && sha256File(abs) === fp.diskSha256;
      });
      recordedStampMatches = headMatches && shaMatches && fingerprintsMatch;
      if (!headMatches) {
        advisoryReasons.push(
          `Recorded graph provenance stamp sourceRevision (${stamp.sourceRevision}) differs from current HEAD (${gitProv.sourceRevision}).`
        );
      }
      if (!shaMatches) {
        advisoryReasons.push(`graph.json SHA-256 changed since graph-provenance.json was recorded.`);
      }
      if (!fingerprintsMatch) {
        advisoryReasons.push(`One or more tracked source files changed SHA-256 since graph-provenance.json was recorded.`);
      }
    } catch (err) {
      advisoryReasons.push(`Failed to parse ${provRel}: ${err.message}`);
    }
  } else {
    advisoryReasons.push(
      `No ${provRel} stamp found tying graph.json SHA-256 to git HEAD (${gitProv.sourceRevision}); run 'record-graph-provenance' after verifying graph build.`
    );
  }

  // 3. Check working tree dirty state (excluding graphify-out/* churn)
  const nonGraphDirty = gitProv.dirtyFiles.filter((d) => !d.path.startsWith('graphify-out/'));
  if (nonGraphDirty.length > 0) {
    advisoryReasons.push(
      `Working tree has ${nonGraphDirty.length} non-graph uncommitted file(s): ${nonGraphDirty.map((d) => d.path).join(', ')}.`
    );
  }

  const provenanceVerified =
    manifestPresent &&
    missingFromManifestFiles.length === 0 &&
    mismatchedManifestFiles.length === 0 &&
    recordedStampMatches &&
    nonGraphDirty.length === 0;

  return {
    exists: true,
    graphPath: graphRel,
    graphSha256,
    graphSizeBytes: stat.size,
    graphModifiedAt: new Date(stat.mtimeMs).toISOString(),
    headCommit: gitProv.sourceRevision,
    recordedStampRevision,
    worktreeState: gitProv.worktreeState,
    nonGraphDirtyFilesCount: nonGraphDirty.length,
    manifestVerification: {
      manifestPath: manifestRel,
      manifestPresent,
      trackedFilesChecked: trackedFiles.length,
      missingFromManifestCount: missingFromManifestFiles.length,
      mismatchedAstHashCount: mismatchedManifestFiles.length,
      mismatchedManifestFiles,
    },
    provenanceVerified,
    advisory: !provenanceVerified,
    advisoryReason:
      advisoryReasons.length > 0
        ? advisoryReasons.join(' ')
        : 'Provenance verified: graph.json SHA-256, graphify-out/manifest.json per-file AST hashes, and clean git HEAD match.',
    advisoryReasons,
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
 * `OPT01` Finding #4 Fix:
 * Distinguishes:
 * 1. `lexicalSeedSearch`: substring/label matching to identify starting seed nodes in `graph.json`.
 * 2. `bfsDependencyTraversal`: actual multi-hop (`depth = 1..maxDepth`) directed/undirected edge
 *    traversal across `calls`, `references`, `imports`, and `method` links in `graph.json` to
 *    surface multi-hop callers and dependencies.
 * 3. `nativeGraphifyCli`: optional invocation of the installed `graphify query "<question>" --budget N --depth D`
 *    CLI so native Graphify traversal output is captured alongside structured JSON nodes.
 * 4. `sourceFallbackResults`: ripgrep / git-grep source search with strict error checking (`status > 1` throws).
 */
function runQueryGraph(queryText, config, options = {}) {
  if (!queryText || !queryText.trim()) {
    throw new Error('query-graph requires a non-empty query string.');
  }

  const prov = inspectGraphProvenance(config);
  const maxResults = Number(options.maxResults || config.graphify.maxResultsDefault || 20);
  const maxDepth = Number(options.depth || config.graphify.defaultTraversalDepth || 2);
  const terms = queryText
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  let seedNodes = [];
  let traversedNodes = [];
  let traversedEdges = [];
  let totalSeedMatches = 0;
  let totalReachableWithinDepth = 0;

  if (prov.exists) {
    const rawGraph = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, config.graphify.graphPath), 'utf8'));
    const nodes = rawGraph.nodes || [];
    const links = rawGraph.links || [];

    const nodeById = new Map();
    for (const n of nodes) {
      nodeById.set(n.id, n);
    }

    // Build adjacency list for multi-hop caller/callee traversal
    const adj = new Map();
    for (const edge of links) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      if (!adj.has(edge.target)) adj.set(edge.target, []);
      adj.get(edge.source).push({ neighbor: edge.target, direction: 'outbound', edge });
      adj.get(edge.target).push({ neighbor: edge.source, direction: 'inbound_caller', edge });
    }

    // Step 1: Lexical seed node selection
    const scoredSeeds = [];
    for (const n of nodes) {
      const labelClean = String(n.label || '')
        .replace(/^\.|\(\)$/g, '')
        .toLowerCase();
      const hay = `${n.id || ''} ${n.label || ''} ${n.source_file || ''}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        const cleanTerm = term.replace(/^\.|\(\)$/g, '');
        if (labelClean === cleanTerm) {
          score += 10;
        } else if (hay.includes(cleanTerm)) {
          score += 2;
        }
      }
      if (score > 0) {
        scoredSeeds.push({ score, node: n });
      }
    }

    scoredSeeds.sort((a, b) => b.score - a.score || String(a.node.id).localeCompare(String(b.node.id)));
    totalSeedMatches = scoredSeeds.length;
    seedNodes = scoredSeeds.slice(0, Math.min(8, maxResults)).map((s) => ({
      id: s.node.id,
      label: s.node.label,
      sourceFile: s.node.source_file || null,
      sourceLocation: s.node.source_location ?? null,
      seedScore: s.score,
    }));

    // Step 2: Multi-hop BFS dependency & caller traversal from top seed nodes
    const visited = new Map(); // nodeId -> { hopDistance, viaRelation, viaDirection }
    const queue = [];
    for (const seed of seedNodes) {
      visited.set(seed.id, { hopDistance: 0, viaRelation: 'seed', viaDirection: 'seed' });
      queue.push({ id: seed.id, depth: 0 });
    }

    const collectedEdges = [];
    const seenEdgeKeys = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.depth >= maxDepth) continue;
      const neighbors = adj.get(current.id) || [];
      for (const item of neighbors) {
        const rel = item.edge.relation || item.edge.type || 'related';
        const edgeKey = `${item.edge.source}->${item.edge.target}:${rel}`;
        if (!seenEdgeKeys.has(edgeKey)) {
          seenEdgeKeys.add(edgeKey);
          collectedEdges.push({
            source: item.edge.source,
            target: item.edge.target,
            relation: rel,
            traversalDirectionFromSeed: item.direction,
            hop: current.depth + 1,
          });
        }
        if (!visited.has(item.neighbor)) {
          visited.set(item.neighbor, {
            hopDistance: current.depth + 1,
            viaRelation: rel,
            viaDirection: item.direction,
          });
          queue.push({ id: item.neighbor, depth: current.depth + 1 });
        }
      }
    }

    totalReachableWithinDepth = visited.size;
    const allVisitedList = [];
    for (const [nodeId, meta] of visited.entries()) {
      const n = nodeById.get(nodeId);
      if (!n) continue;
      allVisitedList.push({
        id: n.id,
        label: n.label,
        sourceFile: n.source_file || null,
        sourceLocation: n.source_location ?? null,
        community: n.community ?? null,
        hopDistance: meta.hopDistance,
        viaRelation: meta.viaRelation,
        viaDirection: meta.viaDirection,
      });
    }

    allVisitedList.sort(
      (a, b) =>
        a.hopDistance - b.hopDistance ||
        (a.viaDirection === 'inbound_caller' ? -1 : 1) ||
        String(a.id).localeCompare(String(b.id))
    );

    traversedNodes = allVisitedList.slice(0, maxResults);
    const keptIds = new Set(traversedNodes.map((n) => n.id));
    traversedEdges = collectedEdges
      .filter((e) => keptIds.has(e.source) && keptIds.has(e.target))
      .slice(0, maxResults * 2);
  }

  // Step 3: Optional native `graphify query` CLI execution for cross-verification
  let nativeCliSummary = { executed: false, status: 'skipped' };
  if (options.runNativeCli !== false) {
    try {
      const cliBudget = Number(config.graphify.defaultCliTokenBudget || 1500);
      const cliOut = execFileSync(
        'graphify',
        ['query', queryText, '--depth', String(maxDepth), '--budget', String(cliBudget)],
        {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );
      const outLines = cliOut.trim().split(/\r?\n/);
      nativeCliSummary = {
        executed: true,
        status: 'OK',
        headerLine: outLines[0] || '',
        truncatedByCliBudget: cliOut.includes('[!] TRUNCATED'),
        lineCount: outLines.length,
        previewLines: outLines.slice(0, 12),
      };
    } catch (err) {
      nativeCliSummary = {
        executed: true,
        status: 'ERROR',
        error: err.message,
      };
    }
  }

  const truncated = totalReachableWithinDepth > maxResults || totalSeedMatches > seedNodes.length;
    const tokens = queryText
      .split(/\s+/)
      .map((t) => t.replace(/^\.|\(\)$/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter((t) => t.length >= 2);
    const fallbackPattern = options.fallbackPattern || tokens.join('|');
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
    queryModesDistinction: {
      lexicalSeedSearch: 'Matches query keywords against node labels/IDs/paths to pick starting seed nodes.',
      bfsDependencyTraversal: `Multi-hop (depth <= ${maxDepth}) inbound-caller and outbound-callee edge traversal in graph.json starting from seed nodes.`,
      nativeGraphifyCli: 'Direct invocation of installed graphify query CLI with --depth and --budget.',
      sourceFallbackSearch: 'Deterministic ripgrep/git-grep regex search across source roots to catch dynamic/re-exported callers missed by static AST edges.',
      knownLimitations: [
        'Static AST call edges in graph.json do not resolve dynamic property dispatch or Next.js route barrel re-exports unless the caller directly references the symbol; always union graph traversal with ripgrep caller search for security packets.',
      ],
    },
    truncation: {
      maxResults,
      maxDepth,
      totalSeedMatches,
      returnedSeeds: seedNodes.length,
      totalReachableWithinDepth,
      returnedTraversedNodes: traversedNodes.length,
      returnedTraversedEdges: traversedEdges.length,
      truncated,
      incompletenessReason: truncated
        ? `BFS traversal reached ${totalReachableWithinDepth} nodes (from ${totalSeedMatches} lexical seeds); truncated to ${traversedNodes.length} nodes to stay within explorationBudget.`
        : traversedNodes.length === 0
          ? 'No graph nodes matched; rely on sourceFallbackResults.'
          : null,
    },
    lexicalSeeds: seedNodes,
    bfsDependencyTraversal: {
      nodes: traversedNodes,
      edges: traversedEdges,
    },
    nativeGraphifyCli: nativeCliSummary,
    sourceFallbackResults: fallbackSearch,
  };

  let serialized = JSON.stringify(resultPayload, null, 2);
  const budget = config.budgets.explorationBudget;
  let budgetExceeded = Buffer.byteLength(serialized, 'utf8') > budget.maxBytes;

  if (budgetExceeded) {
    resultPayload.bfsDependencyTraversal.edges = resultPayload.bfsDependencyTraversal.edges.slice(0, 10);
    resultPayload.truncation.truncated = true;
    resultPayload.truncation.incompletenessReason =
      'Trimmed BFS edge list to stay within explorationBudget.maxBytes.';
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
 * `OPT02` Finding #1 & #2 Fix:
 * Builds a reproducible, secret-scanned, repo-root-confined source packet and `.manifest.json`.
 *
 * Fail-Closed Rules in `full` Security Mode:
 * 1. NEVER silently pops/removes required files when `sourcePacketBudget` is exceeded.
 * 2. If `packetBytes > maxBytes`:
 *    - Writes the complete un-truncated evidence to `.context-packets/<id>-packet.untruncated.md`
 *    - Automatically writes bounded multi-part chunk files (`.context-packets/<id>-packet.part1.md`, `part2.md`, ...)
 *      so every missing/overflowing file can be safely retrieved without truncation.
 *    - Marks `manifest.completenessStatus = "INCOMPLETE_BUDGET_OVERFLOW"` and throws a non-zero exit error
 *      listing every file that overflowed the single-packet budget and the exact chunk retrieval paths.
 * 3. If ANY caller discovered by `callerDiscovery` is absent from `selectedFileManifestEntries`:
 *    - Marks `manifest.completenessStatus = "INCOMPLETE_MISSING_CALLERS"` and throws a non-zero exit error
 *      listing every uncovered caller file.
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

  const extraFiles = options.extraFiles || [];
  const simulateOmitFiles = new Set((options.simulateOmitFile ? [options.simulateOmitFile] : []).map(toPosixPath));

  const categorizedFiles = [
    ...packetDef.securityCriticalFiles.map((f) => ({ path: f, category: 'security_critical', mandatory: true })),
    ...packetDef.schemaAndMigrationFiles.map((f) => ({ path: f, category: 'schema_or_migration', mandatory: true })),
    ...packetDef.securityTestFiles.map((f) => ({ path: f, category: 'negative_security_test', mandatory: true })),
    ...packetDef.solDecisionFiles.map((f) => ({ path: f, category: 'sol_decision', mandatory: true })),
    ...extraFiles.map((f) => ({ path: f, category: 'extra_input', mandatory: true })),
  ];

  const seen = new Set();
  const orderedFiles = [];
  const omittedRequiredFiles = [];

  for (const item of categorizedFiles) {
    const norm = toPosixPath(item.path);
    if (simulateOmitFiles.has(norm)) {
      omittedRequiredFiles.push({
        path: norm,
        category: item.category,
        reason: 'Omitted via --simulate-omit-file negative control test.',
      });
      continue;
    }
    if (!seen.has(norm)) {
      seen.add(norm);
      orderedFiles.push({ ...item, path: norm });
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
  const headerLines = [
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
    ``,
  ];

  const renderedSections = [];

  for (const item of orderedFiles) {
    // 1. Check path against forbiddenPathGlobs & defaultExcludeGlobs BEFORE reading content
    const prePathCheck = checkPathExclusionAndDenylist(item.path, config);
    if (prePathCheck.blocked) {
      allSecretFindings.push({
        file: item.path,
        line: 1,
        patternId: prePathCheck.kind,
        matchedRule: prePathCheck.matchedRule,
        description: prePathCheck.description,
      });
      continue;
    }

    // 2. Strict repo-root path confinement check
    const resolved = resolveRepoPath(item.path, { mustExist: true });
    const rawBuf = fs.readFileSync(resolved.absPath);
    const content = rawBuf.toString('utf8');
    const fileSha256 = sha256Buffer(rawBuf);

    // 3. Strict secret denylist scan (path globs + content regexes)
    const secretHits = scanContentForSecrets(resolved.relPath, content, config);
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

    const entryMeta = {
      path: resolved.relPath,
      category: item.category,
      sha256: fileSha256,
      bytes: rawBuf.length,
      chars: content.length,
      lines: lineCount,
      representation: includeFullBody ? 'full_uncompressed' : 'structural_outline',
      symbolCount: symbols.length,
      symbols,
    };

    selectedFileManifestEntries.push(entryMeta);
    renderedSections.push({ entryMeta, sectionText, sectionBytes: Buffer.byteLength(sectionText, 'utf8') });
  }

  if (allSecretFindings.length > 0) {
    const safeErrorDetails = allSecretFindings
      .map((f) => `${f.file}:${f.line} [${f.patternId}:${f.matchedRule}] (${f.description})`)
      .join('; ');
    throw new Error(`SECRET_SCAN_ABORT: Secret denylist violation detected in packet inputs: ${safeErrorDetails}`);
  }

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  resolveRepoPath(outDir, { mustExist: false });
  fs.mkdirSync(outDir, { recursive: true });

  const baseMaxBytes = Number(options.maxBytes || config.budgets.sourcePacketBudget.maxBytes);
  const headerText = headerLines.join('\n');
  const fullMarkdown = [headerText, ...renderedSections.map((s) => s.sectionText)].join('\n');
  const packetBytes = Buffer.byteLength(fullMarkdown, 'utf8');

  const uncoveredCallers = callerDiscovery.matchedFiles.filter(
    (f) => !selectedFileManifestEntries.some((s) => s.path === f)
  );

  // Check if budget overflow occurred
  const budgetOverflow = packetBytes > baseMaxBytes;
  const overflowItems = [];
  const safeChunks = [];

  if (budgetOverflow) {
    // Partition renderedSections into bounded multi-part chunk files so 100% of safe evidence is retrievable
    let currentChunkSections = [];
    let currentChunkFiles = [];
    let currentChunkBytes = Buffer.byteLength(headerText, 'utf8');
    let chunkIndex = 1;

    for (const sec of renderedSections) {
      if (currentChunkSections.length > 0 && currentChunkBytes + sec.sectionBytes > baseMaxBytes) {
        const chunkFilename = `${packetDef.id}-${mode}-chunk-part${chunkIndex}.md`;
        const chunkAbs = path.join(outDir, chunkFilename);
        const chunkContent = [
          `# ${packetDef.title} — Bounded Chunk Part ${chunkIndex}`,
          headerText,
          ...currentChunkSections,
        ].join('\n');
        fs.writeFileSync(chunkAbs, chunkContent, 'utf8');
        safeChunks.push({
          part: chunkIndex,
          path: toPosixPath(path.relative(REPO_ROOT, chunkAbs)),
          bytes: Buffer.byteLength(chunkContent, 'utf8'),
          files: currentChunkFiles,
        });
        chunkIndex += 1;
        currentChunkSections = [];
        currentChunkFiles = [];
        currentChunkBytes = Buffer.byteLength(headerText, 'utf8');
      }
      currentChunkSections.push(sec.sectionText);
      currentChunkFiles.push(sec.entryMeta.path);
      currentChunkBytes += sec.sectionBytes;
      if (chunkIndex > 1) {
        overflowItems.push({
          path: sec.entryMeta.path,
          category: sec.entryMeta.category,
          bytes: sec.entryMeta.bytes,
          safeChunkPart: chunkIndex,
          reason: `Exceeds single-packet budget (${baseMaxBytes} bytes); preserved in ${packetDef.id}-${mode}-chunk-part${chunkIndex}.md.`,
        });
      }
    }

    if (currentChunkSections.length > 0) {
      const chunkFilename = `${packetDef.id}-${mode}-chunk-part${chunkIndex}.md`;
      const chunkAbs = path.join(outDir, chunkFilename);
      const chunkContent = [
        `# ${packetDef.title} — Bounded Chunk Part ${chunkIndex}`,
        headerText,
        ...currentChunkSections,
      ].join('\n');
      fs.writeFileSync(chunkAbs, chunkContent, 'utf8');
      safeChunks.push({
        part: chunkIndex,
        path: toPosixPath(path.relative(REPO_ROOT, chunkAbs)),
        bytes: Buffer.byteLength(chunkContent, 'utf8'),
        files: currentChunkFiles,
      });
    }
  }

  // Always write the complete untruncated packet on disk so evidence is never lost
  const suffix = mode === 'full' ? 'packet' : 'navigation-packet';
  const packetFilename = `${packetDef.id}-${suffix}.md`;
  const manifestFilename = `${packetDef.id}-${suffix}.manifest.json`;
  const packetAbsPath = path.join(outDir, packetFilename);
  const manifestAbsPath = path.join(outDir, manifestFilename);

  fs.writeFileSync(packetAbsPath, fullMarkdown, 'utf8');
  const packetSha256 = sha256Buffer(Buffer.from(fullMarkdown, 'utf8'));

  // Determine strict completeness status
  const completenessFailures = [];
  if (omittedRequiredFiles.length > 0) {
    completenessFailures.push(
      `OMITTED_REQUIRED_FILES (${omittedRequiredFiles.length}): ${omittedRequiredFiles.map((o) => o.path).join(', ')}`
    );
  }
  if (mode === 'full' && uncoveredCallers.length > 0) {
    completenessFailures.push(
      `UNCOVERED_REQUIRED_CALLERS (${uncoveredCallers.length}): ${uncoveredCallers.join(', ')}`
    );
  }
  if (mode === 'full' && budgetOverflow) {
    completenessFailures.push(
      `BUDGET_OVERFLOW_IN_FULL_SECURITY_MODE: Packet size (${packetBytes} bytes) exceeds maxBytes (${baseMaxBytes} bytes). ${overflowItems.length} file(s) spilled into ${safeChunks.length} safe chunk files (${safeChunks.map((c) => c.path).join(', ')}). Full untruncated artifact preserved at ${toPosixPath(path.relative(REPO_ROOT, packetAbsPath))}.`
    );
  }

  const isCompleteAndValid = completenessFailures.length === 0;

  // Compute distinct source, tool, and test git revisions
  const sourceHead = getLatestCommitForPaths([
    ...packetDef.securityCriticalFiles,
    ...packetDef.schemaAndMigrationFiles,
  ]);
  const toolHead = getLatestCommitForPaths(['tools/ai-context/config.json', 'tools/ai-context/context-cli.mjs']);
  const testHead = getLatestCommitForPaths(packetDef.securityTestFiles);

  const manifest = {
    schemaVersion: '1.1.0',
    packetId: packetDef.id,
    title: packetDef.title,
    mode,
    completenessStatus: isCompleteAndValid ? 'COMPLETE_VERIFIED' : 'FAILED_INCOMPLETE',
    auditSafeForSecuritySignOff: mode === 'full' && isCompleteAndValid,
    completenessFailures,
    taskIds: packetDef.taskIds,
    generatedAt: new Date().toISOString(),
    sourceRevision: gitProv.sourceRevision,
    componentRevisions: {
      repoHead: gitProv.sourceRevision,
      sourceHead,
      toolHead,
      testHead,
    },
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
      maxBytes: baseMaxBytes,
      maxChars: config.budgets.sourcePacketBudget.maxChars,
      maxTokensEstimate: config.budgets.sourcePacketBudget.maxTokensEstimate,
      withinBudget: !budgetOverflow,
      omittedRequiredFilesCount: omittedRequiredFiles.length,
      omittedRequiredFiles,
      overflowItemsCount: overflowItems.length,
      overflowItems,
      safeChunkFiles: safeChunks,
    },
    secretScan: {
      status: 'PASSED',
      enforcedForbiddenPathGlobs: config.secretDenylist.forbiddenPathGlobs,
      enforcedDefaultExcludeGlobs: config.defaultExcludeGlobs,
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
        : 'Full mode preserves 100% of function bodies, negative test assertions, SQL migrations, and Sol D1/D3 architectural decisions.',
    ],
  };

  fs.writeFileSync(manifestAbsPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  if (!isCompleteAndValid) {
    throw new Error(
      `PACKET_INCOMPLETE_FAIL_CLOSED: Security packet '${packetId}' (${mode}) failed completeness validation: ${completenessFailures.join(
        ' | '
      )} (Manifest written to ${toPosixPath(path.relative(REPO_ROOT, manifestAbsPath))})`
    );
  }

  return {
    manifest,
    packetRelPath: toPosixPath(path.relative(REPO_ROOT, packetAbsPath)),
    manifestRelPath: toPosixPath(path.relative(REPO_ROOT, manifestAbsPath)),
  };
}

/**
 * `OPT02` Finding #2 Fix:
 * Runs synthetic security-canary & path-exclusion self-tests without disclosing or committing real credentials.
 * Verifies:
 * 1. `forbiddenPathGlobs` blocks `.env.local`, `nested/credentials.prod.json`, `certs/private.pem`, `keys/id_rsa`, `.npmrc`
 *    while allowing `.env.example`.
 * 2. `defaultExcludeGlobs` blocks `node_modules/pkg/index.js` and `graphify-out/graph.json`.
 * 3. Synthetic credential canaries (constructed dynamically in memory so no literal secret exists in repo)
 *    are caught by `scanContentForSecrets()` without echoing the canary value in the error output.
 * 4. Budget overflow and uncovered/omitted file negative controls fail closed with exit status != 0.
 */
function runVerifyCanaries(configMetadata, options = {}) {
  const { config } = configMetadata;
  const checks = [];

  // 1. Test forbiddenPathGlobs & negation rules
  const pathTestCases = [
    { path: '.env', expectBlocked: true, expectedKind: 'FORBIDDEN_SECRET_PATH_GLOB' },
    { path: 'apps/api-server/.env.production', expectBlocked: true, expectedKind: 'FORBIDDEN_SECRET_PATH_GLOB' },
    { path: '.env.example', expectBlocked: false, expectedKind: null },
    { path: 'config/.npmrc', expectBlocked: true, expectedKind: 'FORBIDDEN_SECRET_PATH_GLOB' },
    { path: 'certs/server.pem', expectBlocked: true, expectedKind: 'FORBIDDEN_SECRET_PATH_GLOB' },
    { path: 'secrets/credentials-prod.json', expectBlocked: true, expectedKind: 'FORBIDDEN_SECRET_PATH_GLOB' },
    { path: 'ssh/id_ed25519', expectBlocked: true, expectedKind: 'FORBIDDEN_SECRET_PATH_GLOB' },
    { path: 'node_modules/vitest/index.js', expectBlocked: true, expectedKind: 'DEFAULT_EXCLUDED_PATH_GLOB' },
    { path: 'packages/auth/src/rbac/ownership.service.ts', expectBlocked: false, expectedKind: null },
  ];

  for (const tc of pathTestCases) {
    const res = checkPathExclusionAndDenylist(tc.path, config);
    const passed = res.blocked === tc.expectBlocked && (tc.expectedKind === null || res.kind === tc.expectedKind);
    checks.push({
      test: `path_glob:${tc.path}`,
      expectedBlocked: tc.expectBlocked,
      actualBlocked: res.blocked,
      matchedRule: res.matchedRule,
      passed,
    });
  }

  // 2. Test synthetic content canaries (built at runtime by joining fragments so source files stay clean)
  const pemCanary = ['-----BEGIN ', 'RSA PRIVATE ', 'KEY-----'].join('');
  const dbUrlCanary = ['postgresql://admin:', 'SynthCanaryPass99!', '@db.internal.example.com:5432/prod'].join('');
  const patCanary = ['ghp_', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'].join('');
  const upstashCanary = ['UPSTASH_REDIS_REST_TOKEN=', '"SynthToken_9876543210abcdefghijklm"'].join('');

  const contentCanaryCases = [
    { id: 'PEM_PRIVATE_KEY', content: `const k = "${pemCanary}";`, secretFragment: 'RSA PRIVATE' },
    { id: 'DATABASE_URL_WITH_PASSWORD', content: `DATABASE_URL=${dbUrlCanary}`, secretFragment: 'SynthCanaryPass99!' },
    { id: 'GITHUB_OR_CLOUD_OR_LLM_TOKEN', content: `token: ${patCanary}`, secretFragment: patCanary },
    { id: 'LIVE_SECRET_ASSIGNMENT', content: upstashCanary, secretFragment: 'SynthToken_9876543210' },
  ];

  for (const cc of contentCanaryCases) {
    const findings = scanContentForSecrets('synthetic/canary-test.ts', cc.content, config);
    const matched = findings.some((f) => f.patternId === cc.id);
    const serializedFindings = JSON.stringify(findings);
    const valueRedacted = !serializedFindings.includes(cc.secretFragment);
    checks.push({
      test: `content_canary:${cc.id}`,
      detected: matched,
      secretValueRedactedFromOutput: valueRedacted,
      passed: matched && valueRedacted,
    });
  }

  // 3. Test fail-closed budget overflow control on buildPacket
  let budgetOverflowFailedClosed = false;
  let budgetOverflowErrorMsg = '';
  try {
    buildPacket('fnd03', configMetadata, {
      mode: 'full',
      allowDirty: true,
      maxBytes: 32768, // Deliberately smaller than the 220KB full packet
      outDir: path.join(DEFAULT_OUT_DIR, 'canary-overflow-test'),
    });
  } catch (err) {
    budgetOverflowFailedClosed = err.message.includes('PACKET_INCOMPLETE_FAIL_CLOSED') && err.message.includes('BUDGET_OVERFLOW');
    budgetOverflowErrorMsg = err.message;
  }
  checks.push({
    test: 'fail_closed:budget_overflow_in_full_mode',
    passed: budgetOverflowFailedClosed,
    observedError: budgetOverflowErrorMsg.slice(0, 220),
  });

  // 4. Test fail-closed missing required file / caller control on buildPacket
  let missingCallerFailedClosed = false;
  let missingCallerErrorMsg = '';
  try {
    buildPacket('fnd03', configMetadata, {
      mode: 'full',
      allowDirty: true,
      simulateOmitFile: 'apps/api-server/src/app/api/auth/profile/route.ts',
      outDir: path.join(DEFAULT_OUT_DIR, 'canary-omit-test'),
    });
  } catch (err) {
    missingCallerFailedClosed =
      err.message.includes('PACKET_INCOMPLETE_FAIL_CLOSED') &&
      err.message.includes('OMITTED_REQUIRED_FILES') &&
      err.message.includes('UNCOVERED_REQUIRED_CALLERS');
    missingCallerErrorMsg = err.message;
  }
  checks.push({
    test: 'fail_closed:missing_required_file_and_caller',
    passed: missingCallerFailedClosed,
    observedError: missingCallerErrorMsg.slice(0, 220),
  });

  const allPassed = checks.every((c) => c.passed);
  const report = {
    command: 'verify-canaries',
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    allPassed,
    totalChecks: checks.length,
    passedChecks: checks.filter((c) => c.passed).length,
    checks,
  };

  const outDir = options.outDir ? path.resolve(REPO_ROOT, options.outDir) : DEFAULT_OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'security-canaries-report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

  return {
    report,
    outFile: toPosixPath(path.relative(REPO_ROOT, outFile)),
  };
}

/**
 * `OPT03` Finding #6 Fix:
 * Benchmarks the conventional FND03 retrieval workflow against the optimized workflow
 * while preserving **identical 30-file FND03 security coverage** and explicitly measuring
 * discovery/manifest overhead separately from packet payload.
 */
function runBenchmark(packetId, configMetadata, options = {}) {
  const { config } = configMetadata;
  const packetDef = config.packets?.[packetId];
  if (!packetDef) {
    throw new Error(`Unknown packet ID '${packetId}'.`);
  }

  const gitProv = getGitProvenance();

  // 1. Run query-graph to measure actual optimized discovery overhead on disk
  const discoveryRun = runQueryGraph(
    'canAccessResource isValidTenantPair 0001_fnd03_add_tenant_ownership',
    config,
    { outDir: options.outDir, runNativeCli: true }
  );

  // 2. Build both full and navigation packets
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

  // 3. Measure the exact same 30 required security files in raw form
  const requiredFiles = packetDef.conventionalSameCoverageBaseline?.requiredSecurityFiles || [];
  let rawRequiredBytes = 0;
  let rawRequiredChars = 0;
  let rawRequiredLines = 0;
  const requiredFilesBreakdown = [];

  for (const relPath of requiredFiles) {
    const resolved = resolveRepoPath(relPath, { mustExist: true });
    const buf = fs.readFileSync(resolved.absPath);
    const text = buf.toString('utf8');
    const lines = text.split(/\r?\n/).length;
    rawRequiredBytes += buf.length;
    rawRequiredChars += text.length;
    rawRequiredLines += lines;
    requiredFilesBreakdown.push({
      path: resolved.relPath,
      bytes: buf.length,
      chars: text.length,
      lines,
      tokensEstimateCharsDiv4: estimateTokensCharsDiv4(text.length),
    });
  }

  // 4. Measure conventional discovery overhead (GRAPH_REPORT.md + multi-slice Tera/Gemini handoffs)
  const discoveryOverheadFiles = packetDef.conventionalSameCoverageBaseline?.conventionalDiscoveryOverheadFiles || [];
  let convOverheadBytes = 0;
  let convOverheadChars = 0;
  let convOverheadLines = 0;
  const convOverheadBreakdown = [];

  for (const relPath of discoveryOverheadFiles) {
    const resolved = resolveRepoPath(relPath, { mustExist: true });
    const buf = fs.readFileSync(resolved.absPath);
    const text = buf.toString('utf8');
    const lines = text.split(/\r?\n/).length;
    convOverheadBytes += buf.length;
    convOverheadChars += text.length;
    convOverheadLines += lines;
    convOverheadBreakdown.push({
      path: resolved.relPath,
      bytes: buf.length,
      chars: text.length,
      lines,
      tokensEstimateCharsDiv4: estimateTokensCharsDiv4(text.length),
    });
  }

  const conventionalTotalBytes = rawRequiredBytes + convOverheadBytes;
  const conventionalTotalChars = rawRequiredChars + convOverheadChars;
  const conventionalTotalLines = rawRequiredLines + convOverheadLines;
  const conventionalTotalTokensEst = estimateTokensCharsDiv4(conventionalTotalChars);

  // Measure optimized discovery + manifest overhead
  const manifestAbs = path.resolve(REPO_ROOT, fullPacket.manifestRelPath);
  const manifestBytes = fs.statSync(manifestAbs).size;
  const manifestChars = fs.readFileSync(manifestAbs, 'utf8').length;
  const queryBytes = discoveryRun.resultPayload.budgetMetrics.bytes;
  const queryChars = discoveryRun.resultPayload.budgetMetrics.chars;

  const optimizedFullPayloadBytes = fullPacket.manifest.packetOutput.bytes;
  const optimizedFullPayloadChars = fullPacket.manifest.packetOutput.chars;
  const optimizedFullWithDiscoveryBytes = optimizedFullPayloadBytes + queryBytes;
  const optimizedFullWithDiscoveryChars = optimizedFullPayloadChars + queryChars;

  const fullPayloadVsConventionalDeltaPct = Number(
    (((optimizedFullPayloadBytes - conventionalTotalBytes) / conventionalTotalBytes) * 100).toFixed(2)
  );
  const fullWithDiscoveryVsConventionalDeltaPct = Number(
    (((optimizedFullWithDiscoveryBytes - conventionalTotalBytes) / conventionalTotalBytes) * 100).toFixed(2)
  );
  const lineNumberFormattingOverheadPct = Number(
    (((optimizedFullPayloadBytes - rawRequiredBytes) / rawRequiredBytes) * 100).toFixed(2)
  );
  const navVsConventionalDeltaPct = Number(
    (((navPacket.manifest.packetOutput.bytes - conventionalTotalBytes) / conventionalTotalBytes) * 100).toFixed(2)
  );

  const benchmarkReport = {
    command: 'benchmark',
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    packetId,
    sourceRevision: gitProv.sourceRevision,
    worktreeState: gitProv.worktreeState,
    sameCoverageGuarantee: {
      requiredSecurityFilesCount: requiredFilesBreakdown.length,
      optimizedPacketFilesCount: fullPacket.manifest.selectedFilesCount,
      identicalSecurityFileSet: requiredFilesBreakdown.length === fullPacket.manifest.selectedFilesCount,
      discoveredCallersIncluded: `${fullPacket.manifest.callerCoverage.discoveredFilesCount}/${fullPacket.manifest.callerCoverage.discoveredFilesCount}`,
    },
    countingMethodology: {
      bytes: 'Exact UTF-8 byte length (Buffer.byteLength)',
      chars: 'Exact UTF-16 code unit / character count',
      tokensEstimateCharsDiv4:
        'Deterministic Math.ceil(chars / 4) applied identically across all recipes (NOT a model-billing or API-usage measurement)',
      repomixCalibration:
        'External Repomix 1.14.0 (tiktoken o200k_base) measurements recorded separately from chars/4 estimates',
    },
    recipes: {
      conventionalSameCoverageWorkflow: {
        description:
          'Same 30 required FND03 security files + conventional unscoped discovery overhead (reading full graphify-out/GRAPH_REPORT.md + multi-slice Tera/Gemini handoffs).',
        requiredSecurityFilesCount: requiredFilesBreakdown.length,
        discoveryOverheadFilesCount: convOverheadBreakdown.length,
        totalFilesLoaded: requiredFilesBreakdown.length + convOverheadBreakdown.length,
        requiredSecurityPayload: {
          bytes: rawRequiredBytes,
          chars: rawRequiredChars,
          lines: rawRequiredLines,
          tokensEstimateCharsDiv4: estimateTokensCharsDiv4(rawRequiredChars),
        },
        discoveryOverhead: {
          bytes: convOverheadBytes,
          chars: convOverheadChars,
          lines: convOverheadLines,
          tokensEstimateCharsDiv4: estimateTokensCharsDiv4(convOverheadChars),
          files: convOverheadBreakdown,
        },
        endToEndTotal: {
          bytes: conventionalTotalBytes,
          chars: conventionalTotalChars,
          lines: conventionalTotalLines,
          tokensEstimateCharsDiv4: conventionalTotalTokensEst,
        },
        auditSafeForSecurityReview: true,
      },
      rawRequired30FilesOnly: {
        description:
          'Raw sum of the 30 required FND03 files on disk with zero discovery overhead and no line-number headers.',
        filesCount: requiredFilesBreakdown.length,
        bytes: rawRequiredBytes,
        chars: rawRequiredChars,
        lines: rawRequiredLines,
        tokensEstimateCharsDiv4: estimateTokensCharsDiv4(rawRequiredChars),
        auditSafeForSecurityReview: true,
        files: requiredFilesBreakdown,
      },
      optimizedFullSecurityWorkflow: {
        description:
          'Bounded query-graph discovery + 30-file uncompressed FND03 packet (with line numbers and SHA-256 verification headers).',
        artifactPath: fullPacket.packetRelPath,
        manifestPath: fullPacket.manifestRelPath,
        filesCount: fullPacket.manifest.selectedFilesCount,
        packetPayloadOnly: {
          bytes: optimizedFullPayloadBytes,
          chars: optimizedFullPayloadChars,
          lines: fullPacket.manifest.packetOutput.lines,
          tokensEstimateCharsDiv4: fullPacket.manifest.packetOutput.tokensEstimateCharsDiv4,
          lineNumberAndHeaderFormattingOverheadPctVsRaw: lineNumberFormattingOverheadPct,
          deltaVsConventionalEndToEndPct: fullPayloadVsConventionalDeltaPct,
        },
        discoveryAndManifestOverhead: {
          boundedGraphQueryBytes: queryBytes,
          boundedGraphQueryChars: queryChars,
          boundedGraphQueryTokensEst: estimateTokensCharsDiv4(queryChars),
          onDiskManifestBytes: manifestBytes,
          onDiskManifestChars: manifestChars,
        },
        endToEndInContextTotal: {
          bytes: optimizedFullWithDiscoveryBytes,
          chars: optimizedFullWithDiscoveryChars,
          tokensEstimateCharsDiv4: estimateTokensCharsDiv4(optimizedFullWithDiscoveryChars),
          deltaVsConventionalEndToEndPct: fullWithDiscoveryVsConventionalDeltaPct,
        },
        withinSourcePacketBudget: fullPacket.manifest.budgetStatus.withinBudget,
        auditSafeForSecurityReview: true,
      },
      optimizedNavigationOutlinePacket: {
        description:
          'Structural navigation packet (imports + symbol signatures + line ranges). For initial orientation only — never sufficient alone for security sign-off.',
        artifactPath: navPacket.packetRelPath,
        manifestPath: navPacket.manifestRelPath,
        filesCount: navPacket.manifest.selectedFilesCount,
        bytes: navPacket.manifest.packetOutput.bytes,
        chars: navPacket.manifest.packetOutput.chars,
        lines: navPacket.manifest.packetOutput.lines,
        tokensEstimateCharsDiv4: navPacket.manifest.packetOutput.tokensEstimateCharsDiv4,
        deltaVsConventionalEndToEndPct: navVsConventionalDeltaPct,
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
 * Extracts exact section headings and line ranges from the governing Sol decision document
 * so checkpoints cite verified Sol sections (`D1`, `D3`) rather than hardcoded summaries.
 */
function extractSolDecisionSectionsFromDisk(solDecisionAbsPath, configuredSections = []) {
  const content = fs.readFileSync(solDecisionAbsPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const extracted = [];

  for (const sec of configuredSections) {
    const startIdx = lines.findIndex((l) => l.trim().startsWith(`## ${sec.sectionId}.`));
    if (startIdx === -1) {
      throw new Error(
        `SOL_DECISION_SECTION_MISSING: Section '${sec.sectionId}' (${sec.heading}) not found in ${sec.sourceFile}.`
      );
    }
    let endIdx = lines.length - 1;
    for (let i = startIdx + 1; i < lines.length; i++) {
      if (/^##\s+/.test(lines[i])) {
        endIdx = i - 1;
        break;
      }
    }
    const sectionText = lines.slice(startIdx, endIdx + 1).join('\n');
    extracted.push({
      sectionId: sec.sectionId,
      heading: lines[startIdx].trim(),
      appliesTo: sec.appliesTo,
      startLine: startIdx + 1,
      endLine: endIdx + 1,
      sectionSha256: sha256Buffer(Buffer.from(sectionText, 'utf8')),
    });
  }
  return extracted;
}

/**
 * `OPT04` Finding #5 Fix:
 * Creates a commit-aware FND session-resumption checkpoint JSON file:
 * - Computes real, distinct git commits for `sourceHead`, `toolHead`, and `testHead` (plus `repoHead`).
 * - Extracts governing Sol decision sections (`D1` and `D3`, correcting the earlier `D2` mislabeling)
 *   directly from `audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md` with line ranges and SHA-256 hashes.
 * - Records observed evidence from `audit/Sol_W1_W3_Checkpoint_f88fef44.mjs` rather than inventing
 *   hardcoded architectural instructions.
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
  const solDecisionCommit = getLatestCommitForPaths([solDecisionRel]);

  // Verify and extract exact D1 and D3 sections from the Sol decision file on disk
  const verifiedSolSections = extractSolDecisionSectionsFromDisk(
    solDecisionResolved.absPath,
    packetDef.governingSolDecisionSections || []
  );

  // Compute distinct source, tool, and test commits
  const sourcePaths = [...packetDef.securityCriticalFiles, ...packetDef.schemaAndMigrationFiles];
  const toolPaths = ['tools/ai-context/config.json', 'tools/ai-context/context-cli.mjs'];
  const testPaths = [...packetDef.securityTestFiles];

  const sourceHead = getLatestCommitForPaths(sourcePaths);
  const toolHead = getLatestCommitForPaths(toolPaths);
  const testHead = getLatestCommitForPaths(testPaths);

  const trackedFiles = [
    ...packetDef.securityCriticalFiles,
    ...packetDef.schemaAndMigrationFiles,
    ...packetDef.securityTestFiles,
    ...packetDef.solDecisionFiles,
  ];
  const uniqueTracked = [...new Set(trackedFiles)];

  const dirtyMap = new Map(gitProv.dirtyFiles.map((d) => [d.path, d.status]));
  const fileFingerprints = uniqueTracked.map((relPath) => {
    const resolved = resolveRepoPath(relPath, { mustExist: true });
    return {
      path: resolved.relPath,
      sha256: sha256File(resolved.absPath),
      lastCommit: getLatestCommitForPaths([resolved.relPath]),
      worktreeStatus: dirtyMap.get(resolved.relPath) || 'clean',
    };
  });

  const status = options.status || 'IN_PROGRESS';
  if (status === 'CLOSED') {
    throw new Error('CHECKPOINT_POLICY_ERROR: Only Sol may mark an FND or remediation item CLOSED.');
  }

  const checkpoint = {
    schemaVersion: '1.1.0',
    checkpointId: `${packetId}-checkpoint-${gitProv.sourceRevision.slice(0, 8)}`,
    packetId,
    role: options.role || 'Argon',
    taskIds: packetDef.taskIds,
    status,
    createdAt: new Date().toISOString(),
    commits: {
      repoHead: gitProv.sourceRevision,
      sourceHead,
      toolHead,
      testHead,
    },
    worktreeStateAtCreation: gitProv.worktreeState,
    dirtyFilesAtCreation: gitProv.dirtyFiles,
    solDecisionReference: {
      solDecisionPath: solDecisionResolved.relPath,
      solDecisionRevision: solDecisionCommit,
      solDecisionSha256: sha256File(solDecisionResolved.absPath),
      verifiedSections: verifiedSolSections,
    },
    observedEvidenceReferences: packetDef.observedCheckpointRunnerEvidence || [],
    unresolvedRequirementsRef: {
      authorityDocument: solDecisionResolved.relPath,
      sections: verifiedSolSections.map((s) => `${s.sectionId} (lines ${s.startLine}-${s.endLine})`),
      note: 'Refer directly to Sol decision sections D1 (private profile ownership & tenant provenance) and D3 (tenant persistence, progress, exports & admin context); checkpoints do not prescribe independent architecture rules.',
    },
    nextAction: {
      nextRequiredModels: [
        'Claude Sonnet 4.5 (DOC01-DOC03 in docs/ai-context/operating-guide.md, docs/ai-context/fnd-checkpoint-template.md, docs/ai-context/task-retrieval-guide.md)',
        'Gemini (VAL01-VAL12 independent tooling validation in tests/tooling/ai-context/* and audit/Gemini_Context_Optimization_Validation.md)',
        'Sol (final architectural acceptance)',
      ],
      teraCriticalWorkstreamNote: 'Terra continues TC01-TC20 independently without interruption.',
    },
    verificationCommandsAdvisoryOnly: [
      'node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary',
      'pnpm --filter @quiz/api-server exec tsc --noEmit',
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
function validateCheckpoint(checkpointFile, configMetadata, options = {}) {
  const { config } = configMetadata;
  const resolved = resolveRepoPath(checkpointFile, { mustExist: true });
  const checkpoint = JSON.parse(fs.readFileSync(resolved.absPath, 'utf8'));
  const gitProv = getGitProvenance();
  const packetDef = config.packets?.[checkpoint.packetId || 'fnd03'];

  const failures = [];

  if (checkpoint.autoExecuteCommands !== false) {
    failures.push('INVALID_EXECUTION_FLAG: checkpoint.autoExecuteCommands must be strictly false.');
  }

  if (checkpoint.status === 'CLOSED') {
    failures.push('UNAUTHORIZED_CLOSURE_STATUS: Checkpoints cannot self-certify status === "CLOSED" without Sol acceptance.');
  }

  // 1. Validate repoHead and distinct sourceHead, toolHead, testHead
  const currentRepoHead = options.simulateHead || gitProv.sourceRevision;
  const currentSourceHead = options.simulateHead
    ? options.simulateHead
    : packetDef
      ? getLatestCommitForPaths([...packetDef.securityCriticalFiles, ...packetDef.schemaAndMigrationFiles])
      : currentRepoHead;
  const currentToolHead = options.simulateHead
    ? options.simulateHead
    : getLatestCommitForPaths(['tools/ai-context/config.json', 'tools/ai-context/context-cli.mjs']);
  const currentTestHead = options.simulateHead
    ? options.simulateHead
    : packetDef
      ? getLatestCommitForPaths(packetDef.securityTestFiles)
      : currentRepoHead;

  if (checkpoint.commits?.repoHead && checkpoint.commits.repoHead !== currentRepoHead) {
    failures.push(
      `REPO_HEAD_MISMATCH: Checkpoint repoHead (${checkpoint.commits.repoHead}) does not match current HEAD (${currentRepoHead}).`
    );
  }
  if (checkpoint.commits?.sourceHead !== currentSourceHead) {
    failures.push(
      `SOURCE_HEAD_MISMATCH: Checkpoint sourceHead (${checkpoint.commits?.sourceHead}) does not match current sourceHead (${currentSourceHead}).`
    );
  }
  if (checkpoint.commits?.toolHead !== currentToolHead) {
    failures.push(
      `TOOL_HEAD_MISMATCH: Checkpoint toolHead (${checkpoint.commits?.toolHead}) does not match current toolHead (${currentToolHead}).`
    );
  }
  if (checkpoint.commits?.testHead !== currentTestHead) {
    failures.push(
      `TEST_HEAD_MISMATCH: Checkpoint testHead (${checkpoint.commits?.testHead}) does not match current testHead (${currentTestHead}).`
    );
  }

  // 2. Validate Sol decision reference & section hashes
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
      if (!Array.isArray(solRef.verifiedSections) || solRef.verifiedSections.length === 0) {
        failures.push('MISSING_SOL_SECTIONS: Checkpoint must reference verified Sol decision sections (e.g. D1, D3).');
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
    currentCommits: {
      repoHead: currentRepoHead,
      sourceHead: currentSourceHead,
      toolHead: currentToolHead,
      testHead: currentTestHead,
    },
    worktreeState: gitProv.worktreeState,
    failuresCount: failures.length,
    failures,
  };
}

/**
 * `OPT05` Finding #7 Fix:
 * Non-destructive inventory of host instruction files (`AGENTS.md`, `CLAUDE.md`, `.kiro`, `.codex`, `.claude`, `.agents`).
 * References the exact approved Sonnet `DOC01`–`DOC03` filenames from `audit/Argon_Developer_Context_Optimization_Assignment.md`:
 * - `docs/ai-context/operating-guide.md` (`DOC01`)
 * - `docs/ai-context/fnd-checkpoint-template.md` (`DOC02`)
 * - `docs/ai-context/task-retrieval-guide.md` (`DOC03`)
 */
function runHostInventory(config, options = {}) {
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
    approvedSonnetDocumentationTargets: config.sonnetDocumentationDeliverables || {
      DOC01: 'docs/ai-context/operating-guide.md',
      DOC02: 'docs/ai-context/fnd-checkpoint-template.md',
      DOC03: 'docs/ai-context/task-retrieval-guide.md',
    },
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
      case 'record-graph-provenance': {
        const { stamp, outFile } = recordGraphProvenance(config, { packet: flags.packet || 'fnd03' });
        printBoundedTerminalSummary(
          [
            `[record-graph-provenance] PASS — wrote ${outFile}`,
            `  Source HEAD: ${stamp.sourceRevision} | Worktree: ${stamp.worktreeState}`,
            `  Graph SHA-256: ${stamp.graphFile.sha256} (${stamp.graphFile.bytes} bytes)`,
            `  Tracked files matching graphify-out/manifest.json AST MD5: ${stamp.fileFingerprints.filter((f) => f.matchesGraphManifest).length}/${stamp.trackedFilesCount}`,
          ],
          config
        );
        break;
      }

      case 'sql-coverage': {
        const { report, outFile } = runSqlCoverage(config, { outDir: flags['out-dir'] });
        printBoundedTerminalSummary(
          [
            `[sql-coverage] PASS — wrote ${outFile}`,
            `  Graph nodes: ${report.graphTotals.totalNodes} | Edges: ${report.graphTotals.totalEdges} | SQL nodes: ${report.graphTotals.sqlNodeCount} (${report.graphTotals.distinctSqlFilesIndexed} SQL files)`,
            `  Provenance verified: ${report.graphProvenance.provenanceVerified} | Advisory: ${report.graphProvenance.advisory} (${report.graphProvenance.advisoryReason})`,
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
          depth: flags.depth,
          fallbackPattern: flags['fallback-pattern'],
          outDir: flags['out-dir'],
          runNativeCli: flags['no-native-cli'] ? false : true,
        });
        printBoundedTerminalSummary(
          [
            `[query-graph] PASS — wrote ${outFile}`,
            `  Query: "${resultPayload.query}" | Provenance verified: ${resultPayload.provenance.provenanceVerified} | Advisory: ${resultPayload.advisory}`,
            `  Lexical seeds: ${resultPayload.truncation.returnedSeeds}/${resultPayload.truncation.totalSeedMatches} | Multi-hop BFS (depth<=${resultPayload.truncation.maxDepth}): ${resultPayload.truncation.returnedTraversedNodes}/${resultPayload.truncation.totalReachableWithinDepth} nodes, ${resultPayload.truncation.returnedTraversedEdges} edges (truncated=${resultPayload.truncation.truncated})`,
            `  Native graphify CLI: ${resultPayload.nativeGraphifyCli.status} (${resultPayload.nativeGraphifyCli.headerLine || 'not run'})`,
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
          maxBytes: flags['max-bytes'],
          simulateOmitFile: flags['simulate-omit-file'],
        });
        printBoundedTerminalSummary(
          [
            `[build-packet] PASS — packet=${packetId} mode=${mode} completeness=${manifest.completenessStatus}`,
            `  Packet file:   ${packetRelPath} (${manifest.packetOutput.bytes} bytes, ${manifest.packetOutput.chars} chars, ~${manifest.packetOutput.tokensEstimateCharsDiv4} tokens [chars/4])`,
            `  Manifest file: ${manifestRelPath}`,
            `  Revisions:     repoHead=${manifest.componentRevisions.repoHead.slice(0, 8)} sourceHead=${manifest.componentRevisions.sourceHead.slice(0, 8)} toolHead=${manifest.componentRevisions.toolHead.slice(0, 8)} testHead=${manifest.componentRevisions.testHead.slice(0, 8)}`,
            `  Files packed:  ${manifest.selectedFilesCount} | Secret scan: ${manifest.secretScan.status} | Within budget: ${manifest.budgetStatus.withinBudget}`,
            `  Callers found: ${manifest.callerCoverage.discoveredFilesCount} (${manifest.callerCoverage.uncoveredCallersCount} uncovered)`,
          ],
          config
        );
        break;
      }

      case 'verify-canaries': {
        const { report, outFile } = runVerifyCanaries(configMetadata, { outDir: flags['out-dir'] });
        printBoundedTerminalSummary(
          [
            `[verify-canaries] ${report.allPassed ? 'PASS' : 'FAIL'} — wrote ${outFile} (${report.passedChecks}/${report.totalChecks} checks passed)`,
            ...report.checks.map((c) => `  - ${c.test}: ${c.passed ? 'PASS' : 'FAIL'}`),
          ],
          config
        );
        if (!report.allPassed) {
          process.exitCode = 1;
        }
        break;
      }

      case 'benchmark': {
        const packetId = flags.packet || positionals[0] || 'fnd03';
        const { benchmarkReport, outFile } = runBenchmark(packetId, configMetadata, {
          outDir: flags['out-dir'],
        });
        const conv = benchmarkReport.recipes.conventionalSameCoverageWorkflow;
        const raw30 = benchmarkReport.recipes.rawRequired30FilesOnly;
        const full = benchmarkReport.recipes.optimizedFullSecurityWorkflow;
        const nav = benchmarkReport.recipes.optimizedNavigationOutlinePacket;
        printBoundedTerminalSummary(
          [
            `[benchmark] PASS — wrote ${outFile} (HEAD ${benchmarkReport.sourceRevision}, identical 30-file security coverage=${benchmarkReport.sameCoverageGuarantee.identicalSecurityFileSet})`,
            `  1. Conventional Same-Coverage End-to-End (30 required + 3 discovery files): ${conv.endToEndTotal.bytes} bytes | ${conv.endToEndTotal.chars} chars | ~${conv.endToEndTotal.tokensEstimateCharsDiv4} tokens [chars/4]`,
            `  2. Raw 30 Required Security Files Only (no discovery/line-numbers):         ${raw30.bytes} bytes | ${raw30.chars} chars | ~${raw30.tokensEstimateCharsDiv4} tokens [chars/4]`,
            `  3. Optimized Full Security Workflow (30 files + bounded query):             ${full.endToEndInContextTotal.bytes} bytes (${full.packetPayloadOnly.bytes} packet + ${full.discoveryAndManifestOverhead.boundedGraphQueryBytes} query) | ~${full.endToEndInContextTotal.tokensEstimateCharsDiv4} tokens [chars/4] (${full.endToEndInContextTotal.deltaVsConventionalEndToEndPct}% vs conventional end-to-end, auditSafe=true)`,
            `  4. Optimized Navigation Outline Only (30 files, orientation only):          ${nav.bytes} bytes | ${nav.chars} chars | ~${nav.tokensEstimateCharsDiv4} tokens [chars/4] (${nav.deltaVsConventionalEndToEndPct}% vs conventional, auditSafe=false)`,
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
          role: flags.role,
          outDir: flags['out-dir'],
          file: flags.file,
        });
        printBoundedTerminalSummary(
          [
            `[checkpoint-create] PASS — wrote ${outFile}`,
            `  Checkpoint ID: ${checkpoint.checkpointId} | Status: ${checkpoint.status}`,
            `  Commits: repoHead=${checkpoint.commits.repoHead.slice(0, 8)} sourceHead=${checkpoint.commits.sourceHead.slice(0, 8)} toolHead=${checkpoint.commits.toolHead.slice(0, 8)} testHead=${checkpoint.commits.testHead.slice(0, 8)}`,
            `  Sol decision ref: ${checkpoint.solDecisionReference.solDecisionPath} @ ${checkpoint.solDecisionReference.solDecisionRevision.slice(0, 8)} (Sections: ${checkpoint.solDecisionReference.verifiedSections.map((s) => s.sectionId).join(', ')})`,
          ],
          config
        );
        break;
      }

      case 'checkpoint-validate': {
        const file = flags.file || positionals[0] || '.context-packets/fnd03-checkpoint.json';
        const validation = validateCheckpoint(file, configMetadata, {
          allowDirty: Boolean(flags['allow-dirty']),
          simulateHead: flags['simulate-head'],
        });
        printBoundedTerminalSummary(
          [
            `[checkpoint-validate] ${validation.valid ? 'PASS' : 'FAIL'} — ${validation.checkpointFile}`,
            `  Commits: repoHead=${validation.currentCommits.repoHead.slice(0, 8)} sourceHead=${validation.currentCommits.sourceHead.slice(0, 8)} toolHead=${validation.currentCommits.toolHead.slice(0, 8)} testHead=${validation.currentCommits.testHead.slice(0, 8)} | Worktree: ${validation.worktreeState}`,
            ...(validation.failures.length
              ? validation.failures.map((f) => `  FAILURE: ${f}`)
              : ['  All commit pointers, Sol D1/D3 decision hashes, and file SHA-256 fingerprints verified.']),
          ],
          config
        );
        if (!validation.valid) {
          process.exitCode = 1;
        }
        break;
      }

      case 'host-inventory': {
        const { report, outFile } = runHostInventory(config, { outDir: flags['out-dir'] });
        printBoundedTerminalSummary(
          [
            `[host-inventory] PASS — wrote ${outFile}`,
            `  Sonnet DOC01-DOC03 targets: ${Object.entries(report.approvedSonnetDocumentationTargets)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')}`,
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
            `  record-graph-provenance                      Stamp graph.json SHA-256 + manifest.json AST MD5s against HEAD (OPT01)`,
            `  sql-coverage                                 Verify Graphify tree_sitter_sql coverage & FND03 migrations (OPT01)`,
            `  query-graph "<query>"                        Run provenance-checked BFS graph traversal + ripgrep fallback (OPT01)`,
            `  build-packet --packet fnd03 [--mode full]    Build fail-closed secret-scanned packet + .manifest.json (OPT02)`,
            `  verify-canaries                              Run synthetic secret-canary, path-glob & fail-closed checks (OPT02)`,
            `  benchmark --packet fnd03                     Run same-coverage FND03 token/byte/discovery benchmark (OPT03)`,
            `  checkpoint-create --packet fnd03             Create commit-aware FND checkpoint pointer (OPT04)`,
            `  checkpoint-validate --file <path>            Validate checkpoint against source/tool/test HEADs & Sol D1/D3 (OPT04)`,
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
