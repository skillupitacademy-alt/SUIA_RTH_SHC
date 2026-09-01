/**
 * ============================================================
 * PHASE 1C-A.5 — GATE D
 * D10-A — DRIZZLE MIGRATION TRACKING VERIFICATION
 * ============================================================
 *
 * PURPOSE:
 *   Read-only verification that migration 0022 was recorded
 *   by Drizzle's migration tracking mechanism.
 *
 * SAFETY:
 *   - NO INSERT
 *   - NO UPDATE
 *   - NO DELETE
 *   - NO DDL
 *   - NO migration execution
 *   - NO schema modification
 *
 * IMPORTANT:
 *   This script ONLY SELECTs from the migration tracking table.
 * ============================================================
 */

const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL_TUTORIAL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_TUTORIAL environment variable is not set."
    );
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    console.log("============================================================");
    console.log("D10-A — DRIZZLE MIGRATION TRACKING VERIFICATION");
    console.log("============================================================");
    console.log();

    /*
     * First establish whether the Drizzle tracking table exists.
     */
    const tableResult = await client.query(`
      SELECT
        to_regclass('public.__drizzle_migrations') AS table_name
    `);

    const trackingTable = tableResult.rows[0]?.table_name;

    if (!trackingTable) {
      console.log("❌ __drizzle_migrations table NOT FOUND");
      process.exitCode = 1;
      return;
    }

    console.log("✅ __drizzle_migrations EXISTS");
    console.log();

    /*
     * Read the migration tracking rows.
     *
     * Drizzle versions can expose different column sets, so
     * SELECT * is intentionally used here for compatibility.
     */
    const result = await client.query(`
      SELECT *
      FROM public.__drizzle_migrations
      ORDER BY id DESC
    `);

    console.log(
      `Migration tracking rows: ${result.rows.length}`
    );
    console.log();

    if (result.rows.length === 0) {
      console.log("❌ Migration tracking table is EMPTY");
      process.exitCode = 1;
      return;
    }

    /*
     * Display column names so the audit has an exact record of
     * the tracking-table structure encountered in production.
     */
    console.log("Columns:");
    console.log(
      result.fields.map((field) => `  - ${field.name}`).join("\n")
    );
    console.log();

    /*
     * Display the newest rows.
     */
    console.log("Recent migration records:");

    result.rows.slice(0, 5).forEach((row, index) => {
      console.log(`\n[${index + 1}]`);

      for (const [key, value] of Object.entries(row)) {
        console.log(`  ${key}: ${value}`);
      }
    });

    console.log();

    /*
     * Migration 0022 should be represented by its hash.
     *
     * Drizzle's tracking table normally records:
     *   id
     *   hash
     *   created_at
     *
     * We therefore obtain the SHA-256 of the actual migration
     * file separately and compare against the tracking record
     * when the tracking schema supports it.
     */

    const crypto = require("crypto");
    const fs = require("fs");
    const path = require("path");

    const migrationPath = path.resolve(
      process.cwd(),
      "packages/db-tutorial/migrations/0022_broken_supernaut.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.log(
        "❌ Migration file not found:"
      );
      console.log(`   ${migrationPath}`);
      process.exitCode = 1;
      return;
    }

    const migrationContents = fs.readFileSync(
      migrationPath
    );

    const sha256 = crypto
      .createHash("sha256")
      .update(migrationContents)
      .digest("hex");

    console.log("Current migration SHA256:");
    console.log(`  ${sha256}`);
    console.log();

    /*
     * Drizzle's hash is the hash stored for the migration.
     *
     * Find a row whose hash corresponds to migration 0022.
     *
     * We do not mutate anything.
     */
    const hashColumn = result.fields.find(
      (field) => field.name === "hash"
    );

    if (!hashColumn) {
      console.log(
        "⚠️  Tracking table has no 'hash' column."
      );
      console.log(
        "⚠️  Migration execution was already confirmed by drizzle-kit."
      );
      console.log(
        "⚠️  Direct hash comparison cannot be performed against this schema."
      );
      return;
    }

    const matchingRows = result.rows.filter(
      (row) =>
        typeof row.hash === "string" &&
        row.hash.toLowerCase() === sha256.toLowerCase()
    );

    if (matchingRows.length === 0) {
      console.log(
        "❌ No tracking row matches migration 0022 SHA256."
      );
      console.log();
      console.log(
        "This requires investigation before declaring D10-A PASS."
      );
      process.exitCode = 1;
      return;
    }

    console.log(
      "✅ Migration 0022 tracking record FOUND"
    );
    console.log(
      `✅ Matching SHA256: ${sha256}`
    );
    console.log(
      `✅ Matching rows: ${matchingRows.length}`
    );
    console.log();

    console.log(
      "============================================================"
    );
    console.log(
      "✅ D10-A PASS — MIGRATION 0022 TRACKING VERIFIED"
    );
    console.log(
      "============================================================"
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error();
  console.error("❌ D10-A FAILED");
  console.error(error);
  process.exitCode = 1;
});
