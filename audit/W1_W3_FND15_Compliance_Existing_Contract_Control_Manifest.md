# FND15 compliance switch additional control manifest

Baseline f0d7c53b. Existing correction guards late out-of-order responses; extend its adjacent mounted test to cover an already loaded A, a switch to pending B, and B fetch failure. Assert copy disabled during and after B failure so A is not reused. No production changes. Guarded fixture API/router/clipboard; no physical service. Sol review required.
