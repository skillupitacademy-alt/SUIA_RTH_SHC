# Security Verification Report - W6 V5

**Script:** verify-security.py
**Timestamp:** 2026-10-09T11:51:48.221774Z
**Status:** FAIL

## 1. JWT Authentication Coverage

- Protected endpoints: 24
- Unprotected endpoints: 12
- Placeholder auth patterns found: 0

**Issues:**
- candidate.py: Endpoint 'get_discovery_client' lacks auth dependency
- contract.py: Endpoint 'calculate_snapshot_sha256' lacks auth dependency
- creation.py: Endpoint 'create_workflow' lacks auth dependency
- creation.py: Endpoint 'get_workflow' lacks auth dependency
- creation.py: Endpoint 'validate_workflow' lacks auth dependency
- evidence.py: Endpoint 'get_discovery_client' lacks auth dependency
- snapshot.py: Endpoint 'get_discovery_client' lacks auth dependency
- workflows.py: Endpoint '_workflow_to_response' lacks auth dependency

## 2. CORS Configuration

- CORS configured: True
- Wildcard origins (*): True

**Issues:**
- CORS allows wildcard origins (*) - unsafe for production
- CORS has TODO comment about production restriction

## 3. Secrets Validation

- JWT_SECRET_KEY validated: True
- DATABASE_URL validated: True
- Startup validates config: True

## Summary

**Overall Status:** FAIL

**Critical Failures:**
- CORS uses wildcard origins (*)

**Warnings:**
- 12 unprotected endpoints (excluding health)

