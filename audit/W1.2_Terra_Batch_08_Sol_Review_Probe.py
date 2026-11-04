"""Offline independent caller-compatibility and canonical-membership probes."""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fixture_helper", ROOT / "audit/W1.2_Batch_08_Sol_Probe.py")
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def main():
    try:
        helper.extend(
            "packages/db-tutorial/src/services/__tests__/learning-progress.service.test.ts",
            "sol-terra-canonical-membership.test.ts",
            """
  it('SOL-TERRA canonical stored block positive control', async () => {
    mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'skillup');
    const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'skillup');
    section!.content = {schemaVersion: 1, blocks: [{id: 'canonical-allowed', type: 'definition', version: 'D1'}]} as any;
    const result = await service.recordBlockCompletion(
      {userId: 'user-1', brand: 'skillup'}, 'node-1', 'subtopic-1', 'section-1', 'canonical-allowed', 'definition', 'D1'
    );
    expect(result.completedBlocks.some(block => block.blockId === 'canonical-allowed')).toBe(true);
  });
  it('SOL-TERRA canonical unknown block must fail before progress mutation', async () => {
    mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'skillup');
    const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'skillup');
    section!.content = {schemaVersion: 1, blocks: [{id: 'canonical-allowed', type: 'definition', version: 'D1'}]} as any;
    const write = vi.spyOn(mockRepo, 'markBlockCompleted');
    const create = vi.spyOn(mockRepo, 'createProgress');
    const accepted = await service.recordBlockCompletion(
      {userId: 'user-1', brand: 'skillup'}, 'node-1', 'subtopic-1', 'section-1', 'canonical-not-in-content', 'definition', 'D1'
    ).then(() => true, () => false);
    expect.soft(accepted).toBe(false);
    expect.soft(create).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
""",
        )
        config = ROOT / "sol-terra-review.config.ts"
        if config.exists():
            raise RuntimeError("Review configuration already exists")
        config.write_text("""
import path from 'path';
import { defineConfig } from 'vitest/config';
import base from './vitest.config';
export default defineConfig({
  ...base,
  resolve: {...base.resolve, alias: [
    {find: '@/lib/student-auth', replacement: path.resolve(__dirname, 'apps/skillup-web/src/lib/student-auth.ts')},
    {find: '@/lib/assignment-auth', replacement: path.resolve(__dirname, 'apps/realtutorialhub-web/src/lib/assignment-auth.ts')},
    ...(base.resolve?.alias as any[]),
  ]},
});
""", encoding="utf-8")
        helper.created.append(config)
        caller = ROOT / "apps/api-server/src/modules/auth/__tests__/sol-terra-progress-bff.test.ts"
        if caller.exists():
            raise RuntimeError("Caller fixture already exists")
        caller.write_text("""
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET as apiGet } from '../../../app/api/tutorial/progress/route';
import { GET as suiaGet } from '../../../../../../apps/skillup-web/src/app/api/tutorial/progress/route';
import { GET as rthGet } from '../../../../../../apps/realtutorialhub-web/src/app/api/tutorial/progress/route';
vi.mock('@quiz/db-tutorial', () => ({TutorialProgressRepository: class {
  async getProgress() { return {blocksCompleted: []}; }
}}));
vi.mock('@/modules/tutorial-engine', () => ({TutorialService: class {}}));
describe('SOL-TERRA actual progress BFF to API transport', () => {
  const key = new TextEncoder().encode('sol-terra-disposable-auth-key-000000');
  let previous: TokenService;
  let previousContainer: TokenService;
  let service: TokenService;
  beforeEach(() => {
    previous = TokenService.getInstance();
    previousContainer = container.get(TokenService);
    service = new TokenService(key, key, key);
    TokenService.setInstance(service);
    container.register(TokenService, service);
    vi.stubEnv('INTERNAL_API_URL', 'http://api-offline.test');
    vi.stubEnv('INTERNAL_API_KEY', 'sol-disposable-internal');
    vi.stubEnv('INTERNAL_API_SECRET', 'sol-disposable-internal');
  });
  afterEach(() => {
    vi.restoreAllMocks(); vi.unstubAllEnvs();
    TokenService.setInstance(previous); container.register(TokenService, previousContainer);
  });
  it.each([
    ['skillup', 'skillup.localhost:3009', suiaGet],
    ['realtutorialhub', 'realtutorialhub.localhost:3003', rthGet],
  ] as const)('SOL-TERRA valid %s progress caller preserves API authentication', async (brand, host, bffGet) => {
    const token = await service.generateAccessToken({userId: 'sol-learner', roles: ['student'], brand,
      aud: 'user', tokenType: 'user', isAdmin: false});
    const endpoint = '/api/tutorial/progress?subtopicId=11111111-1111-4111-8111-111111111111';
    expect((await apiGet(new NextRequest('http://api-offline.test' + endpoint, {
      headers: {authorization: `Bearer ${token}`, 'x-brand': brand},
    }))).status).toBe(200);
    const transport = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      return apiGet(new NextRequest(String(url), {method: init?.method, headers: init?.headers}));
    });
    const result = await bffGet(new NextRequest(`http://${host}${endpoint}`, {
      headers: {host, authorization: `Bearer ${token}`},
    }));
    expect(transport).toHaveBeenCalledOnce();
    expect(result.status).toBe(200);
  });
});
""", encoding="utf-8")
        helper.created.append(caller)
        env = os.environ.copy()
        for key in list(env):
            if any(part in key.upper() for part in ("DATABASE", "REDIS", "UPSTASH", "NEON")):
                env.pop(key, None)
        env.update(JWT_SECRET="sol-terra-disposable-access-key-0000",
                   REFRESH_TOKEN_SECRET="sol-terra-disposable-refresh-key-000",
                   ADMIN_JWT_SECRET="sol-terra-disposable-admin-key-00000")
        command = ["node", "node_modules/vitest/vitest.mjs", "run", "--config", str(config),
                   "--exclude", "**/.worktrees/**"]
        command += [str(path.relative_to(ROOT)) for path in helper.created if path.name.endswith(".test.ts")]
        command += ["-t", "SOL-TERRA"]
        result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True,
                                text=True, encoding="utf-8", errors="replace", timeout=180)
        output = re.sub(r"\x1b\[[0-9;]*m", "", result.stdout + "\n" + result.stderr)
        print(json.dumps({"exit_code": result.returncode,
            "summary": [line.strip() for line in output.splitlines()
                        if re.match(r"\s*(Test Files|Tests|Duration)\s", line)],
            "failures": [line.strip() for line in output.splitlines()
                         if line.strip().startswith(("FAIL ", "AssertionError:", "Error:"))],
            "raw_output_suppressed": True}))
        return result.returncode
    finally:
        for path in helper.created:
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
