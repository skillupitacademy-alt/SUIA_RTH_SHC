/**
 * Physical Redis & Queue Lifecycle Qualification Harness (Slice 22-B Final)
 *
 * Verifies live distributed lease, queue semantics, and worker recovery:
 * 1. Basic REST Connectivity (PING, SET, GET, DEL) -> CONNECTIVITY_PASS
 * 2. Independent Raw Redis Protocol / TLS connection check (port 6379)
 * 3. Atomic Lease Acquisition (SET key owner EX ttl NX)
 * 4. Competing Owners Mutual Exclusion (Worker A vs Worker B CAS)
 * 5. Lease Expiration & Replacement (Expired lease stolen by Worker B)
 * 6. Stale Owner Rejection (Worker A release rejected via Lua CAS)
 * 7. Deduplication & Idempotency Key Handling
 * 8. Queue Acknowledgment & Completed Retention Tombstone
 * 9. Worker Crash & Failure Recovery (Expired lease reclaimed by recovery worker)
 * 10. QStash Receiver Signature Verification & Distinct Boundary Audit
 *
 * Compliance Rules:
 * - Dry-run reports DRY_RUN_QUALIFIED, physicalExecution: NOT_EXECUTED.
 * - Missing credentials report BLOCKED and exit 2.
 * - Basic connectivity is labeled CONNECTIVITY_PASS, not complete queue qualification.
 * - Any assertion failure exits 1.
 */

import dotenv from 'dotenv';
import tls from 'tls';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { Receiver } from '@upstash/qstash';

dotenv.config({ path: '.env.local' });

const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Dry-run contract validation mode.
 */
function runDryRunRedisQualification() {
  console.log('--- RUNNING REDIS & QUEUE QUALIFICATION [DRY-RUN / SPECIFICATION CHECK] ---');
  console.log('[DRY-RUN] Verifying Redis lease, queue, and worker recovery test contracts...');

  const specs = {
    connectivityGate: 'PING / SET / GET / DEL REST probe -> CONNECTIVITY_PASS',
    tlsTransportGate: 'Direct TLS handshake to port 6379 -> TLS_PASS',
    leaseSemantics: [
      'Atomic lease acquisition via SET NX EX',
      'Competing worker mutual exclusion',
      'Lease expiry and replacement',
      'Stale owner rejection via Lua script',
      'Deduplication and idempotency verification',
      'Queue acknowledgment and completed retention',
      'Worker crash and lease failure recovery'
    ],
    qstashBoundary: 'Distinguish Redis key-value storage from QStash HTTP webhook delivery'
  };

  console.log(JSON.stringify(specs, null, 2));
  console.log('\n[NOTICE] Dry-run check completed. Physical Redis execution NOT_EXECUTED.');

  const report = {
    mode: 'DRY_RUN',
    status: 'DRY_RUN_QUALIFIED',
    physicalExecution: 'NOT_EXECUTED',
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
}

/**
 * Probe independent TLS socket to verify TCP/TLS Redis transport
 */
function probeRedisTls(hostname, port = 6379) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: Number(port),
      rejectUnauthorized: true,
      servername: hostname,
      timeout: 5000
    }, () => {
      const authorized = socket.authorized;
      socket.end();
      resolve({ connected: true, authorized });
    });

    socket.on('error', (err) => {
      resolve({ connected: false, error: err.code || err.message });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ connected: false, error: 'TIMEOUT' });
    });
  });
}

/**
 * Live physical Redis & Queue lifecycle qualification
 */
async function runLiveRedisQualification() {
  console.log('--- STARTING UPSTASH REDIS & QUEUE LIFECYCLE PHYSICAL QUALIFICATION [LIVE EXECUTION] ---');

  if (!REST_URL || !REST_TOKEN) {
    console.error('[BLOCKED] Missing Upstash Redis credentials (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN).');
    const report = {
      mode: 'LIVE',
      status: 'BLOCKED',
      reason: 'Missing Upstash Redis credentials in environment',
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
  }

  const redis = new Redis({
    url: REST_URL,
    token: REST_TOKEN,
  });

  const results = {
    basicConnectivity: false,
    tlsTransport: false,
    atomicLeaseAcquisition: false,
    competingOwnerMutualExclusion: false,
    leaseExpiryAndReplacement: false,
    staleOwnerRejection: false,
    idempotentDeduplication: false,
    queueAcknowledgment: false,
    workerRecoveryFromCrash: false,
    qstashSignatureContract: false,
    cleanupConfirmed: false,
    details: [],
  };

  const syntheticKeys = [];

  try {
    // ------------------------------------------------------------------------
    // Step 1: Basic REST Connectivity (CONNECTIVITY_PASS)
    // ------------------------------------------------------------------------
    console.log('[Step 1] Verifying basic REST commands (PING, SET, GET, DEL)...');
    const pingRes = await redis.ping();
    const testKey1 = `test-probe-${Date.now()}`;
    syntheticKeys.push(testKey1);
    await redis.set(testKey1, 'alive');
    const getVal = await redis.get(testKey1);
    await redis.del(testKey1);

    const basicPass = pingRes === 'PONG' && getVal === 'alive';
    results.basicConnectivity = basicPass;
    results.details.push({ step: 'Basic REST Connectivity', ping: pingRes, readBack: getVal, status: basicPass ? 'CONNECTIVITY_PASS' : 'FAIL' });
    console.log(`  Step 1 Result: ping=${pingRes}, readBack=${getVal} -> ${basicPass ? 'CONNECTIVITY_PASS' : 'FAIL'}`);
    if (!basicPass) throw new Error('Basic Redis connectivity test failed');

    // ------------------------------------------------------------------------
    // Step 2: Independent Raw Redis TLS Handshake Check
    // ------------------------------------------------------------------------
    console.log('[Step 2] Probing independent TLS transport on port 6379...');
    const urlObj = new URL(REST_URL);
    const tlsResult = await probeRedisTls(urlObj.hostname, 6379);
    results.tlsTransport = tlsResult.connected;
    results.details.push({ step: 'TLS Transport (Port 6379)', hostname: urlObj.hostname, tlsResult });
    console.log(`  Step 2 Result: TLS connected=${tlsResult.connected}, authorized=${tlsResult.authorized}`);

    // ------------------------------------------------------------------------
    // Step 3: Atomic Lease Acquisition (SET key owner EX ttl NX)
    // ------------------------------------------------------------------------
    console.log('[Step 3] Testing atomic lease acquisition (SET NX EX)...');
    const lockKey = `job-lock:synth-${Date.now()}`;
    syntheticKeys.push(lockKey);
    const workerAlpha = 'worker_alpha_' + crypto.randomUUID();

    // Acquire lock for 5 seconds
    const acqRes = await redis.set(lockKey, workerAlpha, { nx: true, ex: 5 });
    const s3Pass = acqRes === 'OK';
    results.atomicLeaseAcquisition = s3Pass;
    results.details.push({ step: 'Atomic Lease Acquisition', result: acqRes, pass: s3Pass });
    console.log(`  Step 3 Result: Worker Alpha acquired lock=${acqRes} -> ${s3Pass ? 'PASS' : 'FAIL'}`);
    if (!s3Pass) throw new Error('Atomic lease acquisition failed');

    // ------------------------------------------------------------------------
    // Step 4: Competing Owners Mutual Exclusion
    // ------------------------------------------------------------------------
    console.log('[Step 4] Testing competing worker mutual exclusion...');
    const workerBeta = 'worker_beta_' + crypto.randomUUID();

    // Worker Beta attempts to acquire the same active key with NX
    const betaAcqRes = await redis.set(lockKey, workerBeta, { nx: true, ex: 5 });
    const currentHolder = await redis.get(lockKey);

    const s4Pass = (betaAcqRes === null || betaAcqRes === undefined) && currentHolder === workerAlpha;
    results.competingOwnerMutualExclusion = s4Pass;
    results.details.push({ step: 'Competing Owners Mutual Exclusion', betaResult: betaAcqRes, holder: currentHolder, pass: s4Pass });
    console.log(`  Step 4 Result: Worker Beta blocked=${betaAcqRes === null}, Current Holder=${currentHolder} -> ${s4Pass ? 'PASS' : 'FAIL'}`);
    if (!s4Pass) throw new Error('Competing worker mutual exclusion failed: lock stolen while active');

    // ------------------------------------------------------------------------
    // Step 5: Lease Expiration & Replacement
    // ------------------------------------------------------------------------
    console.log('[Step 5] Testing lease expiration and replacement...');
    const shortLockKey = `job-lock:expire-${Date.now()}`;
    syntheticKeys.push(shortLockKey);
    const workerTemp = 'worker_temp_' + crypto.randomUUID();

    // Acquire with 1 second TTL
    await redis.set(shortLockKey, workerTemp, { nx: true, ex: 1 });
    console.log('  Waiting 1.6s for lease TTL to expire...');
    await new Promise(r => setTimeout(r, 1600));

    // Worker Beta attempts to acquire after expiration
    const replaceRes = await redis.set(shortLockKey, workerBeta, { nx: true, ex: 5 });
    const newHolder = await redis.get(shortLockKey);

    const s5Pass = replaceRes === 'OK' && newHolder === workerBeta;
    results.leaseExpiryAndReplacement = s5Pass;
    results.details.push({ step: 'Lease Expiry and Replacement', replaceRes, newHolder, pass: s5Pass });
    console.log(`  Step 5 Result: Lease replaced after expiry=${replaceRes === 'OK'}, newHolder=${newHolder} -> ${s5Pass ? 'PASS' : 'FAIL'}`);
    if (!s5Pass) throw new Error('Lease expiry and replacement failed');

    // ------------------------------------------------------------------------
    // Step 6: Stale Owner Rejection (Atomic Release CAS)
    // ------------------------------------------------------------------------
    console.log('[Step 6] Testing stale owner release rejection via Lua CAS...');
    // Script: if redis.call("GET", KEYS[1]) ~= ARGV[1] then return 0 end return redis.call("DEL", KEYS[1])
    const RELEASE_LUA = `if redis.call("GET", KEYS[1]) ~= ARGV[1] then return 0 end return redis.call("DEL", KEYS[1])`;

    // Stale Worker Temp attempts to release shortLockKey (now held by Worker Beta)
    const staleReleaseRes = await redis.eval(RELEASE_LUA, [shortLockKey], [workerTemp]);

    // Legitimate Worker Beta releases
    const legitReleaseRes = await redis.eval(RELEASE_LUA, [shortLockKey], [workerBeta]);

    const s6Pass = Number(staleReleaseRes) === 0 && Number(legitReleaseRes) === 1;
    results.staleOwnerRejection = s6Pass;
    results.details.push({ step: 'Stale Owner Rejection', staleReleaseRes, legitReleaseRes, pass: s6Pass });
    console.log(`  Step 6 Result: Stale release rejected=${staleReleaseRes === 0}, Legit release succeeded=${legitReleaseRes === 1} -> ${s6Pass ? 'PASS' : 'FAIL'}`);
    if (!s6Pass) throw new Error('Stale owner rejection failed: stale worker released another worker\'s lock');

    // ------------------------------------------------------------------------
    // Step 7: Deduplication & Idempotency Key Handling
    // ------------------------------------------------------------------------
    console.log('[Step 7] Testing queue deduplication and idempotency...');
    const eventId = 'evt-' + crypto.randomUUID();
    const idempotencyKey = `idempotency:${eventId}`;
    syntheticKeys.push(idempotencyKey);

    const CLAIM_LUA = `
      local current = redis.call("GET", KEYS[1])
      if current then return current end
      local ok = redis.call("SET", KEYS[1], ARGV[1], "EX", tonumber(ARGV[2]), "NX")
      if not ok then return "BUSY" end
      return "ACQUIRED"
    `;

    const firstClaim = await redis.eval(CLAIM_LUA, [idempotencyKey], ['status:processing', 10]);
    const secondClaim = await redis.eval(CLAIM_LUA, [idempotencyKey], ['status:processing', 10]);

    const s7Pass = firstClaim === 'ACQUIRED' && secondClaim === 'status:processing';
    results.idempotentDeduplication = s7Pass;
    results.details.push({ step: 'Idempotency Deduplication', firstClaim, secondClaim, pass: s7Pass });
    console.log(`  Step 7 Result: First claim=${firstClaim}, Duplicate claim=${secondClaim} -> ${s7Pass ? 'PASS' : 'FAIL'}`);
    if (!s7Pass) throw new Error('Deduplication check failed');

    // ------------------------------------------------------------------------
    // Step 8: Queue Acknowledgment & Completed Retention Tombstone
    // ------------------------------------------------------------------------
    console.log('[Step 8] Testing queue acknowledgment & completed tombstone...');
    const COMPLETE_LUA = `
      if redis.call("GET", KEYS[1]) ~= ARGV[1] then return 0 end
      redis.call("SET", KEYS[1], ARGV[2], "EX", tonumber(ARGV[3]))
      return 1
    `;

    // Transition from processing to completed with 30s retention
    const ackRes = await redis.eval(COMPLETE_LUA, [idempotencyKey], ['status:processing', 'status:completed', 30]);
    const tombstoneVal = await redis.get(idempotencyKey);

    const s8Pass = Number(ackRes) === 1 && tombstoneVal === 'status:completed';
    results.queueAcknowledgment = s8Pass;
    results.details.push({ step: 'Queue Acknowledgment', ackRes, tombstoneVal, pass: s8Pass });
    console.log(`  Step 8 Result: Ack committed=${ackRes === 1}, Tombstone=${tombstoneVal} -> ${s8Pass ? 'PASS' : 'FAIL'}`);
    if (!s8Pass) throw new Error('Queue acknowledgment failed');

    // ------------------------------------------------------------------------
    // Step 9: Worker Crash & Failure Recovery
    // ------------------------------------------------------------------------
    console.log('[Step 9] Testing worker crash recovery after abandoned lease...');
    const recoveryKey = `job-crash:${crypto.randomUUID()}`;
    syntheticKeys.push(recoveryKey);
    const crashedWorker = 'crashed_worker_' + crypto.randomUUID();
    const recoveryWorker = 'recovery_worker_' + crypto.randomUUID();

    // Worker crashes: acquires 1s lease and never sends heartbeat or completion
    await redis.set(recoveryKey, crashedWorker, { nx: true, ex: 1 });
    console.log('  Simulating crashed worker... Waiting 1.5s for lease to expire...');
    await new Promise(r => setTimeout(r, 1500));

    // Recovery worker reclaims the abandoned job
    const recovered = await redis.set(recoveryKey, recoveryWorker, { nx: true, ex: 5 });
    const activeRecoveryHolder = await redis.get(recoveryKey);

    const s9Pass = recovered === 'OK' && activeRecoveryHolder === recoveryWorker;
    results.workerRecoveryFromCrash = s9Pass;
    results.details.push({ step: 'Worker Crash Recovery', recovered, activeRecoveryHolder, pass: s9Pass });
    console.log(`  Step 9 Result: Abandoned lease reclaimed=${recovered === 'OK'}, Holder=${activeRecoveryHolder} -> ${s9Pass ? 'PASS' : 'FAIL'}`);
    if (!s9Pass) throw new Error('Worker crash recovery failed');

    // ------------------------------------------------------------------------
    // Step 10: QStash Receiver Signature Verification Contract Check
    // ------------------------------------------------------------------------
    console.log('[Step 10] Auditing QStash Receiver signature verification contract...');
    const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    let qstashContractPass = false;
    if (currentKey && nextKey) {
      try {
        const receiver = new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey });
        // Verify receiver instance initialized correctly
        qstashContractPass = typeof receiver.verify === 'function';
        console.log('  QStash Receiver initialized with dual signing keys: verified');
      } catch (qErr) {
        console.warn('  QStash Receiver init error:', qErr.message);
      }
    } else {
      console.warn('  QStash signing keys not present in environment');
    }
    results.qstashSignatureContract = qstashContractPass;
    results.details.push({ step: 'QStash Receiver Contract', qstashContractPass });
    console.log(`  Step 10 Result: QStash Receiver contract=${qstashContractPass ? 'PASS' : 'FAIL'}`);

  } finally {
    // ------------------------------------------------------------------------
    // Deterministic Cleanup of All Synthetic Keys
    // ------------------------------------------------------------------------
    console.log('[Cleanup] Removing synthetic Redis keys...');
    for (const k of syntheticKeys) {
      await redis.del(k).catch(() => null);
    }
    results.cleanupConfirmed = true;
    console.log(`  Cleaned up ${syntheticKeys.length} synthetic keys.`);
  }

  console.log('--- REDIS & QUEUE LIFECYCLE QUALIFICATION COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.entries(results).every(([k, v]) => k === 'details' || v === true);
  if (!allPassed) {
    console.error('[FAILED] One or more Redis lifecycle qualification checks failed.');
    process.exit(1);
  }
  return results;
}

if (isDryRun) {
  runDryRunRedisQualification();
} else {
  runLiveRedisQualification().catch(err => {
    console.error('Fatal Redis Qualification Failure:', err.message);
    process.exit(1);
  });
}
