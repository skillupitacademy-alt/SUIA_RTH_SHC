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


def _content_sha256(content: Any) -> str:
    """Return a stable digest without retaining candidate source in evidence."""
    if isinstance(content, bytes):
        return hashlib.sha256(content).hexdigest()
    return hashlib.sha256(str(content).encode("utf-8")).hexdigest()


def _runner_revision() -> str:
    """Identify the exact qualification runner that produced the evidence."""
    return hashlib.sha256(Path(__file__).read_bytes()).hexdigest()


def _accessibility_preflight(component_files: List[Any]) -> Dict[str, Any]:
    """Catch deterministic structural defects before placement or browser verification."""
    findings: List[str] = []
    checks_run = 5

    readable_text_tag = re.compile(
        r"<(?:p|h[1-6]|span|div|li|strong|em)\b[^>]*style=\{\{[^}]*\bcolor\s*:\s*"
        r"(?:theme\.)?(?:primary|secondary|accent1|accent2)\b",
        re.IGNORECASE,
    )
    raw_hex_color = re.compile(r"#[0-9a-fA-F]{3,8}\b")
    inline_border_color = re.compile(r"\bborderColor\s*:")
    rounded_bordered_surface = re.compile(r"className=[\"'][^\"']*\brounded(?:-[\w\[\]]+)?[^\"']*\bborder(?:\b|-[\w\[\]]+)", re.IGNORECASE)

    for comp in component_files:
        source = comp.content if isinstance(comp.content, str) else comp.content.decode("utf-8", errors="replace")
        if not source.strip():
            findings.append(f"{comp.filename}: component file is empty.")
            continue

        if raw_hex_color.search(source):
            findings.append(
                f"{comp.filename}: raw hex color values are not allowed in candidate components; "
                "use injected theme tokens, semantic Tailwind classes, or a shared primitive."
            )

        if inline_border_color.search(source):
            findings.append(
                f"{comp.filename}: inline borderColor is not allowed on candidate surfaces because it can override "
                "forced-colors perimeters; use an explicit class-based border instead."
            )

        if readable_text_tag.search(source):
            findings.append(
                f"{comp.filename}: theme tokens cannot be used as inline foreground color on readable text; "
                "use semantic high-contrast text classes instead."
            )

        uses_shared_surface = any(primitive in source for primitive in ("CardSurface", "CalloutBanner", "StepBadge", "TerminalWindow"))
        if rounded_bordered_surface.search(source) and not uses_shared_surface and "forced-colors:" not in source:
            findings.append(
                f"{comp.filename}: a hand-built rounded bordered surface needs an explicit forced-colors border or "
                "must compose CardSurface/CalloutBanner."
            )

    return {
        "status": "FAIL" if findings else "PASS",
        "checks_run": checks_run,
        "findings": findings,
        "detail": (
            f"{checks_run}/{checks_run} static accessibility preflight checks passed"
            if not findings
            else "; ".join(findings)
        ),
    }


def find_workspace_root() -> Path:
    """Find monorepo workspace root containing packages/ui."""
    env_root = os.environ.get('WORKSPACE_ROOT')
    if env_root and (Path(env_root) / 'packages' / 'ui').exists():
        return Path(env_root)

    for parent in Path(__file__).resolve().parents:
        if (parent / 'packages' / 'ui').exists():
            return parent

    return Path(__file__).resolve().parents[4]


def _link_dependencies(workspace_root: Path, worktree_path: Path) -> List[Path]:
    """Link node_modules via NTFS junction on Windows or symlink on Unix."""
    linked = []
    targets = [
        ("node_modules", "node_modules"),
        ("packages/ui/node_modules", "packages/ui/node_modules"),
        ("apps/skillhubcore-admin/node_modules", "apps/skillhubcore-admin/node_modules"),
    ]
    for rel_src, rel_dst in targets:
        src = workspace_root / rel_src
        dst = worktree_path / rel_dst
        if src.exists() and not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            if os.name == "nt":
                subprocess.run(["cmd.exe", "/c", "mklink", "/J", str(dst), str(src)], capture_output=True, check=False)
            else:
                try:
                    os.symlink(str(src), str(dst), target_is_directory=True)
                except Exception:
                    pass
            if dst.exists():
                linked.append(dst)
    return linked


def _unlink_dependencies(linked: List[Path]) -> None:
    """Safely unlink junctions/symlinks without deleting underlying targets."""
    for dst in reversed(linked):
        try:
            if dst.exists():
                if os.name == "nt":
                    subprocess.run(["cmd.exe", "/c", "rmdir", str(dst)], capture_output=True, check=False)
                else:
                    if dst.is_symlink():
                        dst.unlink()
        except Exception as e:
            logger.warning(f"Failed to unlink {dst}: {e}")


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


def _remove_isolated_worktree(workspace_root: Path, worktree_path: Path, linked: Optional[List[Path]] = None) -> None:
    """Remove a disposable qualification worktree without affecting project branches."""
    if linked:
        _unlink_dependencies(linked)
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
    timeout_seconds: int = 240
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
        if (f.filename.endswith('Block.tsx') or f.filename.endswith('Block.ts')) and
           not (f.filename.endswith('.test.tsx') or f.filename.endswith('.test.ts') or
                f.filename.endswith('.spec.tsx') or f.filename.endswith('.spec.ts'))
    ]

    if not component_files:
        return {
            "passed": False,
            "status": "FAIL",
            "detail": "Candidate package missing a block component (*Block.tsx or *Block.ts)",
            "evidence_id": f"test-evidence-{candidate_id}",
            "evidence_hash": "",
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
        }

    cand_short = candidate_id.replace('-', '')[:8]
    qualification_inputs = [
        {"filename": file.filename, "sha256": _content_sha256(file.content)}
        for file in files
    ]
    runner_revision = _runner_revision()
    accessibility_preflight = _accessibility_preflight(component_files)

    if accessibility_preflight["status"] != "PASS":
        return {
            "passed": False,
            "status": "FAIL",
            "detail": f"Accessibility preflight failed: {accessibility_preflight['detail']}",
            "evidence_id": f"test-evidence-{candidate_id}",
            "evidence_hash": "",
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "accessibility_preflight": accessibility_preflight,
            "runner_metadata": {
                "runner_revision": runner_revision,
                "qualification_inputs": qualification_inputs,
                "accessibility_preflight": accessibility_preflight,
            },
        }

    # UBA Design & Accessibility Rule 1: Asymmetrical left borders prohibited
    for comp in component_files:
        comp_text = comp.content if isinstance(comp.content, str) else comp.content.decode('utf-8', errors='replace')
        if re.search(r'\bborder-l(?:-[0-9]+|-[a-z]+|\s|"|\')', comp_text) or re.search(r'borderLeft(?:Width|Color)?\s*:', comp_text) or re.search(r'border-left\s*:', comp_text):
            return {
                "passed": False,
                "status": "FAIL",
                "detail": (
                    f"Candidate component '{comp.filename}' violates UBA design standards: "
                    "asymmetrical left-side borders (`border-l-*` or `border-left`) are strictly prohibited. "
                    "Callouts and elevated cards must use symmetric perimeter borders with CardSurface or CalloutBanner."
                ),
                "evidence_id": f"test-evidence-{candidate_id}",
                "evidence_hash": "",
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "runner_metadata": {
                    "runner_revision": runner_revision,
                    "qualification_inputs": qualification_inputs,
                },
            }

        # UBA Accessibility Rule 2: Motion Safety (WCAG SC 2.3.3)
        # Any hover transform translation must be guarded by motion-safe: AND accompanied by motion-reduce:transform-none
        has_hover_translate = bool(re.search(r'hover:[-\w]*translate', comp_text))
        if has_hover_translate and "CardSurface" not in comp_text:
            has_motion_safe = not bool(re.search(r'(?<!motion-safe:)hover:[-\w]*translate', comp_text))
            has_motion_reduce = "motion-reduce:transform-none" in comp_text or "motion-reduce:transition-none" in comp_text
            if not (has_motion_safe and has_motion_reduce):
                return {
                    "passed": False,
                    "status": "FAIL",
                    "detail": (
                        f"Candidate component '{comp.filename}' violates UBA motion safety standards (WCAG SC 2.3.3): "
                        "hover translate movements must be prefixed with `motion-safe:` AND accompanied by `motion-reduce:transform-none` "
                        "(or compose CardSurface with hoverable={true})."
                    ),
                    "evidence_id": f"test-evidence-{candidate_id}",
                    "evidence_hash": "",
                    "total_tests": 0,
                    "passed_tests": 0,
                    "failed_tests": 0,
                    "runner_metadata": {
                        "runner_revision": runner_revision,
                        "qualification_inputs": qualification_inputs,
                    },
                }

        # UBA Accessibility Rule 3: Keyboard semantics for interactive elements (WCAG SC 2.1.1, 4.1.2)
        # Raw cursor-pointer on plain containers without CardSurface or tabIndex/role/onClick
        if "cursor-pointer" in comp_text and "CardSurface" not in comp_text:
            if not ("tabIndex" in comp_text or "role=" in comp_text or "onClick" in comp_text):
                return {
                    "passed": False,
                    "status": "FAIL",
                    "detail": (
                        f"Candidate component '{comp.filename}' violates UBA keyboard semantics (WCAG SC 2.1.1, 4.1.2): "
                        "`cursor-pointer` cannot be applied to static containers without keyboard accessibility. "
                        "Compose CardSurface or provide tabIndex, role, and onKeyDown handlers."
                    ),
                    "evidence_id": f"test-evidence-{candidate_id}",
                    "evidence_hash": "",
                    "total_tests": 0,
                    "passed_tests": 0,
                    "failed_tests": 0,
                    "runner_metadata": {
                        "runner_revision": runner_revision,
                        "qualification_inputs": qualification_inputs,
                    },
                }

        # UBA Rule 4: Mandatory BlockShell Composition (prohibits hand-rolled raw <article>)
        if "<article" in comp_text and "BlockShell" not in comp_text:
            return {
                "passed": False,
                "status": "FAIL",
                "detail": (
                    f"Candidate component '{comp.filename}' violates UBA architecture standards: "
                    "hand-rolling a raw `<article>` outer shell is prohibited. "
                    "Candidates must compose the generic BlockShell primitive from '../primitives' or '@quiz/ui'."
                ),
                "evidence_id": f"test-evidence-{candidate_id}",
                "evidence_hash": "",
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "runner_metadata": {
                    "runner_revision": runner_revision,
                    "qualification_inputs": qualification_inputs,
                },
            }

        # UBA Rule 5: Buttons require visible focus state (WCAG SC 2.4.7)
        if "<button" in comp_text and "focus" not in comp_text:
            return {
                "passed": False,
                "status": "FAIL",
                "detail": (
                    f"Candidate component '{comp.filename}' violates UBA keyboard accessibility standards (WCAG SC 2.4.7): "
                    "custom button elements must declare a visible focus ring (e.g. `focus:ring-2` or `focus-visible:ring-2`)."
                ),
                "evidence_id": f"test-evidence-{candidate_id}",
                "evidence_hash": "",
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "runner_metadata": {
                    "runner_revision": runner_revision,
                    "qualification_inputs": qualification_inputs,
                },
            }

    written_files: List[Path] = []
    worktree_path: Optional[Path] = None
    linked_deps: List[Path] = []
    
    try:
        worktree_path = _create_isolated_worktree(workspace_root)
        linked_deps = _link_dependencies(workspace_root, worktree_path)

        # Synchronize setup.ts into qualification worktree
        live_setup = workspace_root / 'packages' / 'ui' / '__tests__' / 'setup.ts'
        wt_setup = worktree_path / 'packages' / 'ui' / '__tests__' / 'setup.ts'
        if live_setup.exists():
            wt_setup.parent.mkdir(parents=True, exist_ok=True)
            wt_setup.write_text(live_setup.read_text(encoding='utf-8'), encoding='utf-8')

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
            import_rewrites = 0
            for orig_base, cand_base in comp_map.items():
                test_content, replacements = re.subn(
                    rf"(['\"])(?:\.\.?/){re.escape(orig_base)}(['\"])",
                    rf"\1../{cand_base}\2",
                    test_content,
                )
                import_rewrites += replacements

            if import_rewrites == 0:
                return {
                    "passed": False,
                    "status": "FAIL",
                    "detail": (
                        f"Candidate test '{test_file.filename}' must import a submitted block component "
                        "using a relative path so qualification can run the submitted source."
                    ),
                    "evidence_id": str(uuid4()),
                    "evidence_hash": "",
                    "total_tests": 0,
                    "passed_tests": 0,
                    "failed_tests": 0,
                    "runner_metadata": {
                        "runner_revision": runner_revision,
                        "qualification_inputs": qualification_inputs,
                    },
                }

            test_stem = re.sub(r"\.(?:test|spec)$", "", Path(test_file.filename).stem)
            test_stem = re.sub(r"[^A-Za-z0-9_-]+", "_", test_stem)
            cand_test_filename = f"__cand_{cand_short}_{test_stem}.test.tsx"
            cand_test_path = tests_dir / cand_test_filename
            cand_test_path.write_text(test_content, encoding='utf-8')
            written_files.append(cand_test_path)
            rel_test_paths.append(f"src/tutorial/blocks/__tests__/{cand_test_filename}")

        # Run vitest
        # Do not let a long-lived API worker's Node resolution or production mode
        # leak into an isolated qualification run.
        test_env = os.environ.copy()
        test_env.pop("NODE_PATH", None)
        test_env["NODE_ENV"] = "test"
        test_env["CI"] = "true"
        if os.name == 'nt':
            cmd_str = f'pnpm --filter @quiz/ui exec vitest run {" ".join(rel_test_paths)} --reporter=json'
            logger.info(f"Running candidate qualification tests: {cmd_str}")
            process = subprocess.run(
                cmd_str,
                cwd=str(worktree_path),
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                shell=True,
                env=test_env,
            )
        else:
            cmd = [
                "pnpm",
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
                shell=False,
                env=test_env,
            )
        
        duration_ms = int((time.time() - start_time) * 1000)
        stdout = process.stdout or ""
        stderr = process.stderr or ""
        try:
            d = json.loads(stdout)
            for tr in d.get("testResults", []):
                logger.info(f"Candidate test suite {tr.get('name')} status: {tr.get('status')}")
                for ar in tr.get("assertionResults", []):
                    if ar.get("status") == "failed":
                        logger.warning(f"  FAILED assertion: {ar.get('fullName')}: {ar.get('failureMessages')}")
        except Exception:
            logger.debug(f"Candidate test raw output: {stdout[:500]}")
        raw_output = stdout if stdout.strip() else stderr

        runner_metadata = {
            "runner_revision": runner_revision,
            "qualification_inputs": qualification_inputs,
            "sandbox_tests": rel_test_paths,
            "sandbox_components": sorted(comp_map.values()),
            "node_environment": {
                "NODE_ENV": test_env["NODE_ENV"],
                "NODE_PATH": "<cleared>",
            },
            "accessibility_preflight": accessibility_preflight,
        }
        evidence_hash = hashlib.sha256(json.dumps({
            "output": raw_output,
            "runner_metadata": runner_metadata,
        }, sort_keys=True).encode('utf-8')).hexdigest()
        evidence_id = str(uuid4())

        num_total = 0
        num_passed = 0
        num_failed = 0
        success = (process.returncode == 0)

        try:
            json_start = stdout.find('{')
            json_end = stdout.rfind('}')
            if json_start != -1 and json_end != -1:
                json_str = stdout[json_start:json_end + 1]
                data = json.loads(json_str)
                num_total = data.get("numTotalTests", 0)
                num_passed = data.get("numPassedTests", 0)
                num_failed = data.get("numFailedTests", 0)
                success = data.get("success", False)

                failure_reasons = []
                suite_errors = []
                for tr in data.get("testResults", []):
                    if tr.get("message"):
                        suite_errors.append(tr.get("message").strip().split("\n")[0])
                    for ar in tr.get("assertionResults", []):
                        if ar.get("status") == "failed":
                            title = ar.get("title", "test")
                            msgs = ar.get("failureMessages", [])
                            first_msg = msgs[0].split("\n")[0] if msgs else "Assertion failed"
                            failure_reasons.append(f"{title}: {first_msg}")
        except Exception as e:
            logger.warning(f"Failed parsing Vitest JSON: {e}")

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
                "duration_ms": duration_ms,
                "accessibility_preflight": accessibility_preflight,
                "runner_metadata": runner_metadata,
            }
        else:
            if success and num_total == 0:
                success = False
                stderr = "Vitest completed without executing any candidate tests"
            failure_detail = f"Tests failed with exit code {process.returncode}: {stderr[:300] or stdout[:300]}"
            if suite_errors:
                failure_detail = f"Suite load failure: {'; '.join(suite_errors[:2])}"
            elif num_failed > 0:
                reasons_str = "; ".join(failure_reasons[:3]) if failure_reasons else ""
                failure_detail = f"{num_failed} of {num_total} unit tests failed ({duration_ms}ms)"
                if reasons_str:
                    failure_detail += f" - {reasons_str}"
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
                "output": raw_output[:1000],
                "accessibility_preflight": accessibility_preflight,
                "runner_metadata": runner_metadata,
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
            _remove_isolated_worktree(workspace_root, worktree_path, linked_deps)
