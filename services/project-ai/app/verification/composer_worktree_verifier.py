"""
Composer Worktree Verification Engine.

M2.9 R4 ARCHITECTURAL INVARIANT:
- NEVER verify the live admin app directly (that is on main).
- The verifier MUST create a fresh isolated git worktree at the recorded placement commit.
- Starts an ephemeral Admin/UI preview server on an isolated port inside that worktree.
- Runs Playwright browser automation against that port to verify:
  1. Block family appears in the Composer block selector dropdown.
  2. Selecting the block renders the block in Preview Pane.
  3. DOM contains expected data-block-type and data-block-version attributes.
  4. Zero browser console errors / unhandled page exceptions.
  5. Captures screenshot as visual evidence.
- Shuts down ephemeral server and cleans up the worktree.
- Binds all evidence into SHA-256 hash-bound evidence records (no fake cryptographic signatures).
"""

import os
import sys
import json
import time
import socket
import logging
import hashlib
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from uuid import uuid4

logger = logging.getLogger(__name__)


def find_workspace_root() -> Path:
    """Find repository workspace root."""
    env_root = os.environ.get("WORKSPACE_ROOT")
    if env_root and (Path(env_root) / "packages" / "ui").exists():
        return Path(env_root)

    for parent in Path(__file__).resolve().parents:
        if (parent / "packages" / "ui").exists():
            return parent

    return Path(__file__).resolve().parents[4]


def find_free_port() -> int:
    """Find an available ephemeral port for the preview server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


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


def _create_verification_worktree(workspace_root: Path, commit_sha: str) -> Path:
    """Create an isolated git worktree checked out at the placement commit."""
    worktrees_dir = Path(os.environ.get(
        "PROJECT_AI_WORKTREES_DIR",
        workspace_root / ".worktrees" / "verification"
    ))
    worktrees_dir.mkdir(parents=True, exist_ok=True)
    worktree_path = worktrees_dir / f"verify-{uuid4().hex[:12]}"

    res = subprocess.run(
        ["git", "worktree", "add", "--detach", str(worktree_path), commit_sha],
        cwd=workspace_root,
        capture_output=True,
        text=True,
        check=False
    )
    if res.returncode != 0:
        raise RuntimeError(f"Failed to create verification worktree at {commit_sha}: {res.stderr.strip()}")

    return worktree_path


def _cleanup_verification_worktree(workspace_root: Path, worktree_path: Path, linked: Optional[List[Path]] = None) -> None:
    """Clean up and remove an isolated verification worktree."""
    if linked:
        _unlink_dependencies(linked)
    subprocess.run(
        ["git", "worktree", "remove", "--force", str(worktree_path)],
        cwd=workspace_root,
        capture_output=True,
        text=True,
        check=False
    )


def _kill_process_tree(pid: int) -> None:
    """Kill process and all child processes cleanly on Windows or Unix."""
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True, check=False)
        else:
            import signal
            os.kill(pid, signal.SIGKILL)
    except Exception as e:
        logger.warning(f"Error terminating process tree {pid}: {e}")


def _sha256_file(path: Path) -> Optional[str]:
    """Return the hash for a captured artifact when it exists."""
    if not path.exists():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _pnpm_command() -> str:
    return "pnpm.cmd" if os.name == "nt" else "pnpm"


def _build_admin_preview(worktree_path: Path, timeout_seconds: int) -> None:
    """Build the exact placed commit before serving it for browser verification."""
    result = subprocess.run(
        [_pnpm_command(), "--filter", "@quiz/skillhubcore-admin", "exec", "next", "build", "--webpack"],
        cwd=worktree_path,
        capture_output=True,
        text=True,
        timeout=timeout_seconds,
        check=False,
    )
    if result.returncode != 0:
        output = (result.stderr or result.stdout).strip()
        raise RuntimeError(f"Admin production build failed: {output[-1200:]}")


def _generate_playwright_script(
    preview_url: str,
    block_family: str,
    block_version: str,
    screenshot_path: Path
) -> str:
    """Generate Node.js script executing Playwright assertions."""
    target_family_lower = block_family.lower()
    target_version_upper = block_version.upper()
    screenshot_escaped = str(screenshot_path).replace("\\", "\\\\")

    return f"""
const {{ chromium }} = require('playwright');
const fs = require('fs');

(async () => {{
    const result = {{
        passed: false,
        dropdown_registered: false,
        rendered_dom: false,
        target_family: '{target_family_lower}',
        target_version: '{target_version_upper}',
        dom_block_type: null,
        dom_block_version: null,
        console_errors: [],
        page_errors: [],
        network_errors: [],
        screenshot: '{screenshot_escaped}',
        error_message: null
    }};

    let browser;
    try {{
        browser = await chromium.launch({{ headless: true }});
        const context = await browser.newContext({{
            viewport: {{ width: 1440, height: 900 }}
        }});
        const page = await context.newPage();

        page.on('console', msg => {{
            if (msg.type() === 'error') {{
                result.console_errors.push(msg.text());
            }}
        }});

        page.on('pageerror', err => {{
            result.page_errors.push(err.message || String(err));
        }});

        page.on('response', response => {{
            if (response.url().startsWith('{preview_url}') && response.status() >= 400) {{
                result.network_errors.push(`${{response.status()}} ${{response.url()}}`);
            }}
        }});

        const targetUrl = '{preview_url}/tools/tutorial-page-content';
        const response = await page.goto(targetUrl, {{ waitUntil: 'domcontentloaded', timeout: 30000 }});

        if (!response || response.status() >= 400) {{
            throw new Error(`Failed to load ${{targetUrl}} (status: ${{response ? response.status() : 'no response'}})`);
        }}

        // Wait for Tutorial Composer elements
        await page.waitForSelector('select', {{ timeout: 15000 }});

        // 1. Verify family is registered in dropdown
        const options = await page.$$eval('select option', opts => opts.map(o => ({{ value: o.value, text: o.textContent.trim() }})));
        const foundOption = options.find(o => o.value.toLowerCase() === '{target_family_lower}' || o.text.toLowerCase().includes('{target_family_lower}'));

        if (foundOption) {{
            result.dropdown_registered = true;
        }} else {{
            result.error_message = `Block family '{target_family_lower}' not found in Composer block selector dropdown options: ${{JSON.stringify(options)}}`;
            console.log(JSON.stringify(result));
            await browser.close();
            process.exit(0);
        }}

        // Select the block family
        const selects = await page.$$('select');
        let selected = false;
        for (const sel of selects) {{
            const hasOpt = await sel.$$eval('option', (opts, fam) => opts.some(o => o.value.toLowerCase() === fam), '{target_family_lower}');
            if (hasOpt) {{
                await sel.selectOption({{ value: '{target_family_lower}' }});
                selected = true;
                break;
            }}
        }}
        if (!selected) {{
            throw new Error(`Unable to select block family '{target_family_lower}'`);
        }}

        // Select the requested version from the Composer's version selector.
        let versionSelected = false;
        for (const sel of selects) {{
            const hasVersion = await sel.$$eval('option', (opts, version) =>
                opts.some(o => o.value.toUpperCase() === version || (o.textContent || '').toUpperCase().includes(version)),
                '{target_version_upper}'
            );
            if (hasVersion) {{
                const value = await sel.$$eval('option', (opts, version) => {{
                    const option = opts.find(o => o.value.toUpperCase() === version || (o.textContent || '').toUpperCase().includes(version));
                    return option ? option.value : null;
                }}, '{target_version_upper}');
                if (value) {{
                    await sel.selectOption({{ value }});
                    versionSelected = true;
                    break;
                }}
            }}
        }}
        if (!versionSelected) {{
            throw new Error(`Unable to select block version '{target_version_upper}'`);
        }}

        // Wait for preview pane update
        await page.waitForTimeout(1000);

        // Switch preview mode to 'Active Block' if button exists
        const activeBlockBtn = await page.$('button:has-text("Active Block")');
        if (activeBlockBtn) {{
            await activeBlockBtn.click();
            await page.waitForTimeout(800);
        }}

        // 2. Check rendered DOM attributes
        const blockArticle = await page.$(`[data-block-type="{target_family_lower}"]`);
        if (blockArticle) {{
            result.rendered_dom = true;
            result.dom_block_type = '{target_family_lower}';
            result.dom_block_version = await blockArticle.getAttribute('data-block-version');
        }} else {{
            // Check fallback container or any article element
            const anyBlock = await page.$('[data-block-type]');
            if (anyBlock) {{
                result.dom_block_type = await anyBlock.getAttribute('data-block-type');
                result.dom_block_version = await anyBlock.getAttribute('data-block-version');
                if (result.dom_block_type && result.dom_block_type.toLowerCase() === '{target_family_lower}') {{
                    result.rendered_dom = true;
                }}
            }}
        }}

        // Capture screenshot evidence
        try {{
            await page.screenshot({{ path: '{screenshot_escaped}', fullPage: false }});
        }} catch (e) {{
            // Non-fatal if screenshot directory writing fails
        }}

        const versionMatches = result.dom_block_version === '{target_version_upper}';
        if (result.dropdown_registered && result.rendered_dom && versionMatches && result.console_errors.length === 0 && result.page_errors.length === 0 && result.network_errors.length === 0) {{
            result.passed = true;
        }} else if (!result.rendered_dom) {{
            result.error_message = `Block family '{target_family_lower}' registered in dropdown but did not render matching [data-block-type="{target_family_lower}"] in Preview Pane`;
        }} else if (result.console_errors.length > 0 || result.page_errors.length > 0) {{
            result.error_message = `Browser encountered console/page errors during render: ${{result.console_errors.concat(result.page_errors).join('; ')}}`;
        }} else if (result.network_errors.length > 0) {{
            result.error_message = `Browser encountered failed HTTP responses during render: ${{result.network_errors.join('; ')}}`;
        }} else if (!versionMatches) {{
            result.error_message = `Preview Pane rendered version '${{result.dom_block_version}}', expected '{target_version_upper}'`;
        }}

        console.log(JSON.stringify(result));
    }} catch (err) {{
        result.error_message = err.message || String(err);
        console.log(JSON.stringify(result));
    }} finally {{
        if (browser) {{
            await browser.close();
        }}
    }}
}})();
"""


async def verify_composer_in_worktree(
    workflow_id: str,
    commit_sha: str,
    block_family: str,
    block_version: str,
    candidate_hash: str,
    manifest_hash: str,
    timeout_seconds: int = 180
) -> Dict[str, Any]:
    """
    Execute full Composer verification on an isolated git worktree checked out at commit_sha.
    
    Returns hash-bound evidence dictionary conforming to GateResult schema.
    """
    start_time = time.time()
    workspace_root = find_workspace_root()
    port = find_free_port()
    preview_url = f"http://127.0.0.1:{port}"
    
    evidence_dir = workspace_root / ".evidence" / "screenshots"
    evidence_dir.mkdir(parents=True, exist_ok=True)
    screenshot_path = evidence_dir / f"composer_verify_{workflow_id}_{uuid4().hex[:6]}.png"

    worktree_path: Optional[Path] = None
    server_process: Optional[subprocess.Popen] = None
    runner_script_path: Optional[Path] = None
    linked_deps: List[Path] = []

    try:
        # Step 1: Create isolated worktree at placed commit
        logger.info(f"Creating verification worktree for commit {commit_sha}...")
        worktree_path = _create_verification_worktree(workspace_root, commit_sha)
        linked_deps = _link_dependencies(workspace_root, worktree_path)

        _build_admin_preview(worktree_path, timeout_seconds)

        admin_app_dir = worktree_path / "apps" / "skillhubcore-admin"
        if not admin_app_dir.exists():
            return {
                "status": "FAIL",
                "gate_id": "composer",
                "passed": False,
                "verified_commit": commit_sha,
                "candidate_hash": candidate_hash,
                "manifest_hash": manifest_hash,
                "reason": f"apps/skillhubcore-admin not found in placed commit worktree",
                "findings": ["Directory apps/skillhubcore-admin missing from worktree"],
                "evidence_ids": [],
                "evidence_hash": "",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        # Step 2: Start isolated preview server on ephemeral port
        logger.info(f"Starting ephemeral Next.js preview server on port {port}...")
        server_cmd = [_pnpm_command(), "--filter", "@quiz/skillhubcore-admin", "exec", "next", "start", "-p", str(port), "-H", "127.0.0.1"]
        server_process = subprocess.Popen(
            server_cmd,
            cwd=str(worktree_path),
            shell=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Step 3: Wait for preview server to be responsive
        import urllib.request
        server_ready = False
        health_deadline = time.time() + 45
        target_check_url = f"{preview_url}/tools/tutorial-page-content"

        while time.time() < health_deadline:
            if server_process.poll() is not None:
                # Process crashed early
                stderr = server_process.stderr.read() if server_process.stderr else ""
                raise RuntimeError(f"Preview server exited unexpectedly (code {server_process.returncode}): {stderr}")
            try:
                with urllib.request.urlopen(target_check_url, timeout=2) as resp:
                    if resp.status == 200:
                        server_ready = True
                        break
            except Exception:
                time.sleep(1)

        if not server_ready:
            raise RuntimeError(f"Preview server failed to respond on {target_check_url} within 45s")

        logger.info(f"Preview server ready at {preview_url}. Launching Playwright browser verification...")

        # Step 4: Run Playwright script
        script_content = _generate_playwright_script(
            preview_url=preview_url,
            block_family=block_family,
            block_version=block_version,
            screenshot_path=screenshot_path
        )
        scripts_dir = workspace_root / ".evidence" / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        runner_script_path = scripts_dir / f"verify_composer_{uuid4().hex[:8]}.js"
        runner_script_path.write_text(script_content, encoding="utf-8")

        node_env = os.environ.copy()
        node_env["NODE_PATH"] = str(workspace_root / "node_modules")
        node_cmd = ["node", str(runner_script_path)]
        playwright_res = subprocess.run(
            node_cmd,
            cwd=str(workspace_root),
            env=node_env,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False
        )

        stdout = playwright_res.stdout.strip()
        stderr = playwright_res.stderr.strip()

        # Parse JSON output from the Playwright runner script
        parsed_result: Dict[str, Any] = {}
        for line in stdout.splitlines():
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                try:
                    parsed_result = json.loads(line)
                    break
                except Exception:
                    continue

        if not parsed_result:
            parsed_result = {
                "passed": False,
                "dropdown_registered": False,
                "rendered_dom": False,
                "error_message": f"Playwright runner produced no parseable JSON output. Stdout: {stdout}. Stderr: {stderr}",
                "console_errors": [stderr] if stderr else []
            }

        passed = bool(parsed_result.get("passed", False))
        findings: List[str] = []

        if parsed_result.get("dropdown_registered"):
            findings.append(f"Block family '{block_family.lower()}' is discoverable in Composer dropdown")
        else:
            findings.append(f"Block family '{block_family.lower()}' missing from Composer dropdown")

        if parsed_result.get("rendered_dom"):
            findings.append(f"Preview Pane successfully rendered {block_family} {block_version} with correct DOM attributes")
        else:
            findings.append(f"Preview Pane failed to render DOM attributes for {block_family} {block_version}")

        console_errors = parsed_result.get("console_errors", [])
        if console_errors:
            findings.append(f"Console errors detected ({len(console_errors)}): {'; '.join(console_errors[:3])}")

        # Compute deterministic evidence hash from verification result
        screenshot_hash = _sha256_file(screenshot_path)
        evidence_payload = {
            "verification": parsed_result,
            "verified_commit": commit_sha,
            "candidate_hash": candidate_hash,
            "manifest_hash": manifest_hash,
            "screenshot_sha256": screenshot_hash,
        }
        raw_payload = json.dumps(evidence_payload, sort_keys=True, separators=(",", ":"))
        evidence_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
        evidence_id = f"composer-ev-{uuid4().hex[:12]}"

        duration_ms = int((time.time() - start_time) * 1000)

        return {
            "status": "PASS" if passed else "FAIL",
            "gate_id": "composer",
            "passed": passed,
            "verified_commit": commit_sha,
            "candidate_hash": candidate_hash,
            "manifest_hash": manifest_hash,
            "evidence_hash": evidence_hash,
            "evidence_ids": [evidence_id],
            "reason": (
                f"Composer verification passed on isolated preview: registered in dropdown, rendered in Preview Pane with 0 console errors"
                if passed else (parsed_result.get("error_message") or "Composer verification failed")
            ),
            "findings": findings,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "runner_metadata": {
                "port": port,
                "browser": "chromium",
                "preview_url": preview_url,
                "duration_ms": duration_ms,
                "screenshot_captured": screenshot_path.exists(),
                "screenshot_path": str(screenshot_path) if screenshot_path.exists() else None,
                "screenshot_sha256": screenshot_hash,
                "dom_block_type": parsed_result.get("dom_block_type"),
                "dom_block_version": parsed_result.get("dom_block_version"),
            }
        }

    except Exception as e:
        logger.exception("Composer worktree verification error")
        return {
            "status": "FAIL",
            "gate_id": "composer",
            "passed": False,
            "verified_commit": commit_sha,
            "candidate_hash": candidate_hash,
            "manifest_hash": manifest_hash,
            "evidence_hash": hashlib.sha256(str(e).encode()).hexdigest(),
            "evidence_ids": [],
            "reason": f"Composer worktree verification exception: {str(e)}",
            "findings": [str(e)],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "runner_metadata": {
                "port": port,
                "browser": "chromium"
            }
        }

    finally:
        # Step 5: Cleanly terminate the preview server
        if server_process and server_process.pid:
            logger.info(f"Terminating preview server process {server_process.pid}...")
            _kill_process_tree(server_process.pid)

        # Step 6: Clean up the runner script
        if runner_script_path and runner_script_path.exists():
            try:
                runner_script_path.unlink()
            except Exception:
                pass

        # Step 7: Clean up isolated worktree
        if worktree_path and worktree_path.exists():
            logger.info(f"Cleaning up verification worktree at {worktree_path}...")
            _cleanup_verification_worktree(workspace_root, worktree_path, linked_deps)
