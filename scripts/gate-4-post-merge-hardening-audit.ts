/**
 * GATE 4 — Post-Merge Hardening Audit
 *
 * PURPOSE:
 *   Read-only verification of Tutorial V2 post-merge state.
 *
 * IMPORTANT:
 *   - Does not modify source files.
 *   - Does not modify database records.
 *   - Does not touch protected worktree files.
 *   - Does not perform git reset/restore/clean/stash.
 *
 * Run:
 *   pnpm exec tsx scripts/gate-4-post-merge-hardening-audit.ts
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type CheckStatus = "PASS" | "FAIL" | "WARN" | "NOT_EXECUTED";

interface CheckResult {
  id: string;
  description: string;
  status: CheckStatus;
  details?: string;
}

const results: CheckResult[] = [];

function add(
  id: string,
  description: string,
  status: CheckStatus,
  details?: string,
) {
  results.push({
    id,
    description,
    status,
    details,
  });
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function read(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

const EXPECTED_HEAD =
  "4881b406928deeea371f4dc3f3b89103f0cf8661";

const EXPECTED_GATE2 =
  "5cd5dab9cceacea3b7bcace7a5ef262c95f4ac89";

const PROTECTED_FILES = [
  "apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/suggestions/apply/__tests__/route.test.ts",
  "apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/suggestions/apply/route.ts",
  "scripts/gate-1-verify-database-schema.ts",
  "scripts/tutorial-v2-reconciliation-audit-db-snapshot.ts",
  "scripts/verify-db-schema-current.ts",
];

const ROUTES = [
  "apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts",
  "apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts",
  "apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/blocks/route.ts",
  "apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/publish/route.ts",
];

const FORBIDDEN_V1_METHODS = [
  "createSection(",
  "getSection(",
  "querySections(",
  "updateSection(",
  "archiveSection(",
  "publishSection(",
  "appendBlockToSection(",
];

function checkGitBaseline() {
  const branch = git(["branch", "--show-current"]);
  const head = git(["rev-parse", "HEAD"]);

  add(
    "G4-GIT-001",
    "Current branch is main",
    branch === "main" ? "PASS" : "FAIL",
    `branch=${branch}`,
  );

  add(
    "G4-GIT-002",
    "HEAD matches GATE 3 merge commit",
    head === EXPECTED_HEAD ? "PASS" : "FAIL",
    `HEAD=${head}`,
  );
}

function checkProtectedFiles() {
  const modified = new Set(
    git(["diff", "--name-only"])
      .split(/\r?\n/)
      .filter(Boolean),
  );

  const untracked = new Set(
    git(["ls-files", "--others", "--exclude-standard"])
      .split(/\r?\n/)
      .filter(Boolean),
  );

  for (const file of PROTECTED_FILES) {
    const status = modified.has(file) || untracked.has(file)
      ? "PASS"
      : "WARN";

    add(
      "G4-SAFE-" + file.length,
      `Protected work remains present: ${file}`,
      status,
      status === "PASS"
        ? "Protected item remains in working tree."
        : "Item is not currently detected in expected state.",
    );
  }
}

function checkMergeIntegrity() {
  const parents = git([
    "rev-list",
    "--parents",
    "-n",
    "1",
    EXPECTED_HEAD,
  ]).split(/\s+/);

  const parent1 = parents[1];
  const parent2 = parents[2];

  add(
    "G4-MERGE-001",
    "Merge parent 1 is pre-GATE-3 main",
    parent1 === "da050bd9f86f0db258637e2049836513f6e9188a"
      ? "PASS"
      : "FAIL",
    parent1,
  );

  add(
    "G4-MERGE-002",
    "Merge parent 2 is GATE 2 commit",
    parent2 === EXPECTED_GATE2
      ? "PASS"
      : "FAIL",
    parent2,
  );
}

function checkRoutes() {
  for (const route of ROUTES) {
    if (!existsSync(resolve(route))) {
      add(
        "G4-HTTP-" + route.length,
        `Route exists: ${route}`,
        "FAIL",
        "Route file missing.",
      );
      continue;
    }

    const content = read(route);

    const hasAuth =
      content.includes("authenticateRequest");

    const hasV2Service =
      /createTutorial|queryTutorials|getTutorial|updateTutorialContent|archiveTutorial|appendBlockToTutorial|publishTutorial/.test(
        content,
      );

    const hasForbiddenV1 =
      FORBIDDEN_V1_METHODS.some((method) =>
        content.includes(method),
      );

    const hasLegacyFields =
      content.includes("sectionType") ||
      content.includes("difficulty");

    add(
      "G4-HTTP-AUTH-" + route.length,
      `Authentication present: ${route}`,
      hasAuth ? "PASS" : "FAIL",
    );

    add(
      "G4-HTTP-V2-" + route.length,
      `V2 service implementation present: ${route}`,
      hasV2Service ? "PASS" : "FAIL",
    );

    add(
      "G4-HTTP-V1-" + route.length,
      `No V1 service calls: ${route}`,
      !hasForbiddenV1 ? "PASS" : "FAIL",
    );

    add(
      "G4-HTTP-FIELDS-" + route.length,
      `No legacy tutorial fields: ${route}`,
      !hasLegacyFields ? "PASS" : "FAIL",
    );
  }
}

function checkTestIsolation() {
  const tests = [
    "packages/db-tutorial/src/repositories/__tests__/v2-repository-integration.test.ts",
    "packages/db-tutorial/src/services/__tests__/v2-composer-integration.test.ts",
    "packages/db-tutorial/src/services/__tests__/v2-delivery-integration.test.ts",
  ];

  for (const file of tests) {
    if (!existsSync(resolve(file))) {
      add(
        "G4-TEST-" + file.length,
        `V2 test exists: ${file}`,
        "FAIL",
      );
      continue;
    }

    const content = read(file);

    const tracksCreatedIds =
      content.includes("createdTutorialIds");

    const hasBeforeEach =
      content.includes("beforeEach");

    const hasIdScopedDelete =
      content.includes("inArray(tutorialSections.id, createdTutorialIds)");

    const hasBroadDelete =
      /delete\s*\([\s\S]{0,300}subtopicId/.test(content);

    add(
      "G4-ISO-TRACK-" + file.length,
      `Tracks created tutorial IDs: ${file}`,
      tracksCreatedIds ? "PASS" : "FAIL",
    );

    add(
      "G4-ISO-RESET-" + file.length,
      `Resets test tracking per test: ${file}`,
      hasBeforeEach ? "PASS" : "FAIL",
    );

    add(
      "G4-ISO-DELETE-" + file.length,
      `Uses ID-scoped cleanup: ${file}`,
      hasIdScopedDelete ? "PASS" : "FAIL",
    );

    add(
      "G4-ISO-BROAD-" + file.length,
      `No broad destructive cleanup: ${file}`,
      !hasBroadDelete ? "PASS" : "FAIL",
    );
  }
}

function checkSchema() {
  const schemaPath =
    "packages/db-tutorial/src/schema/tutorial-sections.ts";

  if (!existsSync(resolve(schemaPath))) {
    add("G4-DB-001", "V2 schema exists", "FAIL");
    return;
  }

  const content = read(schemaPath);

  add(
    "G4-DB-002",
    "TutorialDocument typed JSONB",
    content.includes(
      "$type<TutorialDocument>()",
    )
      ? "PASS"
      : "FAIL",
  );

  add(
    "G4-DB-003",
    "V2 unique identity exists",
    content.includes(
      "uqTutorialV2Identity",
    ) &&
      content.includes("subtopicId") &&
      content.includes("brandId")
      ? "PASS"
      : "FAIL",
  );

  add(
    "G4-DB-004",
    "Legacy section_type removed",
    !content.includes("section_type")
      ? "PASS"
      : "FAIL",
  );

  add(
    "G4-DB-005",
    "Legacy tutorial difficulty removed",
    !content.includes(
      "difficulty: integer",
    ) &&
      !content.includes(
        "tutorialDifficultyEnum",
      )
      ? "PASS"
      : "FAIL",
  );
}

function printReport() {
  console.log("\n======================================");
  console.log("GATE 4 POST-MERGE HARDENING AUDIT");
  console.log("======================================\n");

  for (const result of results) {
    console.log(
      `[${result.status}] ${result.id} — ${result.description}`,
    );

    if (result.details) {
      console.log(`       ${result.details}`);
    }
  }

  const failures = results.filter(
    (r) => r.status === "FAIL",
  );

  const warnings = results.filter(
    (r) => r.status === "WARN",
  );

  console.log("\n======================================");
  console.log(`FAILURES : ${failures.length}`);
  console.log(`WARNINGS : ${warnings.length}`);
  console.log(`CHECKS   : ${results.length}`);
  console.log("======================================\n");

  if (failures.length > 0) {
    console.log("GATE 4 STATIC AUDIT: FAIL");
    process.exitCode = 1;
  } else {
    console.log("GATE 4 STATIC AUDIT: PASS");
  }
}

checkGitBaseline();
checkProtectedFiles();
checkMergeIntegrity();
checkRoutes();
checkTestIsolation();
checkSchema();
printReport();
