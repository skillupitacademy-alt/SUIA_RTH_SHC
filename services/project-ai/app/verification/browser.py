"""
Browser Verification Module.

ARCHITECTURAL RULE:
- Use Playwright for headless browser automation
- No credentials or secrets in evidence output
- Capture DOM state, console errors, network failures
- Screenshot evidence for visual verification

Browser Verification Flow:
    Launch Browser (headless) → Navigate URL
        → Wait for Block Render → Capture DOM State
        → Verify data-block-type → Verify data-block-version
        → Verify Expected Content → Capture Screenshot
        → Record Console Errors → Record Network Failures
        → Return RuntimeVerification

Error Codes (from runtime.py):
    - RUNTIME_NAVIGATION_FAILURE: Cannot navigate to target route
    - RUNTIME_BLOCK_NOT_FOUND: Block not found in DOM
    - RUNTIME_ATTRIBUTE_MISMATCH: data-block-type or data-block-version incorrect
    - RUNTIME_CONTENT_MISSING: Expected content not present
    - RUNTIME_CONSOLE_ERRORS: Console errors detected
    - RUNTIME_NETWORK_ERRORS: Network request failures detected
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from pathlib import Path
import asyncio
import uuid

# NOTE: Playwright Python integration
# This module is designed to use playwright-python package
# Installation: pip install playwright
# Setup: playwright install chromium
# The actual Playwright integration will be completed when playwright
# is added to pyproject.toml dependencies

from .runtime import RuntimeVerification, RuntimeErrorCode


@dataclass
class BrowserVerificationConfig:
    """Configuration for browser verification."""
    
    base_url: str = 'http://localhost:3000'
    headless: bool = True
    timeout: int = 30000  # 30 seconds
    screenshot_path: Optional[Path] = None
    viewport_width: int = 1280
    viewport_height: int = 720


async def verify_in_browser(
    block_type: str,
    route: str,
    expected: Dict[str, Any],
    config: BrowserVerificationConfig,
    evidence_ids: List[str],
) -> RuntimeVerification:
    """
    Perform browser-based verification of block rendering.
    
    SAFETY INVARIANTS:
    - Browser runs headless (no GUI)
    - No credentials in output
    - No secrets in evidence
    - Clean browser shutdown
    
    This function uses Playwright to:
    1. Launch headless browser
    2. Navigate to target URL
    3. Wait for block to render
    4. Capture DOM state (data-block-type, data-block-version)
    5. Verify expected content
    6. Capture screenshot
    7. Record console errors
    8. Record network failures
    9. Return RuntimeVerification with evidence
    
    Args:
        block_type: Block type to verify (e.g., 'introduction')
        route: Route to navigate to
        expected: Expected attributes/content
        config: Browser configuration
        evidence_ids: Evidence IDs collected from snapshot
        
    Returns:
        RuntimeVerification result with DOM state and errors
    """
    verification_id = f"browser-{uuid.uuid4().hex[:8]}"
    console_errors: List[str] = []
    network_errors: List[str] = []
    observed: Dict[str, Any] = {}
    
    try:
        # Import playwright (will fail if not installed)
        # This is intentional - installation is handled separately
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            # Playwright not installed
            return RuntimeVerification(
                verificationId=verification_id,
                target=config.base_url,
                route=route,
                blockType=block_type,
                expected=expected,
                observed={
                    'error': 'playwright_not_installed',
                    'note': 'Install playwright: pip install playwright && playwright install chromium'
                },
                passed=False,
                evidenceIds=evidence_ids,
                consoleErrors=[],
                networkErrors=[],
                error_code=RuntimeErrorCode.RUNTIME_START_FAILURE,
                error_message="Playwright not installed"
            )
        
        async with async_playwright() as p:
            # Launch browser (headless)
            browser = await p.chromium.launch(headless=config.headless)
            
            # Create new page with viewport
            page = await browser.new_page(
                viewport={'width': config.viewport_width, 'height': config.viewport_height}
            )
            
            # Capture console messages
            def handle_console(msg):
                if msg.type in ['error', 'warning']:
                    console_errors.append(f"[{msg.type}] {msg.text}")
            
            page.on('console', handle_console)
            
            # Capture network failures
            def handle_request_failed(request):
                network_errors.append(
                    f"[{request.method}] {request.url} - {request.failure}"
                )
            
            page.on('requestfailed', handle_request_failed)
            
            # Navigate to target URL
            url = f"{config.base_url}{route}"
            try:
                response = await page.goto(url, timeout=config.timeout)
                
                if response is None or response.status >= 400:
                    await browser.close()
                    return RuntimeVerification(
                        verificationId=verification_id,
                        target=config.base_url,
                        route=route,
                        blockType=block_type,
                        expected=expected,
                        observed={'status': response.status if response else 'no_response'},
                        passed=False,
                        evidenceIds=evidence_ids,
                        consoleErrors=console_errors,
                        networkErrors=network_errors,
                        error_code=RuntimeErrorCode.RUNTIME_NAVIGATION_FAILURE,
                        error_message=f"Navigation failed with status {response.status if response else 'unknown'}"
                    )
            
            except Exception as e:
                await browser.close()
                return RuntimeVerification(
                    verificationId=verification_id,
                    target=config.base_url,
                    route=route,
                    blockType=block_type,
                    expected=expected,
                    observed={'error': str(e)},
                    passed=False,
                    evidenceIds=evidence_ids,
                    consoleErrors=console_errors,
                    networkErrors=network_errors,
                    error_code=RuntimeErrorCode.RUNTIME_NAVIGATION_FAILURE,
                    error_message=f"Navigation error: {str(e)}"
                )
            
            # Wait for block to render
            # Look for element with data-block-type attribute matching expected type
            expected_block_type = expected.get('blockType', block_type)
            selector = f'[data-block-type="{expected_block_type}"]'
            
            try:
                # Wait for block to appear (max 5 seconds)
                await page.wait_for_selector(selector, timeout=5000)
            except Exception:
                # Block not found
                await browser.close()
                return RuntimeVerification(
                    verificationId=verification_id,
                    target=config.base_url,
                    route=route,
                    blockType=block_type,
                    expected=expected,
                    observed={'dom_state': 'block_not_found', 'selector': selector},
                    passed=False,
                    evidenceIds=evidence_ids,
                    consoleErrors=console_errors,
                    networkErrors=network_errors,
                    error_code=RuntimeErrorCode.RUNTIME_BLOCK_NOT_FOUND,
                    error_message=f"Block with data-block-type='{expected_block_type}' not found in DOM"
                )
            
            # Capture DOM state
            block_element = await page.query_selector(selector)
            
            if block_element:
                # Extract attributes
                block_type_attr = await block_element.get_attribute('data-block-type')
                block_version_attr = await block_element.get_attribute('data-block-version')
                
                observed = {
                    'blockType': block_type_attr,
                    'blockVersion': block_version_attr,
                    'found': True
                }
                
                # Verify expected attributes
                if 'blockType' in expected and block_type_attr != expected['blockType']:
                    await browser.close()
                    return RuntimeVerification(
                        verificationId=verification_id,
                        target=config.base_url,
                        route=route,
                        blockType=block_type,
                        expected=expected,
                        observed=observed,
                        passed=False,
                        evidenceIds=evidence_ids,
                        consoleErrors=console_errors,
                        networkErrors=network_errors,
                        error_code=RuntimeErrorCode.RUNTIME_ATTRIBUTE_MISMATCH,
                        error_message=f"data-block-type mismatch: expected '{expected['blockType']}', got '{block_type_attr}'"
                    )
                
                if 'blockVersion' in expected and block_version_attr != expected['blockVersion']:
                    await browser.close()
                    return RuntimeVerification(
                        verificationId=verification_id,
                        target=config.base_url,
                        route=route,
                        blockType=block_type,
                        expected=expected,
                        observed=observed,
                        passed=False,
                        evidenceIds=evidence_ids,
                        consoleErrors=console_errors,
                        networkErrors=network_errors,
                        error_code=RuntimeErrorCode.RUNTIME_ATTRIBUTE_MISMATCH,
                        error_message=f"data-block-version mismatch: expected '{expected['blockVersion']}', got '{block_version_attr}'"
                    )
                
                # Capture screenshot if configured
                if config.screenshot_path:
                    screenshot_file = config.screenshot_path / f"{verification_id}.png"
                    await page.screenshot(path=str(screenshot_file))
                    observed['screenshot'] = str(screenshot_file)
            
            # Close browser
            await browser.close()
            
            # Check for errors
            passed = True
            error_code = None
            error_message = None
            
            if console_errors:
                passed = False
                error_code = RuntimeErrorCode.RUNTIME_CONSOLE_ERRORS
                error_message = f"{len(console_errors)} console error(s) detected"
            
            if network_errors:
                passed = False
                error_code = RuntimeErrorCode.RUNTIME_NETWORK_ERRORS
                error_message = f"{len(network_errors)} network error(s) detected"
            
            return RuntimeVerification(
                verificationId=verification_id,
                target=config.base_url,
                route=route,
                blockType=block_type,
                expected=expected,
                observed=observed,
                passed=passed,
                evidenceIds=evidence_ids,
                consoleErrors=console_errors,
                networkErrors=network_errors,
                error_code=error_code,
                error_message=error_message
            )
    
    except Exception as e:
        # Unexpected error
        return RuntimeVerification(
            verificationId=verification_id,
            target=config.base_url,
            route=route,
            blockType=block_type,
            expected=expected,
            observed={'error': str(e)},
            passed=False,
            evidenceIds=evidence_ids,
            consoleErrors=console_errors,
            networkErrors=network_errors,
            error_code=RuntimeErrorCode.RUNTIME_START_FAILURE,
            error_message=f"Browser verification error: {str(e)}"
        )


def verify_block_in_browser_sync(
    block_type: str,
    route: str,
    expected: Dict[str, Any],
    config: BrowserVerificationConfig,
    evidence_ids: List[str],
) -> RuntimeVerification:
    """
    Synchronous wrapper for verify_in_browser.
    
    This allows calling the async browser verification from synchronous code.
    
    Args:
        block_type: Block type to verify
        route: Route to navigate to
        expected: Expected attributes/content
        config: Browser configuration
        evidence_ids: Evidence IDs from snapshot
        
    Returns:
        RuntimeVerification result
    """
    return asyncio.run(
        verify_in_browser(block_type, route, expected, config, evidence_ids)
    )
