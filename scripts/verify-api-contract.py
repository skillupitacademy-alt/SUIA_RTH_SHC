#!/usr/bin/env python3
"""
API Contract Verification Script
Verifies that API routes match OpenAPI specs and have proper authentication/authorization.
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Set, Tuple

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'

class APIContractVerifier:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.endpoints_found = []
        self.spec_paths = set()
        self.issues = []
        self.auth_covered = 0
        self.endpoints_count = 0
        
    def find_openapi_specs(self) -> List[Path]:
        """Find OpenAPI specification files in the project."""
        spec_files = []
        patterns = ['*.openapi.yaml', '*.openapi.json', '*swagger.yaml', '*swagger.json', 
                    'openapi.yaml', 'openapi.json', 'swagger.yaml', 'swagger.json']
        
        for pattern in patterns:
            spec_files.extend(self.root_path.rglob(pattern))
        
        return spec_files
    
    def parse_openapi_yaml(self, spec_path: Path) -> Set[str]:
        """Extract paths from OpenAPI YAML spec (simplified parser)."""
        paths = set()
        try:
            with open(spec_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Simple regex to find paths in OpenAPI YAML
                # Matches lines like "  /auth/register:" or "  /admin/users/{userId}/platforms:"
                path_pattern = r'^\s{2}(/[^\s:]+):'
                for match in re.finditer(path_pattern, content, re.MULTILINE):
                    paths.add(match.group(1))
        except Exception as e:
            print(f"{YELLOW}Warning: Could not parse {spec_path}: {e}{RESET}")
        
        return paths
    
    def find_hono_routes(self, file_path: Path) -> List[Dict[str, Any]]:
        """Extract Hono framework routes from TypeScript files."""
        routes = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Pattern: app.get('/path', middleware, async (c) => ...)
                # Captures method, path, and checks for middleware
                pattern = r"app\.(get|post|put|delete|patch)\(['\"]([^'\"]+)['\"](?:,\s*([^,\)]+))?(?:,\s*([^,\)]+))?"
                
                for match in re.finditer(pattern, content):
                    method = match.group(1).upper()
                    path = match.group(2)
                    middleware = match.group(3) if match.group(3) else ''
                    
                    # Check for authentication middleware
                    has_auth = 'requireAuth' in content or 'requireRoles' in content or 'requirePlatform' in content
                    
                    routes.append({
                        'method': method,
                        'path': path,
                        'file': str(file_path.relative_to(self.root_path)),
                        'has_auth': has_auth,
                        'middleware': middleware.strip(),
                        'framework': 'hono'
                    })
        except Exception as e:
            pass  # Skip files that can't be read
        
        return routes
    
    def find_nextjs_routes(self, file_path: Path) -> List[Dict[str, Any]]:
        """Extract Next.js API routes from route.ts files."""
        routes = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Pattern: export async function GET|POST|PUT|DELETE|PATCH
                methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
                
                for method in methods:
                    if f'export async function {method}' in content:
                        # Derive path from file location
                        # e.g., apps/skillup-web/src/app/api/tutorial/sections/[subtopicId]/route.ts
                        # becomes /api/tutorial/sections/[subtopicId]
                        relative_path = file_path.relative_to(self.root_path)
                        parts = relative_path.parts
                        
                        # Find 'api' in path and construct endpoint
                        if 'api' in parts:
                            api_index = parts.index('api')
                            endpoint_parts = parts[api_index:-1]  # Exclude 'route.ts'
                            path = '/' + '/'.join(endpoint_parts)
                        else:
                            path = '/' + '/'.join(parts[:-1])
                        
                        # Check for authentication
                        has_auth = (
                            'requireAuth' in content or 
                            'requireStudentAuth' in content or 
                            'requireAdminAuth' in content or
                            'requireBrandAccess' in content
                        )
                        
                        routes.append({
                            'method': method,
                            'path': path,
                            'file': str(relative_path),
                            'has_auth': has_auth,
                            'middleware': self._extract_auth_middleware(content),
                            'framework': 'nextjs'
                        })
        except Exception as e:
            pass  # Skip files that can't be read
        
        return routes
    
    def _extract_auth_middleware(self, content: str) -> str:
        """Extract authentication middleware names from content."""
        auth_patterns = [
            'requireAuth',
            'requireStudentAuth',
            'requireAdminAuth',
            'requireBrandAccess',
            'requireRoles',
            'requirePlatform'
        ]
        
        found = [pattern for pattern in auth_patterns if pattern in content]
        return ', '.join(found) if found else ''
    
    def check_error_handling(self, file_path: Path) -> bool:
        """Check if endpoint has proper error handling (4xx/5xx status codes)."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for error status codes
                error_patterns = [
                    r'return c\.json\([^)]*,\s*4\d{2}\)',  # Hono: c.json({...}, 400)
                    r'return c\.json\([^)]*,\s*5\d{2}\)',  # Hono: c.json({...}, 500)
                    r'NextResponse\.json\([^)]*{[^}]*status:\s*4\d{2}',  # Next.js
                    r'NextResponse\.json\([^)]*{[^}]*status:\s*5\d{2}',  # Next.js
                    r'\.status\(4\d{2}\)',  # Express-style
                    r'\.status\(5\d{2}\)',  # Express-style
                ]
                
                for pattern in error_patterns:
                    if re.search(pattern, content):
                        return True
                
                return False
        except:
            return False
    
    def discover_routes(self) -> List[Dict[str, Any]]:
        """Discover all API routes in the codebase."""
        all_routes = []
        
        # Search for Hono routes in services
        services_path = self.root_path / 'services'
        if services_path.exists():
            for ts_file in services_path.rglob('*.routes.ts'):
                routes = self.find_hono_routes(ts_file)
                all_routes.extend(routes)
        
        # Search for Next.js API routes
        apps_path = self.root_path / 'apps'
        if apps_path.exists():
            for route_file in apps_path.rglob('**/api/**/route.ts'):
                routes = self.find_nextjs_routes(route_file)
                all_routes.extend(routes)
        
        return all_routes
    
    def verify_contracts(self) -> bool:
        """Run all verification checks."""
        print(f"{BOLD}=== API Contract Verification ==={RESET}\n")
        
        # 1. Find OpenAPI specs
        print(f"{BOLD}1. Discovering OpenAPI Specifications...{RESET}")
        spec_files = self.find_openapi_specs()
        
        if spec_files:
            print(f"   {GREEN}✓{RESET} Found {len(spec_files)} specification file(s):")
            for spec in spec_files:
                print(f"     - {spec.relative_to(self.root_path)}")
                self.spec_paths.update(self.parse_openapi_yaml(spec))
        else:
            print(f"   {YELLOW}⚠{RESET} No OpenAPI specification files found")
        
        print()
        
        # 2. Discover routes
        print(f"{BOLD}2. Discovering API Routes...{RESET}")
        self.endpoints_found = self.discover_routes()
        self.endpoints_count = len(self.endpoints_found)
        
        if self.endpoints_count > 0:
            print(f"   {GREEN}✓{RESET} Found {self.endpoints_count} endpoint(s)\n")
        else:
            print(f"   {RED}✗{RESET} No API endpoints found\n")
            self.issues.append("No API endpoints discovered in codebase")
            return False
        
        # 3. Verify authentication coverage
        print(f"{BOLD}3. Verifying Authentication Coverage...{RESET}")
        auth_count = 0
        no_auth_endpoints = []
        
        for endpoint in self.endpoints_found:
            if endpoint['has_auth']:
                auth_count += 1
            else:
                # Skip health check endpoints
                if '/healthz' not in endpoint['path'] and '/health' not in endpoint['path']:
                    no_auth_endpoints.append(f"{endpoint['method']} {endpoint['path']}")
        
        self.auth_covered = auth_count
        auth_percentage = (auth_count / self.endpoints_count * 100) if self.endpoints_count > 0 else 0
        
        print(f"   Authentication coverage: {auth_count}/{self.endpoints_count} ({auth_percentage:.1f}%)")
        
        if no_auth_endpoints:
            print(f"   {YELLOW}⚠{RESET} Endpoints without authentication:")
            for endpoint in no_auth_endpoints[:10]:  # Show first 10
                print(f"     - {endpoint}")
                self.issues.append(f"Missing authentication: {endpoint}")
            
            if len(no_auth_endpoints) > 10:
                print(f"     ... and {len(no_auth_endpoints) - 10} more")
        else:
            print(f"   {GREEN}✓{RESET} All non-health endpoints have authentication\n")
        
        print()
        
        # 4. Verify spec alignment (if specs exist)
        if self.spec_paths:
            print(f"{BOLD}4. Verifying OpenAPI Spec Alignment...{RESET}")
            spec_mismatches = []
            
            for endpoint in self.endpoints_found:
                # Normalize path (replace [param] with {param} for comparison)
                normalized_path = re.sub(r'\[([^\]]+)\]', r'{\1}', endpoint['path'])
                
                if normalized_path not in self.spec_paths:
                    spec_mismatches.append(f"{endpoint['method']} {endpoint['path']}")
            
            if spec_mismatches:
                print(f"   {YELLOW}⚠{RESET} Paths not in OpenAPI spec:")
                for path in spec_mismatches[:10]:
                    print(f"     - {path}")
                    self.issues.append(f"Not in spec: {path}")
                
                if len(spec_mismatches) > 10:
                    print(f"     ... and {len(spec_mismatches) - 10} more")
            else:
                print(f"   {GREEN}✓{RESET} All routes match OpenAPI specification")
            
            print()
        
        # 5. Verify error handling
        print(f"{BOLD}5. Verifying Error Handling...{RESET}")
        error_handling_count = 0
        no_error_handling = []
        
        for endpoint in self.endpoints_found:
            file_path = self.root_path / endpoint['file']
            if self.check_error_handling(file_path):
                error_handling_count += 1
            else:
                no_error_handling.append(f"{endpoint['method']} {endpoint['path']}")
        
        error_percentage = (error_handling_count / self.endpoints_count * 100) if self.endpoints_count > 0 else 0
        print(f"   Error handling coverage: {error_handling_count}/{self.endpoints_count} ({error_percentage:.1f}%)")
        
        if no_error_handling:
            print(f"   {YELLOW}⚠{RESET} Endpoints without explicit error handling:")
            for endpoint in no_error_handling[:5]:
                print(f"     - {endpoint}")
            if len(no_error_handling) > 5:
                print(f"     ... and {len(no_error_handling) - 5} more")
        
        print()
        
        # Summary
        print(f"{BOLD}=== Verification Summary ==={RESET}")
        
        has_failures = len(no_auth_endpoints) > 0 or (self.spec_paths and len(spec_mismatches) > 0)
        
        if not has_failures:
            print(f"{GREEN}✓ All checks passed!{RESET}")
            return True
        else:
            print(f"{YELLOW}⚠ Issues found - see report for details{RESET}")
            return False
    
    def write_report(self, report_path: Path):
        """Write detailed report to markdown file."""
        timestamp = datetime.now().isoformat()
        
        report = f"""# API Contract Verification Report

**Script**: verify-api-contract.py  
**Timestamp**: {timestamp}  
**Status**: {'PASS' if len(self.issues) == 0 else 'FAIL'}

## Summary

- **Endpoints Found**: {self.endpoints_count}
- **Auth Coverage**: {self.auth_covered}/{self.endpoints_count} ({(self.auth_covered / self.endpoints_count * 100) if self.endpoints_count > 0 else 0:.1f}%)
- **Issues**: {len(self.issues)}

## Discovered Endpoints

| Method | Path | Framework | Auth | File |
|--------|------|-----------|------|------|
"""
        
        for endpoint in self.endpoints_found:
            auth_status = '✓' if endpoint['has_auth'] else '✗'
            report += f"| {endpoint['method']} | {endpoint['path']} | {endpoint['framework']} | {auth_status} | {endpoint['file']} |\n"
        
        if self.issues:
            report += f"\n## Issues Found\n\n"
            for issue in self.issues:
                report += f"- {issue}\n"
        else:
            report += f"\n## Issues Found\n\n✓ No issues found\n"
        
        report += f"\n## Recommendations\n\n"
        
        if self.auth_covered < self.endpoints_count:
            report += "- Add authentication middleware to unprotected endpoints\n"
        
        if not self.spec_paths:
            report += "- Consider adding OpenAPI specification for API documentation\n"
        
        report += "\n---\n*Generated by verify-api-contract.py*\n"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"Report written to: {report_path}")
    
    def write_evidence(self, evidence_path: Path):
        """Write JSON evidence file."""
        evidence = {
            "domain": "api-contract",
            "status": "PASS" if len(self.issues) == 0 else "FAIL",
            "endpoints_found": self.endpoints_count,
            "auth_covered": self.auth_covered,
            "issues": self.issues,
            "timestamp": datetime.now().isoformat(),
            "endpoints": [
                {
                    "method": ep['method'],
                    "path": ep['path'],
                    "framework": ep['framework'],
                    "has_auth": ep['has_auth'],
                    "file": ep['file']
                }
                for ep in self.endpoints_found
            ]
        }
        
        with open(evidence_path, 'w', encoding='utf-8') as f:
            json.dump(evidence, f, indent=2)
        
        print(f"Evidence written to: {evidence_path}")


def main():
    root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    verifier = APIContractVerifier(root_path)
    success = verifier.verify_contracts()
    
    # Write outputs
    report_path = Path(root_path) / '.agents' / 'tasks' / 'w6-v1-report.md'
    evidence_path = Path(root_path) / '.agents' / 'tasks' / 'w6-v1-evidence.json'
    
    verifier.write_report(report_path)
    verifier.write_evidence(evidence_path)
    
    # Exit code based on verification result
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
