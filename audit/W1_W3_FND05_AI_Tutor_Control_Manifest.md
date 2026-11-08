# FND05/FND13 RTH AI tutor boundary controls manifest

Baseline 85fa2d9c. Audit RTH-AI-001/002 identifies user-token brand mismatch and global seeded Q&A regardless of requested subtopic. Add isolated actual route controls with token/Redis/vector/progress fixtures, actual seeded Q&A, and offline guard: wrong-brand user must deny before effects; unrelated subtopic must not receive global seed answer. Retain any failures. No runtime changes until identity, completion and tutorial ownership authority is selected; no DB/vector/browser/network. Sol review required.
