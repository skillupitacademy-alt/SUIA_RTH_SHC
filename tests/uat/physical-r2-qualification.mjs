/**
 * Cloudflare R2 Physical Qualification Harness (Slice 22-B Final / Gate P4)
 *
 * Verifies R2 storage behavior and actual application export route authorization:
 * 1. Synthetic probe PutObject to R2
 * 2. HeadObject metadata existence check
 * 3. Direct unauthenticated URL access denial (distinguishing HTTP 401/403/400 from DNS/transport error)
 * 4. Time-bounded presigned URL generation and successful fetch
 * 5. Presigned URL expiration test (expiresIn: 1, wait 2.5s, assert HTTP 401/403 denial from Cloudflare R2)
 * 6. Actual Application Export Route Authorization:
 *    - Anonymous request to /api/export/download -> HTTP 401 Unauthorized
 *    - Unauthorized / foreign-brand request to /api/export/download -> HTTP 401/403
 * 7. Object deletion and HeadObject 404 NotFound independent verification
 *
 * Compliance Rules:
 * - No locally invented simulation functions. Tests actual API routes and live provider.
 * - Dry-run reports DRY_RUN_QUALIFIED, physicalExecution: NOT_EXECUTED.
 * - Missing credentials report BLOCKED and exit 2.
 * - Any assertion failure exits 1.
 */

import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config({ path: '.env.local' });

const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

const rawApiUrl = process.env.UAT_API_SERVER_URL || 'http://localhost:3000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

/**
 * Dry-run contract validation mode.
 * Explicitly reports DRY_RUN_QUALIFIED, NOT a physical PASS.
 */
function runDryRunR2Qualification() {
  console.log('--- RUNNING CLOUDFLARE R2 QUALIFICATION [DRY-RUN / SPECIFICATION CHECK] ---');
  console.log('[DRY-RUN] Verifying Cloudflare R2 and export API route contracts...');

  const specs = {
    r2Provider: {
      endpointPattern: 'https://<account-id>.r2.cloudflarestorage.com',
      requiredOps: ['PutObjectCommand', 'HeadObjectCommand', 'GetObjectCommand', 'DeleteObjectCommand', 'getSignedUrl'],
      expirationTest: 'expiresIn: 1 -> wait 2.5s -> assert HTTP 401/403'
    },
    exportApiRoutes: {
      downloadRoute: '/api/export/download',
      anonymousRequirement: 'HTTP 401 Unauthorized',
      foreignTenantRequirement: 'HTTP 401/403 Forbidden',
      ownerRequirement: 'HTTP 200 with presigned storage stream'
    }
  };

  console.log(JSON.stringify(specs, null, 2));
  console.log('\n[NOTICE] Dry-run check completed. Physical R2 storage execution NOT_EXECUTED.');

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
 * Live physical Cloudflare R2 and Export API qualification
 */
async function runLiveR2Qualification() {
  console.log('--- STARTING CLOUDFLARE R2 & EXPORT ROUTE PHYSICAL QUALIFICATION [LIVE EXECUTION] ---');

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.error('[BLOCKED] Missing Cloudflare R2 credentials (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).');
    const report = {
      mode: 'LIVE',
      status: 'BLOCKED',
      reason: 'Missing Cloudflare R2 credentials in environment',
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const testKey = `test-qualification/synthetic-probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`;
  const testContent = 'Physical qualification probe payload at ' + new Date().toISOString();

  const results = {
    putObject: false,
    headObject: false,
    unauthorizedDirectAccessDenied: false,
    signedUrlGeneration: false,
    signedUrlFetch: false,
    signedUrlExpirationDenial: false,
    exportApiAnonymousRejection: false,
    exportApiUnauthorizedTenantRejection: false,
    deleteObject: false,
    cleanupConfirmed: false,
    details: [],
  };

  try {
    // ------------------------------------------------------------------------
    // 1. PutObject Synthetic Probe
    // ------------------------------------------------------------------------
    console.log('[Step 1] Uploading synthetic probe to R2:', testKey);
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    }));
    results.putObject = true;
    console.log('  PutObject successful');

    // ------------------------------------------------------------------------
    // 2. HeadObject Existence Check
    // ------------------------------------------------------------------------
    console.log('[Step 2] Verifying object existence via HeadObject...');
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: testKey }));
    const headPass = head.$metadata.httpStatusCode === 200;
    results.headObject = headPass;
    results.details.push({ step: 'HeadObject Check', statusCode: head.$metadata.httpStatusCode, pass: headPass });
    console.log(`  HeadObject status: ${head.$metadata.httpStatusCode} -> ${headPass ? 'PASS' : 'FAIL'}`);
    if (!headPass) throw new Error('HeadObject failed to locate uploaded probe');

    // ------------------------------------------------------------------------
    // 3. Raw Direct Access Denial (Distinguishing HTTP denial from DNS failure)
    // ------------------------------------------------------------------------
    console.log('[Step 3] Checking unauthenticated raw URL access denial by R2...');
    const rawUrl = `${endpoint.replace(/\/$/, '')}/${bucket}/${testKey}`;
    try {
      const directRes = await fetch(rawUrl);
      const isDenied = directRes.status === 401 || directRes.status === 403 || directRes.status === 400;
      results.unauthorizedDirectAccessDenied = isDenied;
      results.details.push({ step: 'Raw Access Denial', rawUrl, status: directRes.status, pass: isDenied });
      console.log(`  Raw Access HTTP Status: ${directRes.status} -> ${isDenied ? 'PASS' : 'FAIL'}`);
      if (!isDenied) throw new Error(`Raw access was not denied by R2; returned status ${directRes.status}`);
    } catch (fetchErr) {
      if (fetchErr.message && fetchErr.message.includes('not denied')) {
        throw fetchErr;
      }
      console.error('  Raw access failed due to network/DNS transport error, not verified HTTP denial:', fetchErr.code || fetchErr.message);
      results.unauthorizedDirectAccessDenied = false;
      throw new Error(`Raw access transport error: ${fetchErr.code || fetchErr.message}`);
    }

    // ------------------------------------------------------------------------
    // 4. Presigned Active URL Generation & Content Fetch
    // ------------------------------------------------------------------------
    console.log('[Step 4] Generating active presigned URL (300s)...');
    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: testKey }), { expiresIn: 300 });
    const hasSignature = typeof signedUrl === 'string' && signedUrl.includes('X-Amz-Signature');
    results.signedUrlGeneration = hasSignature;
    console.log(`  Presigned URL generated: ${hasSignature ? 'PASS' : 'FAIL'}`);
    if (!hasSignature) throw new Error('Failed to generate valid presigned URL');

    console.log('[Step 5] Fetching object via presigned URL...');
    const fetchRes = await fetch(signedUrl);
    const fetchedText = await fetchRes.text();
    const fetchPass = fetchRes.status === 200 && fetchedText === testContent;
    results.signedUrlFetch = fetchPass;
    results.details.push({ step: 'Presigned URL Fetch', status: fetchRes.status, contentMatches: fetchedText === testContent, pass: fetchPass });
    console.log(`  Presigned Fetch: status=${fetchRes.status}, contentMatches=${fetchedText === testContent} -> ${fetchPass ? 'PASS' : 'FAIL'}`);
    if (!fetchPass) throw new Error('Presigned URL fetch failed or returned incorrect content');

    // ------------------------------------------------------------------------
    // 5. Presigned URL Expiration Denial
    // ------------------------------------------------------------------------
    console.log('[Step 6] Testing presigned URL expiration denial (expiresIn: 1)...');
    const shortLivedUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: testKey }), { expiresIn: 1 });
    console.log('  Waiting 2.5s for presigned signature to expire...');
    await new Promise(r => setTimeout(r, 2500));

    const expiredRes = await fetch(shortLivedUrl);
    const expiredDenied = expiredRes.status === 401 || expiredRes.status === 403;
    results.signedUrlExpirationDenial = expiredDenied;
    results.details.push({ step: 'Presigned Expiry Denial', status: expiredRes.status, pass: expiredDenied });
    console.log(`  Expired URL Fetch Status: ${expiredRes.status} -> ${expiredDenied ? 'PASS' : 'FAIL'}`);
    if (!expiredDenied) throw new Error(`Expired presigned URL was not rejected by R2; returned status ${expiredRes.status}`);

    // ------------------------------------------------------------------------
    // 6. Actual Application Export Route Authorization Testing
    // ------------------------------------------------------------------------
    console.log(`[Step 7] Testing actual application export API route authorization (${API_BASE_URL}/api/export/download)...`);

    // Test 6A: Anonymous request must receive 401 Unauthorized
    try {
      const anonRes = await fetch(`${API_BASE_URL}/api/export/download`);
      const anonPass = anonRes.status === 401;
      results.exportApiAnonymousRejection = anonPass;
      results.details.push({ step: 'Export API Anonymous Check', status: anonRes.status, pass: anonPass });
      console.log(`  Export API Anonymous: status=${anonRes.status} (expected 401) -> ${anonPass ? 'PASS' : 'FAIL'}`);
      if (!anonPass) throw new Error(`Export API anonymous check failed: expected 401, got ${anonRes.status}`);
    } catch (apiErr) {
      console.warn(`  Export API server not reachable at ${API_BASE_URL} (${apiErr.code || apiErr.message}). Recording as offline/unreachable.`);
      results.exportApiAnonymousRejection = false;
      throw apiErr;
    }

    // Test 6B: Foreign tenant / invalid token request must receive 401 or 403
    try {
      const foreignRes = await fetch(`${API_BASE_URL}/api/export/download`, {
        headers: {
          'Authorization': 'Bearer invalid.test.token',
          'x-tenant-id': 'foreign-tenant'
        }
      });
      const foreignPass = foreignRes.status === 401 || foreignRes.status === 403;
      results.exportApiUnauthorizedTenantRejection = foreignPass;
      results.details.push({ step: 'Export API Foreign Tenant Check', status: foreignRes.status, pass: foreignPass });
      console.log(`  Export API Foreign Tenant: status=${foreignRes.status} (expected 401/403) -> ${foreignPass ? 'PASS' : 'FAIL'}`);
      if (!foreignPass) throw new Error(`Export API foreign tenant check failed: expected 401/403, got ${foreignRes.status}`);
    } catch (apiErr) {
      results.exportApiUnauthorizedTenantRejection = false;
      throw apiErr;
    }

  } finally {
    // ------------------------------------------------------------------------
    // 7. Deterministic Cleanup & Independent 404 NotFound Verification
    // ------------------------------------------------------------------------
    console.log('[Step 8] Deleting synthetic probe and verifying 404 NotFound...');
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
      results.deleteObject = true;

      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: testKey }));
        results.cleanupConfirmed = false;
        console.error('  CRITICAL: Probe object still exists in R2 bucket after delete!');
        process.exit(1);
      } catch (headErr) {
        const isNotFound = headErr.name === 'NotFound' || headErr.$metadata?.httpStatusCode === 404;
        results.cleanupConfirmed = isNotFound;
        console.log(`  Cleanup Confirmed: HeadObject returned ${headErr.name || headErr.message} (404 NotFound)`);
        if (!isNotFound) {
          throw new Error(`Unexpected error checking deletion: ${headErr.message}`);
        }
      }
    } catch (cleanupErr) {
      console.error('[FATAL CLEANUP FAILURE]', cleanupErr.message);
      results.cleanupConfirmed = false;
      process.exit(1);
    }
  }

  console.log('--- CLOUDFLARE R2 QUALIFICATION COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.entries(results).every(([k, v]) => k === 'details' || v === true);
  if (!allPassed) {
    console.error('[FAILED] One or more Cloudflare R2 qualification steps failed.');
    process.exit(1);
  }
  return results;
}

if (isDryRun) {
  runDryRunR2Qualification();
} else {
  runLiveR2Qualification().catch(err => {
    console.error('Fatal R2 Qualification Failure:', err.message);
    process.exit(1);
  });
}
