# Wave 1B: Complete Identity Extraction from SHC JWT Tokens

Wave 1B extends the FastAPI authentication layer to extract all 11 identity claims from verified SHC JWT tokens. The implementation introduces a strongly-typed `AuthenticatedPrincipal` TypedDict that captures core identity (user IDs and impersonation state), tenant boundary (brand), authorization context (roles, admin flags), and platform/subscription metadata. All route handlers now receive typed identity context, enabling future waves to implement brand isolation (1C) and role-based access control (1D) without further auth plumbing changes.

**Watch for:** None - the implementation is correct and complete.

**Verdict**: APPROVED

## High-level view

The extraction logic uses `payload["userId"]` as the primary identity claim with fallback to `payload["sub"]` for backward compatibility. All three shadow identity fields (user_id, original_user_id, shadow_user_id) are extracted to support admin impersonation scenarios. The brand claim is captured for Wave 1C tenant isolation. Admin privilege flags (is_admin, token_type) and portal_identity are extracted for Wave 1D authorization decisions. Array fields (roles, platforms, subscriptions) default to empty lists rather than None, enabling safe iteration without None checks. The TypedDict design preserves backward compatibility - existing code expecting `user: dict` continues to work unchanged. Route handlers are all new files; no existing handlers were modified, so there's no behavioral risk. Test coverage spans all 11 claims with edge cases for missing optional fields, sub/userId precedence, and empty arrays.

<details>
<summary>File map</summary>

**New files:**
- `app/auth/types.py` - AuthenticatedPrincipal TypedDict with 11 identity claims
- `app/auth/dependencies.py` - get_current_user() extracts all claims from JWT payload
- `tests/security/test_identity_extraction.py` - 9 tests covering extraction, defaults, edge cases
- `app/api/routes/*.py` (9 new route files) - Use AuthenticatedPrincipal type annotation

**Modified files:**
- `README.md` - Added Identity Claims section documenting all 11 fields with examples

**Full diff:** `git diff main..m2-project-ai-canonical-wiring -- services/project-ai/`

</details>
