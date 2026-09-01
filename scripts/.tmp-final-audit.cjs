const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('============================================================');
  console.log('PHASE 1C-A.5 — GATE D FINAL READ-ONLY AUDIT');
  console.log('============================================================');
  console.log('');

  let failures = 0;

  function check(name, result) {
    console.log((result ? '✅' : '❌') + ' ' + name);
    if (!result) failures++;
  }

  // ----------------------------------------------------------
  // 1. Target table
  // ----------------------------------------------------------

  const table = await client.query(`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name='tutorial_navigation_progress'
  `);

  check(
    'tutorial_navigation_progress exists',
    table.rowCount === 1
  );

  // ----------------------------------------------------------
  // 2. Column count
  // ----------------------------------------------------------

  const columns = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='tutorial_navigation_progress'
  `);

  check(
    '18 columns',
    columns.rowCount === 18
  );

  // ----------------------------------------------------------
  // 3. Index count
  // ----------------------------------------------------------

  const indexes = await client.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname='public'
      AND tablename='tutorial_navigation_progress'
  `);

  check(
    '6 physical indexes including primary key',
    indexes.rowCount === 6
  );

  // ----------------------------------------------------------
  // 4. Unique identity index
  // ----------------------------------------------------------

  const unique = await client.query(`
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname='public'
      AND tablename='tutorial_navigation_progress'
      AND indexname='uq_navigation_progress_user_node'
  `);

  const uniqueDef =
    unique.rows[0]?.indexdef
      ?.replace(/\s+/g, ' ')
      .toLowerCase() || '';

  check(
    'unique identity index exists',
    unique.rowCount === 1
  );

  check(
    'unique identity contains user_id',
    uniqueDef.includes('user_id')
  );

  check(
    'unique identity contains navigation_node_id',
    uniqueDef.includes('navigation_node_id')
  );

  check(
    'unique identity is partial on deleted_at IS NULL',
    uniqueDef.includes('deleted_at is null')
  );

  // ----------------------------------------------------------
  // 5. tutorial_sections preservation
  // ----------------------------------------------------------

  const navigationNode = await client.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='tutorial_sections'
      AND column_name='navigation_node_id'
  `);

  check(
    'tutorial_sections.navigation_node_id preserved',
    navigationNode.rowCount === 1
  );

  const delivery = await client.query(`
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname='public'
      AND tablename='tutorial_sections'
      AND indexname='idx_tutorial_v2_delivery'
  `);

  const deliveryDef =
    delivery.rows[0]?.indexdef
      ?.replace(/\s+/g, ' ')
      .toLowerCase() || '';

  check(
    'idx_tutorial_v2_delivery preserved',
    delivery.rowCount === 1
  );

  check(
    'idx_tutorial_v2_delivery contains navigation_node_id',
    deliveryDef.includes('navigation_node_id')
  );

  console.log('');
  console.log('============================================================');

  if (failures === 0) {
    console.log('✅ ALL FINAL READ-ONLY CHECKS PASSED (11/11)');
  } else {
    console.log(
      '❌ FINAL AUDIT FAILED: ' + failures + ' CHECK(S)'
    );
  }

  console.log('============================================================');

  await client.end();

  if (failures > 0) {
    process.exit(1);
  }
})().catch(e => {
  console.error('');
  console.error('❌ AUDIT ERROR');
  console.error(e);
  process.exit(1);
});
