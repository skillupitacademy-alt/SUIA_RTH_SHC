"""Additional offline positive and recovery-path containment controls."""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("batch08_probe", ROOT / "audit/W1.2_Batch_08_Sol_Probe.py")
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def main():
    try:
        helper.extend(
            "apps/api-server/src/app/api/tutorial/progress/__tests__/batch-08-identity-binding.test.ts",
            "sol-b08-containment.test.ts",
            """
  it('SOL-CONTAIN-E positive owner GET through proxy preserves data', async () => {
    const req = new NextRequest(`https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`, {
      headers: {authorization: `Bearer ${victimToken}`, 'x-user-id': VICTIM_USER_ID, 'x-brand': 'skillup'},
    });
    expect((await proxy(req)).headers.get('x-middleware-next')).toBe('1');
    const response = await GET(req);
    expect(response.status).toBe(200);
    expect((await response.json()).data.blocksCompleted).toEqual(['concept', 'example']);
  });
  it('SOL-CONTAIN-E positive owner POST through proxy preserves writes', async () => {
    const req = new NextRequest('https://skillup.test/api/tutorial/progress', {
      method: 'POST', headers: {
        authorization: `Bearer ${victimToken}`, host: 'skillup.test', origin: 'https://skillup.test',
        'x-user-id': VICTIM_USER_ID, 'x-brand': 'skillup', 'content-type': 'application/json',
        'x-csrf-token': 'sol-nonce', cookie: 'csrfToken=sol-nonce',
      }, body: JSON.stringify({subtopicId: SUBTOPIC_ID, blockType: 'code', status: 'viewed'}),
    });
    expect((await proxy(req)).headers.get('x-middleware-next')).toBe('1');
    expect((await POST(req)).status).toBe(200);
    expect(mockStore.get(`skillup:${VICTIM_USER_ID}:${SUBTOPIC_ID}`)?.blocksCompleted.includes('code')).toBe(true);
  });
  it('SOL-CONTAIN-E invalid token fails closed', async () => {
    const req = new NextRequest(`https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`, {
      headers: {authorization: 'Bearer sol.invalid.signature', 'x-user-id': VICTIM_USER_ID},
    });
    expect((await GET(req)).status).toBe(401);
  });
  it('SOL-CONTAIN-E signed non-tenant user-class token fails closed', async () => {
    const token = await testTokenService.generateAccessToken({
      userId: VICTIM_USER_ID, brand: 'skillhubcore', tokenType: 'user', aud: 'user', isAdmin: false,
    });
    const req = new NextRequest(`https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`, {
      headers: {authorization: `Bearer ${token}`},
    });
    expect((await GET(req)).status).toBe(403);
  });
""", "import { proxy } from '@/proxy';\n",
        )
        helper.extend(
            "apps/api-server/src/app/api/export/status/[jobId]/__tests__/batch-08-ownership.test.ts",
            "sol-b08-containment.test.ts",
            """
  it('SOL-CONTAIN-F stale non-owner denied before side effects', async () => {
    const job = mockJobs.get(JOB_ID);
    job.status = 'processing';
    job.updatedAt = new Date(Date.now() - 600000);
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      headers: {authorization: `Bearer ${attackerToken}`},
    });
    expect((await GET(req, {params: Promise.resolve({jobId: JOB_ID})})).status).toBe(403);
    expect(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });
  it('SOL-CONTAIN-F authorized stale owner retains recovery behavior', async () => {
    const job = mockJobs.get(JOB_ID);
    job.status = 'processing';
    job.updatedAt = new Date(Date.now() - 600000);
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      headers: {authorization: `Bearer ${ownerToken}`},
    });
    const response = await GET(req, {params: Promise.resolve({jobId: JOB_ID})});
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('completed');
    expect(JobsService.updateJobStatus).toHaveBeenCalledTimes(1);
  });
  it('SOL-CONTAIN-F valid internal caller retains access', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      headers: {'x-internal-key': 'sol-b08-disposable-internal-key'},
    });
    expect((await GET(req, {params: Promise.resolve({jobId: JOB_ID})})).status).toBe(200);
  });
""",
            "import { JobsService } from '@/modules/system/jobs.service';\nimport { storage } from '@/lib/storage';\nimport { redis } from '@/lib/redis';\n",
        )
        env = os.environ.copy()
        for key in list(env):
            if any(part in key.upper() for part in ("DATABASE_URL", "REDIS", "UPSTASH", "NEON")):
                env.pop(key, None)
        env.update(JWT_SECRET="sol-b08-disposable-access-key-000000",
                   REFRESH_TOKEN_SECRET="sol-b08-disposable-refresh-key-0000",
                   ADMIN_JWT_SECRET="sol-b08-disposable-admin-key-000000",
                   INTERNAL_API_KEY="sol-b08-disposable-internal-key")
        command = ["node", "node_modules/vitest/vitest.mjs", "run", "--config", "vitest.config.ts"]
        command += [str(path.relative_to(ROOT)) for path in helper.created] + ["-t", "SOL-CONTAIN"]
        result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True,
                                text=True, encoding="utf-8", errors="replace", timeout=180)
        output = re.sub(r"\x1b\[[0-9;]*m", "", result.stdout + "\n" + result.stderr)
        print(json.dumps({"exit_code": result.returncode,
            "summary": [line.strip() for line in output.splitlines()
                        if re.match(r"\s*(Test Files|Tests|Duration)\s", line)],
            "failures": [line.strip() for line in output.splitlines()
                         if line.strip().startswith(("FAIL ", "AssertionError:"))],
            "raw_output_suppressed": True}))
        return result.returncode
    finally:
        for path in helper.created:
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
