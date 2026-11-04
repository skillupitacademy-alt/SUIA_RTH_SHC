"""Offline actual-source Batch 08 controls. Raw runner output stays in memory."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
created = []


def extend(base, name, extra, imports=""):
    original = ROOT / base
    target = original.with_name(name)
    if target.exists():
        raise RuntimeError("Probe path already exists")
    prefix, suffix = original.read_text(encoding="utf-8").rsplit("});", 1)
    target.write_text(imports + prefix + extra + "\n});" + suffix, encoding="utf-8")
    created.append(target)


def main():
    try:
        extend(
            "apps/api-server/src/app/api/tutorial/progress/__tests__/batch-08-identity-binding.test.ts",
            "sol-b08-pipeline.test.ts",
            """
  it('SOL-B08-E forged GET through proxy must deny', async () => {
    const req = new NextRequest(`https://skillup.test/api/tutorial/progress?subtopicId=${SUBTOPIC_ID}`, {
      headers: {'x-user-id': VICTIM_USER_ID, 'x-brand': 'skillup'},
    });
    const gate = await proxy(req);
    expect(gate.headers.get('x-middleware-next')).toBe('1');
    const response = await GET(req);
    expect(response.status).toBe(401);
  });
  it('SOL-B08-E forged POST with valid CSRF pair must deny', async () => {
    const req = new NextRequest('https://skillup.test/api/tutorial/progress', {
      method: 'POST',
      headers: {
        host: 'skillup.test', origin: 'https://skillup.test',
        'x-user-id': VICTIM_USER_ID, 'x-brand': 'skillup',
        'content-type': 'application/json', 'x-csrf-token': 'sol-disposable-nonce',
        cookie: 'csrfToken=sol-disposable-nonce',
      },
      body: JSON.stringify({subtopicId: SUBTOPIC_ID, blockType: 'code', status: 'viewed'}),
    });
    const gate = await proxy(req);
    expect(gate.headers.get('x-middleware-next')).toBe('1');
    const response = await POST(req);
    expect.soft(response.status).toBe(401);
    expect(mockStore.get(`skillup:${VICTIM_USER_ID}:${SUBTOPIC_ID}`)?.blocksCompleted.includes('code')).toBe(false);
  });
""",
            "import { proxy } from '@/proxy';\n",
        )
        extend(
            "apps/api-server/src/app/api/export/download/__tests__/batch-08-ownership.test.ts",
            "sol-b08-collision.test.ts",
            """
  it('SOL-B08-F foreign brand colliding ID job must deny', async () => {
    const foreign = await testTokenService.generateAccessToken({
      userId: OWNER_USER_ID, roles: ['student'], brand: 'realtutorialhub', tokenType: 'user', aud: 'user',
    });
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, {
      headers: {authorization: `Bearer ${foreign}`},
    });
    expect((await GET(req)).status).toBe(403);
  });
  it('SOL-B08-F foreign brand colliding ID exam must deny', async () => {
    const foreign = await testTokenService.generateAccessToken({
      userId: OWNER_USER_ID, roles: ['student'], brand: 'realtutorialhub', tokenType: 'user', aud: 'user',
    });
    const req = new NextRequest(`https://skillup.test/api/export/download?examId=${EXAM_ID}`, {
      headers: {authorization: `Bearer ${foreign}`},
    });
    expect((await GET(req)).status).toBe(403);
  });
""",
        )
        extend(
            "apps/api-server/src/modules/auth/__tests__/batch-08-resource-guard-boundary.test.ts",
            "sol-b08-downshift.test.ts",
            """
  it('SOL-B08-G explicit bad internal key plus real learner credential must deny', async () => {
    const token = await createSignedToken({
      userId: 'sol-learner', brand: 'realtutorialhub', tokenType: 'user', aud: 'user', isAdmin: false,
    });
    const req = createProxyRequest({path: '/api/export/status/sol-job', token});
    expect((await proxy(req)).status).toBe(200);
    req.headers.set('x-internal-key', 'sol-explicit-wrong-key');
    expect((await proxy(req)).status).toBe(403);
  });
""",
        )
        env = os.environ.copy()
        for key in list(env):
            if any(part in key.upper() for part in ("DATABASE_URL", "REDIS", "UPSTASH", "NEON")):
                env.pop(key, None)
        env.update(
            JWT_SECRET="sol-b08-disposable-access-key-000000",
            REFRESH_TOKEN_SECRET="sol-b08-disposable-refresh-key-0000",
            ADMIN_JWT_SECRET="sol-b08-disposable-admin-key-000000",
            INTERNAL_API_KEY="sol-b08-disposable-internal-key",
        )
        command = ["node", "node_modules/vitest/vitest.mjs", "run", "--config", "vitest.config.ts"]
        command += [str(path.relative_to(ROOT)) for path in created] + ["-t", "SOL-B08"]
        result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True,
                                text=True, encoding="utf-8", errors="replace", timeout=180)
        output = re.sub(r"\x1b\[[0-9;]*m", "", result.stdout + "\n" + result.stderr)
        summary = [line.strip() for line in output.splitlines()
                   if re.match(r"\s*(Test Files|Tests|Duration)\s", line)]
        failures = [line.strip() for line in output.splitlines()
                    if line.strip().startswith(("FAIL ", "AssertionError:"))]
        print(json.dumps({"exit_code": result.returncode, "summary": summary,
                          "failures": failures, "raw_output_suppressed": True}))
        return result.returncode
    finally:
        for path in created:
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
