# FND22 artifact hash ingress control manifest

Baseline 4dc94e16. Actual Project AI `BindArtifactRequest` describes SHA-256 hex but only enforces length 64; contract-admin route forwards it to governance binding. Add isolated Pydantic schema positive valid hex and negative 64 non-hex fixture; no HTTP/JWT/database or production change. Offline Python guard blocks socket/DNS/dotenv before app import; use existing foundation runner. Retain failure, choose canonical hash casing/legacy compatibility before tightening.
