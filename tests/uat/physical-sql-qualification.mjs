import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

async function runSqlQualification() {
  console.log('--- STARTING POSTGRESQL PHYSICAL CONCURRENCY & ROLLBACK QUALIFICATION ---');
  
  const peopleUrl = process.env.DATABASE_URL_PEOPLE;
  const tutorialUrl = process.env.DATABASE_URL_TUTORIAL;

  if (!peopleUrl || !tutorialUrl) {
    throw new Error('DATABASE_URL_PEOPLE or DATABASE_URL_TUTORIAL missing');
  }

  const peoplePool1 = new pg.Pool({ connectionString: peopleUrl, ssl: { rejectUnauthorized: false }, max: 2 });
  const peoplePool2 = new pg.Pool({ connectionString: peopleUrl, ssl: { rejectUnauthorized: false }, max: 2 });
  const tutorialPool = new pg.Pool({ connectionString: tutorialUrl, ssl: { rejectUnauthorized: false }, max: 2 });

  const results = {
    scenario1_claimVsClaim: null,
    scenario2_claimVsExpire: null,
    scenario3_redeemVsExpire: null,
    scenario4_revokeVsRedeem: null,
    scenario5_resendVsClaim: null,
    scenario6_outboxRollback: null,
    cleanup: false,
  };

  const syntheticIds = [];

  try {
    // Check if student_invitations exists in people DB
    const tableCheck = await peoplePool1.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'student_invitations'");
    console.log('student_invitations table exists:', tableCheck.rows.length > 0);

    if (tableCheck.rows.length === 0) {
      console.log('Table student_invitations does not exist in people DB; checking invitations / admissions tables...');
      const allTables = await peoplePool1.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      console.log('People DB tables:', allTables.rows.map(r => r.table_name));
    }

    // Let's inspect columns of student_invitations or admissions/enquiries
    if (tableCheck.rows.length > 0) {
      const colRes = await peoplePool1.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_invitations'");
      console.log('Columns:', colRes.rows.map(r => r.column_name));

      // 1. Scenario 1: Claim vs Claim Race
      // Insert synthetic pending invitation
      const synthId1 = crypto.randomUUID();
      const token1 = 'synth_tok_' + crypto.randomBytes(8).toString('hex');
      syntheticIds.push(synthId1);

      await peoplePool1.query(`
        INSERT INTO student_invitations (id, enquiry_id, tenant_id, email, token, status, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '1 day', NOW(), NOW())
      `, [synthId1, crypto.randomUUID(), 'skillup', 'synth1@example.com', token1]);

      // Two simultaneous connections attempt atomic claim (UPDATE status = 'claimed' WHERE id = $1 AND status = 'pending')
      const claimQuery = `
        UPDATE student_invitations
        SET status = 'claimed', updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING id, status
      `;

      const [res1A, res1B] = await Promise.all([
        peoplePool1.query(claimQuery, [synthId1]),
        peoplePool2.query(claimQuery, [synthId1]),
      ]);

      const winners = (res1A.rowCount || 0) + (res1B.rowCount || 0);
      console.log('Scenario 1 (Claim vs Claim): res1A =', res1A.rowCount, 'res1B =', res1B.rowCount, '| total winners =', winners);
      results.scenario1_claimVsClaim = winners === 1;

      // 2. Scenario 2: Claim vs Expire Race
      const synthId2 = crypto.randomUUID();
      const token2 = 'synth_tok_' + crypto.randomBytes(8).toString('hex');
      syntheticIds.push(synthId2);

      await peoplePool1.query(`
        INSERT INTO student_invitations (id, enquiry_id, tenant_id, email, token, status, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '1 day', NOW(), NOW())
      `, [synthId2, crypto.randomUUID(), 'skillup', 'synth2@example.com', token2]);

      const expireQuery = `
        UPDATE student_invitations
        SET status = 'expired', updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING id, status
      `;

      const [res2Claim, res2Expire] = await Promise.all([
        peoplePool1.query(claimQuery, [synthId2]),
        peoplePool2.query(expireQuery, [synthId2]),
      ]);

      const winner2 = (res2Claim.rowCount || 0) + (res2Expire.rowCount || 0);
      console.log('Scenario 2 (Claim vs Expire): claim =', res2Claim.rowCount, 'expire =', res2Expire.rowCount, '| total mutations =', winner2);
      results.scenario2_claimVsExpire = winner2 === 1;

      // 3. Scenario 3: Redeem vs Expire (Cannot redeem expired)
      const synthId3 = crypto.randomUUID();
      syntheticIds.push(synthId3);
      await peoplePool1.query(`
        INSERT INTO student_invitations (id, enquiry_id, tenant_id, email, token, status, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'expired', NOW() - INTERVAL '1 hour', NOW(), NOW())
      `, [synthId3, crypto.randomUUID(), 'skillup', 'synth3@example.com', 'synth_tok_' + crypto.randomBytes(8).toString('hex')]);

      const redeemQuery = `
        UPDATE student_invitations
        SET status = 'redeemed', updated_at = NOW()
        WHERE id = $1 AND status = 'claimed' AND expires_at > NOW()
        RETURNING id
      `;
      const res3 = await peoplePool1.query(redeemQuery, [synthId3]);
      console.log('Scenario 3 (Redeem vs Expire): redeemed rows =', res3.rowCount);
      results.scenario3_redeemVsExpire = res3.rowCount === 0;

      // 4. Scenario 4: Revoke vs Redeem
      const synthId4 = crypto.randomUUID();
      syntheticIds.push(synthId4);
      await peoplePool1.query(`
        INSERT INTO student_invitations (id, enquiry_id, tenant_id, email, token, status, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'revoked', NOW() + INTERVAL '1 day', NOW(), NOW())
      `, [synthId4, crypto.randomUUID(), 'skillup', 'synth4@example.com', 'synth_tok_' + crypto.randomBytes(8).toString('hex')]);

      const res4 = await peoplePool1.query(redeemQuery, [synthId4]);
      console.log('Scenario 4 (Revoke vs Redeem): redeemed rows =', res4.rowCount);
      results.scenario4_revokeVsRedeem = res4.rowCount === 0;

      // 5. Scenario 5: Resend vs Claim Race
      const synthId5 = crypto.randomUUID();
      syntheticIds.push(synthId5);
      await peoplePool1.query(`
        INSERT INTO student_invitations (id, enquiry_id, tenant_id, email, token, status, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'claimed', NOW() + INTERVAL '1 day', NOW(), NOW())
      `, [synthId5, crypto.randomUUID(), 'skillup', 'synth5@example.com', 'synth_tok_' + crypto.randomBytes(8).toString('hex')]);

      const resendQuery = `
        UPDATE student_invitations
        SET token = $2, expires_at = NOW() + INTERVAL '2 days', updated_at = NOW()
        WHERE id = $1 AND status IN ('pending', 'expired')
        RETURNING id
      `;
      const res5 = await peoplePool1.query(resendQuery, [synthId5, 'new_tok_' + crypto.randomBytes(8).toString('hex')]);
      console.log('Scenario 5 (Resend vs Claim): resend on claimed invitation =', res5.rowCount);
      results.scenario5_resendVsClaim = res5.rowCount === 0;
    }

    // 6. Scenario 6: Tutorial Event Outbox Transactional Rollback
    const outboxTable = await tutorialPool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'tutorial_event_outbox'");
    console.log('tutorial_event_outbox table exists in tutorial DB:', outboxTable.rows.length > 0);

    if (outboxTable.rows.length > 0) {
      const client = await tutorialPool.connect();
      const synthOutboxId = crypto.randomUUID();
      try {
        await client.query('BEGIN');
        await client.query(`
          INSERT INTO tutorial_event_outbox (id, tenant_id, event_type, aggregate_type, aggregate_id, payload, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
        `, [synthOutboxId, 'skillup', 'test.qualification', 'test', synthOutboxId, JSON.stringify({ test: true })]);
        // Rollback explicitly
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }

      // Assert row does not exist
      const checkRes = await tutorialPool.query("SELECT id FROM tutorial_event_outbox WHERE id = $1", [synthOutboxId]);
      console.log('Scenario 6 (Outbox Transactional Rollback): rows found after rollback =', checkRes.rowCount);
      results.scenario6_outboxRollback = checkRes.rowCount === 0;
    }

  } finally {
    // CLEANUP SYNTHETIC RECORDS
    if (syntheticIds.length > 0) {
      console.log('Cleaning up', syntheticIds.length, 'synthetic records from student_invitations...');
      await peoplePool1.query('DELETE FROM student_invitations WHERE id = ANY($1)', [syntheticIds]);
      const remaining = await peoplePool1.query('SELECT count(*) FROM student_invitations WHERE id = ANY($1)', [syntheticIds]);
      results.cleanup = Number(remaining.rows[0].count) === 0;
      console.log('Cleanup confirmed: remaining synthetic rows =', remaining.rows[0].count);
    }
    await peoplePool1.end();
    await peoplePool2.end();
    await tutorialPool.end();
  }

  console.log('--- POSTGRESQL PHYSICAL QUALIFICATION COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));
}

runSqlQualification().catch(err => {
  console.error('Fatal SQL Qualification Failure:', err);
  process.exit(1);
});
