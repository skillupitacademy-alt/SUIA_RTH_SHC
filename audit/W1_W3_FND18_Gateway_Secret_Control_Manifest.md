# FND18 gateway secret absence sensitivity manifest

Baseline 0c169b88. Shared auth proxy treats missing configured INTERNAL_GATEWAY_SECRET as valid for applicable nonpublic API paths; this does not replace subsequent user authentication. Add isolated actual proxy with fake verified principal and missing/valid configured secret, preserving denial assertion for missing configuration and positive configured key. Do not infer deployment exploitability or select policy; no production changes, no network/browser. Guard before imports; Sol decision required.

Manifest amendment before additional control: actual `/api/private-fixture` is outside explicit protected prefixes; add unauthenticated case to distinguish proxy routing from protected-route authentication. Synthetic path only; no claim about a deployed handler.
