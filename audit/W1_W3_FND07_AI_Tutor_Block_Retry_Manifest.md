# FND07 AI tutor block retry sensitivity manifest

Baseline 1572c119. Extend retry evidence to actual AITutorBlock mounted in isolation: 429 Retry-After 1 should permit input after interval. Retain failure; no backend/progress/browser execution or production change. Pre-import offline guard, mocked translations/header, fake timers. Sol review required.
