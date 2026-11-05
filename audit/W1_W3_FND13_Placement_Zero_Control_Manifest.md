# FND13 placement match zero characterization manifest

Baseline 159b0513. Existing `getSkillupPlacement` converts vector score using `Math.max(1, round(score * 100))`, so observed zero becomes 1; response semantics/calibration are not selected. Add actual helper fixture test characterizing persisted profile/job and vector zero; no production change, no claim a vector score is percentage. Isolated mocked people/placement/vector and pre-import offline guard; no physical store/network. Owner decision and migration remain required.
