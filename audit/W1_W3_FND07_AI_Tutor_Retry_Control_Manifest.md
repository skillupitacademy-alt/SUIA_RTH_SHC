# FND07 AI tutor retry-after sensitivity manifest

Baseline 33379972. The active useAiTutor hook sets isRateLimited on 429 and never clears it or reads Retry-After. Add guarded isolated real-hook control with fake time and intercepted response to test retry after server-provided interval; retain failing assertion. No production change, real browser/API/rate store or policy selected. Sol review required.
