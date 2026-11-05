# FND18 signed token tenant claim control manifest

Baseline 921256f4. Existing identity policy decisions remain open; add only an isolated actual TokenService signing/verifying control showing same local ID/email remains tagged with its independently signed brand, distinct shadow projections are retained, and wrong audience rejects. This does not establish resource ownership, DB identity mapping or cross-tenant access denial. Disposable signing keys; no env files/network. Guarded config-free Vitest. Sol review required.
