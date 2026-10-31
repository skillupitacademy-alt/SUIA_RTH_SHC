"""
Learner Runtime Verifier.

Executes an isolated Playwright browser session using short-lived non-production test cookies,
verifies that the candidate block renders on the canonical learner route, asserts that
ILS navigation and progress APIs return 200 (no 401/403), verifies LSNB/RSSB, exercises progress events,
captures screenshots, and computes canonical evidence hashes.
"""

import os
import json
import hashlib
import subprocess
import tempfile
import time
import shutil
import urllib.request
from contextlib import contextmanager, nullcontext
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.verification.learner_identity import (
    LearnerRuntimeTestIdentityProvider,
    LearnerSessionResult,
    LearnerRuntimeTestIdentityUnavailable,
)
from app.verification.learner_route_resolver import (
    LearnerRouteResolver,
    LearnerRouteContext,
    LearnerRouteResolutionError,
)
from app.verification.fixture_registry import LearnerRuntimeFixtureContract
from app.verification.fixture_environment import verification_database_url
from app.verification.composer_worktree_verifier import (
    _create_verification_worktree,
    _cleanup_verification_worktree,
    _prepare_dependencies,
    _kill_process_tree,
    find_free_port,
)


@dataclass
class LearnerRuntimeVerificationResult:
    status: str  # "PASS", "FAIL", "BLOCKED", "NOT_APPLICABLE"
    message: str
    evidence_payload: Optional[Dict[str, Any]] = None
    evidence_hash: Optional[str] = None
    screenshot_path: Optional[str] = None
    screenshot_sha256: Optional[str] = None
    blockers: List[str] = field(default_factory=list)


def compute_sha256_file(path: Path) -> Optional[str]:
    """Compute sha256 digest of a file if it exists."""
    if not path.is_file():
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def compute_canonical_json_hash(payload: Dict[str, Any]) -> str:
    """Compute deterministic SHA-256 hash of canonical JSON."""
    canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


def _pnpm_command() -> str:
    return "pnpm.cmd" if os.name == "nt" else "pnpm"


@contextmanager
def _skillup_preview_at_commit(
    workspace_root: Path,
    commit_sha: str,
    timeout_seconds: int = 600,
    progress=None,
):
    """Serve SkillUp from the immutable placement commit, never the live tree."""
    worktree_path: Optional[Path] = None
    server_process: Optional[subprocess.Popen] = None
    linked: List[Path] = []
    server_log = tempfile.TemporaryFile(mode="w+", encoding="utf-8")
    report = progress or (lambda label: None)
    try:
        report("Checkout learner placement commit")
        worktree_path = _create_verification_worktree(workspace_root, commit_sha)
        report("Install frozen-lockfile dependencies (offline, then online if needed)")
        linked = _prepare_dependencies(workspace_root, worktree_path, timeout_seconds)
        source_env = workspace_root / "apps" / "skillup-web" / ".env.local"
        target_env = worktree_path / "apps" / "skillup-web" / ".env.local"
        if source_env.exists() and not target_env.exists():
            target_env.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_env, target_env)

        preview_env = os.environ.copy()
        preview_env["PROJECT_LLM_ISOLATED_VERIFICATION"] = "true"
        preview_env["ENVIRONMENT"] = "verification"
        preview_env["APP_ENV"] = "verification"
        fixture_db = verification_database_url()
        preview_env["DATABASE_URL_TUTORIAL"] = fixture_db
        preview_env["DATABASE_DIRECT_URL_TUTORIAL"] = fixture_db
        learner_api = os.environ.get("PROJECT_LLM_LEARNER_API_BASE_URL")
        if not learner_api:
            raise RuntimeError("PROJECT_LLM_LEARNER_API_BASE_URL must point to a non-production ILS API")
        preview_env["API_SERVER_URL"] = learner_api
        preview_env["NEXT_PUBLIC_API_URL"] = learner_api
        preview_env["INTERNAL_API_URL"] = learner_api
        preview_env["GATEWAY_URL"] = learner_api

        report("Build SkillUp learner application")
        build = subprocess.run(
            [_pnpm_command(), "--filter", "@quiz/skillup-web", "exec", "next", "build", "--webpack"],
            cwd=worktree_path,
            env=preview_env,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
        if build.returncode != 0:
            output = ((build.stdout or "") + "\n" + (build.stderr or "")).strip()
            raise RuntimeError(f"SkillUp production build failed: {output[-1200:]}")

        port = find_free_port()
        report("Start learner preview and wait for readiness")
        server_process = subprocess.Popen(
            [_pnpm_command(), "--filter", "@quiz/skillup-web", "exec", "next", "start", "-p", str(port), "-H", "127.0.0.1"],
            cwd=worktree_path,
            env=preview_env,
            stdout=server_log,
            stderr=server_log,
            text=True,
        )
        deadline = time.time() + 90
        ready_url = f"http://skillup.localhost:{port}/login"
        ready = False
        while time.time() < deadline:
            if server_process.poll() is not None:
                raise RuntimeError("SkillUp preview exited before readiness")
            try:
                with urllib.request.urlopen(ready_url, timeout=2) as response:
                    if response.status < 500:
                        ready = True
                        break
            except Exception:
                time.sleep(1)
        if not ready:
            raise RuntimeError(f"SkillUp preview did not become ready at {ready_url}")
        yield port
    finally:
        report("Stop learner preview and remove temporary worktree")
        if server_process and server_process.poll() is None:
            _kill_process_tree(server_process.pid)
        if worktree_path:
            _cleanup_verification_worktree(workspace_root, worktree_path, linked)
        server_log.close()


def _generate_playwright_learner_script(
    target_url: str,
    cookie_name: str,
    cookie_value: str,
    cookie_domain: str,
    block_family: str,
    block_version: str,
    progress_role: str,
    screenshot_path: Path,
) -> str:
    """Generate Node.js script executing Playwright assertions on the learner page."""
    family_lower = block_family.lower()
    version_upper = block_version.upper()
    screenshot_escaped = str(screenshot_path).replace("\\", "\\\\")

    return f"""
const {{ chromium }} = require('playwright');
const fixtureCookie = JSON.parse(require('node:fs').readFileSync(0, 'utf8') || '{{}}');

(async () => {{
    const result = {{
        passed: false,
        blocked: false,
        redirected_to_login: false,
        navigation_status: null,
        progress_status: null,
        block_rendered: false,
        lsnb_status: 'NOT_CHECKED',
        rssb_status: 'NOT_CHECKED',
        progress_event_status: 'NOT_CHECKED',
        console_errors: [],
        page_errors: [],
        network_errors: [],
        block_selector: '[data-block-type="{family_lower}"][data-block-version="{version_upper}"]',
        error_message: null
    }};

    let browser;
    try {{
        browser = await chromium.launch({{ headless: true }});
        const context = await browser.newContext({{
            viewport: {{ width: 1440, height: 900 }}
        }});

        // 1. Inject short-lived test fixture cookie
        await context.addCookies([{{
            name: {json.dumps(cookie_name)},
            value: fixtureCookie.cookieValue,
            domain: {json.dumps(cookie_domain)},
            path: '/'
        }}]);

        const page = await context.newPage();

        // 2. Attach listeners
        page.on('console', msg => {{
            if (msg.type() === 'error') {{
                const text = msg.text();
                if (!text.includes('favicon') && !text.includes('404')) {{
                    result.console_errors.push(text);
                }}
            }}
        }});

        page.on('pageerror', err => {{
            result.page_errors.push(err.message || String(err));
        }});

        page.on('response', resp => {{
            const url = resp.url();
            const status = resp.status();
            
            // Monitor ILS navigation / progress endpoints
            if (url.includes('/api/student') || url.includes('/api/tutorial') || url.includes('progress') || url.includes('navigation')) {{
                if (url.includes('navigation') || url.includes('sidebar')) {{
                    result.navigation_status = status;
                }}
                if (url.includes('/api/tutorial/ils/visit') || url.includes('/api/tutorial/ils/block-visit')) {{
                    result.progress_status = status;
                    result.progress_event_status = status === 200 ? 'PASS' : 'FAIL';
                }}
            }}

            if (status === 401 || status === 403) {{
                result.network_errors.push(`UNAUTHORIZED_${{status}}: ${{url}}`);
            }}
        }});

        // 3. Navigate to canonical learner URL
        const resp = await page.goto({json.dumps(target_url)}, {{
            waitUntil: 'domcontentloaded',
            timeout: 25000
        }});

        await page.waitForResponse(response =>
            new URL(response.url()).pathname.startsWith('/api/tutorial/ils/navigation/'),
            {{ timeout: 15000 }}).catch(() => null);

        // 4. Assert no redirect to login
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {{
            result.redirected_to_login = true;
            result.error_message = `Redirected to login: ${{currentUrl}}`;
            console.log(JSON.stringify(result));
            return;
        }}

        // 5. Assert block exists in DOM via stable UBRC attributes
        const blockEl = await page.waitForSelector(result.block_selector, {{ timeout: 10000 }}).catch(() => null);
        if (blockEl) {{
            result.block_rendered = true;
        }} else {{
            result.error_message = `Block not found in DOM with selector: ${{result.block_selector}}`;
        }}

        // 6. Assert LSNB and RSSB presence
        const lsnb = await page.$('aside[aria-label="Tutorial navigation"], nav[aria-label="Tutorial curriculum"]');
        result.lsnb_status = lsnb ? 'PASS' : 'FAIL';

        const progressToggle = page.getByRole('button', {{ name: 'Learning progress', exact: true }});
        if (await progressToggle.count()) await progressToggle.click();
        const rssb = await page.$('aside[aria-label="Your Progress"]');
        result.rssb_status = rssb ? 'PASS' : 'FAIL';

        // 7. Exercise applicable learner progression if progressRole is instructional or assessment
        const role = {json.dumps(progress_role.lower())};
        if (role === 'instructional' || role === 'assessment') {{
            // Locate interactive completion button or section element
            const compBtn = await page.$('button[data-action="complete-block"], button:has-text("Mark Complete"), [data-testid="progress-check"]');
            if (compBtn) {{
                await compBtn.click();
                await page.waitForTimeout(1000);
            }}
        }} else {{
            result.progress_event_status = 'NOT_APPLICABLE';
        }}

        // 8. Capture screenshot
        await page.screenshot({{ path: {json.dumps(str(screenshot_path))}, fullPage: false }});

        // 9. Final assertion logic. A missing API observation is not success:
        // this gate certifies the learner lifecycle, not merely a rendered page.
        const hasAuthFailure = result.network_errors.some(e => e.includes('UNAUTHORIZED_401') || e.includes('UNAUTHORIZED_403'));
        const navigationPassed = result.navigation_status === 200;
        const progressionRequired = role === 'instructional' || role === 'assessment';
        const progressPassed = !progressionRequired ||
            (result.progress_status === 200 && result.progress_event_status === 'PASS');
        const sidebarsPassed = result.lsnb_status === 'PASS' && result.rssb_status === 'PASS';
        if (!hasAuthFailure && !result.redirected_to_login && result.block_rendered &&
            navigationPassed && progressPassed && sidebarsPassed &&
            result.console_errors.length === 0 && result.page_errors.length === 0) {{
            result.passed = true;
        }}
    }} catch (err) {{
        result.error_message = err.message || String(err);
    }} finally {{
        if (browser) await browser.close();
        console.log(JSON.stringify(result));
    }}
}})();
"""


def verify_learner_runtime(
    workflow_id: str,
    candidate_hash: str,
    manifest_hash: str,
    verified_commit: str,
    block_family: str,
    block_version: str,
    progress_role: str = "instructional",
    workspace_root: Optional[Path] = None,
    identity_provider: Optional[LearnerRuntimeTestIdentityProvider] = None,
    route_resolver: Optional[LearnerRouteResolver] = None,
    manifest_metadata: Optional[Dict[str, Any]] = None,
    fixture_contract: Optional[LearnerRuntimeFixtureContract] = None,
    progress=None,
) -> LearnerRuntimeVerificationResult:
    """
    Executes generic authenticated learner-runtime certification gate.
    """
    root = workspace_root or Path(os.getcwd())
    provider = identity_provider or LearnerRuntimeTestIdentityProvider()
    resolver = route_resolver or LearnerRouteResolver()

    # Step 1: Resolve canonical fixture route. The production endpoint passes a
    # database-validated contract; the legacy resolver remains only for unit
    # compatibility and cannot create certification evidence by itself.
    if fixture_contract is None:
        try:
            route_ctx = resolver.resolve_fixture_route(
                block_family=block_family,
                block_version=block_version,
                manifest_metadata=manifest_metadata,
            )
        except LearnerRouteResolutionError as e:
            return LearnerRuntimeVerificationResult(
                status="BLOCKED",
                message=f"Fixture route resolution BLOCKED: {str(e)}",
                blockers=[str(e)],
            )
    else:
        route_ctx = LearnerRouteContext(
            domain_slug=fixture_contract.domain_slug,
            subject_slug=fixture_contract.subject_slug,
            topic_slug=fixture_contract.topic_slug,
            subtopic_slug=fixture_contract.subtopic_slug,
            navigation_node_id=fixture_contract.navigation_node_id,
            subtopic_id=fixture_contract.subtopic_id,
            page_route=fixture_contract.learner_route,
            block_family=block_family.lower(),
            block_version=block_version.upper(),
            is_fixture=True,
        )

    # Step 2: Prepare screenshot and script paths
    screenshots_dir = root / ".evidence" / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    runner_dir = root / ".evidence" / "runtime-runners"
    runner_dir.mkdir(parents=True, exist_ok=True)
    screenshot_filename = f"learner_runtime_{workflow_id}_{candidate_hash[:8]}.png"
    screenshot_path = screenshots_dir / screenshot_filename

    preview_context = (
        _skillup_preview_at_commit(root, verified_commit, progress=progress)
        if fixture_contract is not None
        else nullcontext(None)
    )
    script_path: Optional[Path] = None
    try:
        with preview_context as preview_port:
            # Fixture mode obtains the cookie from the same immutable preview
            # that Playwright is about to inspect. This avoids testing a
            # mutable live SkillUp process with a session from another build.
            if fixture_contract is not None and preview_port is not None:
                provider.base_url = fixture_contract.resolve_origin(preview_port)
            try:
                if progress:
                    progress("Obtain authenticated learner fixture session")
                session = provider.get_test_session()
            except LearnerRuntimeTestIdentityUnavailable as e:
                return LearnerRuntimeVerificationResult(
                    status="BLOCKED",
                    message=f"Learner runtime verification BLOCKED: {e.message}",
                    blockers=[e.message],
                )
            target_url = (
                fixture_contract.resolve_url(preview_port)
                if fixture_contract is not None and preview_port is not None
                else f"{provider.base_url}{route_ctx.page_route}"
            )
            script_content = _generate_playwright_learner_script(
                target_url=target_url,
                cookie_name=session.cookieName,
                cookie_value=session.cookieValue,
                cookie_domain=session.domain,
                block_family=block_family,
                block_version=block_version,
                progress_role=progress_role,
                screenshot_path=screenshot_path,
            )
            # Keep the generated runner beneath the workspace so Node can
            # resolve the repository's Playwright dependency while the source
            # served to the browser still comes from the detached worktree.
            with tempfile.NamedTemporaryFile(
                "w",
                suffix=".js",
                prefix="learner-runtime-",
                dir=runner_dir,
                delete=False,
                encoding="utf-8",
            ) as f:
                f.write(script_content)
                script_path = Path(f.name)
            # Run Playwright from the detached worktree when available.
            if progress:
                progress("Browser verification: learner render, ILS APIs and screenshot")
            proc = subprocess.run(
                ["node", str(script_path)],
                cwd=str(root),
                capture_output=True,
                input=json.dumps({"cookieValue": session.cookieValue}),
                text=True,
                timeout=90,
            )
    except subprocess.TimeoutExpired:
        if script_path and script_path.exists():
            script_path.unlink()
        return LearnerRuntimeVerificationResult(
            status="FAIL",
            message="Playwright learner runtime verification timed out after 90 seconds",
            blockers=["Execution timed out waiting for learner page to stabilize"],
        )
    except Exception as e:
        if script_path and script_path.exists():
            script_path.unlink()
        return LearnerRuntimeVerificationResult(
            status="BLOCKED",
            message=f"Failed to execute Playwright runner: {str(e)}",
            blockers=[str(e)],
        )
    finally:
        if script_path and script_path.exists():
            try:
                script_path.unlink()
            except Exception:
                pass

    # Parse JSON output from Node.js script
    raw_output = proc.stdout.strip()
    json_line = None
    for line in raw_output.splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            json_line = line
            break

    if not json_line:
        err_msg = proc.stderr.strip() or raw_output or "No output from learner browser runner"
        return LearnerRuntimeVerificationResult(
            status="BLOCKED" if "Cannot find module" in err_msg or "ECONNREFUSED" in err_msg else "FAIL",
            message=f"Learner browser verification error: {err_msg[:400]}",
            blockers=[err_msg[:400]],
        )

    try:
        run_data = json.loads(json_line)
    except Exception as e:
        return LearnerRuntimeVerificationResult(
            status="FAIL",
            message=f"Invalid browser output: {str(e)}",
            blockers=[str(e)],
        )

    # Calculate screenshot SHA-256
    screenshot_sha256 = compute_sha256_file(screenshot_path) if screenshot_path.is_file() else None

    # Compute hashed endpoints and values (never storing plaintext tokens or user emails)
    def hash_str(val: str) -> str:
        return hashlib.sha256(val.encode("utf-8")).hexdigest()

    evidence_payload = {
        "workflowId": workflow_id,
        "candidateHash": candidate_hash,
        "manifestHash": manifest_hash,
        "verifiedCommit": verified_commit,
        "learnerRouteHash": hash_str(route_ctx.page_route),
        "navigationNodeHash": hash_str(route_ctx.navigation_node_id),
        "subtopicHash": hash_str(route_ctx.subtopic_id),
        "blockIdentity": {
            "family": block_family.lower(),
            "version": block_version.upper(),
        },
        "identityMode": provider.auth_mode,
        "identityHash": session.learnerIdHash,
        "blockRender": {
            "status": "PASS" if run_data.get("block_rendered") else "FAIL",
            "selector": run_data.get("block_selector", ""),
        },
        "navigationApi": {
            "status": "PASS" if run_data.get("navigation_status") == 200 else "FAIL",
            "endpointHash": hash_str(f"{route_ctx.page_route}/navigation"),
            "httpStatus": run_data.get("navigation_status"),
        },
        "progressApi": {
            "status": "PASS" if run_data.get("progress_status") == 200 else "FAIL",
            "endpointHash": hash_str(f"{route_ctx.page_route}/progress"),
            "httpStatus": run_data.get("progress_status"),
        },
        "lsnb": {"status": run_data.get("lsnb_status", "PASS")},
        "rssb": {"status": run_data.get("rssb_status", "PASS")},
        "consoleErrors": run_data.get("console_errors", []),
        "pageErrors": run_data.get("page_errors", []),
        "screenshotPath": f".evidence/screenshots/{screenshot_filename}",
        "screenshotSha256": screenshot_sha256 or "",
        "verifiedAt": datetime.now(timezone.utc).isoformat(),
    }

    evidence_hash = compute_canonical_json_hash(evidence_payload)

    blockers = []
    if run_data.get("redirected_to_login"):
        blockers.append("Learner page redirected to /login (session cookie not authorized)")
    if not run_data.get("block_rendered"):
        blockers.append(f"Candidate block failed to render in DOM: {run_data.get('error_message') or 'Element not found'}")
    if run_data.get("network_errors"):
        for ne in run_data["network_errors"]:
            blockers.append(f"Network error: {ne}")
    if run_data.get("console_errors"):
        for ce in run_data["console_errors"]:
            blockers.append(f"Console error: {ce}")
    if run_data.get("page_errors"):
        for pe in run_data["page_errors"]:
            blockers.append(f"Uncaught page error: {pe}")
    if run_data.get("navigation_status") != 200:
        blockers.append(
            f"Required ILS navigation API was not observed with HTTP 200 "
            f"(observed: {run_data.get('navigation_status')!r})"
        )
    if progress_role.lower() in ("instructional", "assessment"):
        if run_data.get("progress_status") != 200:
            blockers.append(
                f"Required learner progress API was not observed with HTTP 200 "
                f"(observed: {run_data.get('progress_status')!r})"
            )
        if run_data.get("progress_event_status") != "PASS":
            blockers.append("Required learner progress event did not complete successfully")
    for sidebar_name, sidebar_status in (("LSNB", run_data.get("lsnb_status")), ("RSSB", run_data.get("rssb_status"))):
        if sidebar_status in (None, "NOT_CHECKED", "FAIL"):
            blockers.append(f"{sidebar_name} verification did not pass (status: {sidebar_status or 'missing'})")
    if not screenshot_sha256:
        blockers.append("Screenshot artifact was not created or verified on disk")

    if blockers or not run_data.get("passed"):
        return LearnerRuntimeVerificationResult(
            status="FAIL",
            message=f"Learner runtime verification FAILED with {len(blockers)} error(s)",
            evidence_payload=evidence_payload,
            evidence_hash=evidence_hash,
            screenshot_path=str(screenshot_path) if screenshot_path.is_file() else None,
            screenshot_sha256=screenshot_sha256,
            blockers=blockers,
        )

    return LearnerRuntimeVerificationResult(
        status="PASS",
        message="Learner runtime verification PASSED: block rendered, ILS APIs authorized, no console errors",
        evidence_payload=evidence_payload,
        evidence_hash=evidence_hash,
        screenshot_path=str(screenshot_path),
        screenshot_sha256=screenshot_sha256,
        blockers=[],
    )

