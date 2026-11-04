"""Run bounded Batch 07 actual-source offline probes; emit counts only."""
from pathlib import Path
import json
import re
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parent.parent
PROBE_SOURCE = "import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';\nimport { NextRequest } from 'next/server';\nimport { POST } from '@/app/api/auth/logout-all/route';\nimport { LoginService } from '@/modules/auth/login.service';\nimport { GlobalLogoutService } from '@/modules/auth/global-logout.service';\nimport { TokenService } from '@/modules/auth/token.service';\nimport { container } from '@/modules/core/container';\nvi.mock('@/modules/auth/brand-db',()=>({shouldUseBrandBinding:()=>false,getAuthBrandContext:()=>({db:{},tables:{users:{},refreshTokens:{},loginAttempts:{}}})}));\nconst key=new TextEncoder().encode('sol-batch07-disposable-signing-key-32bytes');\nconst service=new TokenService(key,key,key);\nconst engine={getActiveSessions:vi.fn(async()=>[{id:'fixture-session'}]),logoutAllDevices:vi.fn(async()=>({success:true}))};\nconst previousToken=container.get(TokenService);\nconst previousGlobal=container.get(GlobalLogoutService);\nbeforeEach(()=>{vi.spyOn(console,'log').mockImplementation(()=>{});});\nafterEach(()=>{vi.restoreAllMocks();container.register(TokenService,previousToken);container.register(GlobalLogoutService,previousGlobal);vi.clearAllMocks();});\nfunction register(){container.register(TokenService,service);container.register(GlobalLogoutService,engine as any);}\nasync function token(aud:string,isAdmin:boolean){return service.generateAccessToken({userId:'fixture-user',originalUserId:'fixture-user',shadowUserId:'fixture-shadow',email:'fixture@example.test',roles:isAdmin?['infrastructure']:['student'],brand:'realtutorialhub',isAdmin,tokenType:isAdmin?'admin':'user',aud});}\ndescribe('Sol Batch 07 bounded offline probes',()=>{\n it('positive user control reaches the legacy adapter',async()=>{\n  register(); const jwt=await token('user',false);\n  const req=new NextRequest('http://realtutorialhub.localhost:3003/api/auth/logout-all',{method:'POST',headers:{host:'realtutorialhub.localhost:3003','x-brand':'realtutorialhub',authorization:'Bearer '+jwt}});\n  expect((await POST(req)).status).toBe(200);\n  expect(engine.logoutAllDevices).toHaveBeenCalledTimes(1);\n });\n it('infra audience must be rejected even though tokenType is admin',async()=>{\n  register(); const jwt=await token('infra',true);\n  const req=new NextRequest('http://realtutorialhub.localhost:3003/api/auth/logout-all',{method:'POST',headers:{host:'realtutorialhub.localhost:3003','x-brand':'realtutorialhub',authorization:'Bearer '+jwt}});\n  expect((await POST(req)).status).toBe(403);\n  expect(engine.getActiveSessions).not.toHaveBeenCalled();\n  expect(engine.logoutAllDevices).not.toHaveBeenCalled();\n });\n it('cookie-authenticated foreign-origin logout-all must be denied',async()=>{\n  register(); const jwt=await token('user',false);\n  const req=new NextRequest('http://realtutorialhub.localhost:3003/api/auth/logout-all',{method:'POST',headers:{host:'realtutorialhub.localhost:3003','x-brand':'realtutorialhub',cookie:'accessToken='+jwt,origin:'https://foreign.example.invalid'}});\n  expect((await POST(req)).status).toBe(403);\n  expect(engine.logoutAllDevices).not.toHaveBeenCalled();\n });\n it('generic skillhubcore route forwarding must preserve existing purpose behavior',async()=>{\n  const user={id:'fixture-admin',email:'fixture@example.test',passwordHash:'fake-hash',isBlocked:false,emailVerified:true,shadowUserId:'fixture-shadow',userRoles:[{role:{name:'admin'}}]};\n  const userRepo={findWithDetails:vi.fn(async()=>user),updateLastActive:vi.fn(async()=>{})};\n  const tokenRepo={createRefreshToken:vi.fn(async()=>{})};\n  const audit={log:vi.fn(async()=>{})};\n  const password={compare:vi.fn(async()=>true)};\n  const security:any={isAccountLocked:vi.fn(async()=>false),trackLoginAttempt:vi.fn(async()=>{})}; security.withContext=()=>security;\n  const login=new LoginService(userRepo as any,tokenRepo as any,audit as any,password as any,security as any,service);\n  const legacy=await login.login(user.email,'offline-fake-password','192.0.2.1','skillhubcore');\n  const forwarded=await login.login(user.email,'offline-fake-password','192.0.2.1','skillhubcore',undefined,{purpose:'learner'});\n  expect(forwarded.isAdmin).toBe(legacy.isAdmin);\n });\n});\n"

def main():
    target = ROOT / 'tests' / ('.sol-batch07-' + uuid.uuid4().hex + '.test.ts')
    command = ['node', str(ROOT / 'node_modules/vitest/vitest.mjs'), 'run', '--config', str(ROOT / 'vitest.config.ts'), '--dir', str(ROOT / 'tests'), target.name]
    try:
        with target.open('x', encoding='utf-8') as handle:
            handle.write(PROBE_SOURCE)
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, errors='replace')
        output = re.sub(r'\x1b\[[0-9;]*m', '', result.stdout + '\n' + result.stderr)
        match = re.search(r'^\s*Tests\s+([^\n]+)', output, re.MULTILINE)
        counts = {label: int(number) for number, label in re.findall(r'(\d+)\s+(passed|failed|skipped)', match.group(1) if match else '')}
        print(json.dumps({'exit_code': result.returncode, 'test_counts': counts, 'raw_output_suppressed': True}))
        return result.returncode
    finally:
        target.unlink(missing_ok=True)

if __name__ == '__main__':
    sys.exit(main())
