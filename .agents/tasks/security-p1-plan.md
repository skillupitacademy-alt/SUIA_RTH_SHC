# Security P1: CORS & Secrets Implementation Plan

## Context
This plan addresses Security Priority 1 issues in the project-ai FastAPI service:
1. CORS is currently configured with wildcard `allow_origins=["*"]` (line 89 in main.py)
2. JWT secrets are properly validated but need to be logged securely
3. Need comprehensive security documentation and testing

**Project Info:**
- Test framework: pytest with pytest-asyncio
- Build command: `pip install -e ".[dev]"` (from pyproject.toml)
- Test command: `pytest tests/` or `pytest tests/unit/` for unit tests
- Service runs on: `http://0.0.0.0:8000` (uvicorn)
- Existing test pattern: Tests in `tests/unit/`, `tests/integration/`, `tests/e2e/` with fixtures in `conftest.py`
- Environment setup: JWT_SECRET_KEY is validated on startup in `app/main.py` lines 58-63

## Implementation Plan

- [ ] 1. **Create .env.example file for project-ai service**
      Create a template `.env.example` file in `services/project-ai/` with all required and optional environment variables documented.
      
      Files: 
      - `services/project-ai/.env.example` (create new)
      
      Content should include:
      ```
      # JWT Authentication (REQUIRED)
      JWT_SECRET_KEY=your-secret-key-at-least-32-characters-long-change-in-production
      JWT_ALGORITHM=HS256
      JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
      
      # CORS Configuration (REQUIRED for production)
      ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
      
      # Database (REQUIRED)
      DATABASE_URL_TUTORIAL=postgresql+asyncpg://user:password@localhost:5432/dbname
      
      # Application Configuration
      WORKSPACE_ROOT=E:\onlinewebsites\quiz-platform
      ```
      
      Verify: File exists at `services/project-ai/.env.example` with proper documentation

- [ ] 2. **Update CORS configuration to use environment variable**
      Modify `services/project-ai/app/main.py` to read allowed origins from environment variable instead of hardcoded wildcard.
      
      Files:
      - `services/project-ai/app/main.py` (lines 9, 87-93)
      
      Changes:
      - Add `import logging` at line 9 (after `import os`)
      - Replace lines 87-93 (CORS middleware configuration) with:
      ```python
      # CORS middleware - read allowed origins from environment
      allowed_origins_str = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
      allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]
      
      logging.info(f"CORS configured with allowed origins: {allowed_origins}")
      
      app.add_middleware(
          CORSMiddleware,
          allow_origins=allowed_origins,
          allow_credentials=True,
          allow_methods=["*"],
          allow_headers=["*"],
      )
      ```
      
      Verify: Run `cd services/project-ai && python -m app.main` and check startup logs show CORS origins

- [ ] 3. **Add secure logging for JWT configuration validation**
      Update JWT config validation in `app/main.py` to avoid logging the actual secret key.
      
      Files:
      - `services/project-ai/app/main.py` (lines 58-63)
      
      Changes:
      - Modify line 62 to avoid exposing sensitive data:
      ```python
      print(f"✓ JWT configuration validated (algorithm: {jwt_config['algorithm']}, token expiry: {jwt_config['access_token_expire_minutes']} minutes, secret length: {len(jwt_config['secret_key'])} chars)")
      ```
      
      Verify: Run `cd services/project-ai && python -m app.main` and confirm startup logs don't contain the actual secret key

- [ ] 4. **Add environment variable validation for ALLOWED_ORIGINS**
      Create a new validation function in the lifespan startup to ensure ALLOWED_ORIGINS is properly configured.
      
      Files:
      - `services/project-ai/app/main.py` (add after JWT validation, around line 64)
      
      Changes:
      - Add CORS validation in lifespan startup:
      ```python
      # Startup: Validate CORS configuration
      try:
          allowed_origins_str = os.environ.get("ALLOWED_ORIGINS")
          if not allowed_origins_str:
              print("WARNING: ALLOWED_ORIGINS not set. Using default: http://localhost:3000")
              print("For production, set ALLOWED_ORIGINS environment variable with comma-separated origins.")
          else:
              origins_list = [o.strip() for o in allowed_origins_str.split(",")]
              if "*" in origins_list:
                  print("WARNING: CORS configured with wildcard '*'. This is insecure for production.")
              else:
                  print(f"✓ CORS configuration validated ({len(origins_list)} allowed origin(s))")
      except Exception as e:
          print(f"ERROR: CORS configuration validation failed: {e}")
          raise
      ```
      
      Verify: Run `cd services/project-ai && python -m app.main` without ALLOWED_ORIGINS env var and confirm warning appears

- [ ] 5. **Create unit tests for CORS configuration**
      Create comprehensive unit tests for the CORS middleware configuration.
      
      Files:
      - `services/project-ai/tests/unit/test_cors_config.py` (create new)
      
      Test cases:
      - Test default ALLOWED_ORIGINS fallback
      - Test single origin configuration
      - Test multiple origins configuration
      - Test wildcard detection
      - Test empty/whitespace handling
      - Test comma-separated parsing
      
      Pattern to follow: Similar to `tests/unit/test_auth_jwt.py` with fixtures and environment mocking
      
      Verify: Run `cd services/project-ai && pytest tests/unit/test_cors_config.py -v` and confirm all tests pass

- [ ] 6. **Create integration test for CORS headers**
      Create integration test that verifies CORS headers are properly set on API responses.
      
      Files:
      - `services/project-ai/tests/integration/test_cors_integration.py` (create new)
      
      Test cases:
      - Test OPTIONS preflight request returns correct CORS headers
      - Test GET request with allowed origin returns proper Access-Control-Allow-Origin header
      - Test request with disallowed origin is rejected
      - Test credentials flag is set correctly
      
      Use httpx TestClient pattern from existing tests (e.g., `tests/test_health.py`)
      
      Verify: Run `cd services/project-ai && pytest tests/integration/test_cors_integration.py -v` and confirm all tests pass

- [ ] 7. **Create security documentation directory and CORS guide**
      Create `docs/security/` directory with comprehensive security documentation.
      
      Files:
      - `services/project-ai/docs/security/README.md` (create new - main security overview)
      - `services/project-ai/docs/security/CORS.md` (create new - CORS configuration guide)
      - `services/project-ai/docs/security/JWT.md` (create new - JWT authentication guide)
      
      Content should include:
      - README.md: Overview of security features, links to specific guides
      - CORS.md: How to configure ALLOWED_ORIGINS, examples for dev/prod, security considerations
      - JWT.md: How to generate secure keys, environment variables, token expiry settings
      
      Verify: Files exist in `services/project-ai/docs/security/` with clear documentation

- [ ] 8. **Update main README with security section**
      Add security configuration section to the project-ai README.
      
      Files:
      - `services/project-ai/README.md` (add new section after existing content)
      
      Changes:
      - Add "Security Configuration" section with:
        - Link to `.env.example`
        - Required environment variables
        - Link to `docs/security/` directory
        - Quick start security checklist for production deployment
      
      Verify: Section exists in README.md with clear links and instructions

- [ ] 9. **Add logging module configuration**
      Configure Python logging properly with security considerations (avoid logging secrets).
      
      Files:
      - `services/project-ai/app/main.py` (add after imports, before lifespan)
      
      Changes:
      - Add logging configuration:
      ```python
      # Configure logging
      logging.basicConfig(
          level=logging.INFO,
          format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
      )
      logger = logging.getLogger(__name__)
      ```
      - Replace all `print()` statements in lifespan with `logger.info()`, `logger.warning()`, `logger.error()`
      
      Verify: Run `cd services/project-ai && python -m app.main` and confirm structured logging appears

- [ ] 10. **Create environment validation test**
      Create a test that validates all required environment variables are documented in .env.example.
      
      Files:
      - `services/project-ai/tests/unit/test_env_validation.py` (create new)
      
      Test cases:
      - Test that all os.environ.get() calls in the codebase have corresponding entries in .env.example
      - Test that .env.example file exists and is parseable
      - Test that required variables (JWT_SECRET_KEY, DATABASE_URL_TUTORIAL, ALLOWED_ORIGINS) are documented
      
      Verify: Run `cd services/project-ai && pytest tests/unit/test_env_validation.py -v` and confirm all tests pass

- [ ] 11. **Add security headers middleware (optional enhancement)**
      Add security headers to all responses for defense-in-depth.
      
      Files:
      - `services/project-ai/app/main.py` (add after CORS middleware, around line 100)
      
      Changes:
      - Add security headers middleware:
      ```python
      # Security headers middleware
      @app.middleware("http")
      async def add_security_headers(request, call_next):
          response = await call_next(request)
          response.headers["X-Content-Type-Options"] = "nosniff"
          response.headers["X-Frame-Options"] = "DENY"
          response.headers["X-XSS-Protection"] = "1; mode=block"
          response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
          return response
      ```
      
      Verify: Run `cd services/project-ai && pytest tests/integration/` and confirm no regressions

- [ ] 12. **Final integration verification**
      Run full test suite and verify the application starts correctly with security configurations.
      
      Commands to run:
      ```bash
      cd services/project-ai
      
      # Install dependencies
      pip install -e ".[dev]"
      
      # Run unit tests
      pytest tests/unit/ -v
      
      # Run integration tests  
      pytest tests/integration/ -v
      
      # Start the application with test environment
      export JWT_SECRET_KEY="test-secret-key-at-least-32-characters-long-for-testing"
      export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8000"
      export DATABASE_URL_TUTORIAL="postgresql+asyncpg://user:pass@localhost:5432/test"
      python -m app.main
      ```
      
      Expected outcomes:
      - All unit tests pass
      - All integration tests pass (excluding those requiring real database)
      - Application starts without errors
      - Startup logs show:
        - ✓ JWT configuration validated
        - ✓ CORS configuration validated
        - No secret keys in logs
        - Structured logging output
      
      Verify: All tests pass and application starts with proper security configurations

## Notes

### Existing Test Structure
- Tests use pytest with pytest-asyncio
- Fixtures in `tests/conftest.py` provide database session mocks
- Test files follow pattern: `test_<module_name>.py`
- Unit tests in `tests/unit/`, integration tests in `tests/integration/`

### Security Considerations
- Never log actual JWT secret keys
- Default to secure-by-default (localhost only for ALLOWED_ORIGINS)
- Warn on insecure configurations (wildcard CORS)
- Validate all security-critical environment variables on startup
- Use structured logging to prevent accidental secret exposure

### Files That Need Creation
- `services/project-ai/.env.example`
- `services/project-ai/tests/unit/test_cors_config.py`
- `services/project-ai/tests/integration/test_cors_integration.py`
- `services/project-ai/tests/unit/test_env_validation.py`
- `services/project-ai/docs/security/README.md`
- `services/project-ai/docs/security/CORS.md`
- `services/project-ai/docs/security/JWT.md`

### Files That Need Modification
- `services/project-ai/app/main.py` (CORS config, logging, validation, security headers)
- `services/project-ai/README.md` (add security section)

### Environment Variables Reference
**Required:**
- `JWT_SECRET_KEY` - Already validated in config.py (min 32 chars)
- `DATABASE_URL_TUTORIAL` - Already validated in database.py
- `ALLOWED_ORIGINS` - New, will be added with validation

**Optional:**
- `JWT_ALGORITHM` - Defaults to HS256
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` - Defaults to 30
- `WORKSPACE_ROOT` - Defaults to hardcoded path

### Import Additions Needed
In `services/project-ai/app/main.py`:
- Add `import logging` at line 9 (after `import os`)
