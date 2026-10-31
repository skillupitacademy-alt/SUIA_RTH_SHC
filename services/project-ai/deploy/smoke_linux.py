"""Run with the service directory mounted read-only; never uses a database."""

import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.verification.worker_slot import verification_slot
from app.verification.composer_worktree_verifier import _kill_process_tree


def check_dependency_startup():
    entrypoint = Path(__file__).with_name('entrypoint.sh').read_text()
    for scenario in ('cached', 'missing-tarball', 'invalid-lockfile'):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            commands = root / 'bin'
            commands.mkdir()
            (root / '.git').mkdir()
            config = root / 'worker.env'
            config.touch()
            script = root / 'entrypoint.sh'
            script.write_text(entrypoint)
            mocks = {
                'git': '#!/bin/sh\nexit 0\n',
                'pnpm': '''#!/bin/sh
printf '%s|%s\\n' "$npm_config_store_dir" "$*" >> "$WORKSPACE_ROOT/calls"
case "$*" in
  *--offline*)
    case "$INSTALL_SCENARIO" in
      missing-tarball) echo ERR_PNPM_NO_OFFLINE_TARBALL; exit 1 ;;
      invalid-lockfile) echo ERR_PNPM_OUTDATED_LOCKFILE; exit 1 ;;
    esac ;;
esac
exit 0
''',
                'python': '#!/bin/sh\nexit 0\n',
                'uvicorn': '#!/bin/sh\nexit 0\n',
            }
            for name, content in mocks.items():
                command = commands / name
                command.write_text(content)
                command.chmod(0o755)
            (root / 'services/project-ai').mkdir(parents=True)
            environment = {**os.environ, 'PATH': f'{commands}:{os.environ["PATH"]}',
                           'WORKSPACE_ROOT': str(root), 'PROJECT_AI_ENV_FILE': str(config),
                           'INSTALL_SCENARIO': scenario}
            environment.pop('npm_config_store_dir', None)
            result = subprocess.run(['sh', str(script)], env=environment, capture_output=True,
                                    text=True, timeout=15)
            calls = (root / 'calls').read_text().splitlines()
            installs = [line for line in calls if '|install ' in line]
            assert all(line.startswith(f'{root}/.pnpm-store|') for line in calls)
            assert '--offline' in installs[0]
            assert len(installs) == (2 if scenario == 'missing-tarball' else 1)
            if scenario == 'invalid-lockfile':
                assert result.returncode != 0
                assert not any('|--filter' in line for line in calls)
                assert 'ERR_PNPM_OUTDATED_LOCKFILE' in result.stdout
            else:
                assert result.returncode == 0, result.stderr
                assert any('|--filter' in line for line in calls)
            if scenario == 'missing-tarball':
                assert 'ERR_PNPM_NO_OFFLINE_TARBALL' in result.stdout
                assert '--offline' not in installs[1]
    print('PASS: shared-cache startup, missing-tarball retry and fail-closed lockfile errors', flush=True)


def main():
    if sys.platform != 'linux':
        raise SystemExit('This smoke test requires a Linux container')
    check_dependency_startup()
    with tempfile.TemporaryDirectory() as directory:
        os.environ['PROJECT_AI_STATE_DIR'] = directory
        child_check = (
            "from app.verification.worker_slot import verification_slot; "
            "from fastapi import HTTPException; "
            "import sys\n"
            "try:\n with verification_slot(): sys.exit(2)\n"
            "except HTTPException as error:\n sys.exit(0 if error.status_code == 409 else 3)"
        )
        environment = {**os.environ, 'PYTHONPATH': sys.path[0]}
        with verification_slot():
            subprocess.run([sys.executable, '-c', child_check], env=environment, check=True, timeout=15)
        with verification_slot():
            pass
        print('PASS: Linux cross-process exclusion and lock release', flush=True)

    process = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)'], start_new_session=True)
    try:
        _kill_process_tree(process.pid)
        process.wait(timeout=5)
        assert process.returncode != 0
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()
    print('PASS: Linux isolated process-group cleanup', flush=True)

    infrastructure = Path('/infra')
    if infrastructure.is_dir():
        scripts = ('scripts/deploy-load-production.sh', 'scripts/lib-deployment.sh',
                   'scripts/package-runtime-bundle.sh', 'config/validate-config.sh')
        for name in scripts:
            # Same newline normalization applied by the runtime bundle packager.
            subprocess.run(['sh', '-n'], input=(infrastructure / name).read_text(),
                           text=True, check=True, timeout=10)
        print('PASS: Linux deployment shell syntax after bundle normalization', flush=True)


if __name__ == '__main__':
    main()
