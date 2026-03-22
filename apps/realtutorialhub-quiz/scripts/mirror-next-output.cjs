#!/usr/bin/env node
/**
 * Workaround for Vercel output path misconfiguration.
 *
 * Some Vercel projects have the Output Directory set to "apps/web-app/.next"
 * while the project root is already "apps/web-app", which makes the platform
 * look for ".next" at "<root>/apps/web-app/.next". This script mirrors the
 * real build output (apps/web-app/.next) into that nested path so deployment
 * succeeds even with the mis-set directory.
 */
const fs = require("fs");
const path = require("path");

async function main() {
  const root = process.cwd(); // apps/web-app
  const source = path.join(root, ".next");
  const nestedDir = path.join(root, "apps", "web-app");
  const target = path.join(nestedDir, ".next");

  if (!fs.existsSync(source)) {
    console.error("[mirror-next-output] Source .next folder not found; skipping.");
    return;
  }

  await fs.promises.mkdir(nestedDir, { recursive: true });

  // Remove any stale copy
  if (fs.existsSync(target)) {
    await fs.promises.rm(target, { recursive: true, force: true });
  }

  console.log(`[mirror-next-output] Copying ${source} -> ${target}`);
  await fs.promises.cp(source, target, { recursive: true, dereference: true });
}

main().catch((err) => {
  console.error("[mirror-next-output] Failed:", err);
  process.exit(1);
});
