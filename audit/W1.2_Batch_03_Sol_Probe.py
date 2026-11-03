"""Replay isolated service-contract probes; no production or existing test edits.

Run from the checkout: python audit/W1.2_Batch_03_Sol_Probe.py
Expected at reviewed 8badd407: 9 failures / 4 passes, exit 1.
"""

from pathlib import Path
import subprocess


EXTRA_CASES = """
  it('SOL: infra must not invoke tenant eligibility', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({ id: 's1', userId: 'u1', revoked: false, expiresAt: new Date(Date.now() + 100000) });
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', brand: 'skillhubcore', aud: 'infra', isAdmin: true, tokenType: 'admin' });
    mockUserRepo.findActiveUserWithRoles.mockRejectedValue(new Error('OUT_OF_SCOPE_TENANT_LOOKUP'));
    await expect(service.refresh('infra-token', undefined, undefined, 'infra', 'skillhubcore')).resolves.toMatchObject({ accessToken: 'new-access-token' });
    expect(mockUserRepo.findActiveUserWithRoles).not.toHaveBeenCalled();
  });

  it('SOL: explicit false admin flag conflicts with admin audience', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({ id: 's1', userId: 'u1', revoked: false, expiresAt: new Date(Date.now() + 100000) });
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', brand: 'realtutorialhub', aud: 'admin', isAdmin: false });
    mockUserRepo.findActiveUserWithRoles.mockResolvedValue({ id: 'u1', email: 'u1@example.test', isBlocked: false, deletedAt: null, roles: ['admin'] });
    await expect(service.refresh('conflict-token', undefined, undefined, 'admin', 'realtutorialhub')).rejects.toThrow('Invalid refresh token');
    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
  });

  it('SOL: unsupported present tokenType must be rejected', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({ id: 's1', userId: 'u1', revoked: false, expiresAt: new Date(Date.now() + 100000) });
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', brand: 'realtutorialhub', aud: 'user', isAdmin: false, tokenType: 'unexpected-class' });
    mockUserRepo.findActiveUserWithRoles.mockResolvedValue({ id: 'u1', email: 'u1@example.test', isBlocked: false, deletedAt: null, roles: ['student'] });
    await expect(service.refresh('bad-class-token', undefined, undefined, 'user', 'realtutorialhub')).rejects.toThrow('Invalid refresh token');
    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
  });

  it('SOL: strict method must not fall back to permissive hydration', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({ id: 's1', userId: 'u1', revoked: false, expiresAt: new Date(Date.now() + 100000) });
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', brand: 'realtutorialhub', aud: 'user', isAdmin: false, tokenType: 'user' });
    mockUserRepo.findActiveUserWithRoles = undefined;
    mockUserRepo.findByIdWithDetails.mockResolvedValue({ id: 'u1', email: 'u1@example.test', isBlocked: false, deletedAt: null, userRoles: [] });
    await expect(service.refresh('fallback-token', undefined, undefined, 'user', 'realtutorialhub')).rejects.toThrow();
    expect(mockUserRepo.findByIdWithDetails).not.toHaveBeenCalled();
    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
  });

"""


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    folder = root / "apps/api-server/src/modules/auth/__tests__"
    original = folder / "token-refresh.lifecycle.test.ts"
    probe = folder / "token-refresh.sol-review.test.ts"
    if probe.exists():
        raise RuntimeError("Review probe already exists; refusing to overwrite")
    source = original.read_text(encoding="utf-8")
    assertion = "expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();"
    anchor = "  it('TC-LIFE-01:"
    if assertion not in source or anchor not in source:
        raise RuntimeError("Lifecycle fixture changed; adapt the probe explicitly")
    source = source.replace(
        assertion,
        "expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();\n    " + assertion,
    )
    position = source.index(anchor)
    probe.write_text(source[:position] + EXTRA_CASES + source[position:], encoding="utf-8")
    try:
        command = (
            "pnpm --filter @quiz/api-server test "
            "src/modules/auth/__tests__/token-refresh.sol-review.test.ts"
        )
        return subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", command], cwd=root, check=False
        ).returncode
    finally:
        probe.unlink()


if __name__ == "__main__":
    raise SystemExit(main())
