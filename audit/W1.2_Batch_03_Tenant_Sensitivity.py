"""Reproduce tenant-evidence blind spots at reviewed source 7a3b26ef.

Run: python audit/W1.2_Batch_03_Tenant_Sensitivity.py
At that SHA both broken variants pass 28 checks, exit 0. That demonstrates a
test-sensitivity gap, not correct production behavior. Inspect any future failure;
an import/setup error is not a successful regression detection.
"""

from pathlib import Path
import subprocess


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    auth = root / "apps/api-server/src/modules/auth"
    fixture = auth / "__tests__/token-refresh.lifecycle.test.ts"
    service_copy = auth / "token-refresh.sol-binding-mutant.ts"
    repo_copy = auth / "repositories/user.sol-predicate-mutant.ts"
    binding_test = auth / "__tests__/token-refresh.sol-binding-sensitivity.test.ts"
    predicate_test = auth / "__tests__/token-refresh.sol-predicate-sensitivity.test.ts"
    targets = (service_copy, repo_copy, binding_test, predicate_test)
    for target in targets:
        if target.exists():
            raise RuntimeError(f"Refusing to overwrite {target.name}")

    service = (auth / "token-refresh.service.ts").read_text(encoding="utf-8")
    binding = (
        "    const brandUserRepo = useBrandBinding && typeof this.userRepo.withDb === 'function'\n"
        "      ? this.userRepo.withDb(brandContext.db, brandContext.tables)\n"
        "      : this.userRepo;"
    )
    repo = (auth / "repositories/user.repository.ts").read_text(encoding="utf-8")
    predicate = ".where(eq(usersTable.id, userId))"
    fixture_source = fixture.read_text(encoding="utf-8")
    if service.count(binding) != 1 or repo.count(predicate) != 1:
        raise RuntimeError("Reviewed source changed; adapt mutants explicitly")
    if "from '../token-refresh.service'" not in fixture_source:
        raise RuntimeError("Fixture import changed; refusing silent no-op mutation")
    if "from '../repositories/user.repository'" not in fixture_source:
        raise RuntimeError("Repository import changed; adapt fixture explicitly")

    created = []
    try:
        files = (
            (service_copy, service.replace(binding, "    const brandUserRepo = this.userRepo;", 1)),
            (repo_copy, repo.replace(predicate, ".where(eq(usersTable.email, userId))", 1)),
            (binding_test, fixture_source.replace(
                "from '../token-refresh.service'", "from '../token-refresh.sol-binding-mutant'")),
            (predicate_test, fixture_source.replace(
                "from '../repositories/user.repository'", "from '../repositories/user.sol-predicate-mutant'")),
        )
        for target, content in files:
            target.write_text(content, encoding="utf-8")
            created.append(target)
        command = (
            "pnpm --filter @quiz/api-server test "
            "src/modules/auth/__tests__/token-refresh.sol-binding-sensitivity.test.ts "
            "src/modules/auth/__tests__/token-refresh.sol-predicate-sensitivity.test.ts"
        )
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", command], cwd=root, check=False
        )
        if result.returncode == 0:
            print("Both mutants survived: current evidence does not detect broken binding/predicate.")
        return result.returncode
    finally:
        for target in reversed(created):
            target.unlink()


if __name__ == "__main__":
    raise SystemExit(main())
