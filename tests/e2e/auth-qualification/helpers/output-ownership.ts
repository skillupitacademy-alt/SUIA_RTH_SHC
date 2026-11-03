import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Fixed harness-only artifact parent directory.
 * All qualification run output MUST reside strictly beneath this fixed directory.
 * Arbitrary caller-supplied paths outside this parent are rejected fail-closed.
 */
export const FIXED_HARNESS_ARTIFACTS_PARENT = path.resolve(__dirname, '..', '.run-artifacts');

export const OWNERSHIP_MARKER_FILENAME = '.auth-run-ownership.json';
export const VALID_RUN_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export interface RunOwnershipRecord {
  harness: 'auth-qualification-run';
  runId: string;
  pid: number;
  parentDir: string;
  runDir: string;
  ownershipToken: string;
  createdAt: number;
}

/**
 * Checks whether any existing directory or component along the ancestor path
 * from targetPath up to stopAncestor (or root) is a symbolic link or directory junction.
 */
export function hasSymlinkOrJunctionAncestor(targetPath: string, stopAncestor?: string): boolean {
  if (!targetPath) return false;
  try {
    let current = path.resolve(targetPath);
    const stop = stopAncestor ? path.resolve(stopAncestor) : null;

    // Guard against infinite loop in root traversal
    let prev = '';
    while (current !== prev) {
      if (fs.existsSync(current)) {
        const lstat = fs.lstatSync(current);
        if (lstat.isSymbolicLink()) {
          return true;
        }
      }

      if (stop && current === stop) {
        break;
      }

      prev = current;
      current = path.dirname(current);
    }

    return false;
  } catch {
    // Fail-closed on inspection errors
    return true;
  }
}

/**
 * Validates that an output directory is strictly a unique run directory inside the fixed
 * harness parent, contains a valid run ID, has no symlink/junction ancestors, and does not escape.
 * Fails closed BEFORE Playwright config or runner can touch or clean the directory.
 */
export function allocateOrValidateRunDirectory(options?: {
  runId?: string;
  parentDir?: string;
  ownershipToken?: string;
  create?: boolean;
}): { runId: string; runDir: string; ownershipToken: string } {
  const parentDir = options?.parentDir
    ? path.resolve(options.parentDir)
    : FIXED_HARNESS_ARTIFACTS_PARENT;

  // 1. Ancestor symlink/junction check on parent directory
  if (fs.existsSync(parentDir) && hasSymlinkOrJunctionAncestor(parentDir)) {
    throw new Error(
      `[OWNERSHIP_SAFETY_VIOLATION] Harness artifact parent ${parentDir} contains a symbolic link or junction ancestor.`
    );
  }

  // 2. Validate or generate run ID
  let runId = options?.runId || process.env.AUTH_QUALIFICATION_RUN_ID;
  if (runId) {
    runId = runId.trim();
    if (!VALID_RUN_ID_REGEX.test(runId)) {
      throw new Error(
        `[OWNERSHIP_SAFETY_VIOLATION] Invalid run identifier: '${runId}'. Run ID must be alphanumeric (max 64 chars) with no path separators or traversal.`
      );
    }
  } else {
    const timestamp = Date.now();
    const rand = crypto.randomBytes(4).toString('hex');
    runId = `run-${timestamp}-${process.pid}-${rand}`;
  }

  // 3. Form runDir and verify strict containment beneath parentDir
  const runDir = path.resolve(parentDir, runId);
  const relative = path.relative(parentDir, runDir);
  if (
    relative.startsWith('..') ||
    path.isAbsolute(relative) ||
    relative === '' ||
    relative.includes('/') ||
    relative.includes('\\')
  ) {
    throw new Error(
      `[OWNERSHIP_SAFETY_VIOLATION] Run directory '${runDir}' escapes fixed artifact parent '${parentDir}'.`
    );
  }

  // 4. Prohibit workspace root or ancestors as run directory
  const workspaceRoot = path.resolve(process.cwd());
  if (runDir === workspaceRoot || path.relative(runDir, workspaceRoot) === '') {
    throw new Error(
      `[OWNERSHIP_SAFETY_VIOLATION] Run directory cannot be workspace root or an ancestor.`
    );
  }

  // 5. Ancestor symlink/junction check on runDir
  if (fs.existsSync(runDir) && hasSymlinkOrJunctionAncestor(runDir, parentDir)) {
    throw new Error(
      `[OWNERSHIP_SAFETY_VIOLATION] Run directory '${runDir}' contains a symbolic link or junction.`
    );
  }

  // 6. Token generation and marker creation
  const markerPath = path.join(runDir, OWNERSHIP_MARKER_FILENAME);
  let ownershipToken = options?.ownershipToken || process.env.AUTH_QUALIFICATION_OWNERSHIP_TOKEN;

  if (options?.create !== false) {
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }

    if (!ownershipToken) {
      ownershipToken = crypto.randomBytes(16).toString('hex');
    }

    const record: RunOwnershipRecord = {
      harness: 'auth-qualification-run',
      runId,
      pid: process.pid,
      parentDir,
      runDir,
      ownershipToken,
      createdAt: Date.now(),
    };

    fs.writeFileSync(markerPath, JSON.stringify(record, null, 2), 'utf-8');
  } else if (!ownershipToken && fs.existsSync(markerPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(markerPath, 'utf-8'));
      if (data.ownershipToken) {
        ownershipToken = data.ownershipToken;
      }
    } catch {
      // Ignore
    }
  }

  return {
    runId,
    runDir,
    ownershipToken: ownershipToken || '',
  };
}

/**
 * Verifies that a target run directory is genuinely owned by this qualification run,
 * is strictly located under the fixed parent, is free of symlinks, and contains a valid ownership marker.
 */
export function validateRunOwnership(
  runDir: string,
  expectedRunId?: string,
  expectedToken?: string,
  parentDir?: string
): boolean {
  if (!runDir || typeof runDir !== 'string') return false;

  const expectedParent = parentDir
    ? path.resolve(parentDir)
    : FIXED_HARNESS_ARTIFACTS_PARENT;

  try {
    const resolvedRunDir = path.resolve(runDir);
    if (!fs.existsSync(resolvedRunDir)) return false;

    // Check lexical containment
    const rel = path.relative(expectedParent, resolvedRunDir);
    if (
      rel.startsWith('..') ||
      path.isAbsolute(rel) ||
      rel === '' ||
      rel.includes('/') ||
      rel.includes('\\')
    ) {
      return false;
    }

    // Check realpath containment
    if (fs.existsSync(expectedParent)) {
      const realParent = fs.realpathSync(expectedParent);
      const realRunDir = fs.realpathSync(resolvedRunDir);
      const realRel = path.relative(realParent, realRunDir);
      if (realRel.startsWith('..') || path.isAbsolute(realRel) || realRel === '') {
        return false;
      }
    }

    // Check symlinks along ancestor chain
    if (hasSymlinkOrJunctionAncestor(resolvedRunDir, expectedParent)) {
      return false;
    }

    // Verify ownership marker file
    const markerPath = path.join(resolvedRunDir, OWNERSHIP_MARKER_FILENAME);
    if (!fs.existsSync(markerPath)) {
      return false;
    }

    const content = fs.readFileSync(markerPath, 'utf-8');
    const parsed: RunOwnershipRecord = JSON.parse(content);

    if (parsed.harness !== 'auth-qualification-run') return false;
    if (expectedRunId && parsed.runId !== expectedRunId) return false;
    if (expectedToken && parsed.ownershipToken !== expectedToken) return false;
    if (path.resolve(parsed.runDir) !== resolvedRunDir) return false;

    return true;
  } catch {
    return false;
  }
}
/**
 * Safely removes a verified run-owned directory.
 * If ownership validation fails, REFUSES TO DELETE and returns false.
 * NEVER removes the parent directory containing other sibling runs.
 */
export function safeCleanupRunDirectory(
  runDir: string,
  expectedRunId?: string,
  expectedToken?: string,
  parentDir?: string
): boolean {
  if (!validateRunOwnership(runDir, expectedRunId, expectedToken, parentDir)) {
    return false;
  }

  const expectedParent = parentDir
    ? path.resolve(parentDir)
    : FIXED_HARNESS_ARTIFACTS_PARENT;

  if (path.resolve(runDir) === path.resolve(expectedParent)) {
    return false; // Never remove the parent directory
  }

  try {
    fs.rmSync(runDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
/**
 * Checks whether targetPath is strictly inside ownedOutputDir without escaping via
 * directory traversal ('..') or symbolic links/junctions along any ancestor component.
 */
export function isSafelyContainedInOwnedDir(targetPath: string, ownedDir: string): boolean {
  if (!targetPath || !ownedDir) return false;
  try {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedOwned = path.resolve(ownedDir);

    // Prevent matching the directory itself or root
    if (resolvedTarget === resolvedOwned) return false;

    // Check lexical traversal escape
    const relative = path.relative(resolvedOwned, resolvedTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
      return false;
    }

    // Check realpath containment if both exist
    if (fs.existsSync(resolvedOwned) && fs.existsSync(resolvedTarget)) {
      const realOwned = fs.realpathSync(resolvedOwned);
      const realTarget = fs.realpathSync(resolvedTarget);
      const realRelative = path.relative(realOwned, realTarget);
      if (
        realRelative.startsWith('..') ||
        path.isAbsolute(realRelative) ||
        realRelative === ''
      ) {
        return false;
      }
    }

    // Reject symbolic links or junctions anywhere along the path from targetPath up to ownedDir
    if (hasSymlinkOrJunctionAncestor(resolvedTarget, resolvedOwned)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
