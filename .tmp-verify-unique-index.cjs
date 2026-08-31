/**
 * ============================================================
 * PHASE 1C-A.5 — GATE D
 * D8 — UNIQUE INDEX DEFINITION VERIFICATION
 * ============================================================
 *
 * READ ONLY.
 *
 * Expected:
 *
 * UNIQUE INDEX
 *   uq_navigation_progress_user_node
 *
 * ON:
 *   tutorial_navigation_progress
 *
 * COLUMNS:
 *   user_id
 *   navigation_node_id
 *
 * PREDICATE:
 *   deleted_at IS NULL
 *
 * NO DATABASE MODIFICATIONS.
 * ============================================================
 */

const { Client } = require("pg");

async function main() {
  const connectionString =
    process.env.DATABASE_URL_TUTORIAL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_TUTORIAL is not configured."
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
    console.log("D8 — UNIQUE INDEX VERIFICATION");
    console.log("============================================================");
    console.log();

    const result = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_navigation_progress'
        AND indexname = 'uq_navigation_progress_user_node'
    `);

    if (result.rows.length === 0) {
      console.log(
        "❌ uq_navigation_progress_user_node NOT FOUND"
      );

      process.exitCode = 1;
      return;
    }

    const row = result.rows[0];

    console.log("✅ Index EXISTS");
    console.log();
    console.log("Index definition:");
    console.log(row.indexdef);
    console.log();

    /*
     * Normalize PostgreSQL output for semantic checks.
     */
    const definition = row.indexdef
      .replace(/\s+/g, " ")
      .toLowerCase();

    const checks = {
      unique:
        definition.includes("create unique index"),

      table:
        definition.includes(
          "on public.tutorial_navigation_progress"
        ),

      userId:
        definition.includes("user_id"),

      navigationNodeId:
        definition.includes("navigation_node_id"),

      predicate:
        definition.includes("where (deleted_at is null)") ||
        definition.includes(
          "where deleted_at is null"
        ),
    };

    console.log("Definition checks:");

    for (const [name, passed] of Object.entries(checks)) {
      console.log(
        `  ${passed ? "✅" : "❌"} ${name}`
      );
    }

    console.log();

    /*
     * Verify all required properties.
     */
    const allPassed =
      Object.values(checks).every(Boolean);

    if (!allPassed) {
      console.log(
        "❌ UNIQUE INDEX DEFINITION IS NOT CORRECT"
      );

      process.exitCode = 1;
      return;
    }

    console.log(
      "============================================================"
    );
    console.log(
      "✅ D8 PASS — UNIQUE INDEX VERIFIED"
    );
    console.log(
      "============================================================"
    );
    console.log();
    console.log(
      "Expected identity:"
    );
    console.log(
      "  UNIQUE (user_id, navigation_node_id)"
    );
    console.log(
      "  WHERE deleted_at IS NULL"
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error();
  console.error("❌ D8 FAILED");
  console.error(error);
  process.exitCode = 1;
});
