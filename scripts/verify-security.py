#!/usr/bin/env python3
"""
Security Verification Script - W6 V5
Verifies JWT authentication, CORS configuration, and secrets validation.
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any


def find_jwt_endpoints(project_root: Path) -> Dict[str, Any]:
    """Search for JWT authentication implementation in route files."""
    routes_dir = project_root / "services" / "project-ai" / "app" / "api" / "routes"
    
    jwt_protected = 0
    unprotected = 0
    placeholder_auth = 0
    issues = []
    
    if not routes_dir.exists():
        return {
            "protected": 0,
            "unprotected": 0,
            "placeholder": 0,
            "issues": ["Routes directory not found"]
        }
    
    # Patterns to detect
    auth_dependency_pattern = re.compile(r'Depends\(get_current_user\)|Depends\(require_contract_\w+\)')
    route_decorator_pattern = re.compile(r'@router\.(get|post|put|delete|patch)\(')
    placeholder_patterns = ['TODO', 'FIXME', 'placeholder', 'fake_auth', 'skip_auth', 'stub']
    
    for route_file in routes_dir.glob("*.py"):
        if route_file.name == "__init__.py":
            continue
            
        content = route_file.read_text(encoding='utf-8')
        
        # Check for placeholder auth patterns
        for pattern in placeholder_patterns:
            if pattern.lower() in content.lower():
                # Check if it's in comments or actual code near auth
                if re.search(rf'{pattern}.*auth|auth.*{pattern}', content, re.IGNORECASE):
                    placeholder_auth += 1
                    issues.append(f"{route_file.name}: Contains '{pattern}' near auth code")
        
        # Count routes and their protection
        routes = route_decorator_pattern.findall(content)
        
        # Split content into function blocks to check each endpoint
        functions = re.split(r'\n(?=async def |def )', content)
        
        for func in functions:
            if route_decorator_pattern.search(func):
                # Check if this function has auth dependency
                if auth_dependency_pattern.search(func):
                    jwt_protected += 1
                elif 'health' not in func.lower():  # Health endpoint is intentionally public
                    unprotected += 1
                    # Extract function name for reporting
                    func_match = re.search(r'async def (\w+)|def (\w+)', func)
                    if func_match:
                        func_name = func_match.group(1) or func_match.group(2)
                        issues.append(f"{route_file.name}: Endpoint '{func_name}' lacks auth dependency")
    
    return {
        "protected": jwt_protected,
        "unprotected": unprotected,
        "placeholder": placeholder_auth,
        "issues": issues
    }


def check_cors_config(project_root: Path) -> Dict[str, Any]:
    """Check CORS configuration for production safety."""
    main_py = project_root / "services" / "project-ai" / "app" / "main.py"
    
    if not main_py.exists():
        return {
            "configured": False,
            "wildcard_origins": True,
            "issues": ["main.py not found"]
        }
    
    content = main_py.read_text(encoding='utf-8')
    
    issues = []
    wildcard_origins = False
    
    # Check for CORS middleware
    if "CORSMiddleware" not in content:
        issues.append("CORSMiddleware not configured")
        return {
            "configured": False,
            "wildcard_origins": False,
            "issues": issues
        }
    
    # Check for wildcard origins
    if re.search(r'allow_origins\s*=\s*\[\s*["\']?\*["\']?\s*\]', content):
        wildcard_origins = True
        issues.append("CORS allows wildcard origins (*) - unsafe for production")
    
    # Check for TODO comment about restricting in production
    if "TODO: Restrict in production" in content:
        issues.append("CORS has TODO comment about production restriction")
    
    return {
        "configured": True,
        "wildcard_origins": wildcard_origins,
        "issues": issues
    }


def check_secrets_validation(project_root: Path) -> Dict[str, Any]:
    """Check that secrets are validated at startup."""
    issues = []
    
    # Check JWT config validation
    jwt_config_py = project_root / "services" / "project-ai" / "app" / "auth" / "config.py"
    
    jwt_validated = False
    if jwt_config_py.exists():
        content = jwt_config_py.read_text(encoding='utf-8')
        
        # Check for JWT_SECRET_KEY validation
        if "JWT_SECRET_KEY" in content and "raise ValueError" in content:
            jwt_validated = True
        else:
            issues.append("JWT_SECRET_KEY not validated with raise ValueError")
    else:
        issues.append("app/auth/config.py not found")
    
    # Check database URL validation
    db_session_py = project_root / "services" / "project-ai" / "app" / "persistence" / "database.py"
    
    db_validated = False
    if db_session_py.exists():
        content = db_session_py.read_text(encoding='utf-8')
        
        # Check for DATABASE_URL_TUTORIAL validation
        if "DATABASE_URL_TUTORIAL" in content and "raise ValueError" in content:
            db_validated = True
        else:
            issues.append("DATABASE_URL_TUTORIAL not validated with raise ValueError")
    else:
        # Try alternate location
        db_session_py = project_root / "services" / "project-ai" / "app" / "database" / "session.py"
        if db_session_py.exists():
            content = db_session_py.read_text(encoding='utf-8')
            if "DATABASE_URL_TUTORIAL" in content and "raise ValueError" in content:
                db_validated = True
            else:
                issues.append("DATABASE_URL_TUTORIAL not validated with raise ValueError")
        else:
            issues.append("database session module not found")
    
    # Check startup validation in main.py
    main_py = project_root / "services" / "project-ai" / "app" / "main.py"
    startup_validates = False
    
    if main_py.exists():
        content = main_py.read_text(encoding='utf-8')
        
        # Check for JWT validation call at startup
        if "get_jwt_config()" in content and "JWT configuration validated" in content:
            startup_validates = True
        else:
            issues.append("Startup does not call get_jwt_config() to validate JWT secrets")
    
    return {
        "jwt_validated": jwt_validated,
        "db_validated": db_validated,
        "startup_validates": startup_validates,
        "issues": issues
    }


def main():
    """Run security verification checks."""
    project_root = Path(__file__).parent.parent
    
    print("=" * 70)
    print("Security Verification - W6 V5")
    print("=" * 70)
    print(f"Project root: {project_root}")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print()
    
    # Check 1: JWT Authentication Coverage
    print("1. Checking JWT Authentication Coverage...")
    jwt_results = find_jwt_endpoints(project_root)
    
    print(f"   - Protected endpoints: {jwt_results['protected']}")
    print(f"   - Unprotected endpoints: {jwt_results['unprotected']}")
    print(f"   - Placeholder auth patterns: {jwt_results['placeholder']}")
    
    if jwt_results['issues']:
        print("   Issues:")
        for issue in jwt_results['issues']:
            print(f"     • {issue}")
    print()
    
    # Check 2: CORS Configuration
    print("2. Checking CORS Configuration...")
    cors_results = check_cors_config(project_root)
    
    print(f"   - CORS configured: {cors_results['configured']}")
    print(f"   - Wildcard origins (*): {cors_results['wildcard_origins']}")
    
    if cors_results['issues']:
        print("   Issues:")
        for issue in cors_results['issues']:
            print(f"     • {issue}")
    print()
    
    # Check 3: Secrets Validation
    print("3. Checking Secrets/Environment Variable Validation...")
    secrets_results = check_secrets_validation(project_root)
    
    print(f"   - JWT_SECRET_KEY validated: {secrets_results['jwt_validated']}")
    print(f"   - DATABASE_URL validated: {secrets_results['db_validated']}")
    print(f"   - Startup validates config: {secrets_results['startup_validates']}")
    
    if secrets_results['issues']:
        print("   Issues:")
        for issue in secrets_results['issues']:
            print(f"     • {issue}")
    print()
    
    # Determine pass/fail
    all_issues = (
        jwt_results['issues'] +
        cors_results['issues'] +
        secrets_results['issues']
    )
    
    # Critical failures
    critical_failures = []
    
    if jwt_results['placeholder'] > 0:
        critical_failures.append(f"Found {jwt_results['placeholder']} placeholder auth patterns")
    
    if cors_results['wildcard_origins']:
        critical_failures.append("CORS uses wildcard origins (*)")
    
    if not secrets_results['jwt_validated']:
        critical_failures.append("JWT_SECRET_KEY not validated")
    
    if not secrets_results['db_validated']:
        critical_failures.append("DATABASE_URL not validated")
    
    # Warnings (not critical but should be addressed)
    warnings = []
    if jwt_results['unprotected'] > 1:  # Allow health endpoint
        warnings.append(f"{jwt_results['unprotected']} unprotected endpoints (excluding health)")
    
    # Final status
    print("=" * 70)
    status = "PASS" if len(critical_failures) == 0 else "FAIL"
    print(f"Status: {status}")
    
    if critical_failures:
        print("\nCritical Failures:")
        for failure in critical_failures:
            print(f"  ✗ {failure}")
    
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"  ⚠ {warning}")
    
    print("=" * 70)
    
    # Write report
    report_dir = project_root / ".agents" / "tasks"
    report_dir.mkdir(parents=True, exist_ok=True)
    
    report_path = report_dir / "w6-v5-report.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# Security Verification Report - W6 V5\n\n")
        f.write(f"**Script:** verify-security.py\n")
        f.write(f"**Timestamp:** {datetime.utcnow().isoformat()}Z\n")
        f.write(f"**Status:** {status}\n\n")
        
        f.write("## 1. JWT Authentication Coverage\n\n")
        f.write(f"- Protected endpoints: {jwt_results['protected']}\n")
        f.write(f"- Unprotected endpoints: {jwt_results['unprotected']}\n")
        f.write(f"- Placeholder auth patterns found: {jwt_results['placeholder']}\n\n")
        
        if jwt_results['issues']:
            f.write("**Issues:**\n")
            for issue in jwt_results['issues']:
                f.write(f"- {issue}\n")
            f.write("\n")
        
        f.write("## 2. CORS Configuration\n\n")
        f.write(f"- CORS configured: {cors_results['configured']}\n")
        f.write(f"- Wildcard origins (*): {cors_results['wildcard_origins']}\n\n")
        
        if cors_results['issues']:
            f.write("**Issues:**\n")
            for issue in cors_results['issues']:
                f.write(f"- {issue}\n")
            f.write("\n")
        
        f.write("## 3. Secrets Validation\n\n")
        f.write(f"- JWT_SECRET_KEY validated: {secrets_results['jwt_validated']}\n")
        f.write(f"- DATABASE_URL validated: {secrets_results['db_validated']}\n")
        f.write(f"- Startup validates config: {secrets_results['startup_validates']}\n\n")
        
        if secrets_results['issues']:
            f.write("**Issues:**\n")
            for issue in secrets_results['issues']:
                f.write(f"- {issue}\n")
            f.write("\n")
        
        f.write("## Summary\n\n")
        f.write(f"**Overall Status:** {status}\n\n")
        
        if critical_failures:
            f.write("**Critical Failures:**\n")
            for failure in critical_failures:
                f.write(f"- {failure}\n")
            f.write("\n")
        
        if warnings:
            f.write("**Warnings:**\n")
            for warning in warnings:
                f.write(f"- {warning}\n")
            f.write("\n")
    
    print(f"\nReport written to: {report_path}")
    
    # Write JSON evidence
    evidence_path = report_dir / "w6-v5-evidence.json"
    evidence = {
        "domain": "security",
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "jwt_endpoints_covered": jwt_results['protected'],
        "placeholder_auth_remaining": jwt_results['placeholder'],
        "cors_ok": not cors_results['wildcard_origins'],
        "secrets_validated": secrets_results['jwt_validated'] and secrets_results['db_validated'],
        "issues": all_issues,
        "critical_failures": critical_failures,
        "warnings": warnings,
        "details": {
            "jwt": jwt_results,
            "cors": cors_results,
            "secrets": secrets_results
        }
    }
    
    with open(evidence_path, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, indent=2)
    
    print(f"Evidence written to: {evidence_path}")
    
    # Exit with appropriate code
    sys.exit(0 if status == "PASS" else 1)


if __name__ == "__main__":
    main()
