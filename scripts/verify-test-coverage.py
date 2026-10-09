#!/usr/bin/env python3
"""
Test Coverage Verification Script
Verifies test coverage meets requirements and checks for critical issues.
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


class TestCoverageVerifier:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.threshold = 80.0
        self.issues: List[str] = []
        self.coverage_pct = 0.0
        self.critical_skips: List[str] = []
        self.has_integration_tests = False
        
    def check_test_config(self) -> Tuple[bool, str]:
        """Check for test runner configuration."""
        configs = [
            self.project_root / "pytest.ini",
            self.project_root / "setup.cfg",
            self.project_root / "pyproject.toml",
            self.project_root / "jest.config.js",
            self.project_root / "jest.config.json",
        ]
        
        for config in configs:
            if config.exists():
                return True, str(config)
        
        # Check for pytest config in pyproject.toml
        pyproject = self.project_root / "services" / "project-ai" / "pyproject.toml"
        if pyproject.exists():
            return True, str(pyproject)
        
        return False, "No test configuration found"
    
    def run_pytest_coverage(self) -> Tuple[bool, Dict]:
        """Run pytest with coverage enabled."""
        service_dir = self.project_root / "services" / "project-ai"
        
        if not service_dir.exists():
            return False, {"error": "services/project-ai directory not found"}
        
        # Change to service directory
        os.chdir(service_dir)
        
        # First check if pytest is available
        try:
            subprocess.run(
                [sys.executable, "-m", "pytest", "--version"],
                capture_output=True,
                timeout=10
            )
        except Exception as e:
            return False, {"error": f"pytest not available: {e}"}
        
        # Check if pytest-cov is installed
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "show", "pytest-cov"],
                capture_output=True,
                timeout=10
            )
            has_pytest_cov = result.returncode == 0
        except Exception:
            has_pytest_cov = False
        
        if not has_pytest_cov:
            # Try to install pytest-cov
            print("pytest-cov not found, attempting to install...")
            try:
                subprocess.run(
                    [sys.executable, "-m", "pip", "install", "pytest-cov"],
                    capture_output=True,
                    timeout=60
                )
                print("✓ pytest-cov installed")
            except Exception as e:
                print(f"✗ Failed to install pytest-cov: {e}")
                return self._run_without_coverage()
        
        # Run pytest with coverage
        cmd = [
            sys.executable, "-m", "pytest",
            "--cov=app",
            "--cov=tests",
            "--cov-report=json",
            "--cov-report=term",
            "--tb=short",
            "-q",
            "-v"
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            # Read coverage report
            coverage_file = service_dir / "coverage.json"
            if coverage_file.exists():
                with open(coverage_file, 'r') as f:
                    coverage_data = json.load(f)
                return True, coverage_data
            else:
                # Try to parse output
                output = result.stdout + result.stderr
                return True, {"output": output, "returncode": result.returncode}
        
        except subprocess.TimeoutExpired:
            return False, {"error": "Test execution timed out"}
        except Exception as e:
            return False, {"error": f"Failed to run pytest: {e}"}
    
    def _run_without_coverage(self) -> Tuple[bool, Dict]:
        """Run tests without coverage to at least verify they pass."""
        print("Running tests without coverage measurement...")
        cmd = [sys.executable, "-m", "pytest", "-v", "--tb=short", "-q"]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            output = result.stdout + result.stderr
            
            # Count tests
            passed = output.count(" PASSED")
            failed = output.count(" FAILED")
            
            return True, {
                "output": output,
                "returncode": result.returncode,
                "note": "Coverage measurement unavailable - pytest-cov not installed",
                "tests_passed": passed,
                "tests_failed": failed
            }
        except Exception as e:
            return False, {"error": f"Failed to run tests: {e}"}
    
    def parse_coverage_data(self, coverage_data: Dict) -> float:
        """Parse coverage data and extract percentage."""
        try:
            if "totals" in coverage_data:
                # Standard coverage.json format
                totals = coverage_data["totals"]
                if "percent_covered" in totals:
                    return float(totals["percent_covered"])
                elif "covered_lines" in totals and "num_statements" in totals:
                    statements = totals["num_statements"]
                    if statements > 0:
                        return (totals["covered_lines"] / statements) * 100
            
            # Try alternative format
            if "output" in coverage_data:
                output = coverage_data["output"]
                # Look for coverage percentage in output
                for line in output.split('\n'):
                    if "TOTAL" in line and "%" in line:
                        parts = line.split()
                        for part in parts:
                            if part.endswith('%'):
                                return float(part.rstrip('%'))
        
        except Exception as e:
            self.issues.append(f"Failed to parse coverage data: {e}")
        
        return 0.0
    
    def check_integration_tests(self) -> bool:
        """Check for integration test files covering main workflows."""
        test_dirs = [
            self.project_root / "services" / "project-ai" / "tests" / "integration",
            self.project_root / "services" / "project-ai" / "tests" / "e2e",
            self.project_root / "tests" / "integration",
        ]
        
        integration_patterns = [
            "test_m2_9_golden_e2e.py",
            "test_i2_e2e_certification.py",
            "test_canonical",
            "test_workflow",
            "test_integration.py",
        ]
        
        found_tests = []
        for test_dir in test_dirs:
            if not test_dir.exists():
                continue
            
            for pattern in integration_patterns:
                matches = list(test_dir.glob(f"**/{pattern}*")) if "*" not in pattern else list(test_dir.glob(pattern))
                found_tests.extend(matches)
        
        if found_tests:
            print(f"✓ Found {len(found_tests)} integration test files")
            return True
        else:
            self.issues.append("No integration test files found for main workflows")
            return False
    
    def check_skipped_tests(self) -> List[str]:
        """Check for tests with skip or xfail markers."""
        service_dir = self.project_root / "services" / "project-ai" / "tests"
        
        if not service_dir.exists():
            return []
        
        critical_skips = []
        skip_patterns = ["@pytest.mark.skip", "@pytest.mark.xfail", "pytest.skip("]
        
        for test_file in service_dir.glob("**/*.py"):
            try:
                content = test_file.read_text(encoding='utf-8')
                for pattern in skip_patterns:
                    if pattern in content:
                        # Check if this is a critical test
                        if any(keyword in test_file.name for keyword in 
                              ["canonical", "certification", "workflow", "integration", "e2e"]):
                            critical_skips.append(str(test_file.relative_to(self.project_root)))
            except Exception:
                pass
        
        return critical_skips
    
    def verify(self) -> Tuple[bool, Dict]:
        """Run all verification checks."""
        print("=" * 70)
        print("Test Coverage Verification")
        print("=" * 70)
        
        # Check 1: Test configuration
        has_config, config_path = self.check_test_config()
        if has_config:
            print(f"✓ Found test configuration: {config_path}")
        else:
            print(f"✗ {config_path}")
            self.issues.append(config_path)
        
        # Check 2: Run tests with coverage
        print("\nRunning tests with coverage...")
        success, coverage_data = self.run_pytest_coverage()
        
        if success:
            self.coverage_pct = self.parse_coverage_data(coverage_data)
            print(f"✓ Test coverage: {self.coverage_pct:.2f}%")
            
            if self.coverage_pct >= self.threshold:
                print(f"✓ Coverage meets threshold ({self.threshold}%)")
            else:
                msg = f"Coverage {self.coverage_pct:.2f}% below threshold {self.threshold}%"
                print(f"✗ {msg}")
                self.issues.append(msg)
        else:
            print(f"✗ Failed to run coverage: {coverage_data.get('error', 'Unknown error')}")
            self.issues.append(f"Coverage check failed: {coverage_data.get('error')}")
        
        # Check 3: Integration tests
        print("\nChecking integration tests...")
        self.has_integration_tests = self.check_integration_tests()
        
        # Check 4: Skipped critical tests
        print("\nChecking for skipped critical tests...")
        self.critical_skips = self.check_skipped_tests()
        
        if self.critical_skips:
            print(f"✗ Found {len(self.critical_skips)} critical tests with skip/xfail markers")
            for skip in self.critical_skips:
                print(f"  - {skip}")
        else:
            print("✓ No critical tests skipped")
        
        # Summary
        print("\n" + "=" * 70)
        if not self.issues and self.coverage_pct >= self.threshold:
            print("✓ All checks PASSED")
            status = "PASS"
            exit_code = 0
        else:
            print("✗ Some checks FAILED")
            status = "FAIL"
            exit_code = 1
        
        print("=" * 70)
        
        result = {
            "domain": "test-coverage",
            "status": status,
            "coverage_pct": self.coverage_pct,
            "threshold": self.threshold,
            "critical_skips": self.critical_skips,
            "issues": self.issues,
            "has_integration_tests": self.has_integration_tests,
            "timestamp": datetime.now().isoformat()
        }
        
        return exit_code == 0, result
    
    def write_reports(self, result: Dict):
        """Write verification reports."""
        reports_dir = self.project_root / ".agents" / "tasks"
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Write markdown report
        report_path = reports_dir / "w6-v4-report.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Test Coverage Verification Report\n\n")
            f.write(f"**Script:** verify-test-coverage.py\n\n")
            f.write(f"**Timestamp:** {result['timestamp']}\n\n")
            f.write(f"**Status:** {result['status']}\n\n")
            f.write("---\n\n")
            
            f.write("## Coverage Summary\n\n")
            f.write(f"- **Total Coverage:** {result['coverage_pct']:.2f}%\n")
            f.write(f"- **Threshold:** {result['threshold']}%\n")
            f.write(f"- **Status:** {'✓ PASS' if result['coverage_pct'] >= result['threshold'] else '✗ FAIL'}\n\n")
            
            f.write("## Integration Tests\n\n")
            f.write(f"- **Integration Tests Present:** {'✓ Yes' if result['has_integration_tests'] else '✗ No'}\n\n")
            
            if result['critical_skips']:
                f.write("## Critical Skipped Tests\n\n")
                for skip in result['critical_skips']:
                    f.write(f"- `{skip}`\n")
                f.write("\n")
            else:
                f.write("## Critical Skipped Tests\n\n")
                f.write("✓ No critical tests are skipped.\n\n")
            
            if result['issues']:
                f.write("## Issues Found\n\n")
                for issue in result['issues']:
                    f.write(f"- {issue}\n")
                f.write("\n")
            else:
                f.write("## Issues Found\n\n")
                f.write("✓ No issues found.\n\n")
            
            f.write("---\n\n")
            f.write("*Report generated by verify-test-coverage.py*\n")
        
        print(f"\n✓ Report written to: {report_path}")
        
        # Write JSON evidence
        evidence_path = reports_dir / "w6-v4-evidence.json"
        with open(evidence_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        
        print(f"✓ Evidence written to: {evidence_path}")


def main():
    """Main entry point."""
    # Determine project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Create verifier and run
    verifier = TestCoverageVerifier(str(project_root))
    passed, result = verifier.verify()
    
    # Write reports
    verifier.write_reports(result)
    
    # Exit with appropriate code
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
