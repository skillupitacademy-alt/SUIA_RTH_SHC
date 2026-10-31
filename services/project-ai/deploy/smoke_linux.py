"""Run with the service directory mounted read-only; never uses a database."""

import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.verification.worker_slot import verification_slot
from app.verification.composer_worktree_verifier import _kill_process_tree


def main():
    if sys.platform != 'linux':
        raise SystemExit('This smoke test requires a Linux container')
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
