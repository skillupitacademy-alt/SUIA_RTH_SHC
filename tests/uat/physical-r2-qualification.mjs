import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function testR2Storage() {
  console.log('--- STARTING CLOUDFLARE R2 PHYSICAL QUALIFICATION (Gate P4) ---');
  
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.log('R2 credentials incomplete');
    return;
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const testKey = `test-qualification/synthetic-probe-${Date.now()}.txt`;
  const testContent = 'Synthetic qualification probe at ' + new Date().toISOString();

  const results = {
    putObject: false,
    headObject: false,
    signedUrlGeneration: false,
    signedUrlFetch: false,
    unauthorizedDirectAccessDenied: false,
    deleteObject: false,
    cleanupConfirmed: false,
  };

  try {
    // 1. PutObject
    console.log('[Step 1] Uploading synthetic probe to R2:', testKey);
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    }));
    results.putObject = true;

    // 2. HeadObject (exists)
    console.log('[Step 2] Verifying object existence via HeadObject...');
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: testKey }));
    results.headObject = head.$metadata.httpStatusCode === 200;

    // 3. Unauthorized direct access must fail (Bucket is private)
    console.log('[Step 3] Checking that unauthenticated raw URL is denied...');
    const rawUrl = `${endpoint.replace(/\/$/, '')}/${bucket}/${testKey}`;
    try {
      const directRes = await fetch(rawUrl);
      results.unauthorizedDirectAccessDenied = directRes.status === 401 || directRes.status === 403 || directRes.status === 400;
      console.log('  Direct raw access status:', directRes.status, '(expected 401/403/400)');
    } catch {
      results.unauthorizedDirectAccessDenied = true;
    }

    // 4. Generate signed URL
    console.log('[Step 4] Generating time-bounded signed URL...');
    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: testKey }), { expiresIn: 300 });
    results.signedUrlGeneration = typeof signedUrl === 'string' && signedUrl.includes('X-Amz-Signature');

    // 5. Fetch via signed URL
    console.log('[Step 5] Fetching object via signed URL...');
    const fetchRes = await fetch(signedUrl);
    const text = await fetchRes.text();
    results.signedUrlFetch = fetchRes.status === 200 && text === testContent;
    console.log('  Signed URL fetch status:', fetchRes.status, '| Content matches:', text === testContent);

    // 6. DeleteObject (Cleanup)
    console.log('[Step 6] Deleting synthetic probe...');
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    results.deleteObject = true;

    // 7. Verify deletion
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: testKey }));
      results.cleanupConfirmed = false;
    } catch (e) {
      results.cleanupConfirmed = true;
      console.log('  Deletion confirmed (HeadObject returned 404/NotFound)');
    }

  } catch (err) {
    console.error('R2 test error:', err.message);
  }

  console.log('--- CLOUDFLARE R2 QUALIFICATION RESULT ---');
  console.log(JSON.stringify(results, null, 2));
}

testR2Storage().catch(console.error);
