"""
Candidate Sandbox Test Runner & Qualification Engine
"""

import os
import re
import json
import logging
import hashlib
import subprocess
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from uuid import uuid4

logger = logging.getLogger(__name__)


def find_workspace_root() -> Path:
    """Find monorepo workspace root containing packages/ui."""
    env_root = os.environ.get('WORKSPACE_ROOT')
    if env_root and (Path(env_root) / 'packages' / 'ui').exists():
        return Path(env_root)

    for parent in Path(__file__).resolve().parents:
        if (parent / 'packages' / 'ui').exists():
            return parent

    return Path(__file__).resolve().parents[4]


def _create_isolated_worktree(workspace_root: Path) -> Path:
    """Create a detached worktree so candidate code never touches the live tree."""
    sandbox_root = Path(os.environ.get("PROJECT_AI_QUALIFICATION_DIR", Path(os.getenv("TEMP", "/tmp")) / "project_ai_qualification"))
    sandbox_root.mkdir(parents=True, exist_ok=True)
    worktree_path = sandbox_root / f"candidate-{uuid4().hex}"
    result = subprocess.run(
        ["git", "worktree", "add", "--detach", str(worktree_path), "HEAD"],
        cwd=workspace_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Unable to create qualification worktree: {result.stderr.strip()}")
    return worktree_path


def _remove_isolated_worktree(workspace_root: Path, worktree_path: Path) -> None:
    """Remove a disposable qualification worktree without affecting project branches."""
    subprocess.run(
        ["git", "worktree", "remove", "--force", str(worktree_path)],
        cwd=workspace_root,
        capture_output=True,
        text=True,
        check=False,
    )


async def run_candidate_qualification_tests(
    candidate_id: str,
    files: List[Any],
    timeout_seconds: int = 45
) -> Dict[str, Any]:
    """
    Run automated Vitest test suite on candidate files in an isolated sandbox.
    """
    start_time = time.time()
    workspace_root = find_workspace_root()
    ui_package_dir = workspace_root / 'packages' / 'ui'
    
    if not ui_package_dir.exists():
        return {
            "passed": False,
            "status": "FAIL",
            "detail": f"UI package directory not found at {ui_package_dir}",
            "evidence_id": f"test-evidence-{candidate_id}",
            "evidence_hash": "",
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
        }

    # Identify test file and component files
    test_files = [
        f for f in files
        if f.filename.endswith('.test.tsx') or f.filename.endswith('.test.ts') or
           f.filename.endswith('.spec.tsx') or f.filename.endswith('.spec.ts')
    ]
    
    if not test_files:
        return {
            "passed": False,
            "status": "FAIL",
            "detail": "Candidate package missing required unit test suite (*.test.tsx)",
            "evidence_id": f"test-evidence-{candidate_id}",
            "evidence_hash": "",
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
        }

    component_files = [
        f for f in files
        if (f.filename.endswith('.tsx') or f.filename.endswith('.ts')) and
           not (f.filename.endswith('.test.tsx') or f.filename.endswith('.test.ts') or
                f.filename.endswith('.spec.tsx') or f.filename.endswith('.spec.ts') or
                f.filename.endswith('.schema.ts'))
    ]

    cand_short = candidate_id.replace('-', '')[:8]
    written_files: List[Path] = []
    worktree_path: Optional[Path] = None
    
    try:
        worktree_path = _create_isolated_worktree(workspace_root)
        blocks_dir = worktree_path / 'packages' / 'ui' / 'src' / 'tutorial' / 'blocks'
        tests_dir = blocks_dir / '__tests__'

        # Write candidate component files with prefix
        comp_map = {}
        for comp in component_files:
            orig_base = os.path.splitext(os.path.basename(comp.filename))[0]
            cand_comp_filename = f"__cand_{cand_short}_{comp.filename}"
            cand_comp_path = blocks_dir / cand_comp_filename
            cand_comp_base = os.path.splitext(cand_comp_filename)[0]
            
            content = comp.content if isinstance(comp.content, str) else comp.content.decode('utf-8', errors='replace')
            cand_comp_path.write_text(content, encoding='utf-8')
            written_files.append(cand_comp_path)
            comp_map[orig_base] = cand_comp_base

        rel_test_paths: List[str] = []
        for test_file in test_files:
            test_content = test_file.content if isinstance(test_file.content, str) else test_file.content.decode('utf-8', errors='replace')

            # Tests run from blocks/__tests__; keep their component imports inside the sandbox.
            for orig_base, cand_base in comp_map.items():
                test_content = re.sub(
                    rf"(['\"])(?:\.\.?/){re.escape(orig_base)}(['\"])",
                    rf"\1../{cand_base}\2",
                    test_content,
                )

            cand_test_filename = f"__cand_{cand_short}_{os.path.basename(test_file.filename)}"
            cand_test_path = tests_dir / cand_test_filename
            cand_test_path.write_text(test_content, encoding='utf-8')
            written_files.append(cand_test_path)
            rel_test_paths.append(f"src/tutorial/blocks/__tests__/{cand_test_filename}")

        # Run vitest
        pnpm_cmd = "pnpm.cmd" if os.name == 'nt' else "pnpm"
        cmd = [
            pnpm_cmd,
            "--filter",
            "@quiz/ui",
            "exec",
            "vitest",
            "run",
            *rel_test_paths,
            "--reporter=json"
        ]

        logger.info(f"Running candidate qualification tests: {' '.join(cmd)}")
        process = subprocess.run(
            cmd,
            cwd=str(worktree_path),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            shell=(os.name == 'nt')
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        stdout = process.stdout or ""
        stderr = process.stderr or ""
        raw_output = stdout if stdout.strip() else stderr

        evidence_hash = hashlib.sha256(raw_output.encode('utf-8')).hexdigest()
        evidence_id = str(uuid4())

        num_total = 0
        num_passed = 0
        num_failed = 0
        success = (process.returncode == 0)

        try:
            json_start = stdout.find('{')
            if json_start != -1:
                json_str = stdout[json_start:]
                data = json.loads(json_str)
                num_total = data.get("numTotalTests", 0)
                num_passed = data.get("numPassedTests", 0)
                num_failed = data.get("numFailedTests", 0)
                success = data.get("success", False)
        except Exception:
            pass

        if success and num_total > 0:
            detail_msg = f"{num_passed}/{num_total or num_passed} unit tests passed ({duration_ms}ms)"
            return {
                "passed": True,
                "status": "PASS",
                "detail": detail_msg,
                "evidence_id": evidence_id,
                "evidence_hash": evidence_hash,
                "total_tests": num_total,
                "passed_tests": num_passed,
                "failed_tests": num_failed,
                "duration_ms": duration_ms
            }
        else:
            if success and num_total == 0:
                success = False
                stderr = "Vitest completed without executing any candidate tests"
            failure_detail = f"Tests failed with exit code {process.returncode}: {stderr[:300] or stdout[:300]}"
            if num_failed > 0:
                failure_detail = f"{num_failed} of {num_total} unit tests failed ({duration_ms}ms)"
            return {
                "passed": False,
                "status": "FAIL",
                "detail": failure_detail,
                "evidence_id": evidence_id,
                "evidence_hash": evidence_hash,
                "total_tests": num_total,
                "passed_tests": num_passed,
                "failed_tests": num_failed,
                "duration_ms": duration_ms,
                "output": raw_output[:1000]
            }

    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "status": "FAIL",
            "detail": f"Test execution timed out after {timeout_seconds} seconds",
            "evidence_id": str(uuid4()),
            "evidence_hash": "",
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
        }
    except Exception as ex:
        logger.error(f"Error running candidate qualification tests: {ex}", exc_info=True)
        return {
            "passed": False,
            "status": "FAIL",
            "detail": f"Qualification test runner error: {str(ex)}",
            "evidence_id": str(uuid4()),
            "evidence_hash": "",
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
        }
    finally:
        if worktree_path:
            _remove_isolated_worktree(workspace_root, worktree_path)
